import type { Match } from "@/lib/api/matches";

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 다가오는 매치 카드 — 라운드/장소, 대진, 일정을 하나의 카드로 표시
export default function UpcomingMatchCard({ match }: { match: Match }) {
  return (
    <div className="rounded-md bg-brand p-4 text-white">
      <p className="text-xs text-white/80">
        {match.round} · {match.venue}
      </p>
      <p className="mt-2 text-center text-lg font-bold">
        {match.isHome
          ? `인천 유나이티드 vs ${match.opponent}`
          : `${match.opponent} vs 인천 유나이티드`}
      </p>
      <p className="mt-2 text-center text-sm">{formatKickoff(match.kickoffAt)}</p>
    </div>
  );
}
