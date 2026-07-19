"""사람이 고른 유튜브 영상 → 응원가 후보 (아누즈 채널 신곡 반영).

아누즈 채널(UCIEPr-kv6_nCdQ1-ueuypZQ)은 인천 신규 응원가가 나오면 올려주는 곳이라, 지금
songs.json의 영상은 **대부분 이미 이 채널 것**이다 — 다만 인천네이션 게시글(community.py)을
**거쳐서** 들어왔다. 그 글은 2016~2019년 링크 모음이라 갱신되지 않고, 그래서 이후 신곡이
반영되지 않는다. 이 모듈이 그 통로를 만든다(CRAWLER_SPEC.md 3.9절).

**왜 채널을 자동으로 훑지 않나** — youtube.com/robots.txt가 전량 조회 경로를 Disallow한다:
    Disallow: /feeds/videos.xml   ← 채널 RSS
    Disallow: /youtubei/          ← 채널 페이지 '더보기'
CRAWLER_SPEC.md 3.7.1이 나무위키를 탈락시킨 기준과 같다(봇 차단을 우회하지 않는다). 대신
**사람이 고른 영상 URL만** oembed로 조회한다 — `/oembed`는 Disallow 목록에 없는 공개
엔드포인트다. "이 영상이 신규 응원가인가"는 어차피 검수자의 판단이라 이 분업이 자연스럽다.

**가사는 영상 설명란에서 온다**(v2.7). 아누즈는 설명란에 가사 전문을 적어두고, 상당수는 출처까지
밝혀둔다("출처 : 파랑검정 인스타그램" — 파랑검정은 인천 서포터즈다). 채널이 스스로 공개한 텍스트라
PRD 9장의 '출처가 확인된 자료'에 해당한다. 설명란이 없으면 lyrics는 ""로 두고 source도 붙이지
않는다(가사를 안 가져왔으면 출처를 주장하지 않는다).

> 영상 **음성을 받아적는(ASR) 방식은 쓰지 않는다**: rules.md 9장이 "유튜브 영상은 임베드로만
> 불러온다 — 영상 파일을 직접 복사하지 않는다"고 못박고 있고, robots.txt도 /get_video를
> Disallow한다. 게다가 대상이 관중 떼창 직캠이라 정확도도 낮고 출처도 못 밝힌다. 설명란이
> 모든 면에서 낫다.
"""

import json
import re

import requests

OEMBED_URL = "https://www.youtube.com/oembed"
WATCH_URL = "https://www.youtube.com/watch"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
    )
}

# 유튜브 URL(또는 11자 ID 자체)에서 영상 ID를 뽑는다. community.py의 규칙과 같은 형태.
VIDEO_ID_RE = re.compile(
    r"(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/|shorts/))([A-Za-z0-9_-]{11})"
)
BARE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")

# 아누즈 신곡 제목 형식: "이명주 콜; 인천유나이티드 응원가 (vs 경남)@인천축구전용경기장 251026"
# → ';' 앞이 곡 제목이다. 뒤쪽은 채널이 붙이는 설명(경기·날짜)이라 제목이 아니다.
TITLE_SUFFIX_RE = re.compile(r"\s*;.*$", re.DOTALL)

# 설명란 = 가사. 끝에 채널이 붙인 출처 꼬리표가 오는 경우가 있어 떼어낸다:
#     ...가사 마지막 줄
#
#     출처 : 파랑검정 인스타그램        ← 표기가 흔들린다("인스타그램 파랑검정", 공백 2칸 등)
#     https://www.instagram.com/...
# '출처'로 시작하는 줄부터 끝까지가 꼬리표다. 이건 가사가 아니라 메타라서 lyrics에 넣지 않는다.
SOURCE_TRAILER_RE = re.compile(r"\n\s*출처\s*[:：].*$", re.DOTALL)

# 설명란은 공개 문서화된 API가 아니라 /watch 페이지의 내부 JSON에 있다. 깨질 수 있으므로
# 실패하면 예외 대신 None을 돌려 가사 없이 진행한다(제목은 oembed에서 따로 온다).
SHORT_DESC_RE = re.compile(r'"shortDescription":("(?:[^"\\]|\\.)*")')

DEFAULT_CATEGORY = "팀 응원가"


def video_id_of(url: str) -> str:
    """유튜브 URL(또는 ID) → 영상 ID. 못 알아보면 ValueError."""
    url = url.strip()
    if BARE_ID_RE.match(url):
        return url
    matched = VIDEO_ID_RE.search(url)
    if matched is None:
        raise ValueError(f"유튜브 영상 URL로 보이지 않습니다: {url}")
    return matched.group(1)


def fetch(video_id: str) -> dict:
    """oembed로 영상 메타를 가져온다 → {title, author_name, ...}. 없는 영상이면 HTTPError(404)."""
    resp = requests.get(
        OEMBED_URL,
        params={"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"},
        headers=HEADERS,
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()


def watch_url(video_id: str) -> str:
    return f"{WATCH_URL}?v={video_id}"


def fetch_description(video_id: str) -> str | None:
    """/watch 페이지에서 영상 설명란을 가져온다. 구조가 바뀌어 못 찾으면 None.

    robots.txt는 /watch를 막지 않는다(막힌 건 /feeds/videos.xml·/youtubei/·/get_video 등).
    다만 설명란은 공식 API가 아닌 내부 JSON에서 꺼내므로, 실패를 예외로 키우지 않고 None을
    돌려 '가사 없음'으로 진행한다 — 제목·영상은 oembed에서 오므로 후보 자체는 유효하다.
    """
    resp = requests.get(
        WATCH_URL, params={"v": video_id}, headers=HEADERS, timeout=20
    )
    resp.raise_for_status()
    matched = SHORT_DESC_RE.search(resp.text)
    if matched is None:
        return None
    # 내부 JSON의 문자열 리터럴이라 json으로 풀어야 \n이 진짜 줄바꿈이 된다.
    return json.loads(matched.group(1))


def clean_title(raw_title: str) -> str:
    """영상 제목 → 곡 제목. 형식이 다르면 원제목을 그대로 둔다(추측하지 않고 검수자가 고친다)."""
    return TITLE_SUFFIX_RE.sub("", raw_title).strip() or raw_title.strip()


def lyrics_from_description(description: str) -> str:
    """설명란 → 가사. 끝의 '출처 :' 꼬리표만 떼고 나머지는 **원문 그대로** 둔다.

    머리말("2023 인천유나이티드 새 응원가" 같은 줄)을 자동으로 떼지 않는 이유: '첫 연에 제목과
    같은 줄이 있으면 지운다'는 식의 규칙은 **첫 소절이 곧 제목인 곡의 가사를 날린다**. 흔한 구조라
    위험을 감수할 이유가 없다 — 드문 머리말은 검수자가 지우는 게 안전하다(rules.md 12장: 추측하지 않는다).
    """
    return SOURCE_TRAILER_RE.sub("", description).strip()


def build_candidate(video_id: str, meta: dict, description: str | None) -> dict:
    """oembed 메타 + 설명란 → 검수 후보(앱 스키마 + _review). merge.py의 후보와 같은 모양이다."""
    lyrics = lyrics_from_description(description) if description else ""
    candidate = {
        "title": clean_title(meta["title"]),
        # 아누즈는 팬 촬영 채널이라 live 기본값. 공식 영상이면 검수자가 official로 바꾼다.
        "videos": [{"type": "live", "label": "현장 영상", "youtubeId": video_id}],
        "lyrics": lyrics,
        "category": DEFAULT_CATEGORY,
        "tags": [],
        "isFavorite": False,
        "_review": {
            "sourceUrls": [watch_url(video_id)],
            # 팬 채널이 올린 가사라 커뮤니티 등급이다(구단 공식 게시물이 아님).
            "lyricsConfidence": "community" if lyrics else "none",
            "hasVideo": True,
            # 검수자가 원제목·채널을 보고 곡 제목과 official/live를 판단할 수 있게 남긴다.
            "videoTitle": meta["title"],
            "videoAuthor": meta.get("author_name", ""),
        },
    }
    # 가사를 실제로 가져왔을 때만 출처를 붙인다(PRD 9장 — merge.py와 같은 규칙).
    # 호스트가 아니라 **채널 이름**을 쓴다: 화면에 "가사 출처: www.youtube.com"이 뜨면 무의미하다.
    if lyrics:
        candidate["source"] = source_of(video_id, meta)
    return candidate


def source_of(video_id: str, meta: dict) -> dict:
    """가사 출처 = 가사를 실제로 가져온 그 영상. 이름은 채널명(예: '아누즈')."""
    return {"name": meta.get("author_name") or "YouTube", "url": watch_url(video_id)}
