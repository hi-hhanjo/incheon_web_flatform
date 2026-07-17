"""다음 경기 일정/결과(schedule.json) 파싱.

응답의 schedule는 날짜(YYYYMMDD) → 경기 리스트 형태의 dict. 각 경기를 '특정 팀 관점'으로
해석해, 앱이 쓰는 세 가지 산출물로 변환한다:
- parse_incheon_matches: 인천 경기 → data/matches.json 스키마(Match)
- parse_team_form: 임의 팀의 완료 경기(최신순) → 상대 폼 스키마
- parse_head_to_head: 임의 팀의 완료 경기 → 상대전적 스키마(홈/원정 관점 유지)
"""

from typing import Any

from .codes import normalize_team_name


def _flatten(schedule: dict) -> list[dict]:
    """날짜별 dict를 경기 리스트로 펴서 kickoff 순으로 정렬한다."""
    games = [g for date in schedule for g in schedule[date]]
    return sorted(games, key=lambda g: (g["startDate"], g.get("startTime") or "0000"))


def _kickoff_iso(game: dict) -> str:
    """startDate(20260712)+startTime(1930) → '2026-07-12T19:30:00+09:00'(KST)."""
    d, t = game["startDate"], (game.get("startTime") or "0000")
    return f"{d[0:4]}-{d[4:6]}-{d[6:8]}T{t[0:2]}:{t[2:4]}:00+09:00"


def _view(game: dict, team_id: int) -> dict:
    """경기를 team_id 관점(우리 팀/상대)으로 해석한다."""
    is_home = game["homeTeamId"] == team_id
    opp_short = game["awayTeamName"] if is_home else game["homeTeamName"]
    # 다음 API는 스코어를 문자열("4")로 준다 — 숫자로 캐스팅(미종료 경기는 None).
    home_score = int(game["homeResult"]) if game["homeResult"] is not None else None
    away_score = int(game["awayResult"]) if game["awayResult"] is not None else None
    team_score = home_score if is_home else away_score
    opp_score = away_score if is_home else home_score
    return {
        "is_home": is_home,
        "opponent": normalize_team_name(opp_short),
        "team_score": team_score,
        "opp_score": opp_score,
        "finished": game["gameStatus"] == "END",
        "date": f"{game['startDate'][0:4]}-{game['startDate'][4:6]}-{game['startDate'][6:8]}",
    }


def parse_incheon_matches(schedule: dict, incheon_team_id: int) -> list[dict[str, Any]]:
    """인천 경기 전체를 data/matches.json 스키마로 변환한다."""
    matches = []
    for game in _flatten(schedule):
        v = _view(game, incheon_team_id)
        finished = v["finished"]
        matches.append(
            {
                "id": game["gameId"],
                "round": f"K리그1 {game['roundSeq']}라운드",
                "kickoffAt": _kickoff_iso(game),
                "status": "finished" if finished else "upcoming",
                "opponent": v["opponent"],
                "isHome": v["is_home"],
                "score": (
                    {"incheon": v["team_score"], "opponent": v["opp_score"]}
                    if finished
                    else None
                ),
                "venue": game["fieldName"],
            }
        )
    return matches


def parse_head_to_head(schedule: dict, team_id: int) -> list[dict[str, Any]]:
    """team_id 팀의 완료 경기를 상대전적 스키마로 변환한다(최신순).

    상대 폼(parse_team_form)과 달리 '우리 팀 관점'으로 접지 않고 **홈/원정 팀명과 스코어를 그대로**
    남긴다 — 화면(HeadToHeadList)이 "인천 2:1 전북"처럼 실제 대진을 보여주기 때문이다.
    `opponent`는 어느 상대와의 전적인지 묶기 위한 키이며, 앱 스키마(HeadToHeadMatch)에는 없다.
    """
    rows = []
    for game in _flatten(schedule):
        if game["gameStatus"] != "END":
            continue
        v = _view(game, team_id)
        rows.append(
            {
                "opponent": v["opponent"],
                "date": v["date"],
                "homeTeam": normalize_team_name(game["homeTeamName"]),
                "awayTeam": normalize_team_name(game["awayTeamName"]),
                "homeScore": int(game["homeResult"]),
                "awayScore": int(game["awayResult"]),
            }
        )
    rows.reverse()  # _flatten이 오름차순이므로 뒤집어 최신순
    return rows


def parse_team_form(
    schedule: dict, team_id: int, count: int | None = None
) -> list[dict[str, Any]]:
    """team_id 팀의 완료 경기를 최신순으로 form 스키마(date/opponentFaced/result/score)로 변환한다.

    count=None이면 시즌 전체를 반환한다(저장은 전체, 화면에서 필요한 만큼 잘라 쓴다).
    """
    finished = [
        (_view(game, team_id))
        for game in _flatten(schedule)
        if game["gameStatus"] == "END"
    ]
    recent = list(reversed(finished))  # _flatten이 오름차순이므로 뒤집어 최신순
    if count is not None:
        recent = recent[:count]
    form = []
    for v in recent:
        if v["team_score"] > v["opp_score"]:
            result = "W"
        elif v["team_score"] < v["opp_score"]:
            result = "L"
        else:
            result = "D"
        form.append(
            {
                "date": v["date"],
                "opponentFaced": v["opponent"],
                "result": result,
                "score": f"{v['team_score']}-{v['opp_score']}",
            }
        )
    return form
