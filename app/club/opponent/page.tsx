import { getUpcomingMatch } from "@/lib/api/matches";
import {
  getUpcomingOpponentScouting,
  getOpponentFormsUpdatedAt,
} from "@/lib/api/opponentScouting";
import { getHeadToHead, getHeadToHeadUpdatedAt } from "@/lib/api/headToHead";
import Layout from "@/components/Layout";
import Badge from "@/components/Badge";
import { IconButton } from "@/components/Button";
import OpponentScoutingCard from "@/components/club/OpponentScoutingCard";
import HeadToHeadList from "@/components/club/HeadToHeadList";
import SourceNote from "@/components/SourceNote";
import { DAUM_SPORTS } from "@/lib/api/sources";
import { snapshotLabel } from "@/lib/format";

// 다가오는 맞대결 상대 정보 — 상대전적·최근 폼(실데이터) / 주요 선수·부상(예시 데이터)
export default async function OpponentPage() {
  // "다음 상대"는 크롤된 다가오는 매치 기준으로 정한다.
  const upcomingMatch = await getUpcomingMatch();
  const opponentName = upcomingMatch?.opponent ?? "미정";
  const [scouting, headToHead, headToHeadUpdatedAt, formsUpdatedAt] =
    await Promise.all([
      getUpcomingOpponentScouting(opponentName),
      getHeadToHead(opponentName),
      getHeadToHeadUpdatedAt(),
      getOpponentFormsUpdatedAt(),
    ]);

  return (
    <Layout>
      <IconButton href="/club" icon="←" label="구단 정보로" />

      <h1 className="text-xl font-bold">다음 상대: {opponentName}</h1>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">상대전적</h2>
          {/* 2026-07-17 '실시간 연동' → 크롤 스냅샷으로 바뀌어, 다른 구단 데이터와 같은 기준일 배지를 쓴다. */}
          <Badge text={snapshotLabel(headToHeadUpdatedAt)} variant="neutral" />
        </div>
        <HeadToHeadList matches={headToHead} />
      </section>

      <OpponentScoutingCard scouting={scouting} formsUpdatedAt={formsUpdatedAt} />

      {/* 상대전적·최근 폼 모두 다음 스포츠 크롤이라 출처가 하나로 합쳐졌다. */}
      <SourceNote label="데이터 출처" name={DAUM_SPORTS.name} url={DAUM_SPORTS.url} />
    </Layout>
  );
}
