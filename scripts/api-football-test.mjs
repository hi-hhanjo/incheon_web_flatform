// API-Football(v3.football.api-sports.io) 무료 티어가 K리그1/인천 유나이티드 데이터를
// 실제로 제공하는지 확인하는 검증용 스크립트.
// lib/api/matches.ts, standings.ts, opponentScouting.ts(mock 원본)는 건드리지 않는다.
// 실행: node --env-file=.env.local scripts/api-football-test.mjs
const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE = "https://v3.football.api-sports.io";

if (!API_KEY) {
  console.error("환경변수 API_FOOTBALL_KEY가 없습니다. .env.local을 확인하세요.");
  process.exit(1);
}

async function getJSON(path) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "x-apisports-key": API_KEY },
    });
    const json = await res.json();
    return { status: res.status, ok: res.ok, json };
  } catch (err) {
    return { status: null, ok: false, json: null, error: String(err) };
  }
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

const verdicts = [];
function verdict(label, passed, detail) {
  verdicts.push({ label, passed, detail });
  console.log(`${passed ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`);
}

function printSummary() {
  section("최종 요약");
  for (const v of verdicts) {
    console.log(`${v.passed ? "✅" : "❌"} ${v.label} — ${v.detail}`);
  }
  const allPassed = verdicts.length > 0 && verdicts.every((v) => v.passed);
  console.log(
    `\n${allPassed ? "전부 통과: 실 API 연동 검토 가능" : "일부 실패: 통과 항목만 선별 적용 검토"}`
  );
}

async function main() {
  // 0. API 키 유효성 확인
  section("0. API 키 상태 확인 (/status)");
  const statusCheck = await getJSON("/status");
  console.log("status:", statusCheck.status);
  console.log(JSON.stringify(statusCheck.json, null, 2)?.slice(0, 800));
  const keyValid = statusCheck.ok && (statusCheck.json?.errors?.length ?? 0) === 0;
  verdict("API 키 유효성", keyValid, `status=${statusCheck.status}`);
  if (!keyValid) {
    printSummary();
    return;
  }

  // 1. 리그 검색: K League 1
  section("1. 리그 검색 (/leagues?search=K League 1)");
  const leagueSearch = await getJSON("/leagues?search=K League 1");
  const league = leagueSearch.json?.response?.[0];
  console.log("status:", leagueSearch.status);
  if (!league) {
    verdict("리그 검색", false, "K League 1을 찾지 못함 — 이후 단계 스킵");
    printSummary();
    return;
  }
  const leagueId = league.league.id;
  const currentSeason =
    league.seasons?.find((s) => s.current) ?? league.seasons?.at(-1);
  console.log(`리그: ${league.league.name} (id=${leagueId}), 시즌=${currentSeason?.year}`);
  console.log("coverage:", JSON.stringify(currentSeason?.coverage, null, 2));
  verdict(
    "리그 검색",
    true,
    `${league.league.name} (id=${leagueId}), season=${currentSeason?.year}`
  );

  // 2. 팀 검색: Incheon United
  section("2. 팀 검색 (/teams?search=Incheon)");
  const teamSearch = await getJSON("/teams?search=Incheon");
  const teamEntry = teamSearch.json?.response?.[0];
  console.log("status:", teamSearch.status);
  console.log(JSON.stringify(teamEntry?.team, null, 2));
  if (!teamEntry) {
    verdict("팀 검색", false, "인천 유나이티드를 찾지 못함 — 이후 단계 스킵");
    printSummary();
    return;
  }
  const teamId = teamEntry.team.id;
  verdict("팀 검색", true, `${teamEntry.team.name} (id=${teamId})`);

  // 3. 순위표 — 현재 시즌 조회 후, 막히면 무료 플랜이 허용하는 과거 시즌으로 재시도해
  //    "요청 제한(시즌)"과 "데이터 자체 없음"을 구분한다.
  section("3. 순위표 (/standings)");
  let table = [];
  let standingsSeasonUsed = currentSeason?.year;
  let standingsError = null;
  for (const season of [currentSeason?.year, 2025, 2024, 2023]) {
    const standings = await getJSON(`/standings?league=${leagueId}&season=${season}`);
    const rows = standings.json?.response?.[0]?.league?.standings?.[0] ?? [];
    const err = standings.json?.errors?.plan;
    console.log(`season=${season} → 팀 수=${rows.length}${err ? `, plan 제한: ${err}` : ""}`);
    if (rows.length > 0) {
      table = rows;
      standingsSeasonUsed = season;
      break;
    }
    if (err) standingsError = err;
  }
  console.log(table.slice(0, 3).map((t) => `${t.rank}위 ${t.team.name} ${t.points}점`));
  verdict(
    "순위표",
    table.length >= 12,
    table.length > 0
      ? `season=${standingsSeasonUsed}에서 ${table.length}개 팀 반환 (K리그1 실제 12개 구단, 현재 시즌 아님)`
      : `모든 시즌 조회 실패${standingsError ? ` — ${standingsError}` : ""}`
  );

  // 4. 최근 5경기 — 무료 플랜은 last 파라미터 자체를 막는 경우가 있어 에러 메시지를 그대로 기록한다.
  section("4. 최근 5경기 (/fixtures?team=&last=5)");
  const lastFixtures = await getJSON(`/fixtures?team=${teamId}&last=5`);
  const lastList = lastFixtures.json?.response ?? [];
  const lastError = lastFixtures.json?.errors?.plan;
  console.log("status:", lastFixtures.status, "경기 수:", lastList.length, lastError ?? "");
  verdict(
    "최근 5경기",
    lastList.length >= 5,
    lastError ? `plan 제한: ${lastError}` : `${lastList.length}건 반환`
  );

  // 5. 다음 경기 — 무료 플랜은 next 파라미터도 막는 경우가 있어 에러 메시지를 그대로 기록한다.
  section("5. 다음 경기 (/fixtures?team=&next=1)");
  const nextFixture = await getJSON(`/fixtures?team=${teamId}&next=1`);
  const nextList = nextFixture.json?.response ?? [];
  const nextError = nextFixture.json?.errors?.plan;
  console.log("status:", nextFixture.status, "경기 수:", nextList.length, nextError ?? "");
  verdict(
    "다음 경기",
    nextList.length > 0,
    nextError ? `plan 제한: ${nextError}` : `${nextList.length}건 반환`
  );

  printSummary();
}

main();
