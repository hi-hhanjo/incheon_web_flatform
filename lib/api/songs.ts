import songsData from "@/data/songs.json";
import type { Song } from "./songs.schema";

// 타입·상수는 songs.schema.ts에 있다(그 파일 주석 참고 — 클라이언트 번들 오염 방지).
// 화면에서 타입만 필요하면 songs.schema에서 가져올 것. 여기서 다시 내보내면 `import type`이 아닌
// 경로로 새어 들어갈 수 있어 재수출하지 않는다.

// TECHSTACK.md 2.3.1 — 화면은 이 함수들을 통해서만 데이터에 접근한다.
// 런타임 저장소는 data/songs.json(읽기 전용). Vercel 서버리스에서 그대로 번들·조회된다.
const songs = songsData as Song[];

export async function getSongs(): Promise<Song[]> {
  return songs;
}

export async function getSongById(id: number): Promise<Song | undefined> {
  return songs.find((song) => song.id === id);
}
