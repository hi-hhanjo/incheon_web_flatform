# 크롤러 명세서: K리그1 순위표 크롤링

- **문서 버전**: v1.0
- **작성일**: 2026-07-16
- **연관 문서**: PRD.md (F-16·F-17), CLUB_ERD_SPEC.md, API_SPEC.md
- **목적**: 무료 스포츠 API로 못 가져오는 K리그1 순위표(F-17)를 공개 순위 API 크롤링으로
  수급해 `data/standings.json` → SQLite로 적재하는 파이프라인을 정의합니다.
- **상태**: 순위표(standings) 구현·검증 완료.

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
  `data/standings.json`을 **기존 스키마 그대로** 뱉는 것까지만 책임진다.
- **화면/API 계층 불변**: 크롤러 산출물은 `node scripts/seed-db.mjs`가 그대로 적재한다.
  `lib/api/*.ts`·`app/club/*`는 손대지 않는다.
- **쓰기 전 검증**: `export_standings.py`가 12팀·필수 필드를 확인한 뒤에만 파일을 쓴다.

## 2. 파일 구조

```
scraper/
  requirements.txt            # requests, beautifulsoup4
  kleague/
    client.py                 # fetch_rank(): 다음 순위 API 공개 GET
    codes.py                  # 다음 nameKo → 앱 표기 정규화
    standings.py              # parse_standings(): JSON → 앱 스키마
  export_standings.py         # 크롤 → 검증 → data/standings.json
```

실행:
```bash
pip install -r scraper/requirements.txt
python scraper/export_standings.py [연도]     # 생략 시 올해 → data/standings.json
node scripts/seed-db.mjs                       # → data/app.db
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
| team | `nameKo` → `codes.normalize_team_name()` |
| played | `rank.game` |
| win / draw / lose | `rank.win` / `rank.draw` / `rank.loss` |
| goalsFor / goalsAgainst | `rank.gf` / `rank.ga` |
| points | `rank.pts` |

팀명 정규화 예: `"인천 Utd"`→`"인천 유나이티드"`, `"전북 현대"`→`"전북 현대모터스"`,
`"FC안양"`→`"안양FC"`. 매핑에 없으면 원문 유지(누락은 검증에서 드러남). 시즌 승강으로
구성 팀이 바뀌면 `codes.py`의 매핑만 보정하면 된다(2026시즌엔 제주SK·부천FC 포함).

## 4. 이력 보존 (수집일별 스냅샷)

순위표는 주간 갱신 스냅샷이므로, 최신만 덮어쓰지 않고 **수집일별로 누적 보존**한다.

- `export_standings.py`가 매 실행 시 두 곳에 쓴다:
  - `data/standings.json` — 최신(덮어씀). 화면이 표시하는 현재 순위.
  - `data/standings-history/YYYY-MM-DD.json` — 수집일(KST)별 스냅샷(누적).
- **이력의 durable 원천은 git에 커밋되는 이 JSON 파일들**이다. `data/app.db`는 `.gitignore`
  대상이라 배포/재빌드 때 `seed-db.mjs`가 파일들로부터 다시 만든다.
- `seed-db.mjs`는 `standings_history` 테이블을 파일 기준으로 재구성한다(`DELETE` 후 전체
  파일 재적재 — DB는 파일의 투영). 화면용 `standings`(최신)와 별개로 과거 스냅샷을 보존한다.
- 아직 이 이력을 읽는 화면은 없다. "지난주 대비 순위 변동(▲▼)" 같은 기능의 기반 데이터다.

## 5. 자동화 (주간 크롤링)

`.github/workflows/update-standings.yml` — 매주 화요일 09:00 KST(00:00 UTC) 크론.
크롤링 → `standings.json` + 이력 파일 갱신 → 변경분 커밋·푸시. `workflow_dispatch`로 수동
실행도 가능. **전제**: 레포가 GitHub에 있어야 동작한다(현재 미연결이면 `git init`·푸시 후 활성화).
배포 플랫폼은 빌드 시 `node scripts/seed-db.mjs`로 `app.db`를 재생성해야 한다.

## 6. 향후 확장 (범위 밖, 참고)

- **matches(F-16)**: 다음 스포츠는 일정/결과 API도 제공하므로 동일 패턴으로
  `export_matches.py` 추가 가능(미구현).

---

## 변경 이력 (Changelog)

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.1 | 2026-07-16 | 수집일별 이력 보존(standings-history/*.json + standings_history 테이블)과 주간 자동화(GitHub Actions cron) 추가 |
| v1.0 | 2026-07-16 | 순위표 크롤링 구현·검증 완료. 소스 검토(portal.kleague.com 탈락 → 다음 스포츠 순위 API 채택), 필드 매핑·파이프라인 확정 |
