"""K리그1 순위표를 크롤링해 data/standings.json으로 내보낸다.

실행: python scraper/export_standings.py [연도]
  (연도 생략 시 올해)

두 곳에 쓴다:
- data/standings.json                    : 최신 스냅샷(덮어씀). 화면이 표시하는 현재 순위.
- data/standings-history/YYYY-MM-DD.json  : 수집일별 스냅샷(누적). 재빌드에도 남는 이력 저장소.
이후 `node scripts/seed-db.mjs`가 둘 다 SQLite로 적재한다. 화면/API 코드는 손대지 않는다.
"""

import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

from kleague.client import fetch_rank
from kleague.standings import parse_standings

# scraper/의 부모 = 프로젝트 루트.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "data" / "standings.json"
HISTORY_DIR = PROJECT_ROOT / "data" / "standings-history"

KST = timezone(timedelta(hours=9))  # 수집일은 한국 시간 기준으로 찍는다.

REQUIRED_KEYS = {
    "rank", "team", "played", "win", "draw", "lose",
    "goalsFor", "goalsAgainst", "points",
}
EXPECTED_TEAM_COUNT = 12  # K리그1은 12팀. 달라지면 파싱이 깨진 신호.


def validate(rows: list[dict]) -> None:
    """seed-db.mjs가 신뢰할 수 있도록, 쓰기 전에 스키마를 검증한다."""
    if len(rows) != EXPECTED_TEAM_COUNT:
        raise ValueError(f"팀 수가 {len(rows)}개입니다(예상 {EXPECTED_TEAM_COUNT}개). 파싱을 확인하세요.")
    for row in rows:
        missing = REQUIRED_KEYS - row.keys()
        if missing:
            raise ValueError(f"필수 필드 누락: {missing} (row: {row})")


def main() -> None:
    year = int(sys.argv[1]) if len(sys.argv) > 1 else datetime.now().year

    data = fetch_rank(year)
    rows = parse_standings(data)
    validate(rows)

    payload = json.dumps(rows, ensure_ascii=False, indent=2) + "\n"

    # 최신 스냅샷(덮어씀)
    OUTPUT_PATH.write_text(payload, encoding="utf-8")

    # 수집일별 이력(누적) — 같은 날 재실행하면 그 날짜 파일만 갱신, 과거 파일은 건드리지 않음
    snapshot_date = datetime.now(KST).strftime("%Y-%m-%d")
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    history_path = HISTORY_DIR / f"{snapshot_date}.json"
    history_path.write_text(payload, encoding="utf-8")

    print(
        f"순위표 {len(rows)}팀 → {OUTPUT_PATH.name} + history/{snapshot_date}.json "
        f"(이제 `node scripts/seed-db.mjs` 실행)"
    )


if __name__ == "__main__":
    main()
