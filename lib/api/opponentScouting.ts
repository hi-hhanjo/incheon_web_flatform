import scoutingData from "@/data/opponent-scouting.json";

export interface RecentFormEntry {
  date: string;
  opponentFaced: string;
  result: "W" | "D" | "L";
  score: string;
}

export interface KeyPlayer {
  name: string;
  position: string;
  note: string;
}

export interface InjuryReport {
  name: string;
  status: string;
  expectedReturn: string;
}

export interface OpponentScouting {
  matchId: number;
  opponent: string;
  recentForm: RecentFormEntry[];
  keyPlayers: KeyPlayer[];
  injuries: InjuryReport[];
  probableLineup: string[];
}

const scouting = scoutingData as OpponentScouting;

export async function getUpcomingOpponentScouting(): Promise<OpponentScouting> {
  return scouting;
}
