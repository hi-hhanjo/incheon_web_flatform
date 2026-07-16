import songsData from "@/data/songs.json";

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

// TECHSTACK.md 2.3.1 — 화면은 이 함수들을 통해서만 데이터에 접근한다.
// 런타임 저장소는 data/songs.json(읽기 전용). Vercel 서버리스에서 그대로 번들·조회된다.
const songs = songsData as Song[];

export async function getSongs(): Promise<Song[]> {
  return songs;
}

export async function getSongById(id: number): Promise<Song | undefined> {
  return songs.find((song) => song.id === id);
}
