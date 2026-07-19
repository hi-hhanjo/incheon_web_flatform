import headToHeadData from "@/data/head-to-head.json";
import headToHeadMeta from "@/data/head-to-head-meta.json";

export interface HeadToHeadMatch {
  date: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

// 런타임 저장소는 크롤러가 만든 data/head-to-head.json(상대팀명 → 경기 목록, 최신순). 읽기 전용.
// 2026-07-17 API-Football 실시간 조회에서 전환했다 — 이 파일만 유일하게 매 요청 외부 API를
// 호출해 API 키가 없으면 화면이 조용히 비었고, 팀명 매핑이 크롤러와 중복됐다. 두 소스의 스코어가
// 일치함을 확인하고 다음 스포츠 크롤로 일원화했다(CRAWLER_SPEC.md 3.6).
const headToHead = headToHeadData as Record<string, HeadToHeadMatch[]>;

// 저장은 시즌 전체, 화면은 최근 5경기만 표시한다(opponentScouting의 RECENT_FORM_COUNT와 동일 패턴).
const HEAD_TO_HEAD_COUNT = 5;

// 인천 유나이티드와 opponentKoreanName(예: "전북 현대모터스")의 최근 상대전적.
// 맞붙은 적이 없는 상대면 빈 배열(화면이 "가져오지 못했습니다"로 처리).
export async function getHeadToHead(
  opponentKoreanName: string,
  count = HEAD_TO_HEAD_COUNT
): Promise<HeadToHeadMatch[]> {
  return (headToHead[opponentKoreanName] ?? []).slice(0, count);
}

// 상대전적이 크롤·수집된 날(스냅샷 기준일). 순위표·경기와 동일한 "○○ 기준" 배지에 쓴다.
export async function getHeadToHeadUpdatedAt(): Promise<string | null> {
  return (headToHeadMeta as { updatedAt: string | null }).updatedAt ?? null;
}
