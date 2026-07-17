"""응원가 후보를 크롤링해 data/songs-candidates.json(검수 큐)으로 내보낸다.

실행: python scraper/export_chant_candidates.py

**data/songs.json을 덮어쓰지 않는다.** 순위표·경기 같은 기계적 사실과 달리 응원가는 가사 정확도와
공식/현장 영상 선별에 사람 판단이 들어가는 큐레이션 데이터라, 크롤러는 후보 큐까지만 만들고
사람이 검수해 songs.json으로 옮긴다. 앱(lib/api/songs.ts)은 이 파일을 읽지 않는다.

소스 두 곳(scraper/chants/):
- official.py  : incheonutd.com 공식 응원가 페이지 — 가사 신뢰도 최고, 4곡·영상 없음
- community.py : 인천네이션 응원가 모음 글 — 30여 곡·유튜브 링크, 팬 작성이라 가사 신뢰도 낮음
merge.py가 '공식 가사 + 커뮤니티 영상'으로 합치고, 이미 songs.json에 있는 곡은 걸러낸다.

검수 흐름:
1. 이 스크립트 실행 → data/songs-candidates.json
2. 각 후보의 _review.sourceUrls로 원문 대조(특히 lyricsConfidence가 "community"인 가사)
3. 승인한 곡만 id를 부여하고 _review를 뗀 뒤 data/songs.json으로 옮긴다
"""

import json
import time
from pathlib import Path

from chants import community, merge, official

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SONGS_PATH = PROJECT_ROOT / "data" / "songs.json"
OUTPUT_PATH = PROJECT_ROOT / "data" / "songs-candidates.json"

# 인천네이션 robots.txt의 Crawl-delay: 3 — 소스가 두 곳이라 그 사이에 지킨다.
CRAWL_DELAY_SECONDS = 3


def main() -> None:
    official_songs = official.parse(official.fetch())
    if not official_songs:
        raise ValueError("공식 페이지에서 곡을 0건 파싱했습니다. 페이지 구조를 확인하세요.")

    time.sleep(CRAWL_DELAY_SECONDS)

    community_songs = community.parse(community.fetch())
    if not community_songs:
        raise ValueError("커뮤니티 글에서 곡을 0건 파싱했습니다. 게시글 구조를 확인하세요.")

    known_titles, known_videos = merge.existing_keys(SONGS_PATH)
    candidates = merge.build_candidates(
        official_songs, community_songs, known_titles, known_videos
    )

    OUTPUT_PATH.write_text(
        json.dumps(candidates, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    with_video = sum(1 for c in candidates if c["_review"]["hasVideo"])
    official_lyrics = sum(
        1 for c in candidates if c["_review"]["lyricsConfidence"] == "official"
    )
    skipped = len(official_songs) + len(community_songs) - len(candidates)
    print(
        f"후보 {len(candidates)}곡 (영상 {with_video} · 공식 가사 {official_lyrics}) "
        f"→ {OUTPUT_PATH.name}\n"
        f"  수집: 공식 {len(official_songs)} · 커뮤니티 {len(community_songs)} "
        f"(중복·기존 곡 {skipped}건 제외)\n"
        f"  검수 후 승인한 곡만 id를 부여해 data/songs.json으로 옮기세요."
    )


if __name__ == "__main__":
    main()
