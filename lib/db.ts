import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// docs/data/ERD_SPEC.md 기준 스키마. tags는 Postgres text[] 대신 JSON 문자열로 저장한다(SQLite에 배열 타입이 없음).
const SCHEMA = `
CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  lyrics TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '팀 응원가',
  tags TEXT NOT NULL DEFAULT '[]',
  is_favorite INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('official', 'live')),
  label TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- docs/data/CLUB_ERD_SPEC.md 기준. 순위표·경기·상대 스카우팅은 실시간 API가 아니라
-- 주간 검수 스냅샷이므로 updated_at으로 갱신 시점을 남긴다.
CREATE TABLE IF NOT EXISTS standings (
  team TEXT PRIMARY KEY,
  rank INTEGER NOT NULL,
  played INTEGER NOT NULL,
  win INTEGER NOT NULL,
  draw INTEGER NOT NULL,
  lose INTEGER NOT NULL,
  goals_for INTEGER NOT NULL,
  goals_against INTEGER NOT NULL,
  points INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

-- 순위표 수집일별 스냅샷 이력. data/standings-history/*.json에서 적재하며 삭제 없이 누적한다.
-- 현재 순위표(standings)는 최신 스냅샷이고, 이 테이블은 과거 스냅샷까지 보존한다.
CREATE TABLE IF NOT EXISTS standings_history (
  snapshot_date TEXT NOT NULL,
  team TEXT NOT NULL,
  rank INTEGER NOT NULL,
  played INTEGER NOT NULL,
  win INTEGER NOT NULL,
  draw INTEGER NOT NULL,
  lose INTEGER NOT NULL,
  goals_for INTEGER NOT NULL,
  goals_against INTEGER NOT NULL,
  points INTEGER NOT NULL,
  PRIMARY KEY (snapshot_date, team)
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  round TEXT NOT NULL,
  kickoff_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('finished', 'upcoming')),
  opponent TEXT NOT NULL,
  is_home INTEGER NOT NULL,
  score_incheon INTEGER,
  score_opponent INTEGER,
  venue TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opponent_scouting (
  opponent TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opponent_recent_form (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opponent TEXT NOT NULL REFERENCES opponent_scouting(opponent) ON DELETE CASCADE,
  date TEXT NOT NULL,
  opponent_faced TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('W', 'D', 'L')),
  score TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opponent_key_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opponent TEXT NOT NULL REFERENCES opponent_scouting(opponent) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opponent_injuries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opponent TEXT NOT NULL REFERENCES opponent_scouting(opponent) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  expected_return TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opponent_probable_lineup (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opponent TEXT NOT NULL REFERENCES opponent_scouting(opponent) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);
`;

let db: DatabaseSync | undefined;

export function getDb(): DatabaseSync {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  return db;
}
