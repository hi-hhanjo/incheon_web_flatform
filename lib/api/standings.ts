import standingsData from "@/data/standings.json";
import standingsMeta from "@/data/standings-meta.json";

export interface TeamStanding {
  rank: number;
  team: string;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  // 직전 수집일 대비 순위 변동. 양수=상승, 음수=하락, 0=유지, null=비교 불가(신규/이력 없음).
  rankChange: number | null;
}

// 런타임 저장소는 크롤러가 만든 data/standings.json(읽기 전용, 순수 스냅샷).
// rank 오름차순은 크롤러가 이미 보장. 순위 변동은 파생값이라 meta에 따로 있다.
const standings = standingsData as Omit<TeamStanding, "rankChange">[];
const meta = standingsMeta as {
  updatedAt: string | null;
  rankChange?: Record<string, number | null>;
};

export async function getStandings(): Promise<TeamStanding[]> {
  return standings.map((row) => ({
    ...row,
    rankChange: meta.rankChange?.[row.team] ?? null,
  }));
}

// 순위표가 크롤링·수집된 날(스냅샷 기준일). data/standings-meta.json에 기록된다.
// 값이 없으면 null(화면은 이때 "예시 데이터"로 폴백).
export async function getStandingsUpdatedAt(): Promise<string | null> {
  return meta.updatedAt ?? null;
}
