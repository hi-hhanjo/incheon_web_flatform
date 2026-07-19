import scoutingRawData from "@/data/opponent-scouting.json";
import opponentForms from "@/data/opponent-forms.json";
import opponentFormsMeta from "@/data/opponent-forms-meta.json";

export interface RecentFormEntry {
  date: string;
  round: string;
  opponentFaced: string;
  isHome: boolean;
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
  recentForm: RecentFormEntry[]; // 실데이터(크롤).
  keyPlayers: KeyPlayer[];       // 실데이터(다음 스포츠).
  injuries: InjuryReport[];      // 실데이터(Transfermarkt).
  probableLineup: string[];
}

// 팀별 시즌 전체 폼(최신순)을 미리 크롤해 둔 data/opponent-forms.json에서 상대명으로 조회한다.
const forms = opponentForms as Record<string, RecentFormEntry[]>;
const RECENT_FORM_COUNT = 5; // 저장은 시즌 전체, 화면은 최근 5경기만 표시한다.
// 주요 선수·부상 정보는 export_scouting.py에서 수집한 실데이터 (팀명 키 기반).
const scoutingData = scoutingRawData as Record<string, Pick<OpponentScouting, "keyPlayers" | "injuries" | "probableLineup">>;

// 상대 최근 폼이 크롤·수집된 날(스냅샷 기준일). 순위표·경기와 동일한 "○○ 기준" 배지에 쓴다.
export async function getOpponentFormsUpdatedAt(): Promise<string | null> {
  return (opponentFormsMeta as { updatedAt: string | null }).updatedAt ?? null;
}

// 다가오는 상대(opponentName)의 스카우팅 정보. 모두 실데이터 기반.
export async function getUpcomingOpponentScouting(
  opponentName: string
): Promise<OpponentScouting> {
  const teamData = scoutingData[opponentName] ?? { keyPlayers: [], injuries: [], probableLineup: [] };
  
  return {
    opponent: opponentName,
    recentForm: (forms[opponentName] ?? []).slice(0, RECENT_FORM_COUNT),
    keyPlayers: teamData.keyPlayers,
    injuries: teamData.injuries,
    probableLineup: teamData.probableLineup,
  };
}

// 인천 유나이티드의 스카우팅 정보 (우리팀 정보).
export async function getIncheonScouting(): Promise<Pick<OpponentScouting, "keyPlayers" | "injuries">> {
  const teamData = scoutingData["인천 유나이티드"] ?? { keyPlayers: [], injuries: [] };
  return {
    keyPlayers: teamData.keyPlayers,
    injuries: teamData.injuries,
  };
}
