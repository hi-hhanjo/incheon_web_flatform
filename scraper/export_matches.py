"""인천 유나이티드 경기 일정/결과를 크롤링해 Supabase 데이터베이스에 저장한다.

실행: python scraper/export_matches.py [연도]  (연도 생략 시 올해)

앱(lib/api/matches.ts)이 Supabase에서 읽어 '지난 경기 결과'·'최근 경기 전적'·
'다가오는 매치'를 표시한다. 순위표와 동일한 다음 스포츠 공개 API를 쓴다.
"""

import sys
from datetime import datetime, timezone, timedelta

from kleague.client import fetch_rank, fetch_schedule
from kleague.schedule import parse_incheon_matches
from supabase_client import supabase

KST = timezone(timedelta(hours=9))


def main() -> None:
    year = int(sys.argv[1]) if len(sys.argv) > 1 else datetime.now().year

    teams = fetch_rank(year)["list"]
    incheon = next(t for t in teams if t["shortNameKo"] == "인천")
    schedule = fetch_schedule(incheon["teamId"], year)["schedule"]
    matches = parse_incheon_matches(schedule, incheon["teamId"])

    if not matches:
        raise ValueError("경기가 0건입니다. 스케줄 파싱을 확인하세요.")

    snapshot_date = datetime.now(KST).strftime("%Y-%m-%d")

    for m in matches:
        score_incheon = m.get("score", {}).get("incheon") if m.get("score") else None
        score_opponent = m.get("score", {}).get("opponent") if m.get("score") else None
        is_home = 1 if m["isHome"] else 0
        data = {
            "id": m["id"],
            "round": m["round"],
            "kickoff_at": m["kickoffAt"],
            "status": m["status"],
            "opponent": m["opponent"],
            "is_home": is_home,
            "score_incheon": score_incheon,
            "score_opponent": score_opponent,
            "venue": m["venue"],
            "updated_at": snapshot_date
        }
        supabase.table("matches").upsert(data).execute()

    finished = sum(1 for m in matches if m["status"] == "finished")
    upcoming = len(matches) - finished
    print(f"인천 경기 {len(matches)}건(완료 {finished}·예정 {upcoming}) → Supabase")


if __name__ == "__main__":
    main()
