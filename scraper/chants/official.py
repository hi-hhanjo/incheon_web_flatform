"""인천 유나이티드 공식 홈페이지 응원가 페이지 파싱.

https://incheonutd.com/fanzone/cheersong_list.php — 구단이 자기 응원가를 직접 올린 페이지라
가사 신뢰도가 가장 높다(출처 등급 'official'). 다만 4곡뿐이고 영상 링크가 없다(음원 zip만).
따라서 '가사의 정답지' 역할이고, 곡 수와 영상은 community.py가 채운다.

인증/쿠키 없이 공개 GET으로 열린다(2026-07-17 확인). 페이지는 UTF-8이다 — Content-Type과
meta charset 모두 UTF-8이고 EUC-KR로는 디코드되지 않는다(터미널에서 깨져 보이는 건 콘솔
인코딩 문제이지 데이터 문제가 아니다).

구조:
    div.list[data-cheersong=<슬러그>]
      div.question p.subject   → 제목 (내부 <button> 재생/정지 버튼 제거 필요)
      div.answer  div.txt      → 가사 (<br> 구분, 가사 없으면 "- 가사가 없습니다.")
"""

import requests
from bs4 import BeautifulSoup

URL = "https://incheonutd.com/fanzone/cheersong_list.php"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
    )
}

# 가사 자리에 이 문구만 있으면 가사가 없는 곡(예: 뱃고동소리 — 효과음).
NO_LYRICS_MARKER = "가사가 없습니다"


def fetch() -> str:
    resp = requests.get(URL, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    # 선언된 charset을 믿지 않고 UTF-8로 고정 디코드한다(requests의 추론이 틀리면 가사가 깨진다).
    return resp.content.decode("utf-8")


def _lyrics_from(txt_node) -> str:
    """div.txt의 <br>을 줄바꿈으로 바꿔 가사 문자열을 만든다."""
    for br in txt_node.find_all("br"):
        br.replace_with("\n")
    text = txt_node.get_text().strip()
    if NO_LYRICS_MARKER in text:
        return ""
    # 줄 끝 공백만 정리한다. 빈 줄(연 구분)은 가사의 일부이므로 보존한다.
    return "\n".join(line.strip() for line in text.split("\n")).strip()


def parse(html: str) -> list[dict]:
    """공식 페이지 HTML → [{title, lyrics, sourceUrl}] (영상 정보는 이 소스에 없음)."""
    soup = BeautifulSoup(html, "html.parser")
    songs = []
    for item in soup.select("div.list[data-cheersong]"):
        subject = item.select_one("div.question p.subject")
        txt = item.select_one("div.answer div.txt")
        if subject is None or txt is None:
            continue
        # 제목 안의 재생/정지 <button> 텍스트가 제목에 섞이지 않도록 먼저 제거한다.
        for button in subject.find_all("button"):
            button.decompose()
        title = subject.get_text().strip()
        if not title:
            continue
        songs.append({"title": title, "lyrics": _lyrics_from(txt), "sourceUrl": URL})
    return songs
