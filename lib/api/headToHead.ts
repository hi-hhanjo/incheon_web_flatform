import { supabase } from "../supabase";

export interface HeadToHeadMatch {
  date: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

const HEAD_TO_HEAD_COUNT = 5;

export async function getHeadToHead(
  opponentKoreanName: string,
  count = HEAD_TO_HEAD_COUNT
): Promise<HeadToHeadMatch[]> {
  const { data, error } = await supabase
    .from("head_to_head")
    .select("*")
    .eq("opponent", opponentKoreanName)
    .order("date", { ascending: false })
    .limit(count);

  if (error) {
    console.error("Error fetching head to head:", error);
    return [];
  }

  return (data || []).map(row => ({
    date: row.date,
    round: "", // DB 스키마에 제외됨
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeScore: row.home_score,
    awayScore: row.away_score,
  }));
}

export async function getHeadToHeadUpdatedAt(): Promise<string | null> {
  const { data, error } = await supabase
    .from("head_to_head")
    .select("updated_at")
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.updated_at;
}
