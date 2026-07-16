# 컴포넌트 목록 (Components Index)

- **문서 버전**: v1.0 · **작성일**: 2026-07-11
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
| video-tabs.md | VideoTabs | 공식/현장 영상 선택 탭 | F-04 |
| youtube-player.md | YoutubePlayer | 유튜브 영상 임베드 | F-02, F-04 |
| lyrics.md | Lyrics | 가사 표시 영역 | F-02 |
| feedback.md | Feedback | 로딩·빈 상태·에러 안내 | F-01, F-02, F-04 |

---

## 2. 화면별로 어떤 부품이 쓰이나

### 목록 화면 (F-01)
```
Layout
 └ PageTitle "인천 유나이티드 응원가"
 └ SongCard (곡 수만큼 반복)
      └ Badge (대표곡일 때)
 └ Feedback (곡 없음/로딩 시)
```

### 상세 화면 (F-02, F-04)
```
Layout
 └ IconButton (뒤로 가기)
 └ 응원가 제목
 └ VideoTabs (공식/현장)      ← 영상 2개 이상일 때만
 └ YoutubePlayer (선택된 영상)  또는  Feedback "영상 준비 중입니다"
 └ Lyrics (가사)              또는  Feedback "가사 준비 중입니다"
```

---

## 3. 부품 사이의 연결 관계

- **SongCard → Badge**: 카드가 대표곡 표시를 위해 Badge를 품습니다.
- **VideoTabs → YoutubePlayer**: 탭에서 고른 영상을 플레이어가 표시합니다.
- **모든 예외 상황 → Feedback**: 데이터가 없거나 문제가 생기면 Feedback으로 안내합니다.
- **모든 화면 → Layout**: 전부 Layout 틀 안에 담깁니다.

---

## 4. 지금 만들지 않는 부품 (참고)

> MVP에는 불필요하여 의도적으로 제외합니다. 확장 기능 도입 시 추가하세요.

- **Toast(알림 팝업)**: 즐겨찾기(F-13)·관리자(F-14) 등에서 "저장됨" 알림이 필요해질 때
- **SearchBar(검색창)**: 검색 기능(F-11) 구현 시
- **Modal(모달)**: 지금은 사용할 상황 없음

---

## 변경 이력
| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0 | 2026-07-11 | 컴포넌트 8종 인덱스 최초 작성 |
