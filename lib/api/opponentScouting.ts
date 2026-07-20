import { supabase } from "../supabase";

export interface RecentFormEntry {
  date: string;
  round: string;
  opponentFaced: string;
  isHome: boolean;
  result: "W" | "D" | "L";
  score: string;
  gameId: number;
}

export interface KeyPlayer {
  name: string;
  position: string;
  note: string;
  profileUrl?: string;
}

export interface InjuryReport {
  name: string;
  status: string;
  expectedReturn: string;
  profileUrl?: string;
}

export interface OpponentScouting {
  opponent: string;
  recentForm: RecentFormEntry[];
  keyPlayers: KeyPlayer[];
  injuries: InjuryReport[];
  probableLineup: string[];
}

const RECENT_FORM_COUNT = 5;

export async function getOpponentFormsUpdatedAt(): Promise<string | null> {
  const { data, error } = await supabase
    .from("opponent_scouting")
    .select("updated_at")
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.updated_at;
}

export async function getUpcomingOpponentScouting(
  opponentName: string
): Promise<OpponentScouting> {
  const { data, error } = await supabase
    .from("opponent_scouting")
    .select(`
      opponent,
      opponent_recent_form (*),
      opponent_key_players (*),
      opponent_injuries (*),
      opponent_probable_lineup (*)
    `)
    .eq("opponent", opponentName)
    .single();

  if (error || !data) {
    return {
      opponent: opponentName,
      recentForm: [],
      keyPlayers: [],
      injuries: [],
      probableLineup: []
    };
  }

  const recentForm = (data.opponent_recent_form || [])
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, RECENT_FORM_COUNT)
    .map((f: any) => ({
      date: f.date,
      round: "", // DB 제외
      opponentFaced: f.opponent_faced,
      isHome: false, // DB 제외
      result: f.result,
      score: f.score,
      gameId: f.game_id
    }));

  const probableLineup = (data.opponent_probable_lineup || [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((l: any) => l.player_name);

  const keyPlayers = (data.opponent_key_players || []).map((kp: any) => ({
    name: kp.name,
    position: kp.position,
    note: kp.note,
    profileUrl: kp.profile_url
  }));

  const injuries = (data.opponent_injuries || []).map((inj: any) => ({
    name: inj.name,
    status: inj.status,
    expectedReturn: inj.expected_return,
    profileUrl: inj.profile_url
  }));

  return {
    opponent: opponentName,
    recentForm,
    keyPlayers,
    injuries,
    probableLineup
  };
}

export async function getIncheonScouting(): Promise<Pick<OpponentScouting, "keyPlayers" | "injuries">> {
  const { data, error } = await supabase
    .from("opponent_scouting")
    .select(`
      opponent_key_players (*),
      opponent_injuries (*)
    `)
    .eq("opponent", "인천 유나이티드")
    .single();

  if (error || !data) {
    return { keyPlayers: [], injuries: [] };
  }

  const keyPlayers = (data.opponent_key_players || []).map((kp: any) => ({
    name: kp.name,
    position: kp.position,
    note: kp.note,
    profileUrl: kp.profile_url
  }));

  const injuries = (data.opponent_injuries || []).map((inj: any) => ({
    name: inj.name,
    status: inj.status,
    expectedReturn: inj.expected_return,
    profileUrl: inj.profile_url
  }));

  return {
    keyPlayers,
    injuries
  };
}
