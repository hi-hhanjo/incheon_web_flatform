"""두 소스(공식·커뮤니티)를 합치고, 이미 앱에 있는 곡을 걸러 검수 후보를 만든다.

병합 원칙 — 소스마다 강점이 달라서 필드별로 우선순위가 다르다:
- 가사: 공식(구단이 직접 게시) > 커뮤니티(팬 작성). 둘 다 있으면 공식 가사를 쓴다.
- 영상: 공식 페이지엔 유튜브 링크가 없다(음원 zip만) — 커뮤니티에서만 온다.
따라서 두 소스에 다 있는 곡은 '공식 가사 + 커뮤니티 영상'으로 합쳐진다.

산출물은 앱 스키마(lib/api/songs.ts의 Song)와 같은 모양이되, `id`가 없고 `_review`가 붙는다:
- `id`: 사람이 승인해 data/songs.json으로 옮길 때 부여한다(현재 id가 1,3처럼 큐레이션된 값이라
  크롤러가 임의로 매기면 안 된다).
- `source`: **가사를 가져온 곳**(PRD 9장 — "가사는 출처를 함께 표기"). 앱 스키마의 정식 필드라
  화면에 그대로 표시된다. 영상 출처가 아니라 가사 출처임에 유의 — 공식 가사 + 커뮤니티 영상으로
  합쳐진 곡은 source가 공식이다.
- `_review`: 검수용 메타(대조한 출처 URL 전체·가사 신뢰도). 승인 시 이 필드만 떼면 그대로 Song이 된다.
"""

import json
import re
from pathlib import Path

# 출처 URL의 호스트 → 화면에 보일 출처 이름(PRD 9장 저작권 — 가사 출처 표기).
SOURCE_NAMES = {
    "incheonutd.com": "인천 유나이티드 공식 홈페이지",
    "incheonation.kr": "인천네이션",
}


def source_of(url: str) -> dict:
    """가사 출처 URL → {name, url}. 매핑에 없으면 호스트를 그대로 이름으로 쓴다."""
    host = re.sub(r"^https?://([^/]+).*$", r"\1", url)
    return {"name": SOURCE_NAMES.get(host, host), "url": url}

# 제목 정규화용. 괄호 주석·공백·문장부호를 없앤 키로 같은 곡인지 판단한다.
# 예) "나의 사랑 인천 FC"(앱) == "나의사랑 인천FC"(공식) → 둘 다 "나의사랑인천fc"
PAREN_RE = re.compile(r"\([^)]*\)")
NON_WORD_RE = re.compile(r"[^0-9a-z가-힣]")
# 커뮤니티 글쓴이가 붙인 상태 주석("(new)", "(new인데 못써봄)")은 곡 제목이 아니라 메모다.
NEW_MARKER_RE = re.compile(r"\s*\(\s*new[^)]*\)\s*", re.IGNORECASE)

DEFAULT_CATEGORY = "팀 응원가"


def normalize_title(title: str) -> str:
    """같은 곡인지 대조하기 위한 키. 괄호 주석·공백·부호를 지우고 소문자로 만든다."""
    return NON_WORD_RE.sub("", PAREN_RE.sub("", title).lower())


def display_title(title: str) -> str:
    """검수 큐에 보일 제목. 커뮤니티 상태 주석만 떼고 나머지 괄호(예: 'Alleo (알레오)')는 남긴다."""
    return NEW_MARKER_RE.sub("", title).strip()


def existing_keys(songs_path: Path) -> tuple[set[str], set[str]]:
    """이미 앱에 있는 곡의 (제목 키, youtubeId) 집합. 후보에서 걸러내는 데 쓴다."""
    if not songs_path.exists():
        return set(), set()
    songs = json.loads(songs_path.read_text(encoding="utf-8"))
    titles = {normalize_title(s["title"]) for s in songs}
    videos = {v["youtubeId"] for s in songs for v in s.get("videos", [])}
    return titles, videos


def build_candidates(
    official_songs: list[dict],
    community_songs: list[dict],
    known_titles: set[str],
    known_videos: set[str],
) -> list[dict]:
    """두 소스를 합쳐, 앱에 없는 곡만 앱 스키마 모양의 후보로 만든다."""
    merged: dict[str, dict] = {}

    # 커뮤니티를 먼저 깔고(커버리지·영상), 공식으로 가사를 덮어쓴다(신뢰도).
    for song in community_songs:
        key = normalize_title(song["title"])
        if not key:
            continue
        merged[key] = {
            "title": display_title(song["title"]),
            "lyrics": song["lyrics"],
            "youtubeId": song.get("youtubeId"),
            "sourceUrls": [song["sourceUrl"]],
            # 가사를 실제로 가져온 곳. 아래에서 공식 가사로 덮어쓰면 함께 바뀐다.
            "lyricsSourceUrl": song["sourceUrl"],
            "lyricsConfidence": "community",
        }

    for song in official_songs:
        key = normalize_title(song["title"])
        if not key:
            continue
        entry = merged.get(key)
        if entry is None:
            merged[key] = {
                "title": song["title"],
                "lyrics": song["lyrics"],
                "youtubeId": None,
                "sourceUrls": [song["sourceUrl"]],
                "lyricsSourceUrl": song["sourceUrl"],
                "lyricsConfidence": "official",
            }
            continue
        # 이미 커뮤니티 항목이 있으면: 영상은 유지하고 가사만 공식으로 교체한다.
        # 단 공식 가사가 비어 있으면(효과음 트랙) 커뮤니티 가사를 남긴다.
        if song["lyrics"]:
            entry["lyrics"] = song["lyrics"]
            entry["lyricsSourceUrl"] = song["sourceUrl"]
            entry["lyricsConfidence"] = "official"
        entry["sourceUrls"].append(song["sourceUrl"])

    candidates = []
    for key, entry in merged.items():
        youtube_id = entry["youtubeId"]
        # 앱에 이미 있는 곡(제목 일치 또는 같은 영상)은 후보에서 제외한다.
        if key in known_titles or (youtube_id and youtube_id in known_videos):
            continue
        videos = []
        if youtube_id:
            # 커뮤니티 링크는 대체로 팬 촬영/직캠이라 'live'를 기본값으로 둔다.
            # 공식 채널 영상인지는 검수자가 판단해 official로 바꾼다.
            videos.append(
                {"type": "live", "label": "현장 영상", "youtubeId": youtube_id}
            )
        candidates.append(
            {
                "title": entry["title"],
                "videos": videos,
                "lyrics": entry["lyrics"],
                "category": DEFAULT_CATEGORY,
                "tags": [],
                "isFavorite": False,
                # 앱 스키마의 정식 필드 — 화면 하단에 "가사 출처: ○○"로 표시된다.
                "source": source_of(entry["lyricsSourceUrl"]),
                "_review": {
                    "sourceUrls": sorted(set(entry["sourceUrls"])),
                    "lyricsConfidence": entry["lyricsConfidence"],
                    "hasVideo": bool(videos),
                },
            }
        )

    candidates.sort(key=lambda c: c["title"])
    return candidates
