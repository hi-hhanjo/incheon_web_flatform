"""인천 유나이티드 경기 일정/결과를 크롤링해 data/matches.json으로 내보낸다.

실행: python scraper/export_matches.py [연도]  (연도 생략 시 올해)

앱(lib/api/matches.ts)이 이 JSON을 런타임에 직접 읽어 '지난 경기 결과'·'최근 경기 전적'·
'다가오는 매치'를 표시한다. 순위표와 동일한 다음 스포츠 공개 API를 쓴다.
"""

import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

from kleague.client import fetch_rank, fetch_schedule
from kleague.schedule import parse_incheon_matches

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "data" / "matches.json"
META_PATH = PROJECT_ROOT / "data" / "matches-meta.json"

KST = timezone(timedelta(hours=9))


def main() -> None:
    year = int(sys.argv[1]) if len(sys.argv) > 1 else datetime.now().year

    teams = fetch_rank(year)["list"]
    incheon = next(t for t in teams if t["shortNameKo"] == "인천")
    schedule = fetch_schedule(incheon["teamId"], year)["schedule"]
    matches = parse_incheon_matches(schedule, incheon["teamId"])

    if not matches:
        raise ValueError("경기가 0건입니다. 스케줄 파싱을 확인하세요.")

    OUTPUT_PATH.write_text(
        json.dumps(matches, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    META_PATH.write_text(
        json.dumps({"updatedAt": datetime.now(KST).strftime("%Y-%m-%d")}, ensure_ascii=False)
        + "\n",
        encoding="utf-8",
    )
    finished = sum(1 for m in matches if m["status"] == "finished")
    upcoming = len(matches) - finished
    print(f"인천 경기 {len(matches)}건(완료 {finished}·예정 {upcoming}) → {OUTPUT_PATH.name}")


if __name__ == "__main__":
    main()
