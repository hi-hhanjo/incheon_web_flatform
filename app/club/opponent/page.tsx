import { getUpcomingMatch } from "@/lib/api/matches";
import { getUpcomingOpponentScouting } from "@/lib/api/opponentScouting";
import { getHeadToHead } from "@/lib/api/headToHead";
import Layout from "@/components/Layout";
import Badge from "@/components/Badge";
import { IconButton } from "@/components/Button";
import OpponentScoutingCard from "@/components/club/OpponentScoutingCard";
import HeadToHeadList from "@/components/club/HeadToHeadList";

// 다가오는 맞대결 상대 정보 — 상대전적(실시간) / 최근 폼·주요 선수·부상(예시 데이터)
export default async function OpponentPage() {
  const [upcomingMatch, scouting] = await Promise.all([
    getUpcomingMatch(),
    getUpcomingOpponentScouting(),
  ]);
  // "다음 상대"는 실시간 연동된 다가오는 매치 기준으로 표시한다 (mock의 고정 상대명보다 우선).
  const opponentName = upcomingMatch?.opponent ?? scouting.opponent;
  const headToHead = await getHeadToHead(opponentName);

  return (
    <Layout>
      <IconButton href="/club" icon="←" label="구단 정보로" />

      <h1 className="text-xl font-bold">다음 상대: {opponentName}</h1>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">상대전적</h2>
          <Badge text="실시간 연동" variant="primary" />
        </div>
        <HeadToHeadList matches={headToHead} />
      </section>

      <OpponentScoutingCard scouting={scouting} />
    </Layout>
  );
}
