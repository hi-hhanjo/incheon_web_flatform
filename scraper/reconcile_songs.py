"""이미 등록된 곡을 크롤 데이터와 대조해 갱신하고, 출처를 못 밝히는 곡을 제거한다.

실행: python scraper/reconcile_songs.py [--dry-run]

promote_candidates.py가 **새 곡**을 큐에서 올리는 반면, 이 스크립트는 **이미 songs.json에 있는 곡**을
크롤 원문과 다시 맞춘다. 운영 방침(2026-07-17 확정):

1. **충돌하면 크롤이 이긴다** — 손으로 넣은 가사와 크롤 가사가 다르면 크롤 가사로 덮어쓰고
   `source`를 붙인다. 크롤 소스(구단 공식 > 커뮤니티)가 사람 기억보다 신뢰할 수 있고, 출처를
   밝힐 수 있는 유일한 근거이기 때문이다.
2. **출처를 못 밝히면 지운다** — 1을 적용하고도 `source`가 없는 곡(어느 소스에도 없는 곡)은
   삭제한다. PRD 9장(가사는 출처를 표기하거나 공식/공개 자료를 사용)을 만족할 수 없는 데이터다.
3. **영상은 덮어쓰지 않는다** — `videos`는 '충돌'이 아니라 크롤러가 아예 다루지 않는 영역이다.
   공식 페이지는 영상을 제공하지 않고(음원 zip만), 커뮤니티는 곡당 링크 1개뿐이다. 반면 기존
   곡의 영상은 official/live 구분이 붙은 상태다. 그래서 기존 영상을 유지하고, 영상이 하나도
   없는 곡에만 크롤 영상을 채운다. (PRD 9장 — 영상은 유튜브 임베드라 출처가 자명해 source 대상이 아님)

교체된 가사는 삭제 전에 표준출력으로 보여주므로, --dry-run으로 먼저 확인할 것.
"""

import json
import sys
from pathlib import Path

from chants import community, merge, official

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SONGS_PATH = PROJECT_ROOT / "data" / "songs.json"


def crawl_index() -> dict[str, dict]:
    """제목 키 → {lyrics, youtubeId, sourceUrl}. 공식이 커뮤니티를 덮어쓴다(가사 신뢰도)."""
    index: dict[str, dict] = {}
    for song in community.parse(community.fetch()):
        key = merge.normalize_title(song["title"])
        if key:
            index[key] = song
    for song in official.parse(official.fetch()):
        key = merge.normalize_title(song["title"])
        if not key or not song["lyrics"]:
            continue  # 가사 없는 공식 항목(효과음)은 커뮤니티 가사를 밀어내지 않는다
        index[key] = {**index.get(key, {}), **song}
    return index


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    songs = json.loads(SONGS_PATH.read_text(encoding="utf-8"))
    crawled = crawl_index()

    updated, deleted, kept = [], [], []
    result = []
    for song in songs:
        match = crawled.get(merge.normalize_title(song["title"]))

        if match:
            changes = []
            if match["lyrics"] and match["lyrics"] != song["lyrics"]:
                song["lyrics"] = match["lyrics"]
                changes.append("가사")
            source = merge.source_of(match["sourceUrl"])
            if song.get("source") != source:
                song["source"] = source
                changes.append("출처")
            # 영상이 하나도 없을 때만 크롤 영상으로 채운다(방침 3).
            if not song["videos"] and match.get("youtubeId"):
                song["videos"] = [
                    {"type": "live", "label": "현장 영상", "youtubeId": match["youtubeId"]}
                ]
                changes.append("영상")
            if changes:
                updated.append(f"id={song['id']} {song['title']} ({'·'.join(changes)})")

        if "source" not in song:
            deleted.append(f"id={song['id']} {song['title']}")
            continue

        kept.append(song["title"])
        result.append(song)

    if dry_run:
        print(f"[dry-run] 갱신 {len(updated)}곡:")
        for line in updated:
            print("   ", line)
        print(f"[dry-run] 삭제(출처 없음) {len(deleted)}곡:")
        for line in deleted:
            print("   ", line)
        print(f"[dry-run] 결과: {len(songs)}곡 → {len(result)}곡")
        return

    SONGS_PATH.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        f"갱신 {len(updated)}곡 · 삭제 {len(deleted)}곡 → songs.json ({len(songs)} → {len(result)}곡)"
    )
    for line in updated:
        print("  [갱신]", line)
    for line in deleted:
        print("  [삭제]", line)


if __name__ == "__main__":
    main()
