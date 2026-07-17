# 크롤러 명세서: 구단 데이터 · 응원가 크롤링

- **문서 버전**: v2.5
- **작성일**: 2026-07-16 (v2.5 갱신: 2026-07-17)
- **연관 문서**: PRD.md (F-16·F-17·F-18, 9장 저작권), FUNCTION.md (공통 데이터 규칙, F-01 정렬), API_SPEC.md (2장 Source 객체), ERD_SPEC.md, CLUB_ERD_SPEC.md
- **목적**: 앱이 쓰는 데이터를 크롤링으로 수급해 `data/*.json`으로 내보내는 파이프라인을 정의합니다.
  두 계열이 있고 **처리 모델이 다릅니다**:
  - **구단 데이터(3~3.5절)** — 순위표(F-17) · 인천 경기 일정·결과(F-16) · K리그1 12팀 최근 폼(F-18).
    기계적 사실이라 크롤러가 JSON을 **바로 덮어씁니다**.
  - **응원가(3.7~3.8절)** — 가사·영상 큐레이션이 필요해 **검수 큐를 거칩니다**.
- **상태**: 전부 구현·검증 완료. 앱은 산출 JSON을 런타임에 직접 읽는다(6절).

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
  export_head_to_head.py        # 상대전적(최근 5시즌) → head-to-head.json + meta
```
> 응원가 크롤러(`chants/`, `export_chant_candidates.py` 등)는 2절 범위 밖이다 — 3.7~3.8절 참고.
> 프로젝트에 `scripts/` 디렉터리는 없다. **크롤링·데이터 도구는 전부 `scraper/`에 모은다.**

실행:
```bash
pip install -r scraper/requirements.txt
cd scraper
python export_standings.py [연도]       # → data/standings.json (+meta +이력)
python export_matches.py [연도]         # → data/matches.json (+meta)
python export_opponent_forms.py [연도]  # → data/opponent-forms.json
python export_head_to_head.py [시즌수]  # → data/head-to-head.json (+meta), 생략 시 5시즌
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

## 3.6 상대전적(head-to-head) 크롤링 *(v2.5 신설)*

```
GET .../game/schedule.json?teamId=<인천ID>&seasonKey=<연도>&leagueCode=<kl|kl2>
```
`export_head_to_head.py`가 **최근 5시즌**의 인천 경기를 모아 상대팀별로 묶는다
(`parse_head_to_head`) → `data/head-to-head.json`(상대명 → 경기 목록, 최신순) + meta.
화면은 상대명으로 조회해 **최근 5경기만** 표시한다.

### 3.6.1 왜 API-Football을 걷어냈나

상대전적만 유일하게 **매 요청 외부 API를 실시간 조회**해, 다른 구단 데이터(크롤 스냅샷)와 모델이
어긋나 있었다. 그 탓에:
- `API_FOOTBALL_KEY`가 없으면(=Vercel 미설정) 화면이 **조용히 비었다**. 게다가 "실시간 연동" 배지가
  붙어 있어 실패가 성공처럼 보였다.
- 팀명 한글 매핑이 `kleague/codes.py`와 `lib/api/headToHead.ts` **두 곳에 중복**됐고, 후자는 2024
  로스터 기준이라 2026 승격팀(제주SK·부천FC)이 빠져 있었다(실제 버그였음).
- 무료 플랜의 시즌 제한이라는 **외부 정책이 단일 장애점**이었다.

**동등성 검증**: 전환 전 두 소스를 대조해 **날짜·스코어가 완전히 일치**함을 확인했다(제주SK 5경기,
부천FC 4경기). 다음 쪽은 무료 티어 제한이 없어 데이터가 오히려 많다(2020시즌까지 조회 가능).
결과적으로 **앱의 외부 API 의존과 `.env` 요구가 사라졌다** — 구단 데이터 출처가 다음 스포츠 하나로
통일됐다(`lib/api/sources.ts`).

### 3.6.2 리그 자동 탐색 (중요)

인천은 시즌마다 소속 리그가 달랐다 — **2026 K리그1 / 2025 K리그2(강등) / 2024·2023 K리그1**.
그래서 연도별로 `kl` → `kl2` 순으로 조회해 인천이 있는 쪽을 쓴다. 승강이 또 일어나도 코드를
고칠 필요가 없다. *(`kl`만 조회하면 2025시즌이 통째로 누락된다 — 실제로 2025 순위표에 인천이
없어서 발견했다.)*

`data/head-to-head.json`에는 K리그2 시절 상대(성남·부산·전남 등)도 함께 담긴다. 화면은 **다가오는
매치의 상대**로만 조회하므로 K리그1 팀만 실제로 쓰이지만, 승강으로 다시 만날 수 있어 그대로 둔다.

> **팀명 정규화 범위**: `codes.py`의 매핑은 2026 K리그1 12팀 기준이라, K리그2 팀(대구·수원·성남 …)은
> 약칭이 그대로 남는다. 조회 키는 `matches.json`의 상대명(항상 K리그1 12팀)이고 화면에 뜨는 팀명도
> 그 경기의 양 팀뿐이라 **현재 표시에는 영향이 없다**. K리그2 팀이 화면에 등장할 일이 생기면
> `codes.py`에 추가할 것.

## 3.7 응원가(chants) 크롤링 — 검수 큐 모델

구단 데이터와 **처리 모델이 다르다**. 순위표·경기는 기계적 사실이라 크롤러가 `data/*.json`을
바로 덮어쓰지만, 응원가는 가사 정확도와 공식/현장 영상 선별에 사람 판단이 들어가는 **큐레이션
데이터**다. 그래서 응원가 크롤러는 `data/songs.json`을 **건드리지 않고** 검수 큐
`data/songs-candidates.json`에만 쓴다. 앱(`lib/api/songs.ts`)은 이 후보 파일을 읽지 않는다.

```
scraper/chants/
  official.py    # incheonutd.com 공식 응원가 페이지
  community.py   # 인천네이션 응원가 모음 글
  roster.py      # incheonutd.com 프로선수단 명단 (선수 응원가 현역 판정용)
  merge.py       # 소스 병합 + 제목 정규화 + 출처(source) 부여 + 기존 songs.json 대조
scraper/export_chant_candidates.py   # → data/songs-candidates.json (검수 큐)
scraper/promote_candidates.py        # 검수 통과분 → data/songs.json (신규 곡 승격)
scraper/reconcile_songs.py           # 기존 곡을 크롤과 재대조 (갱신·삭제)
scraper/classify_chants.py           # 선수 응원가 분류 + '미사용' 태그
```
```bash
cd scraper
python export_chant_candidates.py          # 1) 크롤 → 검수 큐
python promote_candidates.py --dry-run     #    무엇이 승격될지 미리 보기
python promote_candidates.py               # 2) 승인분을 songs.json으로
python reconcile_songs.py                  # 3) 기존 곡을 크롤과 재대조
python classify_chants.py                  # 4) 선수 응원가 현역/미사용 갱신
```
세 스크립트는 **모두 멱등**이라 순서대로 반복 실행해도 안전하다.

### 3.7.1 소스 선정

| 소스 | 곡 수 | 가사 | 영상 | 판단 |
|------|-------|------|------|------|
| [공식 홈페이지](https://incheonutd.com/fanzone/cheersong_list.php) | 4 | ✅ 구단 직접 게시(신뢰도 최고) | ❌ 음원 zip만 | **채택** — 가사의 정답지 |
| [인천네이션 응원가 모음](https://incheonation.kr/free/6452) | 30 | △ 팬 작성 | ✅ 유튜브 링크 29건 | **채택** — 커버리지·영상 |
| 나무위키 | 다수 | △ | △ | **탈락** — 아래 참고 |
| YouTube Data API | - | ❌ 설명란 의존 | ✅ | **보류** — 위 둘로 충분, API 키 불필요 |

- **나무위키 탈락 사유**: `robots.txt`는 `/w/` 경로를 허용하지만, 실제 요청은 봇 보호에 막혀
  **403**을 반환한다. 이를 우회하려면 봇 차단 회피가 필요해 채택하지 않았다. 공식+커뮤니티
  두 소스로 이미 34곡을 확보하므로 실익도 없다.
- **크롤링 예의**: 인천네이션 `robots.txt`는 `/free/`를 허용하고 `Crawl-delay: 3`을 명시한다 —
  `export_chant_candidates.py`가 소스 사이에 이 지연을 지킨다. 각 후보에 출처 URL을 남겨
  (`_review.sourceUrls`) 검수자가 원문을 대조할 수 있게 한다.
- **인코딩 주의**: 공식 페이지는 선언대로 **UTF-8**이다(EUC-KR로는 디코드 실패). 윈도우 콘솔에서
  깨져 보이는 건 stdout 인코딩 문제이지 데이터 문제가 아니다 — `resp.content.decode("utf-8")`로 고정.

### 3.7.2 병합 규칙

소스마다 강점이 달라 **필드별로** 우선순위가 다르다:
- **가사**: 공식 > 커뮤니티. 둘 다 있으면 공식으로 덮어쓴다. 단 공식 가사가 비어 있으면
  (뱃고동소리 같은 효과음 트랙) 커뮤니티 가사를 남긴다.
- **영상**: 공식엔 없으므로 커뮤니티에서만 온다. 팬 촬영이 대부분이라 `type`은 `live` 기본값 —
  공식 채널 영상인지는 검수자가 판단해 `official`로 바꾼다.
- **출처(`source`)**: 가사를 **실제로 가져온 쪽**을 기록한다(PRD 9장 저작권 — 가사 출처 표기).
  위 규칙상 공식·커뮤니티가 겹치는 곡은 가사가 공식으로 덮이므로 `source`도 공식이 된다 —
  영상이 커뮤니티에서 왔더라도 그렇다. `source`는 검수용 메타가 아니라 **앱 스키마의 정식 필드**
  (API_SPEC.md 2장 Source 객체)라 승격 후 화면에 그대로 표시된다.
- **중복 제거**: 제목 정규화 키(괄호 주석·공백·부호 제거, 소문자)로 대조한다. 이래야
  `"나의 사랑 인천 FC"`(앱)와 `"나의사랑 인천FC"`(공식)가 같은 곡으로 잡힌다. `youtubeId`가
  이미 `songs.json`에 있어도 제외한다.
- ⚠️ **후보 정렬은 표시 순서가 아니다**: `merge.py`는 후보를 파이썬 기본 `sort()`(코드포인트 순)로
  정렬하는데, 이러면 영어 제목이 한글보다 앞선다(`"Bandiera"` < `"회상"`). 이 순서가 그대로
  `songs.json`의 저장 순서가 되지만, **화면 정렬은 여기에 의존하지 않는다** — F-01이 한국어
  로케일로 다시 정렬한다(FUNCTION.md v1.3, API_SPEC.md 3.1). 저장 순서는 diff를 읽기 쉽게
  하는 용도일 뿐이다.

### 3.7.3 산출물 스키마와 검수 흐름

후보는 앱 스키마(`Song`)와 같은 모양이되 `id`가 **없고** `_review`가 붙는다. `id`는 현재
큐레이션된 값(1, 3 …)이라 크롤러가 임의로 매기지 않고 승인 시 사람이 부여한다.

```jsonc
{
  "title": "Bandiera",
  "videos": [{ "type": "live", "label": "현장 영상", "youtubeId": "3NUV44FixBo" }],
  "lyrics": "검푸른 바다에 바람이 불면\n...",
  "category": "팀 응원가", "tags": [], "isFavorite": false,
  "source": {                        // 앱 스키마 정식 필드 — 화면에 "가사 출처"로 표시된다
    "name": "인천네이션",
    "url": "https://incheonation.kr/free/6452"
  },
  "_review": {                       // 승인 시 이 필드만 떼면 그대로 Song이 된다
    "sourceUrls": ["https://incheonation.kr/free/6452"],  // 대조할 원문 전체(영상 출처 포함)
    "lyricsConfidence": "community", // "official"이면 구단 게시 가사
    "hasVideo": true
  }
}
```

검수 흐름:
1. `export_chant_candidates.py` 실행 → 검수 큐
2. `_review.sourceUrls`로 원문 대조 (특히 `lyricsConfidence: "community"`인 가사)
3. `promote_candidates.py` 실행 → `id` 부여·`_review` 제거 후 `songs.json`에 덧붙이고 큐에서 제거.
   기존 곡의 id·순서는 보존하며, 이미 있는 곡(제목 키·`youtubeId` 일치)은 건너뛰어 **두 번 실행해도
   중복되지 않는다**. `--dry-run`으로 미리 확인할 수 있다.

곡을 큐에서 **빼고 싶으면**(부정확한 가사 등) 승격 전에 `songs-candidates.json`에서 해당 항목을
지우면 된다 — 다음 크롤에서 다시 후보로 올라온다.

**자동화 제외**: 응원가는 1년에 몇 곡 늘어나는 정도라 순위표 같은 주기적 크론이 맞지 않는다.
필요할 때 수동 실행한다.

### 3.7.4 현재 반영 상태 (2026-07-17)

첫 수집분 **32곡을 승격 완료** — `data/songs.json`이 2곡 → **34곡**이 됐다(id 4~35 신규,
기존 id 1·3 보존). 출처 내역: 인천네이션 29곡 · 공식 홈페이지 3곡. 손으로 등록한 기존 2곡은
출처를 몰라 `source`가 없고 화면에도 표기되지 않는다.

> **가사 정확도 주의**: 승격된 29곡의 가사는 팬이 받아적은 것으로 **한 줄씩 대조 검수하지는
> 않았다**. 화면의 "가사 출처: 인천네이션" 표기가 이 사실을 사용자에게 드러내는 장치다
> (PRD 9장의 '출처 표기' 방침). 오탈자를 발견하면 `data/songs.json`에서 직접 고치면 된다 —
> 크롤러는 이미 있는 곡을 다시 후보로 올리지 않으므로 수정이 덮어써지지 않는다.

---

## 3.8 기존 곡 재대조(reconcile) · 선수 응원가 분류(classify)

`promote_candidates.py`가 **새 곡**을 다루는 반면, 아래 둘은 **이미 등록된 곡**을 손본다.

### 3.8.1 reconcile_songs.py — 크롤이 이긴다 + 출처 없으면 삭제

운영 방침(2026-07-17 확정):

| 대상 | 규칙 | 근거 |
|------|------|------|
| `lyrics` | **충돌하면 크롤이 덮어쓴다** | 크롤 소스(구단 공식 > 커뮤니티)가 사람 기억보다 신뢰할 수 있고, 출처를 밝힐 수 있는 유일한 근거 |
| `source` | 크롤 매치가 있으면 부여 | PRD 9장 |
| `videos` | **덮어쓰지 않는다.** 영상이 0개인 곡만 크롤 영상으로 채운다 | '충돌'이 아니라 크롤러가 아예 다루지 않는 영역 — 공식 페이지는 영상 미제공(음원 zip만), 커뮤니티는 곡당 1개뿐. 반면 기존 영상은 official/live 구분이 붙어 더 풍부하다. 영상은 유튜브 임베드라 출처 표기 대상도 아니다(PRD 9장) |
| 어느 소스에도 없는 곡 | **삭제** | 출처를 못 밝히는 데이터라 PRD 9장을 만족할 수 없다 |

**첫 실행 결과(2026-07-17)**: 손으로 등록했던 2곡(`나의 사랑 인천 FC`·`위대한 인천`)이 **삭제 대신
갱신**됐다 — 둘 다 크롤 소스에 있어 가사가 교체되고 출처를 얻었다(각각 공식 홈페이지·인천네이션).
영상은 방침대로 보존됐다. **결과적으로 삭제된 곡은 0건이고, 출처 없는 곡도 0곡이다.**

### 3.8.2 classify_chants.py — 지금도 불리는 곡인가

목록에는 이미 팀을 떠난 선수의 응원가가 섞여 있었다. 신규팬(PRD 핵심 타겟)이 지금 불리지도 않는
곡을 먼저 배우는 문제라, 구단 공식 **프로선수단 명단**(`chants/roster.py`,
`incheonutd.com/player/pro_list.php`)과 대조해 판정한다.

- 새 필드를 만들지 않고 **기존 스키마로** 표현한다: `category`(`"선수 응원가"`/`"팀 응원가"`,
  PRD F-12가 든 분류명 그대로) + `tags`의 `"미사용"`.
- **`PLAYER_CHANTS`는 사람이 관리한다**: 떠난 선수는 명단에 없으므로 명단만으로는 "이 제목이
  선수 이름인지" 알 수 없다(임중용은 명단에 없지만 선수 응원가다). 그래서 선수 응원가 제목 목록만
  스크립트에 두고, **현역 여부 판정만** 자동화한다. 재영입되면 태그가 자동으로 떨어진다.
- **주관성 없음**: FUNCTION.md v1.1이 '대표곡 우선 정렬'을 뺀 이유(판단의 주관성)가 여기선
  재발하지 않는다 — 판정 근거가 구단 공식 명단이다.

**첫 실행 결과(2026-07-17)**: 선수단 50명 기준, 선수 응원가 6곡 중 **현역 1곡(무고사)** ·
**미사용 5곡**(김도혁·남준재·부노자·임중용·전재호). 김도혁은 2026시즌을 앞두고 김포로 이적했다.

> **파싱 주의**: 선수 명단은 `ul.group[data-role] > li.list p.name`으로 한정할 것. `p.name`을
> 전역 선택하면 상단 네비게이션의 팀명("인천"·"전북" …)이 섞여 **현역 선수를 미사용으로 오판정**한다
> (실제로 이 실수를 했다). 한글명 옆 `span.en`(영문명)도 떼야 한다.

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
| v2.5 | 2026-07-17 | **상대전적을 API-Football 실시간 조회 → 다음 크롤로 전환**(3.6절) — 전환 전 두 소스의 날짜·스코어 일치를 검증. 앱의 외부 API 의존·`.env` 요구·팀명 매핑 중복이 사라지고 구단 데이터 출처가 다음 스포츠로 통일됨. 인천의 시즌별 소속 리그가 달라(2025 K리그2) `kl`→`kl2` 자동 탐색 필요함을 명시. 워크플로우에 크롤러 추가, `scripts/` 제거(도구는 `scraper/`로 일원화) |
| v2.4 | 2026-07-17 | `reconcile_songs.py`(크롤 우선 갱신 + 출처 없는 곡 삭제)·`classify_chants.py`(선수 응원가 현역/미사용 판정)·`chants/roster.py` 추가(3.8절). 문서 제목·목적을 응원가까지 포함하도록 갱신하고 헤더 버전(v2.0 방치)을 실제 이력과 동기화. 후보 정렬이 표시 순서가 아님을 3.7.2에 명시 |
| v2.3 | 2026-07-17 | 후보에 `source`(가사 출처) 부여 — 앱 스키마 정식 필드로 화면 표시(PRD 9장). `promote_candidates.py` 추가로 검수 승격 단계 자동화(3.7.3). 첫 수집분 32곡 승격 완료(3.7.4) |
| v2.2 | 2026-07-17 | 응원가 크롤러 추가(3.7절) — 공식 홈페이지+인천네이션 2소스, **검수 큐 모델**(songs.json 직접 갱신 안 함). 나무위키는 봇 차단(403) 우회가 필요해 탈락. 상대전적 팀 ID 맵의 2026시즌 누락(제주SK·부천FC) 수정 |
| v2.1 | 2026-07-17 | 상대 폼을 시즌 전체 저장으로 확대(parse_team_form, 화면은 최근 5경기만). 순위 변동(▲▼) 추가 — 크롤러가 직전 스냅샷과 비교해 meta에 기록(4.1절). opponent-forms-meta.json 추가로 상대 폼도 "○○ 기준" 배지 적용 |
| v2.0 | 2026-07-16 | 경기(F-16)·상대 폼(F-18) 크롤러 추가(schedule.py, export_matches/opponent_forms). TheSportsDB 제거→다가오는 매치도 Daum. 팀명 정규화를 약칭 단일 매핑으로 통일. 워크플로우를 3크롤러로 확장·개명 |
| v1.2 | 2026-07-16 | 런타임 데이터 접근을 SQLite → JSON 직접 읽기로 전환(Vercel 호환, 6절). 크론 주 2회(월·목 06:00 KST)로 조정, standings-meta.json 추가 |
| v1.1 | 2026-07-16 | 수집일별 이력 보존(standings-history/*.json + standings_history 테이블)과 주간 자동화(GitHub Actions cron) 추가 |
| v1.0 | 2026-07-16 | 순위표 크롤링 구현·검증 완료. 소스 검토(portal.kleague.com 탈락 → 다음 스포츠 순위 API 채택), 필드 매핑·파이프라인 확정 |
