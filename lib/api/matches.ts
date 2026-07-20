import { supabase } from "../supabase";

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

export async function getRecentMatches(count = 5): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "finished")
    .order("kickoff_at", { ascending: false })
    .limit(count);

  if (error) {
    console.error("Error fetching recent matches:", error);
    return [];
  }
  return (data || []).map(mapToMatch);
}

export async function getUpcomingMatch(): Promise<Match | undefined> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "upcoming")
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return mapToMatch(data);
}

export async function getMatchesUpdatedAt(): Promise<string | null> {
  const { data, error } = await supabase
    .from("matches")
    .select("updated_at")
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.updated_at;
}

function mapToMatch(row: any): Match {
  return {
    id: row.id,
    round: row.round,
    kickoffAt: row.kickoff_at,
    status: row.status,
    opponent: row.opponent,
    isHome: row.is_home === 1,
    score: (row.score_incheon !== null && row.score_opponent !== null) ? {
      incheon: row.score_incheon,
      opponent: row.score_opponent
    } : null,
    venue: row.venue
  };
}
