"""사람이 고른 유튜브 영상 URL을 응원가 검수 큐에 추가한다.

실행:
    python scraper/add_youtube_chants.py https://youtu.be/XXXXXXXXXXX ...
    python scraper/add_youtube_chants.py < urls.txt      # 한 줄에 하나씩
    python scraper/add_youtube_chants.py --dry-run ...   # 큐에 쓰지 않고 결과만 출력

**왜 URL을 사람이 주나**: 아누즈 채널은 신규 응원가가 나오면 올려주지만, 채널을 자동으로 훑는
경로(RSS·/youtubei/)가 robots.txt Disallow다 — 봇 차단을 우회하지 않는다는 기존 방침
(CRAWLER_SPEC.md 3.7.1의 나무위키 탈락 기준)에 따라 자동 수집 대신 허용된 oembed로
**고른 영상만** 조회한다. 자세한 근거는 CRAWLER_SPEC.md 3.9절.

**data/songs.json을 덮어쓰지 않는다.** export_chant_candidates.py와 같이 검수 큐
(data/songs-candidates.json)까지만 만들고, 승격은 promote_candidates.py가 맡는다(3.7.3).
기존 곡·이미 큐에 있는 후보와 대조하므로 같은 URL을 두 번 넣어도 후보가 늘지 않는다(멱등).
"""

import json
import sys
from pathlib import Path

import requests

from chants import youtube
from chants.merge import existing_keys, normalize_title

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SONGS_PATH = PROJECT_ROOT / "data" / "songs.json"
CANDIDATES_PATH = PROJECT_ROOT / "data" / "songs-candidates.json"


def _read_urls(args: list[str]) -> list[str]:
    """인자로 받은 URL들. 없으면 표준입력에서 한 줄에 하나씩 읽는다."""
    urls = [a for a in args if not a.startswith("--")]
    if urls:
        return urls
    return [line.strip() for line in sys.stdin if line.strip()]


def _load_candidates() -> list[dict]:
    if not CANDIDATES_PATH.exists():
        return []
    return json.loads(CANDIDATES_PATH.read_text(encoding="utf-8"))


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    urls = _read_urls(sys.argv[1:])
    if not urls:
        raise SystemExit(
            "영상 URL을 하나 이상 넘기세요.\n"
            "  예: python add_youtube_chants.py https://youtu.be/XXXXXXXXXXX"
        )

    candidates = _load_candidates()
    known_titles, known_videos = existing_keys(SONGS_PATH)
    # 이미 큐에 있는 후보도 중복 대상이다(export_chant_candidates.py가 만든 것 포함).
    queued_titles = {normalize_title(c["title"]) for c in candidates}
    queued_videos = {v["youtubeId"] for c in candidates for v in c.get("videos", [])}

    added, skipped, failed = [], [], []
    for url in urls:
        try:
            video_id = youtube.video_id_of(url)
        except ValueError as error:
            failed.append(str(error))
            continue

        if video_id in known_videos or video_id in queued_videos:
            skipped.append(f"{video_id} (이미 있는 영상)")
            continue

        try:
            meta = youtube.fetch(video_id)
        except requests.HTTPError as error:
            # 404 = 삭제·비공개 영상. 조용히 넘기지 않고 무엇이 실패했는지 남긴다.
            failed.append(f"{video_id} (조회 실패: HTTP {error.response.status_code})")
            continue

        # 설명란(=가사)은 없을 수 있다 — 그러면 가사 없이 후보를 만든다(youtube.py 참고).
        description = youtube.fetch_description(video_id)
        candidate = youtube.build_candidate(video_id, meta, description)
        key = normalize_title(candidate["title"])
        if key in known_titles or key in queued_titles:
            skipped.append(f"{candidate['title']} (이미 있는 곡)")
            continue

        candidates.append(candidate)
        queued_titles.add(key)
        queued_videos.add(video_id)
        lyrics_note = (
            f"가사 {len(candidate['lyrics'].splitlines())}줄"
            if candidate["lyrics"]
            else "가사 없음(설명란에 없음)"
        )
        added.append(f"{candidate['title']}  [{lyrics_note}]")

    for line in added:
        print("  +", line)
    for line in skipped:
        print("  -", line)
    for line in failed:
        print("  !", line)

    if dry_run:
        print(f"\n[dry-run] 후보 {len(added)}곡 추가 예정 (파일을 쓰지 않았습니다)")
        return

    if added:
        CANDIDATES_PATH.write_text(
            json.dumps(candidates, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    print(
        f"\n후보 {len(added)}곡 추가 → {CANDIDATES_PATH.name} (큐 총 {len(candidates)}곡)\n"
        f"  가사는 영상 설명란에서 가져옵니다 — 원문과 대조하세요(머리말이 섞일 수 있습니다).\n"
        f"  이어서: python promote_candidates.py --dry-run"
    )


if __name__ == "__main__":
    main()
