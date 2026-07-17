"""팬 커뮤니티 '인천네이션'의 응원가 모음 게시글 파싱.

https://incheonation.kr/free/6452 — 곡 수(30여 곡)와 유튜브 링크를 확보하는 소스.
공식 페이지(official.py)가 4곡·영상 없음이라 커버리지를 여기서 채운다. 대신 팬이 작성한
사용자 생성 콘텐츠라 가사 정확도가 공식보다 낮다(출처 등급 'community') — 그래서 산출물은
바로 앱에 들어가지 않고 검수 큐(data/songs-candidates.json)로만 나간다.

크롤링 예의:
- robots.txt가 이 게시판 경로(/free/)를 허용한다(Disallow 목록은 /admin, 검색, 게임 등).
- robots.txt의 `Crawl-delay: 3`을 export 쪽에서 지킨다(여러 요청을 보낼 경우).
- 출처 URL을 후보 레코드에 남겨(_sourceUrl) 검수자가 원문을 대조할 수 있게 한다.

구조: 본문 div.xe_content 안이 텍스트 블록이고, 곡마다 '-----' 구분선으로 나뉜다.
    [제목](부제)
    https://youtu.be/<id>
    가사 여러 줄 (빈 줄 = 연 구분)
"""

import re

import requests
from bs4 import BeautifulSoup

URL = "https://incheonation.kr/free/6452"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
    )
}

SEPARATOR_RE = re.compile(r"-{5,}")
TITLE_RE = re.compile(r"^\[([^\]]+)\](.*)$")
YOUTUBE_RE = re.compile(
    r"(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/))([A-Za-z0-9_-]{11})"
)


def fetch() -> str:
    resp = requests.get(URL, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    return resp.content.decode("utf-8", "replace")


def _block_text(html: str) -> str:
    """게시글 본문만 뽑아 <br>을 줄바꿈으로, nbsp를 보통 공백으로 바꾼 텍스트를 만든다."""
    soup = BeautifulSoup(html, "html.parser")
    node = soup.select_one("div.xe_content")
    if node is None:
        raise ValueError("본문(div.xe_content)을 찾지 못했습니다. 게시글 구조를 확인하세요.")
    for br in node.find_all("br"):
        br.replace_with("\n")
    return node.get_text().replace("\xa0", " ")


def _parse_block(block: str) -> dict | None:
    """'-----'로 나뉜 블록 하나 → {title, lyrics, youtubeId} (제목 없으면 None)."""
    lines = [line.rstrip() for line in block.split("\n")]

    title = None
    youtube_id = None
    lyric_lines: list[str] = []

    for line in lines:
        stripped = line.strip()
        matched_title = TITLE_RE.match(stripped)
        if title is None and matched_title:
            suffix = matched_title.group(2).strip()
            title = f"{matched_title.group(1).strip()} {suffix}".strip()
            continue
        matched_video = YOUTUBE_RE.search(stripped)
        if matched_video:
            # 한 곡에 링크가 여러 개면 첫 번째만 쓴다(검수자가 원문에서 나머지를 확인).
            youtube_id = youtube_id or matched_video.group(1)
            continue
        if title is not None:
            lyric_lines.append(stripped)

    if title is None:
        return None

    # 앞뒤 빈 줄만 걷어내고, 가운데 빈 줄(연 구분)은 가사의 일부로 보존한다.
    while lyric_lines and not lyric_lines[0]:
        lyric_lines.pop(0)
    while lyric_lines and not lyric_lines[-1]:
        lyric_lines.pop()

    return {
        "title": title,
        "lyrics": "\n".join(lyric_lines),
        "youtubeId": youtube_id,
        "sourceUrl": URL,
    }


def parse(html: str) -> list[dict]:
    """게시글 HTML → [{title, lyrics, youtubeId, sourceUrl}]."""
    blocks = SEPARATOR_RE.split(_block_text(html))
    songs = []
    for block in blocks:
        parsed = _parse_block(block)
        if parsed is not None:
            songs.append(parsed)
    return songs
