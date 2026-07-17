# 크롤러 명세서: K리그 구단 데이터 크롤링

- **문서 버전**: v2.0
- **작성일**: 2026-07-16
- **연관 문서**: PRD.md (F-16·F-17·F-18), CLUB_ERD_SPEC.md, API_SPEC.md
- **목적**: 무료 스포츠 API로 못 가져오던 구단 데이터를 다음 스포츠 공개 API 크롤링으로 수급해
  `data/*.json`으로 내보내는 파이프라인을 정의합니다. 대상: **순위표(F-17)**, **인천 경기
  일정·결과(F-16)**, **K리그1 12팀 최근 폼(F-18 상대 폼)**.
- **상태**: 세 크롤러 모두 구현·검증 완료. 앱은 산출 JSON을 런타임에 직접 읽는다(6절).

---

## 0. 배경 — 왜 크롤링이고, 왜 이 소스인가

PRD.md F-16·F-17은 순위표를 무료 API로 실시간 연동할 수 없어, 원래 "주간 예약 에이전트가
**웹 검색**으로 초안 작성 → 사람 검수"로 계획돼 있었습니다. 2026-07-16 이를 크롤링으로 전환하며
소스를 다음과 같이 검토했습니다:

- **portal.kleague.com (탈락)**: 검증 결과 ① 로그인된 브라우저 세션이 필요한 내부 포털이라
  프로그램의 `requests` 세션으로는 "에러가 발생했습니다"만 반환하고, ② 애초에 순위/승점 테이블이
  아니라 단일 스탯(득점 등)만 제공해 데이터 형태가 맞지 않았다.
- **다음 스포츠 순위 API (채택)**: 쿠키/인증 없이 공개 GET으로 K리그1 12팀 순위표 전체를
  JSON으로 제공. 순위·경기수·승·무·패·득점·실점·승점이 모두 들어 있어 앱 스키마와 정확히 대응.

데이터의 "주간 갱신 스냅샷" 성격과 사람 검수 단계는 그대로 유지됩니다 — 크롤링은 초안 생성
수단만 바꿉니다.

## 1. 설계 원칙

- **앱과 느슨하게 분리된 사이드카**: 크롤러(`scraper/`, Python)는 Next.js 앱과 독립.
  `data/*.json`을 **앱 스키마 그대로** 뱉는 것까지만 책임진다.
- **화면/API 계층 불변**: 앱(`lib/api/*.ts`)이 이 JSON을 런타임에 직접 읽는다(6절). 크롤러는
  화면/컴포넌트를 건드리지 않는다.
- **쓰기 전 검증**: 각 export가 산출물을 검증한 뒤에만 파일을 쓴다(예: 순위표 12팀·필수 필드).

## 2. 파일 구조

```
scraper/
  requirements.txt              # requests
  kleague/
    client.py                   # fetch_rank() / fetch_schedule(): 다음 공개 API GET
    codes.py                    # 다음 팀 약칭 → 앱 표기 정규화(단일 매핑)
    standings.py                # parse_standings(): 순위 JSON → 앱 스키마
    schedule.py                 # parse_incheon_matches / parse_team_form: 경기 JSON → 앱 스키마
  export_standings.py           # 순위표 → standings.json + meta + 이력
  export_matches.py             # 인천 경기 → matches.json + meta
  export_opponent_forms.py      # 12팀 최근 폼 → opponent-forms.json
```

실행:
```bash
pip install -r scraper/requirements.txt
cd scraper
python export_standings.py [연도]       # → data/standings.json (+meta +이력)
python export_matches.py [연도]         # → data/matches.json (+meta)
python export_opponent_forms.py [연도]  # → data/opponent-forms.json
# 연도 생략 시 올해. 앱은 이 JSON을 런타임에 직접 읽는다(별도 적재 단계 없음).
```

## 3. 순위표(standings) 크롤링

### 3.1 소스 엔드포인트

```
GET https://sports.daum.net/prx/hermes/api/team/rank.json
      ?leagueCode=kl&seasonKey=<연도>&page=1&pageSize=100
```
- `leagueCode`: `kl`=K리그1, `kl2`=K리그2. 인증/쿠키 불필요.
- 응답 `list[]`의 각 팀 객체 **최상위 `rank`**에 순위표 값이 모두 있다:
  `{"rank":1,"game":17,"win":11,"draw":3,"loss":3,"gf":28,"ga":12,"gd":16,"pts":36}`

### 3.2 필드 매핑 (다음 → 앱 스키마)

| 앱(data/standings.json) | 다음 필드 |
|-------------------------|-----------|
| rank | `rank.rank` |
| team | `shortNameKo` → `codes.normalize_team_name()` |
| played | `rank.game` |
| win / draw / lose | `rank.win` / `rank.draw` / `rank.loss` |
| goalsFor / goalsAgainst | `rank.gf` / `rank.ga` |
| points | `rank.pts` |

팀명 정규화는 약칭 기준: `"인천"`→`"인천 유나이티드"`, `"전북"`→`"전북 현대모터스"`,
`"안양"`→`"안양FC"`. 매핑에 없으면 원문 유지(누락은 검증에서 드러남). 시즌 승강으로 구성 팀이
바뀌면 `codes.py`의 약칭 매핑만 보정하면 된다(2026시즌엔 제주SK·부천FC 포함).

## 3.5 경기(matches) · 상대 폼(forms) 크롤링

같은 다음 스포츠 경기 API를 쓴다:
```
GET https://sports.daum.net/prx/hermes/api/game/schedule.json
      ?teamId=<팀ID>&seasonKey=<연도>&leagueCode=kl
```
- 응답 `schedule`는 날짜(YYYYMMDD)→경기 리스트 dict. 각 경기에 `gameStatus`(END/BEFORE),
  `home/awayTeamName`(약칭), `home/awayResult`(스코어·문자열→int 캐스팅), `roundSeq`, `fieldName`.
- **경기(F-16)**: `export_matches.py`가 인천 팀ID로 조회 → `parse_incheon_matches`가 인천 관점
  (isHome/opponent/score)으로 변환 → `data/matches.json`(+ `matches-meta.json` 기준일). 앱의
  '지난 경기 결과'·'최근 경기 전적'·'다가오는 매치'가 모두 이 파일에서 나온다(TheSportsDB 제거).
- **상대 폼(F-18)**: 다음 상대가 실시간으로 바뀌므로 `export_opponent_forms.py`가 12팀 전체의
  **시즌 경기 전체**(`parse_team_form`, 최신순)를 미리 크롤 → `data/opponent-forms.json`(앱 팀명
  키) + `opponent-forms-meta.json`(기준일). 화면은 그때의 상대명으로 조회하고 **최근 5경기만**
  잘라 쓴다(`lib/api/opponentScouting.ts`의 `RECENT_FORM_COUNT`) — 저장은 전체, 표시는 일부.
  주요 선수·부상·라인업은 선수 개인정보 리스크로 mock 유지(F-18).

## 4. 이력 보존 (수집일별 스냅샷)

순위표는 주간 갱신 스냅샷이므로, 최신만 덮어쓰지 않고 **수집일별로 누적 보존**한다.

- `export_standings.py`가 매 실행 시 세 곳에 쓴다:
  - `data/standings.json` — 최신(덮어씀). 화면이 표시하는 현재 순위. **순수 스냅샷**.
  - `data/standings-meta.json` — `{updatedAt, previousDate, rankChange}`. 기준일 배지 +
    **직전 스냅샷 대비 순위 변동**(파생값은 스냅샷을 오염시키지 않도록 meta에만 둔다).
  - `data/standings-history/YYYY-MM-DD.json` — 수집일(KST)별 스냅샷(누적).
    `standings.json`과 그날 이력 파일은 **항상 동일한 순수 스냅샷**이다.
- **이력의 durable 원천은 git에 커밋되는 이 JSON 파일들**이다. 앱은 이 JSON을 런타임에
  직접 읽으므로(6절) 이력 보존에 DB가 필요 없다.

### 4.1 순위 변동(▲▼) 계산

런타임에 이력 디렉터리를 스캔하는 방식은 Next 번들 트레이싱에 안전하지 않다. 그래서
**크롤러가 계산해 meta에 담고 앱은 읽기만** 한다:
- `previous_snapshot()`이 오늘을 제외한 가장 최근 이력 파일을 찾는다(같은 날 재실행 시 자기 자신과
  비교하지 않기 위함).
- `rank_changes()`가 `직전순위 - 현재순위`를 계산한다 — 양수=상승(▲), 음수=하락(▼), 0=유지(–),
  `null`=비교 불가(신규 팀/이력 없음).
- `lib/api/standings.ts`가 `TeamStanding.rankChange`로 병합, `StandingsTable`이 렌더한다
  (색은 승/패 규칙과 통일: 상승=brand, 하락=negative).

## 5. 자동화 (주간 크롤링)

`.github/workflows/update-kleague-data.yml` — 주 2회(월·목 06:00 KST = 일·수 21:00 UTC) 크론.
세 크롤러 실행(순위표·경기·상대 폼) → 변경된 `data/*.json` 커밋·푸시. `workflow_dispatch`로 수동
실행도 가능. **전제**: 레포가 GitHub에 있어야 동작한다(미연결이면 `git init`·푸시 후 활성화).

## 6. 런타임 데이터 접근 (Vercel 배포)

앱(`lib/api/*.ts`)은 런타임에 `data/*.json`을 **직접 import**해서 읽는다(SQLite 미사용).
Next.js가 이 JSON을 서버리스 함수 번들에 포함하므로 Vercel에서 별도 빌드 스텝·DB·설정 없이
동작한다. 크롤러가 갱신한 JSON이 커밋→배포되면 다음 빌드부터 최신 데이터가 반영된다. SQLite
계층(`lib/db.ts`·`scripts/seed-db.mjs`)은 런타임 JSON 전환과 함께 제거됐다.

## 7. 향후 확장 (범위 밖, 참고)

- **상대 스카우팅 실데이터**: 주요 선수·부상은 선수 개인정보 리스크로 mock 유지 중(F-18 정책).
- **데이터 규모 확대**: 현재는 JSON 파일 + git 커밋 모델. 다중 시즌·선수 단위로 커지면
  (대략 수 MB 이상) 커밋 diff·번들 크기가 부담이 되므로, 시즌별 디렉터리 분리 →
  외부 DB(Supabase 등, ERD_SPEC·CLUB_ERD_SPEC의 관계형 설계 재사용) 순으로 확장한다.
  앱은 `lib/api/*.ts` 내부만 교체하면 되고 화면은 불변이다.

---

## 변경 이력 (Changelog)

| 버전 | 날짜 | 내용 |
|------|------|------|
| v2.1 | 2026-07-17 | 상대 폼을 시즌 전체 저장으로 확대(parse_team_form, 화면은 최근 5경기만). 순위 변동(▲▼) 추가 — 크롤러가 직전 스냅샷과 비교해 meta에 기록(4.1절). opponent-forms-meta.json 추가로 상대 폼도 "○○ 기준" 배지 적용 |
| v2.0 | 2026-07-16 | 경기(F-16)·상대 폼(F-18) 크롤러 추가(schedule.py, export_matches/opponent_forms). TheSportsDB 제거→다가오는 매치도 Daum. 팀명 정규화를 약칭 단일 매핑으로 통일. 워크플로우를 3크롤러로 확장·개명 |
| v1.2 | 2026-07-16 | 런타임 데이터 접근을 SQLite → JSON 직접 읽기로 전환(Vercel 호환, 6절). 크론 주 2회(월·목 06:00 KST)로 조정, standings-meta.json 추가 |
| v1.1 | 2026-07-16 | 수집일별 이력 보존(standings-history/*.json + standings_history 테이블)과 주간 자동화(GitHub Actions cron) 추가 |
| v1.0 | 2026-07-16 | 순위표 크롤링 구현·검증 완료. 소스 검토(portal.kleague.com 탈락 → 다음 스포츠 순위 API 채택), 필드 매핑·파이프라인 확정 |
