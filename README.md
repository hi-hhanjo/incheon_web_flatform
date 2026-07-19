# 인천 유나이티드 응원가

경기장에서 따라 부를 수 있도록 **인천 유나이티드 응원가의 가사와 영상**을 모아둔 모바일 친화형 웹페이지입니다. 구단 정보(순위표·경기 일정·다음 상대)도 함께 봅니다.

- **주 사용자**: 처음 직관 온 신규팬 — 응원가를 몰라 따라 부르지 못하는 문제를 풉니다.
- **화면**: 응원가 목록 → 상세(영상 + 가사) / 구단 정보(경기·순위표·다음 상대)
- **데이터**: 현재 응원가 **34곡**, 구단 데이터는 주 2회 자동 갱신.

## 시작하기

```bash
npm install
npm run dev     # http://localhost:3000
```

**API 키·`.env` 설정이 필요 없습니다.** 모든 데이터가 `data/*.json`에 커밋돼 있고 앱이 이를 직접 읽습니다 — 클론 후 바로 실행됩니다.

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |

## 이 프로젝트를 고치기 전에

**문서가 정답의 기준입니다.** 코드가 문서를 앞서가지 않습니다 — 구현을 바꿔야 하면 문서를 먼저 고칩니다. 규칙 전문은 [`.agent/rules.md`](.agent/rules.md)에 있고, 루트 [`CLAUDE.md`](CLAUDE.md)가 이를 import합니다.

| 알고 싶은 것 | 문서 |
|---|---|
| 무엇을·왜 만드는가, 범위·저작권 방침 | [`docs/bible/PRD.md`](docs/bible/PRD.md) |
| 각 기능이 화면에서 어떻게 동작하는가 | [`docs/bible/FUNCTION.md`](docs/bible/FUNCTION.md) |
| 어떤 기술로 만드는가, 폴더 구조 | [`docs/bible/TECHSTACK.md`](docs/bible/TECHSTACK.md) |
| 색·글꼴·간격 토큰 | [`docs/design/BASE.md`](docs/design/BASE.md) |
| 화면 부품 상세 | [`docs/design/README.md`](docs/design/README.md) |
| 데이터 모델·API 계약 | [`docs/data/API_SPEC.md`](docs/data/API_SPEC.md) |
| 데이터를 어디서 어떻게 긁어오는가 | [`docs/data/CRAWLER_SPEC.md`](docs/data/CRAWLER_SPEC.md) |

## 구조 한눈에

```
app/         화면 (Next.js App Router)
components/  화면 부품
lib/api/     데이터 접근 계층 — 화면은 반드시 여기를 거친다 (data/*.json 직접 import 금지)
data/        런타임 데이터 (응원가 + 구단)
scraper/     크롤러 사이드카 (Python) — data/*.json만 만들고 앱 코드는 건드리지 않는다
docs/        근거 문서
```

기술 스택: Next.js + React · Tailwind CSS · JSON 파일 · YouTube 임베드 · Vercel. 자세한 이유는 [TECHSTACK.md](docs/bible/TECHSTACK.md).

## 데이터 갱신 (크롤러)

앱을 개발·배포하는 데는 필요 없습니다. 직접 돌릴 때만 Python 3.12+가 필요합니다.

```bash
pip install -r scraper/requirements.txt
cd scraper

# 구단 데이터 — 주 2회 GitHub Actions가 자동 실행하므로 보통 수동 실행할 일이 없습니다
python export_standings.py        # 순위표 (+수집일별 이력)
python export_matches.py          # 인천 경기 일정·결과
python export_opponent_forms.py   # 12팀 최근 폼
python export_head_to_head.py     # 상대전적 (최근 5시즌)

# 응원가 — 자동화하지 않습니다. 가사는 사람이 검수한 뒤에 반영합니다
python export_chant_candidates.py       # 크롤 → 검수 큐(data/songs-candidates.json)
python promote_candidates.py --dry-run  # 무엇이 올라갈지 미리 보기
python promote_candidates.py            # 승인분 → songs.json
python reconcile_songs.py               # 기존 곡을 크롤과 재대조 (충돌 시 크롤 우선)
python classify_chants.py               # 선수 응원가 현역/미사용 갱신
```

모든 크롤러는 **멱등**입니다 — 여러 번 돌려도 같은 결과가 나옵니다.

## 저작권

- 영상은 **유튜브 임베드(iframe)로만** 불러옵니다. 파일을 복사·재업로드하지 않습니다.
- 가사는 **공개된 자료**(구단 공식 홈페이지·팬 커뮤니티)에서만 가져오고, 곡마다 **출처를 화면에 표기**합니다.
- 크롤 대상 사이트의 `robots.txt`를 지키며, 봇 차단을 우회해야 하는 소스는 사용하지 않습니다.

자세한 방침은 [PRD.md 9장](docs/bible/PRD.md)을 참고하세요.
