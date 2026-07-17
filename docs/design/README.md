# 컴포넌트 목록 (Components Index)

- **문서 버전**: v1.2 · **작성일**: 2026-07-11
- **연관 문서**: PRD.md (v1.1), 기능명세서.md, TECHSTACK.md, DESIGN.md
- **목적**: 이 서비스에 필요한 화면 부품(컴포넌트)의 전체 지도를 제공합니다. 각 부품의 상세는 개별 `.md` 파일을 참고하세요.

---

## 1. 컴포넌트 한눈에 보기

| 파일 | 컴포넌트 | 역할 | 주요 사용 화면 |
|------|----------|------|----------------|
| layout.md | Layout | 페이지 틀(배경·폭·여백) | 전 화면 (F-03) |
| button.md | Button / IconButton | 주요 버튼·아이콘 버튼 | F-02 (뒤로 가기), 공용 |
| badge.md | Badge | '대표곡' 등 작은 표식 | F-01 |
| song-card.md | SongCard | 목록의 응원가 카드 | F-01 |
| sort-toggle.md | SortToggle | 기본/가나다순 정렬 전환 | F-01 |
| search-bar.md | SearchBar | 제목·가사로 목록 좁히기 | F-01 (F-11) |
| video-tabs.md | VideoTabs | 공식/현장 영상 선택 탭 | F-04 |
| youtube-player.md | YoutubePlayer | 유튜브 영상 임베드 | F-02, F-04 |
| lyrics.md | Lyrics | 가사 표시 영역 | F-02 |
| feedback.md | Feedback | 로딩·빈 상태·에러 안내 | F-01, F-02, F-04 |
| source-note.md | SourceNote | 데이터 출처 표기 (가장 작은 글씨) | F-02, 구단 정보 전 화면 |

---

## 2. 화면별로 어떤 부품이 쓰이나

### 목록 화면 (F-01)
```
Layout
 └ PageTitle "인천 유나이티드 응원가"
 └ SearchBar (제목·가사 검색)     ← 곡이 1개 이상일 때만 (F-11)
 └ SortToggle (기본/가나다순)      ← 곡이 1개 이상일 때만
 └ SongCard (곡 수만큼 반복)
      └ Badge (대표곡·미사용일 때)
 └ Feedback (곡 없음/검색 결과 없음/로딩 시)
```

### 상세 화면 (F-02, F-04)
```
Layout
 └ IconButton (뒤로 가기)
 └ 응원가 제목
 └ VideoTabs (공식/현장)      ← 영상 2개 이상일 때만
 └ YoutubePlayer (선택된 영상)  또는  Feedback "영상 준비 중입니다"
 └ Lyrics (가사)              또는  Feedback "가사 준비 중입니다"
 └ SourceNote "가사 출처"      ← 출처를 아는 곡만 (PRD 9장)
```

---

## 3. 부품 사이의 연결 관계

- **SongCard → Badge**: 카드가 대표곡 표시를 위해 Badge를 품습니다.
- **VideoTabs → YoutubePlayer**: 탭에서 고른 영상을 플레이어가 표시합니다.
- **모든 예외 상황 → Feedback**: 데이터가 없거나 문제가 생기면 Feedback으로 안내합니다.
- **모든 화면 → Layout**: 전부 Layout 틀 안에 담깁니다.
- **외부에서 가져온 데이터 → SourceNote**: 크롤·API로 수집한 데이터를 보여주는 화면은 하단에 수집처를 밝힙니다(PRD 9장).

> **문서화 범위 참고**: 구단 정보 화면의 부품들(`components/club/` — StandingsTable, MatchResultCard, RecentFormStrip, UpcomingMatchCard, OpponentScoutingCard, HeadToHeadList)은 F-16~F-18로 나중에 추가되어 위 표에 아직 개별 문서가 없습니다. 이 인덱스는 현재 MVP(F-01~F-04) 부품 + 공용 부품을 다룹니다.

---

## 4. 지금 만들지 않는 부품 (참고)

> MVP에는 불필요하여 의도적으로 제외합니다. 확장 기능 도입 시 추가하세요.

- **Toast(알림 팝업)**: 즐겨찾기(F-13)·관리자(F-14) 등에서 "저장됨" 알림이 필요해질 때
- **Modal(모달)**: 지금은 사용할 상황 없음

> *(2026-07-17: SearchBar가 이 목록에서 1장으로 승격했습니다 — F-11 구현.)*

---

## 변경 이력
| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.2 | 2026-07-17 | **SearchBar 추가**(F-11 구현) — 4장 '지금 만들지 않는 부품'에서 1장으로 승격, F-01 트리에 반영. 인덱스에서 빠져 있던 **SortToggle**도 함께 등재(v1.0 이후 신설됐으나 이 지도에 누락돼 있었음) |
| v1.1 | 2026-07-17 | SourceNote(출처 표기) 추가 — PRD 9장 저작권·출처 표기 방침 반영. `components/club/` 부품이 이 인덱스 범위 밖임을 명시 |
| v1.0 | 2026-07-11 | 컴포넌트 8종 인덱스 최초 작성 |
