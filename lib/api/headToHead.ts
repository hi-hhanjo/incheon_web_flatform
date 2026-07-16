// API-Football(v3.football.api-sports.io)의 /fixtures/headtohead 엔드포인트는
// 순위표/최근경기(last,next)를 막는 무료 플랜 시즌 제한에 걸리지 않아 실연동이 가능하다
// (scripts/api-football-test.mjs, .env.local의 API_FOOTBALL_KEY로 검증 완료).
const BASE = "https://v3.football.api-sports.io";
const INCHEON_ID = 2763;

// teams?league=292&season=2024 (K리그1 로스터) + teams?search로 확보한 API-Football 팀 ID.
// 안양FC는 2024시즌엔 K리그1이 아니어서 별도 검색으로 확인.
const API_FOOTBALL_TEAM_ID: Record<string, number> = {
  "강원FC": 2746,
  "대구FC": 2747,
  "안양FC": 2748,
  "대전하나시티즌": 2750,
  "수원FC": 2756,
  "광주FC": 2759,
  "전북 현대모터스": 2762,
  "인천 유나이티드": 2763,
  "포항 스틸러스": 2764,
  "FC서울": 2766,
  "울산 HD": 2767,
  "김천 상무": 2768,
};

const KOREAN_TEAM_NAME: Record<string, string> = {
  "Gangwon FC": "강원FC",
  "Daegu FC": "대구FC",
  "FC Anyang": "안양FC",
  "Daejeon Citizen": "대전하나시티즌",
  "Suwon City FC": "수원FC",
  "Gwangju FC": "광주FC",
  "Jeonbuk Motors": "전북 현대모터스",
  "Incheon United": "인천 유나이티드",
  "Pohang Steelers": "포항 스틸러스",
  "FC Seoul": "FC서울",
  "Ulsan Hyundai FC": "울산 HD",
  "Gimcheon Sangmu FC": "김천 상무",
};

function toKoreanTeamName(name: string): string {
  return KOREAN_TEAM_NAME[name] ?? name;
}

export interface HeadToHeadMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

interface ThesportsdbFixture {
  fixture: { date: string; status: { short: string } };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
}

// 인천 유나이티드와 opponentKoreanName(예: "전북 현대모터스")의 최근 상대전적을 조회한다.
// 팀 ID가 매핑에 없거나 API 키가 없거나 요청이 실패하면 빈 배열을 반환한다(mock으로 대체 없음 —
// 호출부에서 빈 배열을 "가져오지 못함" 상태로 처리).
export async function getHeadToHead(
  opponentKoreanName: string,
  count = 5
): Promise<HeadToHeadMatch[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const opponentId = API_FOOTBALL_TEAM_ID[opponentKoreanName];
  if (!apiKey || !opponentId) return [];

  try {
    const res = await fetch(
      `${BASE}/fixtures/headtohead?h2h=${INCHEON_ID}-${opponentId}`,
      {
        headers: { "x-apisports-key": apiKey },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];

    const data = (await res.json()) as { response?: ThesportsdbFixture[] };
    const today = new Date().toISOString().slice(0, 10);

    return (data.response ?? [])
      .filter(
        (f) =>
          f.fixture.status.short === "FT" && f.fixture.date.slice(0, 10) <= today
      )
      .sort((a, b) => b.fixture.date.localeCompare(a.fixture.date))
      .slice(0, count)
      .map((f) => ({
        date: f.fixture.date.slice(0, 10),
        homeTeam: toKoreanTeamName(f.teams.home.name),
        awayTeam: toKoreanTeamName(f.teams.away.name),
        homeScore: f.goals.home ?? 0,
        awayScore: f.goals.away ?? 0,
      }));
  } catch {
    return [];
  }
}
