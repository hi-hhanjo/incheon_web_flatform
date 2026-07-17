import scoutingMock from "@/data/opponent-scouting.json";
import opponentForms from "@/data/opponent-forms.json";
import opponentFormsMeta from "@/data/opponent-forms-meta.json";

export interface RecentFormEntry {
  date: string;
  opponentFaced: string;
  result: "W" | "D" | "L";
  score: string;
}

export interface KeyPlayer {
  name: string;
  position: string;
  note: string;
}

export interface InjuryReport {
  name: string;
  status: string;
  expectedReturn: string;
}

export interface OpponentScouting {
  opponent: string;
  recentForm: RecentFormEntry[]; // 실데이터(크롤). 나머지 3개는 선수 개인정보 리스크로 mock 유지(PRD F-18).
  keyPlayers: KeyPlayer[];
  injuries: InjuryReport[];
  probableLineup: string[];
}

// 팀별 시즌 전체 폼(최신순)을 미리 크롤해 둔 data/opponent-forms.json에서 상대명으로 조회한다.
const forms = opponentForms as Record<string, RecentFormEntry[]>;
const RECENT_FORM_COUNT = 5; // 저장은 시즌 전체, 화면은 최근 5경기만 표시한다.
// 주요 선수·부상·예상 라인업은 실존 선수 개인정보(오정보) 리스크로 익명 mock을 유지한다.
const mock = scoutingMock as Pick<OpponentScouting, "keyPlayers" | "injuries" | "probableLineup">;

// 상대 최근 폼이 크롤·수집된 날(스냅샷 기준일). 순위표·경기와 동일한 "○○ 기준" 배지에 쓴다.
export async function getOpponentFormsUpdatedAt(): Promise<string | null> {
  return (opponentFormsMeta as { updatedAt: string | null }).updatedAt ?? null;
}

// 다가오는 상대(opponentName)의 스카우팅 정보. recentForm은 실데이터, 나머지는 mock.
export async function getUpcomingOpponentScouting(
  opponentName: string
): Promise<OpponentScouting> {
  return {
    opponent: opponentName,
    recentForm: (forms[opponentName] ?? []).slice(0, RECENT_FORM_COUNT),
    keyPlayers: mock.keyPlayers,
    injuries: mock.injuries,
    probableLineup: mock.probableLineup,
  };
}
