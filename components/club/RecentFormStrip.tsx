import type { Match } from "@/lib/api/matches";

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

// 최근 N경기 승/무/패를 원형 뱃지로 나열
export default function RecentFormStrip({ matches }: { matches: Match[] }) {
  return (
    <div className="flex gap-2">
      {matches.map((match) => {
        const result = resultOf(match);
        return (
          <span
            key={match.id}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${RESULT_STYLE[result]}`}
          >
            {RESULT_LABEL[result]}
          </span>
        );
      })}
    </div>
  );
}
