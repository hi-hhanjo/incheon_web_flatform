import Link from "next/link";
import { getRecentMatches, getUpcomingMatch } from "@/lib/api/matches";
import Layout from "@/components/Layout";
import Badge from "@/components/Badge";
import MatchResultCard from "@/components/club/MatchResultCard";
import RecentFormStrip from "@/components/club/RecentFormStrip";
import UpcomingMatchCard from "@/components/club/UpcomingMatchCard";

// 구단 정보 메인 — 다가오는 매치 / 지난 경기 결과 / 최근 경기 전적 요약, 순위표·상대 정보로 이동
export default async function ClubHome() {
  const recentMatches = await getRecentMatches(5);
  const upcomingMatch = await getUpcomingMatch();
  const latestMatch = recentMatches[0];

  return (
    <Layout>
      <h1 className="text-2xl font-bold">구단 정보</h1>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">다가오는 매치</h2>
          <Badge text="실시간 연동" variant="primary" />
        </div>
        {upcomingMatch ? (
          <UpcomingMatchCard match={upcomingMatch} />
        ) : (
          <p className="text-text-muted">예정된 경기가 없습니다</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">지난 경기 결과</h2>
          <Badge text="예시 데이터" variant="neutral" />
        </div>
        {latestMatch ? (
          <MatchResultCard match={latestMatch} />
        ) : (
          <p className="text-text-muted">최근 경기 결과가 없습니다</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">최근 경기 전적</h2>
          <Badge text="예시 데이터" variant="neutral" />
        </div>
        <RecentFormStrip matches={recentMatches} />
      </section>

      <nav className="flex flex-col gap-3">
        <Link
          href="/club/standings"
          className="rounded-md bg-bg-surface px-4 py-4 font-semibold hover:bg-bg-interactive"
        >
          K리그1 전체 순위표 보기 →
        </Link>
        <Link
          href="/club/opponent"
          className="rounded-md bg-bg-surface px-4 py-4 font-semibold hover:bg-bg-interactive"
        >
          다음 상대 정보 보기 →
        </Link>
      </nav>
    </Layout>
  );
}
