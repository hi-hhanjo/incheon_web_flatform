import { supabase } from "../supabase";

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
  rankChange: number | null;
}

export async function getStandings(): Promise<TeamStanding[]> {
  const { data, error } = await supabase
    .from("standings")
    .select("*")
    .order("rank", { ascending: true });

  if (error) {
    console.error("Error fetching standings:", error);
    return [];
  }

  return (data || []).map(row => ({
    rank: row.rank,
    team: row.team,
    played: row.played,
    win: row.win,
    draw: row.draw,
    lose: row.lose,
    goalsFor: row.goals_for,
    goalsAgainst: row.goals_against,
    points: row.points,
    rankChange: row.rank_change ?? null
  }));
}

export async function getStandingsUpdatedAt(): Promise<string | null> {
  const { data, error } = await supabase
    .from("standings")
    .select("updated_at")
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.updated_at;
}
