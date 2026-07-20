import type { Match } from "@/lib/api/matches";
import type { HeadToHeadSummary } from "@/lib/api/headToHead";
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
export default function UpcomingMatchCard({ match, h2hSummary }: { match: Match, h2hSummary?: HeadToHeadSummary }) {
  const home = match.isHome ? "인천 유나이티드" : match.opponent;
  const away = match.isHome ? match.opponent : "인천 유나이티드";

  const venueStats = match.venue && h2hSummary?.perVenue[match.venue] 
    ? h2hSummary.perVenue[match.venue] 
    : null;

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
      <a 
        href={`https://sports.daum.net/match/${match.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-between transition-opacity hover:opacity-80"
        title="다음 스포츠에서 전력분석 보기"
      >
        <div className="flex flex-1 flex-col items-center gap-1">
          <TeamEmblem teamName={home} size="lg" linked={false} />
          <span className="text-sm font-semibold">{home}</span>
        </div>
        <span className="px-4 text-lg font-bold text-white/60">vs</span>
        <div className="flex flex-1 flex-col items-center gap-1">
          <TeamEmblem teamName={away} size="lg" linked={false} />
          <span className="text-sm font-semibold">{away}</span>
        </div>
      </a>
      
      {h2hSummary && (
        <div className="mt-4 flex flex-col items-center gap-1 rounded bg-black/20 py-2 text-xs text-white/90">
          <p>
            <span className="font-semibold text-white/70">역대 전적:</span>{" "}
            {h2hSummary.total.win}승 {h2hSummary.total.draw}무 {h2hSummary.total.loss}패
          </p>
          {venueStats && match.venue && (
            <p className="text-[10px] text-white/60">
              {match.venue} 기준: {venueStats.win}승 {venueStats.draw}무 {venueStats.loss}패
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-center text-sm font-bold text-white/90">
        {formatKickoff(match.kickoffAt)}
      </p>
    </div>
  );
}

