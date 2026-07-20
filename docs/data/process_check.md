# 기능 및 아키텍처 점검 보고서

- **최초 점검일**: 2026-07-17 · **최신 점검일**: 2026-07-20
- **점검 범위**: 클린 아키텍처 준수, 폴더 트리 구조, 파일 간 상호참조, 프론트–데이터–크롤러 워크플로우
- **정책**: 완료·검증된 상세 작업 로그는 요약으로 압축한다. 근거가 낡아 현실과 어긋나는 서술(삭제된 페이지를 가리키는 의존성 그래프 등)은 삭제한다. 변경 이력(Changelog)만 보존한다(rules.md 11장).

---

## 1. 2026-07-20 전체 점검 요약 (Supabase 이전 완료)

| 점검 항목 | 결과 | 근거 |
|---|---|---|
| **클린 아키텍처 (계층 분리)** | ✅ 통과 | `app/`·`components/`에서 외부 데이터를 직접 참조하지 않음. 모든 데이터는 `lib/api/`를 경유해 Supabase에서 조회. |
| **순수 함수 계층 무오염** | ✅ 통과 | `lib/search.ts`·`lib/format.ts`·`songs.schema.ts`·`teams.ts`가 순수 함수/타입으로만 구성됨. |
| **폴더 트리 구조** | ✅ 통과 | 불필요한 `data/*.json` 완전 삭제 완료. TECHSTACK.md 4장 구조와 실제 배치 일치. |
| **파일 간 상호참조** | ✅ 통과 | import 그래프 단방향·순환 없음, 삭제 파일을 참조하는 코드 0건. |
| **타입 안정성** | ✅ 통과 | `tsc --noEmit` 0 errors (`songs.schema.ts` 타입 참조 교정 완료). |
| **빌드** | ✅ 통과 | `next build` 성공. 실제 라우트: `/`(구단 정보·`app/page.tsx`), `/songs`(응원가 목록), `/songs/[id]`(곡 상세), `/_not-found`. |
| **프론트–백엔드–DB 워크플로우** | ✅ 통과 | 파이썬 크롤러 → Supabase DB → `lib/api` → 화면 단방향 파이프라인 정착 (아래 4장). |
| **문서 정합성** | ✅ 정리 완료 | 사용하지 않는 JSON 파일이 정리됨에 따라 낡은 참조 문서 정리 완료. |

**결론**: 로컬 JSON 파일 의존성을 완벽히 끊어내고 Supabase 클라우드 데이터베이스 단일 진실 공급원(SSOT) 체제로 리팩토링을 완료했습니다.

---

## 1-1. 2026-07-20 추가 수정 (엠블럼·크롤러 정합성·죽은 경로 재정정)

Vercel 배포 후 실물 화면 점검에서 발견한 정합성 오류들을 실측 근거로 교정했습니다.

### (a) 구단 엠블럼·팀 링크 데이터 오류 — `lib/api/teams.ts`

- **증상**: **안양FC 엠블럼 자리에 수원 FC 로고**가 떴습니다(수원은 K리그2라 현재 목록에 없음).
- **원인**: `TEAM_META`의 `teamId`가 대부분 `cpTeamId`의 숫자를 그대로 복사한 값이라, 두 값이 실제로 다른 팀에서 어긋났습니다. 엠블럼 URL은 `cpTeamId`로 만들어지는데 안양·김천의 `cpTeamId`까지 틀려 로고가 뒤바뀌었습니다.
- **근거(실측)**: 다음 순위 API(`rank.json`, 2026-07-20)와 각 팀 상세 페이지를 직접 조회해 정답 매핑을 확정했습니다.

| 팀 | 항목 | 수정 전 | 수정 후 |
|---|---|---|---|
| 안양FC | cpTeamId·teamId | K29 · 29 | **K27 · 163984** |
| 김천 상무 | cpTeamId·teamId | K33 · 33 | **K35 · 601032** |
| 강원FC | teamId | 21 | **20** |
| 부천FC | teamId | 26 | **163983** |
| 광주FC | teamId | 22 | **3035** |

- 안양·김천은 **엠블럼(로고)** 이 뒤바뀌었고, 강원·부천·광주는 **팀 상세 링크(daumUrl)** 가 깨져 있었습니다(예: `/team/kl/29`는 빈 페이지, 정답 `/163984`는 FC안양).
- 파일 헤더 주석에 "cpTeamId 숫자 ≠ teamId, 반드시 API 응답에서 옮긴다"는 재발 방지 경고를 추가했습니다.

### (b) 크롤러 마이그레이션 잔재 정리 — `scraper/export_*.py`

- JSON→Supabase 이전(v2.0) 때 `export_standings.py`만 깨끗이 정리되고 나머지 4개(`export_matches`·`export_opponent_forms`·`export_head_to_head`·`export_scouting`)에 잔재가 남아 있었습니다.
- **정정**: 독스트링의 "`data/*.json`으로 내보낸다 / 앱이 이 JSON을 읽는다" 서술을 "Supabase 데이터베이스에 저장한다"로 교체. 실제 코드는 이미 Supabase에 쓰고 있었으므로 **문서만 코드 현실을 따라오지 못한 상태**였습니다.
- **삭제**: 이전 후 아무 데서도 쓰지 않는 죽은 임포트/상수(`import json`, `from pathlib import Path`, `PROJECT_ROOT = ...`)를 4개 파일에서 제거. 파일 쓰기(`open`/`json.dump`)가 남아 있지 않음을 확인한 뒤 삭제. `py_compile` 통과.

### (c) 존재하지 않는 `app/club/page.tsx`를 가리키던 문서 재정정

- v1.15에서 삭제 라우트(`app/club/opponent`)를 정리하며 참조를 **`app/club/page.tsx`로 바꿨는데, 그 파일도 존재하지 않습니다.** 구단 화면은 2026-07-20 루트로 스왑되어 실제 파일은 `app/page.tsx`(라우트 `/`)입니다.
- `docs/data/CLUB_ERD_SPEC.md`(76·173행)·`docs/design/components/floating-nav.md`·`docs/design/components/source-note.md`·`scraper/export_opponent_forms.py`(주석)의 `app/club/page.tsx`를 **`app/page.tsx`로 교정**하고 "2026-07-20 루트 `/`로 이동" 주석을 병기했습니다.
- 코드에는 이 죽은 경로 참조가 없었습니다(빌드 무관, 문서 전용 오류). PRD의 F-17·F-18 `/club` 서술은 **2026-07-17로 날짜가 박힌 역사 주석**이라 프로젝트 관례대로 보존했습니다.

> 참고: 응원가 목록 라우트가 `/`에서 `/songs`로 밀려나며 `app/songs/page.tsx`의 컴포넌트 이름이 `Home`으로 남아 있습니다(동작엔 영향 없음). 이름만 오해 소지 — 다음 손댈 때 `SongsPage` 등으로 바꾸는 걸 후보로 남깁니다(이번엔 불필요한 개명 churn을 피해 미변경).

---

## 2. 계층 분리 검증 (실측)

`grep`으로 `app/`·`components/`·`lib/` 전체의 import를 전수 조사한 결과:

- 화면(`app/`)·부품(`components/`)은 `lib/api/`의 데이터 접근 함수나 `lib/`의 순수 함수만 import합니다.
- 로컬 `data/*.json` 파일들을 **전부 삭제**했으며, `lib/api/*.ts` 파일들도 로컬 파일이 아닌 Supabase 클라이언트를 통해서만 데이터를 가져옵니다.
- `components/*`가 import하는 `lib/api/*`는 대부분 `import type`(타입만) — 런타임 데이터가 부품 번들로 딸려오지 않음.
- 신규 검색 계층: `components/SongList.tsx`·`LyricsSnippet.tsx`가 `lib/search.ts`(순수 함수)와 `songs.schema.ts`(타입·상수)만 참조 → 계층 원칙 그대로 유지.

---

## 3. 폴더 트리 — 신규 파일 배치 적합성

이번 브랜치(`feat/search-and-daum-migration`)에서 추가된 파일이 전부 규칙상 올바른 위치에 있음:

| 신규 파일 | 위치 규칙 | 적합 |
|---|---|---|
| `lib/api/teams.ts` | 데이터 접근/상수 계층 | ✅ (TECHSTACK 4장에 이미 기재됨 — 이전 미비 해소 확인) |
| `lib/api/songs.schema.ts` | 타입·상수, `data` 미참조 | ✅ |
| `lib/search.ts` | `lib/` 직하 순수 함수 자리 | ✅ |
| `components/LyricsSnippet.tsx` | 목록 화면 부품 | ✅ (명세 `lyrics-snippet.md` 존재) |
| `components/club/FloatingNav.tsx` | 구단 정보 전용 부품 | ✅ (명세 `floating-nav.md` 존재) |
| `components/club/RecentMatchesList.tsx` | 구단 정보 전용 부품 | ✅ (`RecentFormStrip` 대체) |
| `components/club/TeamEmblem.tsx` | 구단 정보 전용 부품 | ✅ |

`scripts/` 디렉터리 미신설(규칙 준수). **단, 아래 3-1 주의 참고.**

### 3-1. 루트 작업용 파일 정리 (✅ 2026-07-19 해결)

- `_check_teams.py`(루트) — 팀명 3소스 일치 검증용 완료된 일회성 체크. **삭제**(재생성 가능).
- `scratch/`(check_daum_api.py·test_transfermarkt.py) — 향후 확장 리서치(다음 선수 기록 API·Transfermarkt 부상자 크롤 실험). 프로덕션 크롤러가 아니라 `scraper/`에 넣지 않고 **`.gitignore`에 `scratch/` 등록**해 로컬 보존 + 저장소 제외 처리.

---

## 4. 프론트–백엔드–DB 워크플로우

```
[scraper/ (Python)]  ──Upsert/Insert──▶  [Supabase DB (PostgreSQL)]  ──select──▶  [lib/api/*.ts]  ──▶  [components/]·[app/]
      크롤러                                  클라우드 원격 DB                     데이터 접근 계층         화면
```

- **단방향 유지 및 로컬 의존성 제거**: Python 크롤러(`export_*.py`)들이 로컬 `data/*.json`에 저장하던 로직을 완전 폐기하고, Supabase 원격 DB로 직결되도록 개편했습니다. 
- 앱(Next.js)은 빌드 및 런타임 시 로컬 파일(json)이 아닌 Supabase를 쿼리하므로, 무중단으로 백그라운드 데이터 갱신(크롤러 실행)이 가능해졌습니다.
- **순위 등락(`rank_change`) DB 편입**: 로컬 `meta.json`에 의존하던 마지막 파생 데이터 로직마저 DB 스키마(`ALTER TABLE standings ADD COLUMN rank_change int`)로 편입하여 완벽한 DB-Driven 렌더링을 구현했습니다.
- **번역 모듈화**: 외국인 선수명 및 부상 정보(`Achilles tendon surgery` 등)를 한글로 매핑하는 `translation.py`를 신규 도입하여, 프론트엔드가 별도의 변환 작업을 할 필요 없이 온전한 한글 데이터를 전달받습니다.

---

## 5. 발견 사항 — 삭제된 라우트를 가리키던 낡은 문서 (✅ 2026-07-19 해결)

`app/club/standings/page.tsx`와 `app/club/opponent/page.tsx`는 **삭제**되어 두 화면이 구단 정보 한 페이지로 통합됨. *(2026-07-20 갱신: 그 페이지가 루트로 스왑되어 현재 실제 라우트는 `/`(구단 정보)·`/songs`(응원가 목록)·`/songs/[id]`(곡 상세)이며, 아래 표가 "정정"했다던 `app/club/page.tsx`도 존재하지 않아 1-1(c)에서 `app/page.tsx`로 재정정함.)* 코드에는 이 경로 참조가 없었으나(빌드 정상), 아래 문서들이 옛 경로를 가리키고 있어 **전부 현재 구조로 정리 완료**:

| 문서 | 조치 |
|---|---|
| `docs/bible/PRD.md` (F-17·F-18) | 프로젝트 관례대로 옛 서술 보존 + "2026-07-17 `/club` 통합" 날짜 정정 주석 추가 |
| `docs/design/components/source-note.md` | 2장 표에서 삭제 라우트 2행 제거 → `/club` 한 줄 통합, 6장 예시 정정, v1.1 Changelog 추가 |
| `docs/data/CLUB_ERD_SPEC.md` (76·173행) | 조합 주체를 `app/club/page.tsx`로 정정(통합 주석 병기) |
| `scraper/export_opponent_forms.py` (5행) | 주석의 화면 경로를 `app/club/page.tsx`로 정정 |

정정 후 재스캔: `club/opponent`·`club/standings`를 언급하는 모든 잔여 위치가 "통합/삭제됨" 정정 문맥을 가짐(코드 참조 0건).

> 참고: `docs/design/README.md`·`search-bar.md`의 SortToggle 언급은 **낡은 것이 아님** — 부품 제거를 설명하는 Changelog 서술이라 의도적으로 보존된 것.

---

## 6. 완료된 작업 요약 (상세 로그는 압축)

아래는 검증 완료되어 상세 서술을 걷어낸 작업들. 결과만 남김:

- **Supabase DB 전면 도입 및 로컬 JSON 의존성 제거**: 크롤러와 프론트엔드의 중개자 역할을 하던 `data/*.json`을 폐기하고 클라우드 DB로 이관.
- **크롤러 번역 파이프라인 추가**: Transfermarkt에서 긁어온 영문 선수명/부상상태 한글 매핑.
- **다가오는 매치 엠블럼 클릭 버그 수정**: `linked={false}` 속성을 제거하여 모든 엠블럼이 다음 스포츠 페이지로 정상 연결되도록 조치.
- **구단 정보 UI 통합 및 메인 라우트 변경**: 앱 접속 시 응원가가 아닌 구단 정보(`/`)가 먼저 표출되도록 라우트 스왑.
- **응원가 실데이터화(34곡)** + **분류 기반 정렬**(팀 → 선수·현역 → 미사용).
- **F-11 검색**: `lib/search.ts` 순수 함수 + `LyricsSnippet` 가사 스니펫.
- **상대전적 다음 크롤 전환**: 외부 API·`.env` 의존 제거.
- **플로팅 내비(F-19)**: `FloatingNav` — 긴 `/club` 페이지(현재는 `/` 루트) 섹션 이동.

---

## 7. 향후 확장 후보 (참고용, 미착수)

> **F-12~F-15는 2026-07-19 폐기/미채택으로 목록에서 삭제**했습니다(PRD 4장·Changelog v1.9). 필터 UI(F-12)·즐겨찾기(F-13)·관리자(F-14)·가사 하이라이트(F-15)는 되살릴 필요가 생기면 새 번호로 재정의합니다. 아래는 여전히 열려 있는 후보만 남깁니다.

- 부상/결장 실데이터: Transfermarkt 크롤(2안) 또는 프리뷰 기사 LLM 추출 — 현재는 익명 모의 유지
- **선수 공식 프로필 다이렉트 링크 기능**: 각 구단 홈페이지가 내부 식별자(ID)를 URL로 사용하므로, 크롤러 단독으로는 다이렉트 링크 생성이 불가능. 추후 `opponent_key_players` 및 `opponent_injuries` 테이블에 `profile_url` 텍스트 컬럼을 추가하고, 프론트엔드(`OpponentScoutingCard.tsx` 및 API 매핑)에서 해당 컬럼 값이 존재할 경우 우선적으로 해당 URL로 연결하도록 개선 예정 (관련 구현 내역은 설계 확인됨).
- PWA(오프라인 가사 캐싱)·다크 모드 — 최후순위

---

## 변경 이력 (Changelog)

| 버전 | 날짜 | 내용 |
|------|------|------|
| v2.1 | 2026-07-20 | **배포 후 정합성 점검(1-1장 신설)**: (a) `lib/api/teams.ts`의 팀 엠블럼·링크 데이터 전수 교정 — 안양(K29→**K27**)·김천(K33→**K35**) 엠블럼이 뒤바뀌고(안양 자리에 수원 로고) 강원·부천·광주 팀 링크가 깨져 있던 것을 다음 API 실측으로 수정. (b) 크롤러 4종(`export_matches`·`export_opponent_forms`·`export_head_to_head`·`export_scouting`)의 `data/*.json` 잔재 독스트링을 Supabase 서술로 교체하고 죽은 임포트(`json`·`Path`·`PROJECT_ROOT`) 제거. (c) v1.15가 존재하지 않는 `app/club/page.tsx`로 잘못 정정했던 문서 4곳을 실제 파일 `app/page.tsx`로 재정정. 라우트 목록(`/`·`/songs`·`/songs/[id]`)을 현행화 |
| v2.0 | 2026-07-20 | **Supabase 도입 및 JSON 프리 아키텍처 완성** — 로컬 `data/*.json` 완전 제거 및 크롤러 ➔ DB 직결 파이프라인 구축. 외인 선수 및 부상 상태 한글 번역(`translation.py`) 추가. 구단 정보를 메인('/')으로 스왑. 엠블럼 링크 버그 수정 |
| v1.16 | 2026-07-19 | **F-번호 지형 대정리** — F-12(필터)·F-13(즐겨찾기)·F-14(관리자)·F-15(가사 하이라이트)를 7개 문서에서 삭제/결번 처리하고 흩어진 죽은 참조를 정리. FUNCTION.md 본문 순서 교정(F-04↔F-03)·색인 보완, PRD 4장 목록 정리, API_SPEC의 미존재 CRUD·관리자 API 제거, ERD·PERSONA·CRAWLER·README·TECHSTACK의 F-12~F-14 참조를 현행(F-01 분류 정렬/예약 필드)으로 교체. 7장 확장 후보에서 폐기 기능 삭제 |
| v1.15 | 2026-07-19 | v1.14 발견 사항 **조치 완료**: (5장) 삭제 라우트를 가리키던 문서 4곳(PRD·source-note·CLUB_ERD_SPEC·export_opponent_forms.py)을 현재 `/club` 통합 구조로 정리, (3-1) `_check_teams.py` 삭제·`scratch/`를 `.gitignore` 등록. 1·3-1·5장을 '해결됨'으로 갱신 |
| v1.14 | 2026-07-19 | **전체 프로젝트 재점검**(search·daum-migration 브랜치): 계층 분리·폴더 트리·상호참조·워크플로우 실측 검증(모두 통과, `tsc`·`next build` 0 에러). 완료 작업 로그(구9·10·11장)를 6장 요약으로 압축. **삭제된 페이지를 가리키던 낡은 의존성 그래프·소비자 표 삭제**. 발견 사항으로 (a) 삭제된 라우트를 가리키는 문서 4곳(5장), (b) 루트 작업용 파일(`_check_teams.py`·`scratch/`) 잔존(3-1) 기록 |
| v1.13 | 2026-07-17 | 최근 경기 결과 카드에서 승패 표기를 스코어 좌우측에 배치 |
| v1.12 | 2026-07-17 | 최근 경기 결과 우측 쏠림 해결(좌우 flex-1), 엠블럼 바깥에 점수/승패 배치 및 날짜/시간 추가 |
| v1.11 | 2026-07-17 | 다가오는 매치 레이아웃(세로형 엠블럼) 복구 및 최근 경기 결과 카드 통일 |
| v1.10 | 2026-07-17 | 다가오는 매치와 최근 경기 결과 메인 카드 레이아웃 통일(색상 제외) |
| v1.9 | 2026-07-17 | Home/Away 스타일 반전, 다가오는 매치 Home/Away 추가, 최근 경기 카드 구장명 표시 |
| v1.8 | 2026-07-17 | AWAY 배지 시인성 개선 및 최근 경기 메인 카드 Home/Away 배지 추가 |
| v1.7 | 2026-07-17 | 홈/어웨이 배지 분리 및 순위표 등하락(16라운드 인천/안양 스왑) 반영 |
| v1.6 | 2026-07-17 | 홈/어웨이 표기, 순위표 홈 통합 및 등하락 테스트, 스카우팅 2열 비교 뷰 |
| v1.5 | 2026-07-17 | 맞대결 전적·리스트 가로 카드 UI 통일, 크롤러 라운드 정보 추가 |
| v1.4 | 2026-07-17 | 다음 상대 정보를 구단 정보 메인 탭으로 통합(app/club/opponent 삭제) |
| v1.3 | 2026-07-17 | 인천 최근 전적 4개 조정 및 상대팀 최근 5경기 디자인 통일 |
| v1.2 | 2026-07-17 | 구단 정보 메인 UI 통합 및 RecentMatchesList 리팩터링 |
| v1.1 | 2026-07-17 | 부상/결장 데이터 확보 방안 리서치 추가 및 문서명 변경 |
| v1.0 | 2026-07-17 | 구단 엠블럼 아키텍처 점검 보고서 최초 작성 |
