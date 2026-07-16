// data/songs.json(mock)을 SQLite DB로 옮겨 담는 1회성 시드 스크립트.
// 실행: node scripts/seed-db.mjs
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
const db = new DatabaseSync(dbPath);

db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
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
`);

const seededAt = new Date().toISOString();

const songs = JSON.parse(readFileSync(path.join(process.cwd(), "data", "songs.json"), "utf-8"));

const insertSong = db.prepare(
  `INSERT OR REPLACE INTO songs (id, title, lyrics, category, tags, is_favorite) VALUES (?, ?, ?, ?, ?, ?)`
);
const deleteVideos = db.prepare(`DELETE FROM videos WHERE song_id = ?`);
const insertVideo = db.prepare(
  `INSERT INTO videos (song_id, type, label, youtube_id, sort_order) VALUES (?, ?, ?, ?, ?)`
);

for (const song of songs) {
  insertSong.run(
    song.id,
    song.title,
    song.lyrics ?? "",
    song.category ?? "팀 응원가",
    JSON.stringify(song.tags ?? []),
    song.isFavorite ? 1 : 0
  );

  deleteVideos.run(song.id);
  song.videos?.forEach((video, index) => {
    insertVideo.run(song.id, video.type, video.label, video.youtubeId, index);
  });
}

// standings — 순위표는 항상 리그 전체 스냅샷이므로 전체 삭제 후 재삽입한다.
const standings = JSON.parse(
  readFileSync(path.join(process.cwd(), "data", "standings.json"), "utf-8")
);
db.exec("DELETE FROM standings");
const insertStanding = db.prepare(
  `INSERT INTO standings (team, rank, played, win, draw, lose, goals_for, goals_against, points, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
for (const row of standings) {
  insertStanding.run(
    row.team,
    row.rank,
    row.played,
    row.win,
    row.draw,
    row.lose,
    row.goalsFor,
    row.goalsAgainst,
    row.points,
    seededAt
  );
}

// standings_history — data/standings-history/YYYY-MM-DD.json을 삭제 없이 누적 적재한다.
// 파일명(날짜)이 snapshot_date가 되고, (snapshot_date, team)로 재실행 시 덮어쓴다.
const historyDir = path.join(process.cwd(), "data", "standings-history");
const insertHistory = db.prepare(
  `INSERT OR REPLACE INTO standings_history
     (snapshot_date, team, rank, played, win, draw, lose, goals_for, goals_against, points)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
// DB는 이력 파일들의 투영이므로, 파일 기준으로 정확히 재구성한다(이력의 durable 원천은
// git에 커밋되는 data/standings-history/*.json 파일 자체다). app.db는 언제든 재빌드된다.
db.exec("DELETE FROM standings_history");
let historyDays = 0;
if (existsSync(historyDir)) {
  const files = readdirSync(historyDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const snapshotDate = file.replace(/\.json$/, "");
    const snapshot = JSON.parse(readFileSync(path.join(historyDir, file), "utf-8"));
    for (const row of snapshot) {
      insertHistory.run(
        snapshotDate,
        row.team,
        row.rank,
        row.played,
        row.win,
        row.draw,
        row.lose,
        row.goalsFor,
        row.goalsAgainst,
        row.points
      );
    }
    historyDays += 1;
  }
}

// matches
const matches = JSON.parse(readFileSync(path.join(process.cwd(), "data", "matches.json"), "utf-8"));
const insertMatch = db.prepare(
  `INSERT OR REPLACE INTO matches (id, round, kickoff_at, status, opponent, is_home, score_incheon, score_opponent, venue, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
for (const match of matches) {
  insertMatch.run(
    match.id,
    match.round,
    match.kickoffAt,
    match.status,
    match.opponent,
    match.isHome ? 1 : 0,
    match.score?.incheon ?? null,
    match.score?.opponent ?? null,
    match.venue,
    seededAt
  );
}

// opponent scouting — 부모+4개 하위 테이블. 현재는 항상 "다가오는 상대" 1건뿐이라 통째로 비우고 다시 채운다.
const scouting = JSON.parse(
  readFileSync(path.join(process.cwd(), "data", "opponent-scouting.json"), "utf-8")
);
db.exec("DELETE FROM opponent_scouting"); // ON DELETE CASCADE로 하위 테이블도 함께 비워짐
db.prepare(`INSERT INTO opponent_scouting (opponent, updated_at) VALUES (?, ?)`).run(
  scouting.opponent,
  seededAt
);

const insertRecentForm = db.prepare(
  `INSERT INTO opponent_recent_form (opponent, date, opponent_faced, result, score) VALUES (?, ?, ?, ?, ?)`
);
for (const entry of scouting.recentForm ?? []) {
  insertRecentForm.run(scouting.opponent, entry.date, entry.opponentFaced, entry.result, entry.score);
}

const insertKeyPlayer = db.prepare(
  `INSERT INTO opponent_key_players (opponent, name, position, note) VALUES (?, ?, ?, ?)`
);
for (const player of scouting.keyPlayers ?? []) {
  insertKeyPlayer.run(scouting.opponent, player.name, player.position, player.note);
}

const insertInjury = db.prepare(
  `INSERT INTO opponent_injuries (opponent, name, status, expected_return) VALUES (?, ?, ?, ?)`
);
for (const injury of scouting.injuries ?? []) {
  insertInjury.run(scouting.opponent, injury.name, injury.status, injury.expectedReturn);
}

const insertLineupPlayer = db.prepare(
  `INSERT INTO opponent_probable_lineup (opponent, player_name, sort_order) VALUES (?, ?, ?)`
);
scouting.probableLineup?.forEach((playerName, index) => {
  insertLineupPlayer.run(scouting.opponent, playerName, index);
});

console.log(`시드 완료: ${songs.length}곡, 순위표 ${standings.length}팀, 순위 이력 ${historyDays}일치, 경기 ${matches.length}건, 상대 스카우팅(${scouting.opponent}) → ${dbPath}`);
db.close();
