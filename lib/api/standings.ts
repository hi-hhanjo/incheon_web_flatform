import { getDb } from "@/lib/db";

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

interface StandingRow {
  team: string;
  rank: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

export async function getStandings(): Promise<TeamStanding[]> {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM standings ORDER BY rank ASC").all() as unknown as StandingRow[];
  return rows.map((row) => ({
    rank: row.rank,
    team: row.team,
    played: row.played,
    win: row.win,
    draw: row.draw,
    lose: row.lose,
    goalsFor: row.goals_for,
    goalsAgainst: row.goals_against,
    points: row.points,
  }));
}

// 순위표가 크롤링·검수 반영된 시점(스냅샷 기준일). 모든 행이 같은 값을 가지므로 한 행만 읽는다.
// 데이터가 없으면 null(화면은 이때 "예시 데이터"로 폴백).
export async function getStandingsUpdatedAt(): Promise<string | null> {
  const db = getDb();
  const row = db.prepare("SELECT updated_at FROM standings LIMIT 1").get() as
    | { updated_at: string }
    | undefined;
  return row?.updated_at ?? null;
}
