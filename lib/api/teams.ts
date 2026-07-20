/**
 * K리그1 구단 메타데이터 — 엠블럼 URL + 다음 스포츠 팀 페이지 링크.
 *
 * 앱 전체에서 팀명(standings.json·matches.json 등의 "team"/"opponent" 값)을 키로 써서
 * 엠블럼 이미지와 외부 링크를 가져온다. 매핑은 다음 스포츠 순위 API 응답에서 추출했다.
 *
 * - 엠블럼: t1.daumcdn.net CDN의 300×300 PNG (next.config.ts remotePatterns 필요)
 * - 팀 페이지: https://sports.daum.net/team/kl/{teamId} (숫자 teamId 사용, 브라우저 확인 완료)
 */

export interface TeamMeta {
  /** 다음 스포츠의 cpTeamId (예: "K18"). 엠블럼 URL 패턴의 키. */
  cpTeamId: string;
  /** 다음 스포츠의 숫자 teamId. 팀 상세 페이지 URL에 쓴다. */
  teamId: number;
  /** 300×300 엠블럼 이미지 URL (다음 CDN). */
  emblemUrl: string;
  /** 다음 스포츠 팀 상세 페이지 URL. */
  daumUrl: string;
  /** 구단 공식 홈페이지 선수단 페이지 URL. */
  officialSquadUrl: string;
}

const EMBLEM_BASE = "https://t1.daumcdn.net/media/img-section/sports13/logo/team/6";
const TEAM_PAGE_BASE = "https://sports.daum.net/team/kl";

// 앱 표기 팀명 → 메타데이터. 2026 K리그1 12팀 기준.
// cpTeamId·teamId는 다음 순위 API(2026-07-17)에서 추출.
const TEAM_META: Record<string, TeamMeta> = {
  "FC서울": {
    cpTeamId: "K09", teamId: 9,
    emblemUrl: `${EMBLEM_BASE}/K09_300300.png`,
    daumUrl: `${TEAM_PAGE_BASE}/9`,
    officialSquadUrl: "https://www.fcseoul.com",
  },
  "전북 현대모터스": {
    cpTeamId: "K05", teamId: 5,
    emblemUrl: `${EMBLEM_BASE}/K05_300300.png`,
    daumUrl: `${TEAM_PAGE_BASE}/5`,
    officialSquadUrl: "https://hyundai-motorsfc.com/player/player_list.asp",
  },
  "강원FC": {
    cpTeamId: "K21", teamId: 21,
    emblemUrl: `${EMBLEM_BASE}/K21_300300.png`,
    daumUrl: `${TEAM_PAGE_BASE}/21`,
    officialSquadUrl: "https://gangwon-fc.com",
  },
  "포항 스틸러스": {
    cpTeamId: "K03", teamId: 3,
    emblemUrl: `${EMBLEM_BASE}/K03_300300.png`,
    daumUrl: `${TEAM_PAGE_BASE}/3`,
    officialSquadUrl: "https://www.steelers.kr",
  },
  "울산 HD": {
    cpTeamId: "K01", teamId: 1,
    emblemUrl: `${EMBLEM_BASE}/K01_300300.png`,
    daumUrl: `${TEAM_PAGE_BASE}/1`,
    officialSquadUrl: "https://www.uhfc.tv",
  },
  "안양FC": {
    cpTeamId: "K29", teamId: 29,
    emblemUrl: `${EMBLEM_BASE}/K29_300300.png`,
    daumUrl: `${TEAM_PAGE_BASE}/29`,
    officialSquadUrl: "https://www.fcanyang.com",
  },
  "인천 유나이티드": {
    cpTeamId: "K18", teamId: 18,
    emblemUrl: `${EMBLEM_BASE}/K18_300300.png`,
    daumUrl: `${TEAM_PAGE_BASE}/18`,
    officialSquadUrl: "https://www.incheonutd.com",
  },
  "제주SK": {
    cpTeamId: "K04", teamId: 4,
    emblemUrl: `${EMBLEM_BASE}/K04_300300.png`,
    daumUrl: `${TEAM_PAGE_BASE}/4`,
    officialSquadUrl: "https://www.jeju-utd.com",
  },
  "부천FC": {
    cpTeamId: "K26", teamId: 26,
    emblemUrl: `${EMBLEM_BASE}/K26_300300.png`,
    daumUrl: `${TEAM_PAGE_BASE}/26`,
    officialSquadUrl: "https://www.bfc1995.com/player/pro.php",
  },
  "대전하나시티즌": {
    cpTeamId: "K10", teamId: 10,
    emblemUrl: `${EMBLEM_BASE}/K10_300300.png`,
    daumUrl: `${TEAM_PAGE_BASE}/10`,
    officialSquadUrl: "https://www.dhcfc.kr",
  },
  "김천 상무": {
    cpTeamId: "K33", teamId: 33,
    emblemUrl: `${EMBLEM_BASE}/K33_300300.png`,
    daumUrl: `${TEAM_PAGE_BASE}/33`,
    officialSquadUrl: "https://www.gimcheonfc.com",
  },
  "광주FC": {
    cpTeamId: "K22", teamId: 22,
    emblemUrl: `${EMBLEM_BASE}/K22_300300.png`,
    daumUrl: `${TEAM_PAGE_BASE}/22`,
    officialSquadUrl: "https://www.gwangjufc.com/player/pro.php",
  },
};

/** 앱 표기 팀명으로 메타데이터 전체를 가져온다. 매핑에 없으면 null. */
export function getTeamMeta(teamName: string): TeamMeta | null {
  return TEAM_META[teamName] ?? null;
}

/** 앱 표기 팀명으로 엠블럼 URL만 가져온다. 매핑에 없으면 null. */
export function getEmblemUrl(teamName: string): string | null {
  return TEAM_META[teamName]?.emblemUrl ?? null;
}

/** 앱 표기 팀명으로 다음 스포츠 팀 상세 페이지 URL만 가져온다. 매핑에 없으면 null. */
export function getDaumTeamUrl(teamName: string): string | null {
  return TEAM_META[teamName]?.daumUrl ?? null;
}

/** 앱 표기 팀명으로 공식 홈페이지 선수단 페이지 URL을 가져온다. 매핑에 없으면 null. */
export function getOfficialSquadUrl(teamName: string): string | null {
  return TEAM_META[teamName]?.officialSquadUrl ?? null;
}

