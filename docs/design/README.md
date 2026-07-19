# 컴포넌트 목록 (Components Index)

- **문서 버전**: v1.4 · **작성일**: 2026-07-11 (v1.4 갱신: 2026-07-17)
- **연관 문서**: PRD.md, FUNCTION.md, TECHSTACK.md, BASE.md
- **목적**: 이 서비스에 필요한 화면 부품(컴포넌트)의 **전체 지도**를 제공합니다. 상세 명세가 있는 부품은 1장, **명세 없이 코드로만 있는 부품은 1.1장**에 있습니다 — 지도에서 빠진 부품은 없습니다.

---

## 1. 컴포넌트 한눈에 보기

| 파일 | 컴포넌트 | 역할 | 주요 사용 화면 |
|------|----------|------|----------------|
| layout.md | Layout | 페이지 틀(배경·폭·여백) | 전 화면 (F-03) |
| button.md | Button / IconButton | 주요 버튼·아이콘 버튼 | F-02 (뒤로 가기), 공용 |
| badge.md | Badge | '대표곡' 등 작은 표식 | F-01 |
| song-card.md | SongCard | 목록의 응원가 카드 | F-01 |
| search-bar.md | SearchBar | 제목·가사로 목록 좁히기 | F-01 (F-11) |
| lyrics-snippet.md | LyricsSnippet | 검색어에 걸린 가사 한 줄 표시·강조 | F-01 (F-11) |
| video-tabs.md | VideoTabs | 공식/현장 영상 선택 탭 | F-04 |
| youtube-player.md | YoutubePlayer | 유튜브 영상 임베드 | F-02, F-04 |
| lyrics.md | Lyrics | 가사 표시 영역 | F-02 |
| feedback.md | Feedback | 로딩·빈 상태·에러 안내 | F-01, F-02, F-04 |
| source-note.md | SourceNote | 데이터 출처 표기 (가장 작은 글씨) | F-02, 구단 정보 전 화면 |

### 1.1 상세 문서가 없는 부품 *(v1.3 — 지도를 완성)*

아래 부품들은 **코드에 있지만 개별 명세가 없습니다.** 위 표만 보면 이들이 존재하지 않는 것처럼 보여, 지도로서 불완전했습니다. 상세가 필요해지면 이 표의 항목을 개별 `.md`로 승격시키세요.

| 컴포넌트 | 역할 | 화면 | 왜 문서가 없나 |
|---|---|---|---|
| SongList | 목록 + 검색 상태를 들고 있는 컨테이너 | F-01 | 자체 디자인이 없는 **조립용 부품** — 시각 규격은 SongCard·SearchBar·LyricsSnippet이 갖습니다 |
| VideoSection | VideoTabs + YoutubePlayer 조립 | F-02, F-04 | 위와 같음 (조립용) |
| NavBar | 상단 네비게이션 (응원가 ↔ 구단 정보) | 전 화면 | 명세 없이 추가됨 — **문서화 필요** |
| OfficialLinks | 푸터의 구단 공식 채널 링크 | 전 화면 (Layout) | 명세 없이 추가됨 — **문서화 필요** |
| club/StandingsTable | K리그1 순위표 (인천 행 강조·순위 변동 ▲▼) | F-17 | 구단 정보(F-16~F-18)는 확장 기능이라 개별 명세를 만들지 않고 구현했습니다 |
| club/MatchResultCard | 지난 경기 결과 카드 | F-16 | 위와 같음 |
| club/UpcomingMatchCard | 다가오는 매치 카드 | F-16 | 위와 같음 |
| club/RecentMatchesList | 최근 경기 전적 (상대팀 및 스코어 포함) | F-16 | 위와 같음 |
| club/HeadToHeadList | 상대전적 목록 | F-18 | 위와 같음 |
| club/OpponentScoutingCard | 상대 최근 폼·주요 선수·부상 | F-18 | 위와 같음 |

> **이 문서의 범위**: MVP(F-01~F-04) 부품과 공용 부품은 개별 명세를 갖습니다. **구단 정보(F-16~F-18) 부품은 화면 명세(PRD F-16~F-18)를 근거로 바로 구현**했고, 색·간격은 `BASE.md` 토큰을 그대로 씁니다 — 즉 문서가 없어도 디자인 규칙에서 벗어나 있지는 않습니다.

---

## 2. 화면별로 어떤 부품이 쓰이나

### 목록 화면 (F-01)
```
Layout
 └ PageTitle "인천 유나이티드 응원가"
 └ SearchBar (제목·가사 검색)     ← 곡이 1개 이상일 때만 (F-11)
 └ SongCard (곡 수만큼 반복)
      └ Badge (대표곡·미사용일 때)
   └ LyricsSnippet               ← 검색 중이고, 그 곡의 '가사'에 걸렸을 때만 (F-11)
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
- **SearchBar → SongList → LyricsSnippet**: 검색어는 SearchBar가 올리고, 어느 곡을 남길지·어느 가사 줄이 걸렸는지는 SongList가 `lib/search.ts`로 정하며, LyricsSnippet은 받은 조각을 그리기만 합니다. **스니펫은 SongCard의 자식이 아니라 형제**입니다 — 카드는 링크(`<a>`)라 그 안에 넣으면 스니펫까지 링크가 됩니다.
- **VideoTabs → YoutubePlayer**: 탭에서 고른 영상을 플레이어가 표시합니다.
- **모든 예외 상황 → Feedback**: 데이터가 없거나 문제가 생기면 Feedback으로 안내합니다.
- **모든 화면 → Layout**: 전부 Layout 틀 안에 담깁니다.
- **외부에서 가져온 데이터 → SourceNote**: 크롤로 수집한 데이터를 보여주는 화면은 하단에 수집처를 밝힙니다(PRD 9장).
- **조립용 부품 → 시각 규격을 갖지 않습니다**: SongList·VideoSection은 상태를 들고 자식을 배치할 뿐, 색·간격은 자식 부품(SongCard·VideoTabs 등)의 명세를 따릅니다.

---

## 4. 지금 만들지 않는 부품 (참고)

> MVP에는 불필요하여 의도적으로 제외합니다. 확장 기능 도입 시 추가하세요.

- **Toast(알림 팝업)**: 쓰기/저장 동작이 생겨 "저장됨" 같은 즉시 알림이 필요해질 때
- **Modal(모달)**: 지금은 사용할 상황 없음

> *(2026-07-17: SearchBar가 이 목록에서 1장으로 승격했습니다 — F-11 구현.)*

---

## 변경 이력
| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.4 | 2026-07-17 | **LyricsSnippet 추가**(FUNCTION.md v1.5 — F-11 가사 스니펫) — 1장 인덱스·F-01 트리·3장 연결 관계에 반영. **SortToggle 제거** — `sort-toggle.md`와 `components/SortToggle.tsx`를 함께 삭제했습니다. 실제 데이터(팀 28 / 선수·현역 1 / 미사용 5)에서 '기본'과 '가나다순'의 차이가 1곡뿐이라 사용자가 모드를 구별할 수 없었습니다(근거는 FUNCTION.md v1.5 F-01에 남겼습니다). **정렬 규칙 자체는 사라지지 않았고**(팀 → 선수·현역 → 미사용, 묶음 내 가나다순) SongList가 그대로 적용합니다 |
| v1.2 | 2026-07-17 | **SearchBar 추가**(F-11 구현) — 4장 '지금 만들지 않는 부품'에서 1장으로 승격, F-01 트리에 반영. 인덱스에서 빠져 있던 **SortToggle**도 함께 등재(v1.0 이후 신설됐으나 이 지도에 누락돼 있었음) |
| v1.3 | 2026-07-17 | **1.1장 신설 — 상세 문서가 없는 부품 10종을 지도에 올림**(SongList·VideoSection·NavBar·OfficialLinks·`club/` 6종). 이전엔 표에 없어 존재하지 않는 것처럼 보였음. 조립용 부품이 시각 규격을 갖지 않는다는 원칙 명시. NavBar·OfficialLinks는 명세 없이 추가된 것으로 확인돼 '문서화 필요'로 표시 |
| v1.1 | 2026-07-17 | SourceNote(출처 표기) 추가 — PRD 9장 저작권·출처 표기 방침 반영. `components/club/` 부품이 이 인덱스 범위 밖임을 명시 |
| v1.0 | 2026-07-11 | 컴포넌트 8종 인덱스 최초 작성 |
