// TheSportsDB 무료 API가 K리그1/인천 유나이티드 데이터를 실제로 제공하는지 확인하는 검증용 스크립트.
// lib/api/matches.ts, standings.ts, opponentScouting.ts(mock 원본)는 건드리지 않는다.
// 실행: node scripts/thesportsdb-test.mjs
const API_KEY = "123"; // TheSportsDB 공개 무료 테스트 키
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

async function getJSON(url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // JSON 파싱 실패 시 raw 텍스트만 보존
    }
    return { status: res.status, ok: res.ok, json, raw: text.slice(0, 300) };
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

async function main() {
  // 1. 팀 검색: 인천 유나이티드
  section("1. 팀 검색 (searchteams.php?t=Incheon)");
  const teamSearch = await getJSON(`${BASE}/searchteams.php?t=Incheon`);
  console.log("status:", teamSearch.status, teamSearch.error ?? "");

  const candidates = (teamSearch.json?.teams ?? []).filter(
    (t) => t.strSport === "Soccer"
  );
  console.log(
    "검색된 축구팀:",
    candidates.map((t) => `${t.strTeam} (id=${t.idTeam}, league=${t.strLeague})`)
  );

  const team = candidates.find((t) => t.strTeam?.includes("Incheon"));
  if (!team) {
    verdict("팀 검색", false, "인천 유나이티드를 찾지 못함 — 이후 단계 스킵");
    printSummary();
    return;
  }
  verdict(
    "팀 검색",
    true,
    `${team.strTeam} (idTeam=${team.idTeam}, idLeague=${team.idLeague}, league=${team.strLeague})`
  );

  // 2. 리그 내 전체 팀 목록 (K리그1 커버리지 확인)
  section("2. 리그 전체 팀 목록 (search_all_teams.php)");
  const leagueTeams = await getJSON(
    `${BASE}/search_all_teams.php?l=${encodeURIComponent(team.strLeague ?? "")}`
  );
  const teamNames = (leagueTeams.json?.teams ?? []).map((t) => t.strTeam);
  console.log("status:", leagueTeams.status, "팀 수:", teamNames.length);
  console.log(teamNames.join(", "));
  verdict(
    "리그 전체 팀 목록",
    teamNames.length > 0,
    `${teamNames.length}개 팀 반환 (K리그1이면 12개 안팎이어야 함)`
  );

  // 3. 최근 경기 결과
  section("3. 최근 경기 결과 (eventslast.php)");
  const lastEvents = await getJSON(`${BASE}/eventslast.php?id=${team.idTeam}`);
  console.log("status:", lastEvents.status);
  console.log(JSON.stringify(lastEvents.json, null, 2)?.slice(0, 1500));
  const lastCount = lastEvents.json?.results?.length ?? 0;
  verdict("최근 경기 결과", lastCount > 0, `${lastCount}건 반환`);

  // 4. 다음 경기 일정
  section("4. 다음 경기 일정 (eventsnext.php)");
  const nextEvents = await getJSON(`${BASE}/eventsnext.php?id=${team.idTeam}`);
  console.log("status:", nextEvents.status);
  console.log(JSON.stringify(nextEvents.json, null, 2)?.slice(0, 1500));
  const nextCount = nextEvents.json?.events?.length ?? 0;
  verdict("다음 경기 일정", nextCount > 0, `${nextCount}건 반환`);

  // 5. 리그 순위표 (여러 시즌 포맷 시도)
  section("5. 리그 순위표 (lookuptable.php)");
  let tableFound = false;
  for (const season of ["2026", "2025-2026", "2025"]) {
    const table = await getJSON(
      `${BASE}/lookuptable.php?l=${team.idLeague}&s=${season}`
    );
    const rows = table.json?.table?.length ?? 0;
    console.log(`season=${season} → status=${table.status}, rows=${rows}`);
    if (rows > 0) {
      console.log(JSON.stringify(table.json.table.slice(0, 3), null, 2));
      verdict("리그 순위표", true, `season=${season}에서 ${rows}행 반환`);
      tableFound = true;
      break;
    }
  }
  if (!tableFound) {
    verdict("리그 순위표", false, "시도한 시즌 포맷 전부 빈 결과 (무료 티어 제한 가능성)");
  }

  printSummary();
}

function printSummary() {
  section("최종 요약");
  for (const v of verdicts) {
    console.log(`${v.passed ? "✅" : "❌"} ${v.label} — ${v.detail}`);
  }
  const allPassed = verdicts.every((v) => v.passed);
  console.log(
    `\n${allPassed ? "전부 통과: 실 API 연동 검토 가능" : "일부 실패: mock 유지 또는 대체 소스 필요"}`
  );
}

main();
