import matchesData from "@/data/matches.json";

// 구단 정보 확장(경기 결과/일정) 데이터 구조. songs.ts와 동일하게 API Mocking 패턴을 따른다.
export type MatchStatus = "finished" | "upcoming";

export interface MatchScore {
  incheon: number;
  opponent: number;
}

export interface Match {
  id: number;
  round: string;
  kickoffAt: string;
  status: MatchStatus;
  opponent: string;
  isHome: boolean;
  score: MatchScore | null;
  venue: string;
}

// 런타임 저장소는 data/matches.json(읽기 전용). Vercel 서버리스에서 그대로 번들·조회된다.
const matches = matchesData as Match[];

// 최근 종료된 경기를 최신순으로 count개 반환한다. count=1이면 "지난 경기 결과"로 그대로 쓸 수 있다.
// TheSportsDB 검증 결과 최근 경기(eventslast)는 1건만 반환되어 "최근 5경기" 요구사항을
// 충족하지 못했다 (scripts/thesportsdb-test.mjs 참고) — 주간 검수 스냅샷(JSON) 유지.
export async function getRecentMatches(count = 5): Promise<Match[]> {
  return matches
    .filter((match) => match.status === "finished")
    .sort((a, b) => b.kickoffAt.localeCompare(a.kickoffAt))
    .slice(0, count);
}

// TheSportsDB의 idTeam. scripts/thesportsdb-test.mjs / app/dev/thesportsdb-test에서 검증 완료.
const THESPORTSDB_INCHEON_TEAM_ID = "138110";
const THESPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123";

// TheSportsDB는 팀명을 영문으로만 제공한다. 앱 전체가 한글 팀명을 쓰므로 표시용으로 변환한다.
const KOREAN_TEAM_NAME: Record<string, string> = {
  "Ulsan HD": "울산 HD",
  "Jeonbuk Hyundai Motors": "전북 현대모터스",
  "Pohang Steelers": "포항 스틸러스",
  "Gimcheon Sangmu": "김천 상무",
  "FC Seoul": "FC서울",
  "Daegu FC": "대구FC",
  "Incheon United": "인천 유나이티드",
  "Gwangju FC": "광주FC",
  "Suwon FC": "수원FC",
  "Gangwon FC": "강원FC",
  "Daejeon Hana Citizen": "대전하나시티즌",
  "FC Anyang": "안양FC",
};

function toKoreanTeamName(name: string): string {
  return KOREAN_TEAM_NAME[name] ?? name;
}

// TheSportsDB가 제공하는 경기장명도 영문뿐이라 확인된 것만 변환한다 (미등록 시 원문 유지).
const KOREAN_VENUE_NAME: Record<string, string> = {
  "Incheon Football Stadium": "인천축구전용경기장",
};

function toKoreanVenueName(name: string): string {
  return KOREAN_VENUE_NAME[name] ?? name;
}

interface ThesportsdbEvent {
  idEvent: string;
  dateEvent: string;
  strTime: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strVenue: string;
  intRound: string;
}

// "다가오는 매치"는 TheSportsDB 검증에서 유일하게 통과한 항목(1건 반환 = 요구사항과 정확히 일치).
// 실 API 조회 실패 시(네트워크 오류, 팀 정보 없음 등) mock 데이터로 자동 대체한다.
async function fetchUpcomingFromThesportsdb(): Promise<Match | null> {
  try {
    const res = await fetch(
      `${THESPORTSDB_BASE}/eventsnext.php?id=${THESPORTSDB_INCHEON_TEAM_ID}`,
      { next: { revalidate: 3600 } } // 1시간 캐시 — 요청마다 외부 API를 호출하지 않는다
    );
    if (!res.ok) return null;

    const data = (await res.json()) as { events?: ThesportsdbEvent[] };
    const event = data.events?.[0];
    if (!event) return null;

    const isHome = event.strHomeTeam === "Incheon United";
    return {
      id: Number(event.idEvent),
      round: `K리그1 ${event.intRound}라운드`,
      kickoffAt: `${event.dateEvent}T${event.strTime}Z`,
      status: "upcoming",
      opponent: toKoreanTeamName(isHome ? event.strAwayTeam : event.strHomeTeam),
      isHome,
      score: null,
      venue: toKoreanVenueName(event.strVenue),
    };
  } catch {
    return null;
  }
}

export async function getUpcomingMatch(): Promise<Match | undefined> {
  const liveMatch = await fetchUpcomingFromThesportsdb();
  if (liveMatch) return liveMatch;

  return matches
    .filter((match) => match.status === "upcoming")
    .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))[0];
}
