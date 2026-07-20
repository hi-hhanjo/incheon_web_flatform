import type { Match } from "@/lib/api/matches";
import TeamEmblem from "./TeamEmblem";

type Result = "W" | "D" | "L";

const RESULT_LABEL: Record<Result, string> = { W: "승", D: "무", L: "패" };
const RESULT_STYLE: Record<Result, string> = {
  W: "bg-brand text-white",
  D: "bg-border-light text-white",
  L: "bg-negative text-white",
};

function resultOf(match: Match): Result {
  if (!match.score) return "D";
  if (match.score.incheon > match.score.opponent) return "W";
  if (match.score.incheon < match.score.opponent) return "L";
  return "D";
}

// 최근 N경기 전적 리스트 (상대팀, 스코어 포함)
export default function RecentMatchesList({ matches }: { matches: Match[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {matches.map((match) => {
        const result = resultOf(match);
        const shortRound = match.round.replace("K리그1 ", "");
        
        return (
          <a
            key={match.id}
            href={`https://sports.daum.net/match/${match.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 min-w-[64px] flex-col items-center gap-1 rounded-md bg-[#0E1116] border border-border-dim p-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-[10px] text-text-muted whitespace-nowrap">
              {match.kickoffAt.split("T")[0]}
            </span>
            <span className="text-[10px] text-text-muted whitespace-nowrap">
              {shortRound}
            </span>
            <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[8px] font-bold ${match.isHome ? "bg-border-light text-text-primary" : "bg-bg-interactive text-text-primary"}`}>
              {match.isHome ? "HOME" : "AWAY"}
            </span>
            <div className="mt-1 flex flex-col items-center gap-1">
              <TeamEmblem teamName={match.opponent} size="sm" />
              <span className="w-full truncate text-center text-[10px] font-medium text-text-muted">
                {match.opponent}
              </span>
            </div>
            <span className="mt-1 text-xs font-bold whitespace-nowrap">
              {match.score ? `${match.score.incheon}:${match.score.opponent}` : "vs"}
            </span>
            <span
              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${RESULT_STYLE[result]}`}
            >
              {RESULT_LABEL[result]}
            </span>
          </a>
        );
      })}
    </div>
  );
}
