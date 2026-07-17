import type { SongSource } from "./songs";

// 구단 정보(F-16~F-18) 데이터를 어디서 수집하는지 — 화면 하단 SourceNote 표기에 쓴다.
// 화면이 "다음 스포츠" 같은 문자열을 직접 들고 있지 않도록 데이터 계층에서 한 번만 정의한다.
// 응원가의 곡별 출처(Song.source)와 달리 구단 데이터는 데이터셋 단위로 출처가 고정이라 상수다.

// 순위표 · 인천 경기 일정/결과 · 상대 최근 폼 · 상대전적 — 구단 데이터 전부의 수집처.
// 크롤러가 실제로 호출하는 공개 API(scraper/kleague/client.py)의 사람이 볼 수 있는 페이지.
//
// 2026-07-17 상대전적이 API-Football 실시간 조회에서 이 크롤로 넘어오면서, 구단 데이터의 출처가
// 여기 하나로 통일됐다(CRAWLER_SPEC.md 3.6). 다른 소스가 다시 생기면 상수를 추가할 것.
export const DAUM_SPORTS: SongSource = {
  name: "다음 스포츠",
  url: "https://sports.daum.net/record/kl",
};
