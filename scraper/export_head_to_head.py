"""인천 유나이티드의 상대별 상대전적을 크롤링해 Supabase 데이터베이스에 저장한다.

실행: python scraper/export_head_to_head.py [시즌수]  (생략 시 최근 5시즌)

**왜 API-Football을 걷어냈나**: 상대전적만 유일하게 매 요청 외부 API를 실시간 조회하고 있었다.
그 탓에 ① `API_FOOTBALL_KEY`가 없으면(=Vercel에 미설정) 화면이 조용히 비고, ② 팀명 한글 매핑이
`kleague/codes.py`와 `lib/api/headToHead.ts` 두 곳에 중복됐으며, ③ 무료 플랜 시즌 제한이라는
외부 정책이 단일 장애점이었다. 다음 스포츠 경기 API는 이미 순위표·경기·상대 폼에 쓰고 있고,
시즌을 거슬러 조회하면 상대전적을 그대로 만들 수 있다(2020시즌까지 확인). 검증 결과 두 소스의
스코어가 일치했고, 다음 쪽이 무료 티어 제한이 없어 데이터가 더 많다.

**리그 자동 탐색**: 인천은 시즌마다 소속 리그가 달랐다 — 2026 K리그1, **2025 K리그2**(강등),
2024·2023 K리그1. 그래서 연도별로 `kl`(K리그1) → `kl2`(K리그2) 순으로 조회해 인천이 있는 쪽을
쓴다. 승강이 또 일어나도 코드를 고칠 필요가 없다.

산출물: 상대팀명(앱 표기) → 경기 목록(최신순). `lib/api/headToHead.ts`가 상대명으로 조회한다.
"""

import sys
from datetime import datetime, timedelta, timezone

from kleague.client import fetch_rank, fetch_schedule
from kleague.schedule import parse_head_to_head
from supabase_client import supabase

KST = timezone(timedelta(hours=9))
DEFAULT_SEASONS = 25  # 역대 전적을 위해 25시즌 (K리그 원년부터 최대한 확보)
LEAGUE_CODES = ("kl", "kl2")
INCHEON_SHORT_NAME = "인천"


def find_incheon(year: int) -> tuple[str, int] | None:
    """해당 연도에 인천이 속한 (리그코드, 팀ID). 못 찾으면 None."""
    for code in LEAGUE_CODES:
        try:
            teams = fetch_rank(year, code)["list"]
        except Exception:
            continue
        team = next((t for t in teams if t["shortNameKo"] == INCHEON_SHORT_NAME), None)
        if team:
            return code, team["teamId"]
    return None


def main() -> None:
    seasons = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SEASONS
    this_year = datetime.now(KST).year

    by_opponent: dict[str, list[dict]] = {}
    covered = []
    for year in range(this_year, this_year - seasons, -1):
        found = find_incheon(year)
        if not found:
            continue
        code, team_id = found
        schedule = fetch_schedule(team_id, year, code)["schedule"]
        rows = parse_head_to_head(schedule, team_id)
        for row in rows:
            opponent = row.pop("opponent")
            by_opponent.setdefault(opponent, []).append(row)
        covered.append(f"{year}({code})")

    if not by_opponent:
        raise ValueError("상대전적이 0건입니다. 시즌/리그 탐색을 확인하세요.")

    # 시즌을 최신→과거로 돌았으므로 이미 최신순이지만, 시즌 경계를 넘어 확실히 정렬해 둔다.
    for rows in by_opponent.values():
        rows.sort(key=lambda r: r["date"], reverse=True)

    snapshot_date = datetime.now(KST).strftime("%Y-%m-%d")

    for opponent, matches in by_opponent.items():
        supabase.table("head_to_head").delete().eq("opponent", opponent).execute()
        for m in matches:
            data = {
                "opponent": opponent,
                "date": m["date"],
                "home_team": m["homeTeam"],
                "away_team": m["awayTeam"],
                "home_score": m["homeScore"],
                "away_score": m["awayScore"],
                "game_id": m["gameId"],
                "venue": m["venue"],
                "updated_at": snapshot_date
            }
            supabase.table("head_to_head").insert(data).execute()

    total = sum(len(v) for v in by_opponent.values())
    print(
        f"상대전적 {len(by_opponent)}팀 · {total}경기 (시즌: {', '.join(covered)}) "
        f"→ Supabase"
    )


if __name__ == "__main__":
    main()
