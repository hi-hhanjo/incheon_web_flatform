"""다음 스포츠 순위 API 클라이언트.

portal.kleague.com은 로그인된 브라우저 세션이 필요한 내부 포털이라(하드코딩 쿠키가
만료되면 실패) 순위표 소스로 부적합했다. 다음 스포츠의 순위 API는 쿠키/인증 없이
공개 GET으로 12팀 순위표 전체를 JSON으로 준다(2026-07-16 확인).
"""

import requests

RANK_API = "https://sports.daum.net/prx/hermes/api/team/rank.json"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
    ),
    "Referer": "https://sports.daum.net/record/kl",
    "X-Requested-With": "XMLHttpRequest",
}


def fetch_rank(season_key: int, league_code: str = "kl") -> dict:
    """다음 순위 API 응답(JSON)을 반환한다. league_code 'kl'=K리그1, 'kl2'=K리그2."""
    resp = requests.get(
        RANK_API,
        params={
            "leagueCode": league_code,
            "seasonKey": str(season_key),
            "page": 1,
            "pageSize": 100,
        },
        headers=HEADERS,
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()
