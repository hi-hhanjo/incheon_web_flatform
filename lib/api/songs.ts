import songsData from "@/data/songs.json";

// 데이터 구조 — PRD.md 6장 / 기능명세서 '공통 데이터 규칙' 그대로 (필드명 임의 변경 금지)
export type VideoType = "official" | "live";

export interface Video {
  type: VideoType;
  label: string;
  youtubeId: string;
}

// 가사를 가져온 곳(PRD 9장 저작권 — "가사는 출처를 함께 표기"). 영상 출처가 아니라 가사 출처다.
// scraper/chants/merge.py가 크롤 시점에 채운다.
export interface SongSource {
  name: string;
  url: string;
}

export interface Song {
  id: number;
  title: string;
  videos: Video[];
  lyrics: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  // 선택 필드 — 크롤 이전에 손으로 등록한 곡(id 1·3)은 출처가 없어 표기하지 않는다.
  source?: SongSource;
}

// 분류 값 — scraper/classify_chants.py가 구단 공식 선수단 명단을 보고 채운다(사람이 손대지 않음).
// 화면이 문자열을 직접 들고 있지 않도록 여기서 한 번만 정의한다.
export const PLAYER_CATEGORY = "선수 응원가";
// 팀을 떠난 선수의 응원가 = 지금 경기장에서 불리지 않는 곡. F-01 목록에서 배지 표시 + 맨 아래로.
export const UNUSED_TAG = "미사용";

// TECHSTACK.md 2.3.1 — 화면은 이 함수들을 통해서만 데이터에 접근한다.
// 런타임 저장소는 data/songs.json(읽기 전용). Vercel 서버리스에서 그대로 번들·조회된다.
const songs = songsData as Song[];

export async function getSongs(): Promise<Song[]> {
  return songs;
}

export async function getSongById(id: number): Promise<Song | undefined> {
  return songs.find((song) => song.id === id);
}
