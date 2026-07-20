import type { Match } from "@/lib/api/matches";
import TeamEmblem from "./TeamEmblem";

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 다가오는 매치 카드 — 라운드/장소, 대진(엠블럼 포함), 일정을 하나의 카드로 표시
export default function UpcomingMatchCard({ match }: { match: Match }) {
  const home = match.isHome ? "인천 유나이티드" : match.opponent;
  const away = match.isHome ? match.opponent : "인천 유나이티드";

  return (
    <div className="rounded-md bg-brand p-4 text-white">
      <div className="flex items-center gap-2">
        <p className="text-xs text-white/80">
          {match.round} {match.venue ? `· ${match.venue}` : ""}
        </p>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${match.isHome ? "bg-white/20 text-white" : "bg-black/20 text-white"}`}>
          {match.isHome ? "HOME" : "AWAY"}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-1 flex-col items-center gap-1">
          <TeamEmblem teamName={home} size="lg" />
          <span className="text-sm font-semibold">{home}</span>
        </div>
        <span className="px-4 text-lg font-bold text-white/60">vs</span>
        <div className="flex flex-1 flex-col items-center gap-1">
          <TeamEmblem teamName={away} size="lg" />
          <span className="text-sm font-semibold">{away}</span>
        </div>
      </div>
      <p className="mt-4 text-center text-sm font-bold text-white/90">
        {formatKickoff(match.kickoffAt)}
      </p>
    </div>
  );
}

