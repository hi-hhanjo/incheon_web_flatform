import { getRecentMatches, getUpcomingMatch, getMatchesUpdatedAt } from "@/lib/api/matches";
import {
  getUpcomingOpponentScouting,
  getOpponentFormsUpdatedAt,
  getIncheonScouting,
} from "@/lib/api/opponentScouting";
import { getHeadToHeadSummary, getHeadToHeadUpdatedAt } from "@/lib/api/headToHead";
import { getStandings, getStandingsUpdatedAt } from "@/lib/api/standings";
import Layout from "@/components/Layout";
import Badge from "@/components/Badge";
import MatchResultCard from "@/components/club/MatchResultCard";
import RecentMatchesList from "@/components/club/RecentMatchesList";
import UpcomingMatchCard from "@/components/club/UpcomingMatchCard";
import OpponentScoutingCard from "@/components/club/OpponentScoutingCard";
import HeadToHeadList from "@/components/club/HeadToHeadList";
import StandingsTable from "@/components/club/StandingsTable";
import FloatingNav from "@/components/club/FloatingNav";
import SourceNote from "@/components/SourceNote";
import { DAUM_SPORTS } from "@/lib/api/sources";
import { snapshotLabel } from "@/lib/format";

export const revalidate = 3600; // 1시간 단위 정적 재생성 (ISR)

// 구단 정보 메인 — 다가오는 매치 / 상대 전적 및 정보 / 최근 경기 결과 및 전적 / 전체 순위표
export default async function ClubHome() {
  const [recentMatches, upcomingMatch, updatedAt] = await Promise.all([
    getRecentMatches(5),
    getUpcomingMatch(),
    getMatchesUpdatedAt(),
  ]);
  const latestMatch = recentMatches[0];
  const remainingMatches = recentMatches.slice(1, 5);

  const opponentName = upcomingMatch?.opponent ?? "미정";
  const [scouting, incheonScouting, { matches: headToHead, summary: h2hSummary }, headToHeadUpdatedAt, formsUpdatedAt, standings, standingsUpdatedAt] = await Promise.all([
    getUpcomingOpponentScouting(opponentName),
    getIncheonScouting(),
    getHeadToHeadSummary(opponentName),
    getHeadToHeadUpdatedAt(),
    getOpponentFormsUpdatedAt(),
    getStandings(),
    getStandingsUpdatedAt(),
  ]);

  const navSections = [
    { id: "upcoming-match", label: "다가오는 매치" },
    { id: "head-to-head", label: "상대전적" },
    { id: "opponent-form", label: "상대팀 최근 경기" },
    { id: "key-players", label: "주요 선수" },
    { id: "injuries", label: "부상 및 결장 이슈" },
    { id: "recent-matches", label: "최근 경기 결과" },
    { id: "standings", label: "K리그1 순위표" },
  ];

  return (
    <Layout>
      <FloatingNav sections={navSections} />
      
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">구단 정보</h1>
        <Badge text={snapshotLabel(updatedAt)} variant="neutral" />
      </div>

      <div className="flex flex-col gap-10">
        <section id="upcoming-match" className="flex flex-col gap-4 bg-bg-surface p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-brand rounded-full" />
          <h2 className="text-lg font-bold">다가오는 매치</h2>
        </div>
        {upcomingMatch ? (
          <UpcomingMatchCard match={upcomingMatch} h2hSummary={h2hSummary} />
        ) : (
          <p className="text-text-muted">예정된 경기가 없습니다</p>
        )}
      </section>

      {upcomingMatch && (
        <>
          <section id="head-to-head" className="scroll-mt-20">
            <HeadToHeadList matches={headToHead} updatedAt={headToHeadUpdatedAt} />
          </section>

          <OpponentScoutingCard 
            scouting={scouting} 
            incheonScouting={incheonScouting} 
            formsUpdatedAt={formsUpdatedAt} 
          />
        </>
      )}

      <section id="recent-matches" className="flex flex-col gap-4 bg-bg-surface p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-brand rounded-full" />
          <h2 className="text-lg font-bold">최근 경기 결과 및 전적</h2>
        </div>
        {latestMatch ? (
          <div className="flex flex-col gap-4">
            <MatchResultCard match={latestMatch} />
            <RecentMatchesList matches={remainingMatches} />
          </div>
        ) : (
          <p className="text-text-muted">최근 경기 결과가 없습니다</p>
        )}
      </section>

      <section id="standings" className="flex flex-col gap-4 bg-bg-surface p-5 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-border-light rounded-full" />
            <h2 className="text-lg font-bold">K리그1 순위표</h2>
          </div>
          <Badge text={snapshotLabel(standingsUpdatedAt)} variant="neutral" />
        </div>
        <StandingsTable standings={standings} />
      </section>
      </div>

      <SourceNote label="경기 데이터 출처" name={DAUM_SPORTS.name} url={DAUM_SPORTS.url} />
    </Layout>
  );
}
