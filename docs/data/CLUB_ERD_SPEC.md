# ERD 명세서: 구단 정보 (순위표 · 경기 · 상대 스카우팅)

- **문서 버전**: v1.2
- **작성일**: 2026-07-16 (v1.2 갱신: 2026-07-17)
- **연관 문서**: PRD.md (v1.2, F-16·F-17·F-18), ERD_SPEC.md(응원가 — 동일 설계 원칙 적용)
- **목적**: `lib/api/matches.ts`·`standings.ts`·`opponentScouting.ts`가 읽는 `data/*.json` 데이터의 **관계형 설계 참고서**입니다. (2026-07-16 갱신: 앱은 런타임에 이 JSON을 직접 읽습니다 — SQLite 적재 경로는 제거됐고, 이 스키마는 향후 실제 DB 도입 시의 기준으로 남습니다. ERD_SPEC.md와 동일한 위상.)
- **적용 범위** *(2026-07-17 변경)*: `lib/api/headToHead.ts`(상대전적)도 이제 이 문서의 대상입니다 — API-Football 실시간 조회에서 **다음 크롤 스냅샷**(`data/head-to-head.json`)으로 전환되어 결과를 자체 저장하게 됐기 때문입니다(CRAWLER_SPEC.md 3.6). 스키마는 4장 참고. *(이전 버전은 "실시간 조회라 범위 밖"이라고 적혀 있었습니다.)*
- **데이터 수집처(출처)** *(2026-07-17 신설)*: 이 문서의 도메인들은 수집처가 **데이터셋 단위로 고정**이며, 상대전적 전환 이후 **전부 다음 스포츠 하나**입니다(크롤, CRAWLER_SPEC.md). 응원가처럼 행마다 출처가 다르지 않으므로 `source` 컬럼을 두지 않고, `lib/api/sources.ts`의 상수(`DAUM_SPORTS`)로 정의해 화면 하단에 표기합니다(PRD 9장 '데이터 출처 표기 범위').

---

## 0. 설계 전제 — 이 데이터는 "실시간"이 아니라 "주기 갱신 스냅샷"이다

PRD.md F-16·F-17에 따르면 순위표·지난 경기·최근 5경기는 무료 API로 실시간 연동이 불가능해, **초안을 만들고 사람이 검수 후 반영**하는 방식으로 운영합니다. 초안 생성 수단은 2026-07-16부로 공개 순위 API 크롤링(다음 스포츠, `scraper/`, CRAWLER_SPEC.md)으로 전환했습니다 — 크롤러가 `data/standings.json` + `data/standings-meta.json` + 수집일별 이력을 만들고, 앱은 이 JSON을 런타임에 직접 읽습니다(순위표 구현 완료, 자동 스케줄링은 GitHub Actions 워크플로우로 구성).

그래서 이 문서의 테이블들은 공통적으로:
- 한 번에 여러 행이 갱신 시점마다 통째로 교체되는 "스냅샷" 성격을 가집니다.
- 화면에 "이 데이터가 언제 기준인지" 보여줄 수 있도록 `updated_at` 컬럼을 둡니다 (지금 화면의 "예시 데이터" 배지를 나중에 "2026-07-13 기준"류로 바꿀 근거가 됩니다).
- ERD_SPEC.md와 동일하게 `snake_case` 컬럼명, camelCase API 필드와의 대응을 표로 남깁니다.

---

## 1. STAGE 1 — standings (K리그1 순위표, F-17)

가장 단순한 구조입니다: 관계 없는 평면 테이블 하나, 매주 12행 전체가 교체됩니다.

| 컬럼명 | 타입 | 제약조건 | 설명 (API 필드 대응) |
|--------|------|----------|----------------------|
| team | text | PK | `team` — 팀명이 코드 전반에서 이미 자연키로 쓰이고 있어(`KOREAN_TEAM_NAME` 매핑 등) 그대로 PK로 사용 |
| rank | int | NOT NULL | `rank` |
| played | int | NOT NULL | `played` |
| win | int | NOT NULL | `win` |
| draw | int | NOT NULL | `draw` |
| lose | int | NOT NULL | `lose` |
| goals_for | int | NOT NULL | `goalsFor` |
| goals_against | int | NOT NULL | `goalsAgainst` |
| points | int | NOT NULL | `points` |
| updated_at | text (ISO datetime) | NOT NULL | 이 스냅샷이 반영된 시각 (주간 검수 반영 시점) |

**갱신 방식**: 매주 전체 12행을 `DELETE` 후 재삽입 (부분 갱신 아님 — 순위표는 항상 리그 전체 스냅샷이므로).

---

## 2. STAGE 2 — matches (지난 경기 결과 · 다가오는 매치, F-16)

관계 없는 평면 테이블. `status`가 `finished`/`upcoming` 두 상태를 가지며, 점수는 API의 중첩 객체(`score: {incheon, opponent}`)를 SQLite에 저장 가능하도록 평평하게 풉니다.

| 컬럼명 | 타입 | 제약조건 | 설명 (API 필드 대응) |
|--------|------|----------|----------------------|
| id | integer | PK | `id` — 기존 mock의 비연속 id(1~6,8,9)를 그대로 보존 |
| round | text | NOT NULL | `round` |
| kickoff_at | text (ISO datetime) | NOT NULL | `kickoffAt` |
| status | text | NOT NULL, CHECK (`'finished'` 또는 `'upcoming'`) | `status` |
| opponent | text | NOT NULL | `opponent` |
| is_home | integer | NOT NULL (0/1) | `isHome` |
| score_incheon | integer | NULL 허용 | `score.incheon` (status=`upcoming`이면 NULL) |
| score_opponent | integer | NULL 허용 | `score.opponent` (status=`upcoming`이면 NULL) |
| venue | text | NOT NULL | `venue` |
| updated_at | text (ISO datetime) | NOT NULL | 이 행이 검수 반영된 시각 |

**참고** *(2026-07-17 갱신)*: `getUpcomingMatch()`는 이 테이블(현재는 `data/matches.json`)의 `status='upcoming'` 행 중 가장 가까운 경기를 반환합니다 — **실시간 조회나 폴백이 없는 단일 경로**입니다. *(이전 버전에는 "TheSportsDB 실시간 조회가 우선, 실패 시 폴백"이라 적혀 있었으나, 2026-07-16 TheSportsDB 의존 제거로 사실과 달라져 정정합니다 — CRAWLER_SPEC.md 3.5절.)*

---

## 3. STAGE 3 — opponent scouting (다가오는 상대 정보, F-18)

가장 복잡한 구조 — 상대 1팀에 대해 여러 하위 목록(최근 폼·주요 선수·부상·예상 라인업)이 딸려 있어 정규화가 필요합니다. **주의**: PRD상 실존 선수 개인정보 리스크로 이 데이터는 당분간 익명 처리된 mock을 유지하기로 되어 있어 — 실데이터로 바뀔 계획이 없다면 JSON 파일 그대로 두고 이 단계는 보류해도 됩니다. 그래도 설계는 남겨둡니다.

### 3.1 opponent_scouting (부모)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| opponent | text | PK | 상대팀명 — 현재는 항상 "다가오는 매치의 상대" 1건만 존재 |
| updated_at | text (ISO datetime) | NOT NULL | 검수 반영 시각 |

`matchId` 필드는 스키마에서 제외합니다 — 현재 mock 데이터 자체가 존재하지 않는 `matches.id`를 참조하고 있고(`matchId: 7`), 화면 로직도 `opponent`로만 조회하지 `matchId`는 쓰지 않습니다(`app/page.tsx` 참고 — 2026-07-17 `app/club/opponent`가 구단 페이지로 통합, 2026-07-20 그 페이지가 루트 `/`로 이동).

### 3.2 opponent_recent_form (1:N)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | integer | PK, AUTOINCREMENT | 내부 식별자 |
| opponent | text | NOT NULL, FK → opponent_scouting(opponent) ON DELETE CASCADE | |
| date | text | NOT NULL | `recentForm[].date` |
| opponent_faced | text | NOT NULL | `recentForm[].opponentFaced` |
| result | text | NOT NULL, CHECK (`'W'`/`'D'`/`'L'`) | `recentForm[].result` |
| score | text | NOT NULL | `recentForm[].score` (예: `"2-1"`) |

### 3.3 opponent_key_players (1:N)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | integer | PK, AUTOINCREMENT | |
| opponent | text | NOT NULL, FK → opponent_scouting(opponent) ON DELETE CASCADE | |
| name | text | NOT NULL | `keyPlayers[].name` (익명 처리 원칙 유지) |
| position | text | NOT NULL | `keyPlayers[].position` |
| note | text | NOT NULL | `keyPlayers[].note` |

### 3.4 opponent_injuries (1:N)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | integer | PK, AUTOINCREMENT | |
| opponent | text | NOT NULL, FK → opponent_scouting(opponent) ON DELETE CASCADE | |
| name | text | NOT NULL | `injuries[].name` |
| status | text | NOT NULL | `injuries[].status` |
| expected_return | text | NOT NULL | `injuries[].expectedReturn` |

### 3.5 opponent_probable_lineup (1:N, 순서 있음)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | integer | PK, AUTOINCREMENT | |
| opponent | text | NOT NULL, FK → opponent_scouting(opponent) ON DELETE CASCADE | |
| player_name | text | NOT NULL | `probableLineup[]` 원소 |
| sort_order | int | NOT NULL | 배열 순서 보존 (videos 테이블의 `sort_order`와 동일 패턴) |

---

## 3.6 STAGE 4 — head_to_head (상대전적, F-18) *(v1.2 신설)*

인천 기준 최근 5시즌의 완료 경기를 상대별로 묶은 스냅샷(`data/head-to-head.json`). 다른 테이블과
달리 **인천이 반드시 한쪽에 있는** 경기만 담깁니다.

| 컬럼명 | 타입 | 제약조건 | 설명 (API 필드 대응) |
|--------|------|----------|----------------------|
| id | integer | PK, AUTOINCREMENT | (JSON에는 없는 내부 식별자) |
| opponent | text | NOT NULL, INDEX | 묶음 키 — JSON의 최상위 키. `HeadToHeadMatch`에는 없음 |
| date | text (YYYY-MM-DD) | NOT NULL | `date` |
| home_team | text | NOT NULL | `homeTeam` — 인천 관점으로 접지 않고 실제 홈팀 |
| away_team | text | NOT NULL | `awayTeam` |
| home_score | integer | NOT NULL | `homeScore` |
| away_score | integer | NOT NULL | `awayScore` |
| updated_at | text | NOT NULL | 스냅샷 수집일 (현재는 `head-to-head-meta.json`) |

- **승/무/패를 저장하지 않는 이유**: 화면(`HeadToHeadList`)이 `homeTeam === "인천 유나이티드"`인지
  보고 그때그때 계산합니다. 파생값을 스냅샷에 넣지 않는 원칙은 순위표의 `rankChange`와 같습니다
  (CRAWLER_SPEC.md 4.1 — 파생값은 meta에).
- **`matches` 테이블과 겹치지 않나**: 겹칩니다(올해 경기는 양쪽에 있음). 그래도 분리하는 이유는
  범위가 다르기 때문입니다 — `matches`는 **올해 인천 일정 전체**(예정 경기 포함)이고,
  `head_to_head`는 **여러 시즌의 완료 경기**입니다. 실제 DB 도입 시 `matches`를 다년치로 확장해
  뷰로 합치는 것도 방법입니다.

---

## 4. 관계 다이어그램

```mermaid
erDiagram
    OPPONENT_SCOUTING ||--o{ OPPONENT_RECENT_FORM : has
    OPPONENT_SCOUTING ||--o{ OPPONENT_KEY_PLAYERS : has
    OPPONENT_SCOUTING ||--o{ OPPONENT_INJURIES : has
    OPPONENT_SCOUTING ||--o{ OPPONENT_PROBABLE_LINEUP : has

    STANDINGS {
        text team PK
        int rank
        int points
    }

    MATCHES {
        integer id PK
        text status
        text opponent
    }

    OPPONENT_SCOUTING {
        text opponent PK
        text updated_at
    }
```

`standings`·`matches`·`opponent_scouting`은 서로 FK로 묶여 있지 않습니다 — 세 도메인이 각자 독립적인 스냅샷이며, "다가오는 매치의 상대"라는 개념적 연결은 `opponent`(팀명 문자열) 값이 우연히 같다는 것으로만 화면 코드(`app/page.tsx` — 2026-07-17 `app/club/opponent`가 구단 페이지로 통합, 2026-07-20 루트 `/`로 이동)에서 조합됩니다.

---

## 변경 이력 (Changelog)

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.2 | 2026-07-17 | 상대전적이 크롤 스냅샷으로 전환되며 **적용 범위 안으로 편입** — `head_to_head` 테이블(3.6절) 신설. 구단 데이터 출처가 다음 스포츠 하나로 통일(API-Football 제거) |
| v1.1 | 2026-07-17 | 데이터 수집처(출처) 표기 방침 추가 — 구단 데이터는 데이터셋 단위 고정이라 컬럼이 아닌 `lib/api/sources.ts` 상수로 관리. 2장 `getUpcomingMatch()` 서술을 실제 코드에 맞게 정정(TheSportsDB 우선/폴백 → JSON 단일 경로) |
| v1.0 | 2026-07-16 | 최초 작성. standings·matches·opponent_scouting(+ 4개 하위 테이블) 스키마 정의. head-to-head는 실시간 조회라 범위 밖으로 명시 |
