"""인천 유나이티드 현재 프로선수단 명단 크롤링.

https://www.incheonutd.com/player/pro_list.php — 구단이 직접 관리하는 명단이라 이적·은퇴가
가장 정확하게 반영된다. 선수 응원가가 아직 불리는 곡인지(= 그 선수가 팀에 있는지) 판단하는
근거로 쓴다(classify_chants.py).

구조:
    ul.group[data-role=GK|DF|MF|FW] > li.list > a > div.info > p.name
      → "무고사<span class="en">STEFAN MUGOSA</span>"  (영문명 span을 떼야 한글명만 남는다)

주의: `p.name`을 전역 선택하면 상단 네비게이션의 팀명("인천", "전북" …)까지 섞인다.
반드시 `ul.group[data-role]` 아래로 한정할 것.
"""

import requests
from bs4 import BeautifulSoup

URL = "https://www.incheonutd.com/player/pro_list.php"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
    )
}


def fetch() -> str:
    resp = requests.get(URL, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    return resp.content.decode("utf-8", "replace")


def parse(html: str) -> set[str]:
    """현재 프로선수단의 한글 선수명 집합."""
    soup = BeautifulSoup(html, "html.parser")
    names = set()
    for group in soup.select("ul.group[data-role]"):
        for name_node in group.select("li.list p.name"):
            for english in name_node.select("span.en"):
                english.decompose()
            name = name_node.get_text().strip()
            if name:
                names.add(name)
    return names
