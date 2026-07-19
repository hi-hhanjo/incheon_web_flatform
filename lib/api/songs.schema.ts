// 응원가 데이터의 **계약**(타입 + 데이터 값 상수). PRD.md 6장 / FUNCTION.md '공통 데이터 규칙' /
// API_SPEC.md 2장과 같은 내용이며 필드명을 임의로 바꾸지 않는다.
//
// **이 파일은 data/*.json을 import하지 않는다 — 그게 존재 이유다.**
// 화면 부품(SongCard·SongList)은 클라이언트 컴포넌트인데 `UNUSED_TAG` 같은 '값'이 필요하다.
// 그 값이 songs.ts(맨 윗줄에서 songs.json을 import함)에 있으면, 값 하나 때문에 모듈 전체가
// 클라이언트 번들로 끌려와 **가사 전체(약 20KB)가 JS 번들에 중복 포함된다** — 이미 RSC 페이로드로
// 내려간 데이터를 한 번 더 보내는 셈이다. 그래서 데이터를 읽는 코드(songs.ts)와 계약(이 파일)을
// 분리한다. 타입만 쓰는 곳은 `import type`이라 컴파일 시 지워지므로 원래 안전하다.

export type VideoType = "official" | "live";

export interface Video {
  type: VideoType;
  label: string;
  youtubeId: string;
}

// 데이터를 어디서 가져왔는지 — {이름, 원문 URL}. 화면 하단 SourceNote로 표기한다(PRD 9장).
// 응원가는 곡마다 다르고(Song.source), 구단 데이터는 데이터셋 단위로 고정이다(sources.ts).
export interface DataSource {
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
  // 가사 출처. 선택 필드 — 손으로 곡을 추가하면 출처가 없을 수 있다(API_SPEC.md 2장).
  source?: DataSource;
}

// 분류 값 — scraper/classify_chants.py가 구단 공식 선수단 명단을 보고 채운다(사람이 손대지 않음).
// 화면이 문자열을 직접 들고 있지 않도록 여기서 한 번만 정의한다.
export const PLAYER_CATEGORY = "선수 응원가";
// 팀을 떠난 선수의 응원가 = 지금 경기장에서 불리지 않는 곡. F-01 목록에서 배지 표시 + 맨 아래로.
export const UNUSED_TAG = "미사용";
