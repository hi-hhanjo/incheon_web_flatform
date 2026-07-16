import matchesData from "@/data/matches.json";
import matchesMeta from "@/data/matches-meta.json";

// 구단 정보 확장(경기 결과/일정) 데이터 구조.
export type MatchStatus = "finished" | "upcoming";

export interface MatchScore {
  incheon: number;
  opponent: number;
}

export interface Match {
  id: number;
  round: string;
  kickoffAt: string;
  status: MatchStatus;
  opponent: string;
  isHome: boolean;
  score: MatchScore | null;
  venue: string;
}

// 런타임 저장소는 크롤러가 만든 data/matches.json(다음 스포츠, 인천 경기 전체). 읽기 전용.
const matches = matchesData as Match[];

// 최근 종료된 경기를 최신순으로 count개 반환한다. count=1이면 "지난 경기 결과"로 그대로 쓸 수 있다.
export async function getRecentMatches(count = 5): Promise<Match[]> {
  return matches
    .filter((match) => match.status === "finished")
    .sort((a, b) => b.kickoffAt.localeCompare(a.kickoffAt))
    .slice(0, count);
}

// 다가오는 매치 중 가장 가까운 경기. 크롤된 일정(다음 스포츠) 기준.
export async function getUpcomingMatch(): Promise<Match | undefined> {
  return matches
    .filter((match) => match.status === "upcoming")
    .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))[0];
}

// 경기 데이터가 크롤·수집된 날(스냅샷 기준일). data/matches-meta.json에 기록된다.
export async function getMatchesUpdatedAt(): Promise<string | null> {
  return (matchesMeta as { updatedAt: string | null }).updatedAt ?? null;
}
