"""K리그1 순위표를 크롤링해 Supabase 데이터베이스에 저장한다.

실행: python scraper/export_standings.py [연도]
  (연도 생략 시 올해)

두 테이블을 갱신한다:
- standings                : 최신 스냅샷(덮어씀). 화면이 표시하는 현재 순위.
- standings_history        : 수집일별 스냅샷(누적). 재빌드에도 남는 이력 저장소 및 등락표 계산용.
"""

import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

from kleague.client import fetch_rank
from kleague.standings import parse_standings
from supabase_client import supabase

KST = timezone(timedelta(hours=9))  # 수집일은 한국 시간 기준으로 찍는다.

REQUIRED_KEYS = {
    "rank", "team", "played", "win", "draw", "lose",
    "goalsFor", "goalsAgainst", "points",
}
EXPECTED_TEAM_COUNT = 12  # K리그1은 12팀. 달라지면 파싱이 깨진 신호.


def previous_snapshot(snapshot_date: str) -> tuple[str | None, list[dict] | None]:
    """오늘(snapshot_date)을 제외한 가장 최근 이력 스냅샷의 (날짜, 행들)을 반환한다."""
    response = supabase.table("standings_history").select("snapshot_date").lt("snapshot_date", snapshot_date).order("snapshot_date", desc=True).limit(1).execute()
    
    if not response.data:
        return None, None
        
    past_date = response.data[0]["snapshot_date"]
    past_rows_response = supabase.table("standings_history").select("*").eq("snapshot_date", past_date).execute()
    
    return past_date, past_rows_response.data


def rank_changes(rows: list[dict], previous_rows: list[dict] | None) -> dict[str, int | None]:
    """직전 스냅샷 대비 순위 변동. 양수=상승, 음수=하락, 0=유지, None=비교 불가(신규/이력 없음)."""
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

    snapshot_date = datetime.now(KST).strftime("%Y-%m-%d")

    # 오늘 이력을 쓰기 전에 직전 스냅샷과 비교해 순위 변동을 계산한다.
    previous_date, previous_rows = previous_snapshot(snapshot_date)
    changes = rank_changes(rows, previous_rows)

    # 수집일별 이력(누적) 저장
    # 같은 날 재실행 시 중복을 피하기 위해 기존 오늘 날짜 데이터 삭제 (멱등성)
    supabase.table("standings_history").delete().eq("snapshot_date", snapshot_date).execute()
    
    history_inserts = []
    standings_upserts = []
    
    for row in rows:
        # History 테이블용 데이터
        history_inserts.append({
            "team": row["team"],
            "rank": row["rank"],
            "played": row["played"],
            "win": row["win"],
            "draw": row["draw"],
            "lose": row["lose"],
            "goals_for": row["goalsFor"],
            "goals_against": row["goalsAgainst"],
            "points": row["points"],
            "snapshot_date": snapshot_date
        })
        
        # 현재 순위 테이블용 데이터
        standings_upserts.append({
            "team": row["team"],
            "rank": row["rank"],
            "played": row["played"],
            "win": row["win"],
            "draw": row["draw"],
            "lose": row["lose"],
            "goals_for": row["goalsFor"],
            "goals_against": row["goalsAgainst"],
            "points": row["points"],
            "rank_change": changes.get(row["team"]),
            "updated_at": snapshot_date
        })

    # 데이터베이스에 반영
    supabase.table("standings_history").insert(history_inserts).execute()
    supabase.table("standings").upsert(standings_upserts).execute()

    moved = sum(1 for v in changes.values() if v is not None and v != 0)
    print(
        f"순위표 {len(rows)}팀 (기준일 {snapshot_date}, 직전 {previous_date or '없음'}, "
        f"변동 {moved}팀) → Supabase 업데이트 완료"
    )


if __name__ == "__main__":
    main()

