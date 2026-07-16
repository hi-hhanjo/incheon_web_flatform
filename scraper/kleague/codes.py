"""다음 스포츠 순위 API의 팀명 → 이 앱의 표시용 팀명 매핑.

다음 API는 팀명을 nameKo로 준다(예: "인천 Utd", "전북 현대"). 앱 전체(data/standings.json,
lib/api/*.ts)는 다른 표기(예: "인천 유나이티드", "전북 현대모터스")를 쓰므로 변환한다.
매핑에 없는 팀은 원문을 그대로 두어(조용히 버리지 않음) export 검증에서 드러나게 한다.
"""

# 다음 nameKo → 앱 표기. 2026 K리그1 12팀 기준(2026-07-16 확인).
NORMALIZE_TEAM_NAME = {
    "FC서울": "FC서울",
    "전북 현대": "전북 현대모터스",
    "강원FC": "강원FC",
    "포항 스틸러스": "포항 스틸러스",
    "울산 HD": "울산 HD",
    "FC안양": "안양FC",
    "인천 Utd": "인천 유나이티드",
    "제주SK FC": "제주SK",
    "부천FC1995": "부천FC",
    "대전 하나 시티즌": "대전하나시티즌",
    "김천 상무": "김천 상무",
    "광주FC": "광주FC",
}


def normalize_team_name(daum_name: str) -> str:
    """다음 팀명(nameKo)을 앱 표시용 팀명으로 바꾼다. 매핑에 없으면 원문 유지."""
    return NORMALIZE_TEAM_NAME.get(daum_name.strip(), daum_name.strip())
