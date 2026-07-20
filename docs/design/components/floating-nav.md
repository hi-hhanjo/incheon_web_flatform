# 컴포넌트: FloatingNav (플로팅 내비게이션)

- **문서 버전**: v1.0 · **작성일**: 2026-07-17
- **연관 문서**: BASE.md, FUNCTION.md (F-19)
- **한 줄 요약**: 구단 정보 등 내용이 긴 페이지에서 빠른 섹션 이동을 돕는 플로팅 목차 메뉴입니다.

---

## 1. 개요
- 길어진 페이지에서 원하는 섹션으로 빠르게 이동할 수 있도록 돕는 상시 노출 내비게이션입니다.
- **모바일 환경**: 화면 상단에 찰싹 달라붙는(Sticky) 가로 스크롤 탭 바(Tab bar) 형태로 렌더링되어 화면을 가리지 않으면서도 상시 접근이 가능합니다.
- **PC/태블릿 환경**: 화면 우측 여백에 고정(Fixed)된 세로형 메뉴로 직관적으로 사용할 수 있게 설계합니다.
- `IntersectionObserver`를 통해 스크롤 시 현재 위치한 섹션을 파란색으로 자동 강조합니다.

## 2. 사용처
- F-16~F-18 구단 정보 페이지 (`app/page.tsx`, 루트 `/`)

## 3. 입력 (Props)
| 이름 | 설명 | 필수 |
|------|------|------|
| sections | 이동할 대상 섹션들의 정보 목록 배열 (`{ id: string, label: string }[]`) | O |

## 4. 상태 (States)
| 상태 | 처리 |
|------|------|
| 기본 노출 | 모바일: 상단 가로 스크롤 탭 / PC: 우측 세로 메뉴 |
| 활성(Active) | 현재 스크롤 위치와 일치하는 섹션 탭이 인천 블루(`#2E7DFF`) 색상으로 강조됨 |
| 비활성/호버 | 비활성 탭은 `text-muted` 색상이며, 호버 시 밝아짐 |

## 5. 스타일 규칙 (BASE.md 기준)
### 모바일 탭 바 (Sticky Tab Bar)
- 배경: `#0E1116`(베이스)에 반투명도(`95%`)와 백드롭 블러(`backdrop-blur-sm`) 적용
- 위치: 상단 고정 (`sticky top-0 z-50`)
- 활성 탭: 인천 블루 배경 + 흰색 텍스트 (`px-3.5 py-1.5 rounded-full text-[13px] font-semibold`)
- 비활성 탭: 표면 배경(`#161A21`) + 보더 라인

### 데스크톱 세로 메뉴 (Fixed Side Menu)
- 배경: `#0E1116`(베이스) 반투명도(`80%`) + 보더
- 위치: 우측 고정 (`fixed top-1/2 -translate-y-1/2 right-4 z-50`)
- 활성 탭: 표면 배경(`#161A21`), 흰색 텍스트, 좌측에 파란색 악센트 라인 표시
- 비활성 탭: 배경 없음, 호버 시 표면 배경 적용

### 부드러운 스크롤 (Smooth Scroll)
- 클릭 시 네이티브 `scrollIntoView({ behavior: 'smooth' })` 활용

## 6. 사용 예시 (의사코드)
```tsx
const sections = [
  { id: 'upcoming-match', label: '다가오는 매치' },
  { id: 'head-to-head', label: '상대전적' },
  { id: 'opponent-scouting', label: '상대 폼 & 스카우팅' },
  { id: 'recent-matches', label: '최근 경기 결과' },
  { id: 'standings', label: 'K리그1 순위표' }
];

<FloatingNav sections={sections} />
```

## 7. AI 지시용 스니펫
> "FloatingNav 컴포넌트: 모바일에서는 `sticky top-0` 가로 스크롤 탭 바, 데스크톱에서는 `fixed right-4` 세로 메뉴. IntersectionObserver로 현재 스크롤 위치를 추적하여 활성 탭을 인천 블루(`#2E7DFF`)로 강조. 클릭 시 `scrollIntoView`로 부드럽게 스크롤."

---

## 변경 이력
| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.1 | 2026-07-17 | 모바일 토글(FAB) 방식에서 상시 노출(가로 스크롤 탭) 방식으로 디자인 개편 |
| v1.0 | 2026-07-17 | 최초 작성 |
