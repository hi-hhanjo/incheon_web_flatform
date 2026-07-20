"""Transfermarkt 등 영문 데이터의 한글 변환 매핑 사전"""

PLAYER_NAME_MAP = {
    "Erick Farias": "에릭",
    "Thomas Oude Kotte": "토마스",
    "Sung-wook Jo": "조성욱",
    "Seung-won Yeo": "여승원",
    "Ji-hwan Mun": "문지환",
    "Won-jin Jung": "정원진",
    "Tae-heui Lee": "이태희",
    "Stefan Mugosa": "무고사",
    "Sang-min Lee": "이상민",
    "Ju-yeong Park": "박주영",
    "Andrea Compagno": "티아고",
    "Tae-hwan Kim": "김태환",
    "Chang-rae Ha": "하창래",
    "Won-sang Um": "엄원상",
    "Young-jae Seo": "서영재",
    "Masatoshi Ishida": "마사",
    "Seung-bin Kim": "김승빈",
    "Jong-woo Kim": "김종우",
    "Kyoung-rok Choi": "최경록",
    "Chang-min Lee": "이창민",
    "Tobias Figueiredo": "피게이레두",
    # 필요 시 계속 추가
}

INJURY_MAP = {
    "Achilles tendon surgery": "아킬레스건 수술",
    "unknown injury": "부상(상세불명)",
    "Ankle sprain": "발목 염좌",
    "Muscle injury": "근육 부상",
    "Ankle injury": "발목 부상",
    "Vertebral injury": "척추 부상",
    "Cruciate ligament tear": "십자인대 파열",
    "Hamstring injury": "햄스트링 부상",
    "Meniscal injury": "반월판 부상",
    "Knock": "타박상",
    "Calf injury": "종아리 부상",
    "Knee injury": "무릎 부상",
}

def translate_player(name: str) -> str:
    return PLAYER_NAME_MAP.get(name, name)

def translate_injury(status: str) -> str:
    return INJURY_MAP.get(status, status)
