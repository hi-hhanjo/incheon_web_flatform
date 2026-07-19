import type { Match } from "@/lib/api/matches";
import TeamEmblem from "./TeamEmblem";

type Result = "W" | "D" | "L";

const RESULT_LABEL: Record<Result, string> = { W: "승", D: "무", L: "패" };

function resultOf(match: Match): Result | null {
  if (!match.score) return null;
  if (match.score.incheon > match.score.opponent) return "W";
  if (match.score.incheon < match.score.opponent) return "L";
  return "D";
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 지난 경기 결과 카드 — 홈/원정, 스코어, 승무패를 엠블럼과 함께 하나의 카드로 표시
export default function MatchResultCard({ match }: { match: Match }) {
  const result = resultOf(match);
  const home = match.isHome ? "인천 유나이티드" : match.opponent;
  const away = match.isHome ? match.opponent : "인천 유나이티드";

  return (
    <div className="rounded-md bg-[#0E1116] border border-border-dim p-4">
      <div className="flex items-center gap-2">
        <p className="text-xs text-text-muted">
          {match.round} {match.venue ? `· ${match.venue}` : ""}
        </p>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${match.isHome ? "bg-border-light text-text-primary" : "bg-bg-interactive text-text-primary"}`}>
          {match.isHome ? "HOME" : "AWAY"}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-1 items-center justify-end gap-5">
          <div className="flex items-center gap-2">
            {match.isHome && result && (
              <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${result === "W" ? "bg-brand text-white" : result === "D" ? "bg-border-light text-white" : "bg-negative text-white"}`}>
                {RESULT_LABEL[result]}
              </span>
            )}
            <span className="text-2xl font-bold">{match.score ? (match.isHome ? match.score.incheon : match.score.opponent) : "-"}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <TeamEmblem teamName={home} size="lg" />
            <span className="text-sm font-semibold">{home}</span>
          </div>
        </div>
        <span className="px-4 text-lg font-bold text-text-muted">vs</span>
        <div className="flex flex-1 items-center justify-start gap-5">
          <div className="flex flex-col items-center gap-1">
            <TeamEmblem teamName={away} size="lg" />
            <span className="text-sm font-semibold">{away}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{match.score ? (!match.isHome ? match.score.incheon : match.score.opponent) : "-"}</span>
            {!match.isHome && result && (
              <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${result === "W" ? "bg-brand text-white" : result === "D" ? "bg-border-light text-white" : "bg-negative text-white"}`}>
                {RESULT_LABEL[result]}
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-text-muted">
        {formatKickoff(match.kickoffAt)}
      </p>
    </div>
  );
}

