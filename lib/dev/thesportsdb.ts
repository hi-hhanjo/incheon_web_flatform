// scripts/thesportsdb-test.mjs와 동일한 검증 로직을 서버에서 실행해 브라우저로 볼 수 있게 한 버전.
// lib/api/matches.ts 등 기존 mock API와는 완전히 분리된 진단 전용 코드다.
const API_KEY = "123"; // TheSportsDB 공개 무료 테스트 키
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

async function getJSON(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      // JSON 파싱 실패 시 raw 텍스트만 보존
    }
    return { status: res.status, ok: res.ok, json, raw: text.slice(0, 500) };
  } catch (err) {
    return { status: null, ok: false, json: null, error: String(err) };
  }
}

export type Verdict = "pass" | "partial" | "fail";

export interface TestResult {
  id: string;
  title: string;
  endpoint: string;
  verdict: Verdict;
  finding: string;
  raw: string;
}

export interface ThesportsdbCheck {
  checkedAt: string;
  team?: { idTeam: string; idLeague: string; strLeague: string; strTeam: string };
  results: TestResult[];
}

interface Team {
  idTeam: string;
  idLeague: string;
  strLeague: string;
  strTeam: string;
  strSport: string;
}

interface EventItem {
  dateEvent?: string;
  strEvent?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
}

interface StandingRow {
  strTeam: string;
  intRank: string;
  intPlayed: string;
  intWin: string;
  intDraw: string;
  intLoss: string;
  intPoints: string;
}

export async function runThesportsdbCheck(): Promise<ThesportsdbCheck> {
  const results: TestResult[] = [];

  // 1. 팀 검색
  const teamSearch = await getJSON(`${BASE}/searchteams.php?t=Incheon`);
  const teams = (teamSearch.json as { teams?: Team[] } | null)?.teams ?? [];
  const candidates = teams.filter((t) => t.strSport === "Soccer");
  const team = candidates.find((t) => t.strTeam?.includes("Incheon"));

  results.push({
    id: "search-team",
    title: "1. 팀 검색",
    endpoint: "GET /searchteams.php?t=Incheon",
    verdict: team ? "pass" : "fail",
    finding: team
      ? `${team.strTeam} 조회 성공 (idTeam=${team.idTeam}, idLeague=${team.idLeague})`
      : "인천 유나이티드를 찾지 못함",
    raw: JSON.stringify(teamSearch.json, null, 2).slice(0, 1200),
  });

  if (!team) {
    return { checkedAt: new Date().toISOString(), results };
  }

  // 2. 리그 전체 팀 목록
  const leagueTeams = await getJSON(
    `${BASE}/search_all_teams.php?l=${encodeURIComponent(team.strLeague ?? "")}`
  );
  const teamNames =
    (leagueTeams.json as { teams?: Team[] } | null)?.teams?.map((t) => t.strTeam) ?? [];
  results.push({
    id: "league-teams",
    title: "2. 리그 전체 팀 목록",
    endpoint: `GET /search_all_teams.php?l=${team.strLeague}`,
    verdict: teamNames.length >= 12 ? "pass" : teamNames.length > 0 ? "partial" : "fail",
    finding: `${teamNames.length}개 팀 반환 (K리그1 실제 12개 구단)`,
    raw: teamNames.join(", "),
  });

  // 3. 최근 경기 결과
  const lastEvents = await getJSON(`${BASE}/eventslast.php?id=${team.idTeam}`);
  const lastCount = (lastEvents.json as { results?: EventItem[] } | null)?.results?.length ?? 0;
  results.push({
    id: "last-events",
    title: "3. 최근 경기 결과",
    endpoint: `GET /eventslast.php?id=${team.idTeam}`,
    verdict: lastCount >= 5 ? "pass" : "fail",
    finding: `${lastCount}건 반환 ("최근 5경기" 요구사항 대비)`,
    raw: JSON.stringify(lastEvents.json, null, 2).slice(0, 1200),
  });

  // 4. 다음 경기 일정
  const nextEvents = await getJSON(`${BASE}/eventsnext.php?id=${team.idTeam}`);
  const nextCount = (nextEvents.json as { events?: EventItem[] } | null)?.events?.length ?? 0;
  results.push({
    id: "next-events",
    title: "4. 다음 경기 일정",
    endpoint: `GET /eventsnext.php?id=${team.idTeam}`,
    verdict: nextCount > 0 ? "pass" : "fail",
    finding: `${nextCount}건 반환`,
    raw: JSON.stringify(nextEvents.json, null, 2).slice(0, 1200),
  });

  // 5. 리그 순위표 (여러 시즌 포맷 시도)
  let tableRows: StandingRow[] = [];
  let tableSeasonUsed = "2026";
  for (const season of ["2026", "2025-2026", "2025"]) {
    const table = await getJSON(`${BASE}/lookuptable.php?l=${team.idLeague}&s=${season}`);
    const rows = (table.json as { table?: StandingRow[] } | null)?.table ?? [];
    if (rows.length > 0) {
      tableRows = rows;
      tableSeasonUsed = season;
      break;
    }
  }
  results.push({
    id: "standings",
    title: "5. 리그 순위표",
    endpoint: `GET /lookuptable.php?l=${team.idLeague}&s=${tableSeasonUsed}`,
    verdict: tableRows.length >= 12 ? "pass" : tableRows.length > 0 ? "partial" : "fail",
    finding: `${tableRows.length}개 팀 순위 반환 (K리그1 실제 12개 구단)`,
    raw:
      tableRows
        .map((r) => `${r.intRank}위 ${r.strTeam} (${r.intWin}승 ${r.intDraw}무 ${r.intLoss}패, ${r.intPoints}점)`)
        .join("\n") || "빈 결과",
  });

  // 6. 시즌 전체 경기 수 (요청 제한 vs 데이터 누락 구분용 대조 체크)
  const seasonEvents = await getJSON(`${BASE}/eventsseason.php?id=${team.idLeague}&s=2026`);
  const allEvents = (seasonEvents.json as { events?: EventItem[] } | null)?.events ?? [];
  const incheonEvents = allEvents.filter(
    (e) => e.strHomeTeam?.includes("Incheon") || e.strAwayTeam?.includes("Incheon")
  );
  results.push({
    id: "season-events",
    title: "6. 시즌 전체 경기 수 (대조용)",
    endpoint: `GET /eventsseason.php?id=${team.idLeague}&s=2026`,
    verdict: allEvents.length >= 100 ? "pass" : "fail",
    finding: `시즌 전체 ${allEvents.length}경기 중 인천 관련 ${incheonEvents.length}건 (예상 130+경기)`,
    raw:
      incheonEvents
        .map((e) => `${e.dateEvent} ${e.strEvent} (${e.intHomeScore ?? "-"}:${e.intAwayScore ?? "-"})`)
        .join("\n") || "인천 관련 경기 없음",
  });

  return { checkedAt: new Date().toISOString(), team, results };
}
