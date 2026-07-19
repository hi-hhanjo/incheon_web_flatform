"""가사가 빈 곡을, 그 곡의 유튜브 영상 설명란에서 채운다.

실행: python scraper/backfill_youtube_lyrics.py [--dry-run]

**왜 별도 스크립트인가**: add_youtube_chants.py는 **새 곡**을 검수 큐에 넣는다. 반면 이미
songs.json에 올라간 곡(3.9.4의 아누즈 9곡 — 설명란 수집 이전에 승격돼 lyrics가 "")은 큐를
다시 거치지 않는다. reconcile_songs.py도 공식·커뮤니티 두 소스만 대조하지 유튜브는 모른다.
그 틈을 메우는 게 이 스크립트다(CRAWLER_SPEC.md 3.9.5).

방침:
- **가사가 빈 곡만** 건드린다. 이미 가사가 있으면 건너뛴다 — 손으로 고친 가사나 공식 가사를
  유튜브 설명란으로 덮어쓰지 않는다(reconcile의 '크롤이 이긴다'는 공식>커뮤니티 서열 얘기이고,
  팬 채널 설명란은 그 서열의 맨 아래다).
- 가사를 채우면 `source`(가사 출처)도 함께 붙인다 — 실제로 가져온 그 영상이다(PRD 9장).
- 설명란이 비었거나 못 읽으면 그대로 둔다.
- **멱등**: 두 번 실행해도 이미 채워진 곡은 건너뛴다.
"""

import json
import sys
from pathlib import Path

import requests

from chants import youtube

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SONGS_PATH = PROJECT_ROOT / "data" / "songs.json"


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    songs = json.loads(SONGS_PATH.read_text(encoding="utf-8"))

    filled, skipped, failed = [], [], []
    for song in songs:
        if song["lyrics"]:
            continue  # 이미 가사가 있다 — 덮어쓰지 않는다
        if not song["videos"]:
            skipped.append(f"id={song['id']} {song['title']} (영상 없음)")
            continue

        video_id = song["videos"][0]["youtubeId"]
        try:
            description = youtube.fetch_description(video_id)
            meta = youtube.fetch(video_id)
        except requests.HTTPError as error:
            failed.append(
                f"id={song['id']} {song['title']} (HTTP {error.response.status_code})"
            )
            continue

        lyrics = youtube.lyrics_from_description(description) if description else ""
        if not lyrics:
            skipped.append(f"id={song['id']} {song['title']} (설명란에 가사 없음)")
            continue

        song["lyrics"] = lyrics
        song["source"] = youtube.source_of(video_id, meta)
        filled.append(
            f"id={song['id']} {song['title']} "
            f"({len(lyrics.splitlines())}줄 · 출처 {song['source']['name']})"
        )

    for line in filled:
        print("  +", line)
    for line in skipped:
        print("  -", line)
    for line in failed:
        print("  !", line)

    if dry_run:
        print(f"\n[dry-run] {len(filled)}곡 채울 예정 (파일을 쓰지 않았습니다)")
        return

    if filled:
        SONGS_PATH.write_text(
            json.dumps(songs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    print(
        f"\n가사 {len(filled)}곡 채움 → songs.json"
        + (f" · 건너뜀 {len(skipped)}곡" if skipped else "")
        + (f" · 실패 {len(failed)}곡" if failed else "")
        + "\n  설명란 원문과 대조하세요 — 머리말이 섞여 들어올 수 있습니다."
    )


if __name__ == "__main__":
    main()
