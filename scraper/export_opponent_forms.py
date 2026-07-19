"""K리그1 전체 팀의 시즌 경기 폼을 크롤링해 data/opponent-forms.json으로 내보낸다.

실행: python scraper/export_opponent_forms.py [연도]  (연도 생략 시 올해)

'다음 상대'는 실시간으로 바뀌므로 12팀 전체 폼을 미리 크롤해 두고, 화면(app/club/page.tsx의
다음 상대 섹션)이 그때의 상대 것을 골라 쓴다. 앱 표기 팀명(예: "울산 HD")을 키로 하는 dict를 만든다.
저장은 팀별 시즌 전체(최신순), 화면은 최근 5경기만 표시한다.
"""

import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

from kleague.client import fetch_rank, fetch_schedule
from kleague.codes import normalize_team_name
from kleague.schedule import parse_team_form

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "data" / "opponent-forms.json"
META_PATH = PROJECT_ROOT / "data" / "opponent-forms-meta.json"

KST = timezone(timedelta(hours=9))


def main() -> None:
    year = int(sys.argv[1]) if len(sys.argv) > 1 else datetime.now().year

    teams = fetch_rank(year)["list"]
    forms = {}
    for team in teams:
        schedule = fetch_schedule(team["teamId"], year)["schedule"]
        app_name = normalize_team_name(team["shortNameKo"])
        # 시즌 전체를 저장한다(화면은 최근 N경기만 잘라 쓴다 — lib/api/opponentScouting.ts).
        forms[app_name] = parse_team_form(schedule, team["teamId"])

    OUTPUT_PATH.write_text(
        json.dumps(forms, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    META_PATH.write_text(
        json.dumps({"updatedAt": datetime.now(KST).strftime("%Y-%m-%d")}, ensure_ascii=False)
        + "\n",
        encoding="utf-8",
    )
    print(f"상대 폼 {len(forms)}팀 → {OUTPUT_PATH.name} + meta")


if __name__ == "__main__":
    main()
