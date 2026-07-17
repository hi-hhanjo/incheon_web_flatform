"""검수를 마친 응원가 후보를 data/songs.json으로 승격한다.

실행: python scraper/promote_candidates.py [--dry-run]

CRAWLER_SPEC.md 3.7.3의 검수 흐름 ③단계를 스크립트로 만든 것이다. 손으로 JSON을 편집하면
id 중복·`_review` 잔류 같은 실수가 나기 쉬워 자동화한다.

하는 일:
- data/songs-candidates.json의 각 후보에 `id`를 부여(기존 최대 id + 1부터)하고 `_review`를 뗀 뒤
  data/songs.json 뒤에 덧붙인다. 기존 곡은 건드리지 않는다(id·순서 보존).
- 이미 있는 곡(제목 키 또는 youtubeId 일치)은 건너뛴다 — 두 번 실행해도 중복되지 않는다.
- 승격된 후보는 큐에서 제거한다(남은 후보만 songs-candidates.json에 다시 쓴다).

`--dry-run`은 무엇이 승격될지만 출력하고 파일을 쓰지 않는다.
"""

import json
import sys
from pathlib import Path

from chants.merge import normalize_title

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SONGS_PATH = PROJECT_ROOT / "data" / "songs.json"
CANDIDATES_PATH = PROJECT_ROOT / "data" / "songs-candidates.json"

# 앱 스키마(lib/api/songs.ts의 Song) 필드 순서 — songs.json을 사람이 읽기 좋게 유지한다.
SONG_FIELDS = ["id", "title", "videos", "lyrics", "category", "tags", "isFavorite", "source"]


def _write(path: Path, data: list) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    dry_run = "--dry-run" in sys.argv

    songs = json.loads(SONGS_PATH.read_text(encoding="utf-8"))
    candidates = json.loads(CANDIDATES_PATH.read_text(encoding="utf-8"))

    known_titles = {normalize_title(s["title"]) for s in songs}
    known_videos = {v["youtubeId"] for s in songs for v in s.get("videos", [])}
    next_id = max((s["id"] for s in songs), default=0) + 1

    promoted, skipped, remaining = [], [], []
    for candidate in candidates:
        key = normalize_title(candidate["title"])
        videos = {v["youtubeId"] for v in candidate.get("videos", [])}
        if key in known_titles or (videos & known_videos):
            skipped.append(candidate["title"])
            remaining.append(candidate)
            continue

        song = {k: v for k, v in candidate.items() if k != "_review"}
        song["id"] = next_id
        next_id += 1
        # 필드 순서를 앱 스키마대로 맞춘다(스키마에 없는 키가 있으면 뒤에 그대로 둔다).
        ordered = {f: song[f] for f in SONG_FIELDS if f in song}
        ordered.update({k: v for k, v in song.items() if k not in ordered})
        songs.append(ordered)
        known_titles.add(key)
        known_videos |= videos
        promoted.append(f"{ordered['id']}. {ordered['title']}")

    if dry_run:
        print(f"[dry-run] 승격 대상 {len(promoted)}곡:")
        for line in promoted:
            print("   ", line)
        if skipped:
            print(f"[dry-run] 이미 있어 건너뜀 {len(skipped)}곡: {', '.join(skipped)}")
        return

    _write(SONGS_PATH, songs)
    _write(CANDIDATES_PATH, remaining)
    print(
        f"{len(promoted)}곡 승격 → songs.json (총 {len(songs)}곡)\n"
        f"  큐에 남은 후보: {len(remaining)}곡"
        + (f" (이미 있어 건너뜀 {len(skipped)}곡)" if skipped else "")
    )


if __name__ == "__main__":
    main()
