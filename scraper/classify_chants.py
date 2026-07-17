"""선수 응원가를 분류하고, 팀을 떠난 선수의 곡에 '미사용' 태그를 붙인다.

실행: python scraper/classify_chants.py [--dry-run]

**왜 필요한가**: 목록에는 이미 팀을 떠난 선수의 응원가가 섞여 있다(김도혁·부노자·임중용·전재호·
남준재). 지금 경기장에서 불리지 않는 곡이라 신규팬(PRD 핵심 타겟)이 그대로 배우면 곤란하다.
반대로 무고사는 현 소속이라 계속 불린다. 이 구분은 구단 공식 선수단 명단으로 **객관적으로**
판정할 수 있다 — FUNCTION.md v1.1이 '대표곡 우선 정렬'을 뺀 이유였던 주관적 판단이 개입하지 않는다.

무엇을 쓰는가 (기존 스키마 안에서 해결 — 새 필드 없음):
- `category`: `"선수 응원가"` / `"팀 응원가"` (PRD F-12가 예시로 든 분류명 그대로)
- `tags`: 팀에 없는 선수의 곡에 `"미사용"` 추가. 다시 영입되면 자동으로 떼어진다.

**PLAYER_CHANTS는 사람이 관리한다**: 이미 떠난 선수는 명단에 없으므로 명단만으로는 "이 제목이
선수 이름인지" 알 수 없다(임중용은 명단에 없지만 선수 응원가다). 그래서 선수 응원가 제목만
아래에 모아두고, **현역 여부 판정만** 명단 크롤로 자동화한다. 새 선수 응원가가 생기면 여기 추가.
"""

import json
import sys
from pathlib import Path

from chants import roster

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SONGS_PATH = PROJECT_ROOT / "data" / "songs.json"

# 제목이 곧 선수 이름인 곡(사람이 관리). 값은 명단과 대조할 선수명.
PLAYER_CHANTS = {
    "무고사": "무고사",
    "김도혁": "김도혁",
    "부노자": "부노자",
    "임중용": "임중용",
    "전재호": "전재호",
    "남준재": "남준재",
}

PLAYER_CATEGORY = "선수 응원가"
TEAM_CATEGORY = "팀 응원가"
UNUSED_TAG = "미사용"


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    songs = json.loads(SONGS_PATH.read_text(encoding="utf-8"))
    squad = roster.parse(roster.fetch())
    if len(squad) < 20:
        raise ValueError(f"선수단이 {len(squad)}명입니다. 명단 파싱을 확인하세요.")

    changes = []
    for song in songs:
        player = PLAYER_CHANTS.get(song["title"])
        category = PLAYER_CATEGORY if player else TEAM_CATEGORY
        tags = [t for t in song["tags"] if t != UNUSED_TAG]
        # 팀 응원가는 선수 이적과 무관하므로 '미사용' 판정 대상이 아니다.
        if player and player not in squad:
            tags.append(UNUSED_TAG)

        if song["category"] != category or song["tags"] != tags:
            changes.append(
                f"id={song['id']} {song['title']}: {category}"
                + (f" + {UNUSED_TAG}" if UNUSED_TAG in tags else "")
            )
        song["category"] = category
        song["tags"] = tags

    players = [s for s in songs if s["category"] == PLAYER_CATEGORY]
    unused = [s for s in players if UNUSED_TAG in s["tags"]]

    if dry_run:
        print(f"[dry-run] 선수단 {len(squad)}명 기준 · 변경 {len(changes)}건")
        for line in changes:
            print("   ", line)
        return

    SONGS_PATH.write_text(
        json.dumps(songs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        f"선수단 {len(squad)}명 기준 분류 완료 → songs.json\n"
        f"  선수 응원가 {len(players)}곡 (현역 {len(players) - len(unused)} · "
        f"{UNUSED_TAG} {len(unused)}) · 팀 응원가 {len(songs) - len(players)}곡"
    )
    for line in changes:
        print("  [변경]", line)


if __name__ == "__main__":
    main()
