import type { Match } from "@/lib/api/matches";

type Result = "W" | "D" | "L";

const RESULT_LABEL: Record<Result, string> = { W: "승", D: "무", L: "패" };

function resultOf(match: Match): Result | null {
  if (!match.score) return null;
  if (match.score.incheon > match.score.opponent) return "W";
  if (match.score.incheon < match.score.opponent) return "L";
  return "D";
}

// 지난 경기 결과 카드 — 홈/원정, 스코어, 승무패를 하나의 카드로 표시
export default function MatchResultCard({ match }: { match: Match }) {
  const result = resultOf(match);

  return (
    <div className="rounded-md bg-bg-surface p-4">
      <p className="text-xs text-text-muted">{match.round}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="flex-1 font-semibold">
          {match.isHome ? "인천 유나이티드" : match.opponent}
        </span>
        <span className="text-lg font-bold">
          {match.score ? `${match.score.incheon} : ${match.score.opponent}` : "vs"}
        </span>
        <span className="flex-1 text-right font-semibold">
          {match.isHome ? match.opponent : "인천 유나이티드"}
        </span>
      </div>
      {result && (
        <p className="mt-2 text-center text-sm font-bold text-brand">
          {RESULT_LABEL[result]}
        </p>
      )}
    </div>
  );
}
