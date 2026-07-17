"""K리그1 순위표를 크롤링해 data/standings.json으로 내보낸다.

실행: python scraper/export_standings.py [연도]
  (연도 생략 시 올해)

세 곳에 쓴다:
- data/standings.json                    : 최신 스냅샷(덮어씀). 화면이 표시하는 현재 순위.
- data/standings-meta.json               : {updatedAt, previousDate, rankChange} — 기준일 배지 +
                                           직전 스냅샷 대비 순위 변동(▲▼). 파생값은 여기에 둔다.
- data/standings-history/YYYY-MM-DD.json  : 수집일별 스냅샷(누적). 재빌드에도 남는 이력 저장소.
standings.json과 그날의 history 파일은 항상 동일한 순수 스냅샷이다(파생값은 meta에만).
앱(lib/api/standings.ts)은 이 JSON들을 런타임에 직접 읽는다(Vercel 서버리스 호환).
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
META_PATH = PROJECT_ROOT / "data" / "standings-meta.json"
HISTORY_DIR = PROJECT_ROOT / "data" / "standings-history"

KST = timezone(timedelta(hours=9))  # 수집일은 한국 시간 기준으로 찍는다.

REQUIRED_KEYS = {
    "rank", "team", "played", "win", "draw", "lose",
    "goalsFor", "goalsAgainst", "points",
}
EXPECTED_TEAM_COUNT = 12  # K리그1은 12팀. 달라지면 파싱이 깨진 신호.


def previous_snapshot(snapshot_date: str) -> tuple[str | None, list[dict] | None]:
    """오늘(snapshot_date)을 제외한 가장 최근 이력 스냅샷의 (날짜, 행들)을 반환한다.
    같은 날 재실행해도 오늘 파일과 자기 자신을 비교하지 않도록 오늘 날짜는 제외한다."""
    if not HISTORY_DIR.exists():
        return None, None
    past = sorted(p for p in HISTORY_DIR.glob("*.json") if p.stem != snapshot_date)
    if not past:
        return None, None
    return past[-1].stem, json.loads(past[-1].read_text(encoding="utf-8"))


def rank_changes(rows: list[dict], previous_rows: list[dict] | None) -> dict[str, int | None]:
    """직전 스냅샷 대비 순위 변동. 양수=상승, 음수=하락, 0=유지, None=비교 불가(신규/이력 없음).

    순위는 숫자가 작을수록 상위이므로 (직전순위 - 현재순위)가 양수면 상승이다.
    """
    if not previous_rows:
        return {row["team"]: None for row in rows}
    before = {row["team"]: row["rank"] for row in previous_rows}
    return {
        row["team"]: (before[row["team"]] - row["rank"]) if row["team"] in before else None
        for row in rows
    }


def validate(rows: list[dict]) -> None:
    """앱이 신뢰할 수 있도록, 쓰기 전에 스키마를 검증한다."""
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

    snapshot_date = datetime.now(KST).strftime("%Y-%m-%d")

    # 오늘 이력을 쓰기 전에 직전 스냅샷과 비교해 순위 변동을 계산한다.
    previous_date, previous_rows = previous_snapshot(snapshot_date)
    changes = rank_changes(rows, previous_rows)

    # 최신 스냅샷(덮어씀) + 메타(기준일 + 파생 변동값)
    OUTPUT_PATH.write_text(payload, encoding="utf-8")
    META_PATH.write_text(
        json.dumps(
            {"updatedAt": snapshot_date, "previousDate": previous_date, "rankChange": changes},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    # 수집일별 이력(누적) — 같은 날 재실행하면 그 날짜 파일만 갱신, 과거 파일은 건드리지 않음
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    history_path = HISTORY_DIR / f"{snapshot_date}.json"
    history_path.write_text(payload, encoding="utf-8")

    moved = sum(1 for v in changes.values() if v)
    print(
        f"순위표 {len(rows)}팀 (기준일 {snapshot_date}, 직전 {previous_date or '없음'}, "
        f"변동 {moved}팀) → standings.json + meta + history/"
    )


if __name__ == "__main__":
    main()
