import type { HeadToHeadMatch } from "@/lib/api/headToHead";
import TeamEmblem from "./TeamEmblem";

type Result = "W" | "D" | "L";

const RESULT_LABEL: Record<Result, string> = { W: "승", D: "무", L: "패" };
const RESULT_STYLE: Record<Result, string> = {
  W: "bg-brand text-white",
  D: "bg-border-light text-white",
  L: "bg-negative text-white",
};

function resultOf(match: HeadToHeadMatch): Result {
  const incheonIsHome = match.homeTeam === "인천 유나이티드";
  const incheonScore = incheonIsHome ? match.homeScore : match.awayScore;
  const opponentScore = incheonIsHome ? match.awayScore : match.homeScore;
  if (incheonScore > opponentScore) return "W";
  if (incheonScore < opponentScore) return "L";
  return "D";
}

// 인천 유나이티드와 상대팀의 실시간 상대전적(head-to-head) 목록 — 가로 스크롤 카드 형태
export default function HeadToHeadList({ matches }: { matches: HeadToHeadMatch[] }) {
  if (matches.length === 0) {
    return <p className="text-text-muted">상대전적 데이터를 가져오지 못했습니다</p>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto">
      {matches.map((match) => {
        const incheonIsHome = match.homeTeam === "인천 유나이티드";
        const opponentName = incheonIsHome ? match.awayTeam : match.homeTeam;
        const incheonScore = incheonIsHome ? match.homeScore : match.awayScore;
        const opponentScore = incheonIsHome ? match.awayScore : match.homeScore;
        const result = resultOf(match);

        return (
          <div
            key={match.date}
            className="flex flex-1 min-w-[64px] flex-col items-center gap-1 rounded-md bg-[#0E1116] border border-border-dim p-2"
          >
            <span className="text-[10px] text-text-muted whitespace-nowrap">
              {match.date}
            </span>
            <span className="text-[10px] text-text-muted whitespace-nowrap">
              {match.round ? match.round.replace("K리그1 ", "") : ""}
            </span>
            <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[8px] font-bold ${incheonIsHome ? "bg-border-light text-text-primary" : "bg-bg-interactive text-text-primary"}`}>
              {incheonIsHome ? "HOME" : "AWAY"}
            </span>
            <div className="mt-1 flex flex-col items-center gap-1">
              <TeamEmblem teamName={opponentName} size="sm" />
              <span className="w-full truncate text-center text-[10px] font-medium text-text-muted">
                {opponentName}
              </span>
            </div>
            <span className="mt-1 text-xs font-bold whitespace-nowrap">
              {incheonScore}:{opponentScore}
            </span>
            <span
              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${RESULT_STYLE[result]}`}
            >
              {RESULT_LABEL[result]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
