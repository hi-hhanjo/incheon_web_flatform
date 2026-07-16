"""K리그1 순위표 파싱: 다음 순위 API 응답(JSON) → data/standings.json 스키마.

각 팀 객체의 최상위 rank 필드에 순위표에 필요한 값이 모두 있다:
    "rank": {"rank":1, "game":17, "win":11, "draw":3, "loss":3, "gf":28, "ga":12, "gd":16, "pts":36}
"""

from typing import Any

from .codes import normalize_team_name


def parse_standings(data: dict) -> list[dict[str, Any]]:
    """다음 순위 API 응답을 data/standings.json 스키마의 리스트로 변환한다."""
    rows = []
    for team in data["list"]:
        r = team["rank"]
        rows.append(
            {
                "rank": r["rank"],
                "team": normalize_team_name(team["shortNameKo"]),
                "played": r["game"],
                "win": r["win"],
                "draw": r["draw"],
                "lose": r["loss"],
                "goalsFor": r["gf"],
                "goalsAgainst": r["ga"],
                "points": r["pts"],
            }
        )
    rows.sort(key=lambda x: x["rank"])
    return rows
