// F-11 검색의 **순수 로직**. 화면 부품이 문자열을 직접 자르거나 비교하지 않도록 여기 모은다.
//
// **이 파일은 data/*.json을 import하지 않는다** — songs.schema.ts와 같은 이유다(TECHSTACK.md 2.3.2).
// SongList가 클라이언트 컴포넌트라, 데이터를 읽는 모듈에 기대면 가사 전체가 JS 번들로 딸려 온다.
// 여기서는 넘겨받은 값만 다룬다.

import type { Song } from "./api/songs.schema";

// 가사 한 줄을 검색어 기준으로 쪼갠 조각. matched가 true면 화면에서 강조할 부분이다.
// (어디를 강조할지는 여기서 정하고, 어떻게 그릴지는 LyricsSnippet이 정한다)
export interface Segment {
  text: string;
  matched: boolean;
}

// 검색어 다듬기 — 앞뒤 공백을 버리고 소문자로 맞춘다.
// 소문자로 맞추는 이유는 영어 제목을 소문자로 쳐도 찾히게 하기 위함이다("bandiera" → "Bandiera").
// 공백만 친 경우는 빈 문자열이 되어, 부르는 쪽에서 '검색하지 않음'으로 다뤄진다(FUNCTION.md F-11).
export function normalizeKeyword(query: string): string {
  return query.trim().toLowerCase();
}

// 제목 또는 가사에 검색어가 들어 있으면 남긴다.
// 제목만 뒤지지 않는 이유는 팬이 제목을 모른 채 가사 한 소절만 기억하는 경우가 흔해서다(PRD F-11).
export function matchesSong(song: Song, keyword: string): boolean {
  return (
    song.title.toLowerCase().includes(keyword) ||
    song.lyrics.toLowerCase().includes(keyword)
  );
}

// 가사에서 검색어가 든 **첫 줄**을 찾아 강조 조각으로 쪼갠다. 걸린 줄이 없으면 null.
//
// 왜 첫 줄만인가: 응원가 가사는 같은 소절이 반복되는 구조라(예: '나의사랑 인천FC'가 8번),
// 걸린 줄을 전부 보여주면 거의 같은 줄이 쌓이기만 한다. "이 곡이 맞나" 확인엔 한 줄로 충분하다
// (FUNCTION.md v1.5 F-11).
export function findLyricLine(lyrics: string, keyword: string): Segment[] | null {
  // 검색어가 비면 강조할 것도 없다 — 아래 반복문이 끝나지 않는 것도 막는다(indexOf("")는 항상 성공).
  if (!keyword) return null;

  const line = lyrics
    .split("\n")
    .find((candidate) => candidate.toLowerCase().includes(keyword));

  return line ? splitByKeyword(line, keyword) : null;
}

// 한 줄을 '검색어 밖 / 검색어' 조각으로 번갈아 쪼갠다. 한 줄에 검색어가 여러 번 나오면 전부 쪼갠다.
// 비교는 소문자로 하되, 조각의 글자는 **원문에서** 잘라낸다 — 화면에는 원래 대소문자로 보여야 한다.
function splitByKeyword(line: string, keyword: string): Segment[] {
  const haystack = line.toLowerCase();
  const segments: Segment[] = [];
  let cursor = 0;

  for (
    let hit = haystack.indexOf(keyword);
    hit !== -1;
    hit = haystack.indexOf(keyword, cursor)
  ) {
    if (hit > cursor) {
      segments.push({ text: line.slice(cursor, hit), matched: false });
    }
    segments.push({ text: line.slice(hit, hit + keyword.length), matched: true });
    cursor = hit + keyword.length;
  }

  if (cursor < line.length) {
    segments.push({ text: line.slice(cursor), matched: false });
  }

  return segments;
}
