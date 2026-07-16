import type { HeadToHeadMatch } from "@/lib/api/headToHead";

type Result = "W" | "D" | "L";

const RESULT_LABEL: Record<Result, string> = { W: "승", D: "무", L: "패" };

function resultOf(match: HeadToHeadMatch): Result {
  const incheonIsHome = match.homeTeam === "인천 유나이티드";
  const incheonScore = incheonIsHome ? match.homeScore : match.awayScore;
  const opponentScore = incheonIsHome ? match.awayScore : match.homeScore;
  if (incheonScore > opponentScore) return "W";
  if (incheonScore < opponentScore) return "L";
  return "D";
}

// 인천 유나이티드와 상대팀의 실시간 상대전적(head-to-head) 목록
export default function HeadToHeadList({ matches }: { matches: HeadToHeadMatch[] }) {
  if (matches.length === 0) {
    return <p className="text-text-muted">상대전적 데이터를 가져오지 못했습니다</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {matches.map((match) => (
        <li
          key={match.date}
          className="flex items-center justify-between rounded-md bg-bg-surface px-4 py-3 text-sm"
        >
          <span className="text-text-secondary">{match.date}</span>
          <span>
            {match.homeTeam} {match.homeScore}:{match.awayScore} {match.awayTeam}
          </span>
          <span className="font-bold">{RESULT_LABEL[resultOf(match)]}</span>
        </li>
      ))}
    </ul>
  );
}
