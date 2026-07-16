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
}

// 런타임 저장소는 크롤러가 만든 data/standings.json(읽기 전용). rank 오름차순은 크롤러가 이미 보장.
const standings = standingsData as TeamStanding[];

export async function getStandings(): Promise<TeamStanding[]> {
  return standings;
}

// 순위표가 크롤링·수집된 날(스냅샷 기준일). data/standings-meta.json에 기록된다.
// 값이 없으면 null(화면은 이때 "예시 데이터"로 폴백).
export async function getStandingsUpdatedAt(): Promise<string | null> {
  return (standingsMeta as { updatedAt: string | null }).updatedAt ?? null;
}
