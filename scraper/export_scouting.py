"""K리그1 팀별 스카우팅 정보(주요 선수·부상)를 크롤링해 data/opponent-scouting.json으로 내보낸다.

실행: python scraper/export_scouting.py [연도]  (연도 생략 시 올해)

두 소스를 합친다:
- 주요 선수: 다음 스포츠 선수 순위 API(득점·도움)에서 팀별 상위 2명.
- 부상: Transfermarkt K리그1 부상자 목록(선수·부상명·복귀 예정).

앱(lib/api/opponentScouting.ts)이 이 JSON을 팀명 키로 읽어 '다가오는 상대' 스카우팅에 표시한다.
라인업(probableLineup)은 아직 소스가 없어 빈 목록으로 둔다.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

from kleague.client import fetch_person_rank
from kleague.codes import normalize_team_name, normalize_tm_team_name
from kleague.translation import translate_player, translate_injury
from supabase_client import supabase

PROJECT_ROOT = Path(__file__).resolve().parent.parent

KEY_PLAYERS_PER_TEAM = 2  # 팀당 대표 선수 수(득점→도움 순으로 채운다).
TM_INJURY_URL = "https://www.transfermarkt.com/k-league-1/verletztespieler/wettbewerb/RSK1"
TM_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    )
}


def scrape_injuries() -> dict[str, list[dict]]:
    """Transfermarkt 부상자 페이지를 파싱해 {앱 팀명: [부상 항목]}을 만든다.
    실패하면(구조 변경·네트워크 등) 빈 dict를 반환해 주요 선수만이라도 나가게 한다."""
    injuries_by_team: dict[str, list[dict]] = {}
    try:
        res = requests.get(TM_INJURY_URL, headers=TM_HEADERS, timeout=20)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")

        tables = soup.find_all("table", class_="items")
        if not tables:
            print("Transfermarkt에서 부상자 테이블을 찾지 못했습니다.")
            return injuries_by_team

        rows = tables[0].find("tbody").find_all("tr", recursive=False)
        for row in rows:
            cols = row.find_all("td", recursive=False)
            if len(cols) < 5:
                continue

            # 선수명(첫 칸의 대표 링크)
            player_link = cols[0].find("td", class_="hauptlink")
            if not (player_link and player_link.find("a")):
                continue
            player_name_raw = player_link.find("a").text.strip()
            player_name = translate_player(player_name_raw)

            # 팀명(둘째 칸 엠블럼의 title/alt) → 앱 표기로 정규화
            team_img = cols[1].find("img")
            tm_team_name = (team_img.get("title") or team_img.get("alt")) if team_img else "Unknown"
            normalized_team = normalize_tm_team_name(tm_team_name)

            injury_type_raw = cols[2].text.strip()
            injury_type = translate_injury(injury_type_raw)
            return_date = cols[4].text.strip()
            # 복귀일 칸이 비었거나 이적료(€)가 잘못 들어오면 '미정' 처리
            if not return_date or return_date.startswith("€"):
                return_date = "미정"

            injuries_by_team.setdefault(normalized_team, []).append(
                {"name": player_name, "status": injury_type, "expectedReturn": return_date}
            )
    except Exception as e:
        print(f"Transfermarkt 부상 정보 수집 실패: {e}")

    return injuries_by_team


def collect_key_players(year: str) -> dict[str, dict]:
    """다음 선수 순위(득점·도움)에서 팀별 대표 선수 최대 2명을 뽑는다.
    득점 상위로 먼저 채우고, 모자라면 도움 상위로 보충한다(중복 이름 제외)."""
    teams_data: dict[str, dict] = {}

    def team_bucket(short_name: str) -> dict | None:
        if not short_name:
            return None
        name = normalize_team_name(short_name)
        return teams_data.setdefault(name, {"keyPlayers": [], "injuries": [], "probableLineup": []})

    # 득점 상위 → 팀별 핵심 선수
    for p in fetch_person_rank(year, "gf"):
        bucket = team_bucket(p.get("statTeam", {}).get("shortNameKo"))
        if bucket is None or len(bucket["keyPlayers"]) >= KEY_PLAYERS_PER_TEAM:
            continue
        gf = p.get("stat", {}).get("gf", 0)
        bucket["keyPlayers"].append({
            "name": p.get("nameKo") or p.get("nameMain"),
            "position": p.get("position", {}).get("nameMain", "Unknown"),
            "note": f"시즌 {gf}골 (팀 내 핵심)",
        })

    # 도움 상위 → 빈 자리 보충(이미 담긴 선수는 제외)
    for p in fetch_person_rank(year, "ast"):
        bucket = team_bucket(p.get("statTeam", {}).get("shortNameKo"))
        if bucket is None or len(bucket["keyPlayers"]) >= KEY_PLAYERS_PER_TEAM:
            continue
        name = p.get("nameKo") or p.get("nameMain")
        if name in [kp["name"] for kp in bucket["keyPlayers"]]:
            continue
        ast = p.get("stat", {}).get("ast", 0)
        bucket["keyPlayers"].append({
            "name": name,
            "position": p.get("position", {}).get("nameMain", "Unknown"),
            "note": f"시즌 {ast}도움 (주요 자원)",
        })

    return teams_data


def main() -> None:
    year = sys.argv[1] if len(sys.argv) > 1 else str(datetime.now().year)

    print(f"{year} 주요 선수 수집 중...")
    teams_data = collect_key_players(year)

    print("Transfermarkt 부상 정보 수집 중...")
    for team, injuries in scrape_injuries().items():
        bucket = teams_data.setdefault(team, {"keyPlayers": [], "injuries": [], "probableLineup": []})
        bucket["injuries"] = injuries

    snapshot_date = datetime.now().strftime("%Y-%m-%d")
    for opponent, data in teams_data.items():
        supabase.table("opponent_scouting").upsert({"opponent": opponent, "updated_at": snapshot_date}).execute()

        supabase.table("opponent_key_players").delete().eq("opponent", opponent).execute()
        for kp in data.get("keyPlayers", []):
            supabase.table("opponent_key_players").insert({
                "opponent": opponent,
                "name": kp["name"],
                "position": kp["position"],
                "note": kp["note"]
            }).execute()

        supabase.table("opponent_injuries").delete().eq("opponent", opponent).execute()
        for inj in data.get("injuries", []):
            supabase.table("opponent_injuries").insert({
                "opponent": opponent,
                "name": inj["name"],
                "status": inj["status"],
                "expected_return": inj["expectedReturn"]
            }).execute()
        
        supabase.table("opponent_probable_lineup").delete().eq("opponent", opponent).execute()
        for i, player in enumerate(data.get("probableLineup", [])):
            supabase.table("opponent_probable_lineup").insert({
                "opponent": opponent,
                "player_name": player,
                "sort_order": i
            }).execute()

    print(f"스카우팅 {len(teams_data)}팀 → Supabase")


if __name__ == "__main__":
    main()
