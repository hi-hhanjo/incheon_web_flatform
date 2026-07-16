import { getDb } from "@/lib/db";

// 데이터 구조 — PRD.md 6장 / 기능명세서 '공통 데이터 규칙' 그대로 (필드명 임의 변경 금지)
export type VideoType = "official" | "live";

export interface Video {
  type: VideoType;
  label: string;
  youtubeId: string;
}

export interface Song {
  id: number;
  title: string;
  videos: Video[];
  lyrics: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
}

interface SongRow {
  id: number;
  title: string;
  lyrics: string;
  category: string;
  tags: string;
  is_favorite: number;
}

interface VideoRow {
  song_id: number;
  type: VideoType;
  label: string;
  youtube_id: string;
}

function toSong(row: SongRow, videoRows: VideoRow[]): Song {
  return {
    id: row.id,
    title: row.title,
    lyrics: row.lyrics,
    category: row.category,
    tags: JSON.parse(row.tags) as string[],
    isFavorite: row.is_favorite === 1,
    videos: videoRows
      .filter((video) => video.song_id === row.id)
      .map((video) => ({ type: video.type, label: video.label, youtubeId: video.youtube_id })),
  };
}

// TECHSTACK.md 2.3.1 — 화면은 이 함수들을 통해서만 데이터에 접근한다 (직접 DB 접근 금지).
export async function getSongs(): Promise<Song[]> {
  const db = getDb();
  const songRows = db.prepare("SELECT * FROM songs").all() as unknown as SongRow[];
  const videoRows = db.prepare("SELECT * FROM videos ORDER BY sort_order ASC").all() as unknown as VideoRow[];
  return songRows.map((row) => toSong(row, videoRows));
}

export async function getSongById(id: number): Promise<Song | undefined> {
  const db = getDb();
  const row = db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as unknown as SongRow | undefined;
  if (!row) return undefined;

  const videoRows = db
    .prepare("SELECT * FROM videos WHERE song_id = ? ORDER BY sort_order ASC")
    .all(id) as unknown as VideoRow[];
  return toSong(row, videoRows);
}
