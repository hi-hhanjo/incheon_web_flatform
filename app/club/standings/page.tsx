import { getStandings, getStandingsUpdatedAt } from "@/lib/api/standings";
import Layout from "@/components/Layout";
import Badge from "@/components/Badge";
import { IconButton } from "@/components/Button";
import StandingsTable from "@/components/club/StandingsTable";
import { snapshotLabel } from "@/lib/format";

// K리그1 전체 순위표 — 리그 선두/다음 상대 순위 파악용
export default async function StandingsPage() {
  const [standings, updatedAt] = await Promise.all([
    getStandings(),
    getStandingsUpdatedAt(),
  ]);

  return (
    <Layout>
      <IconButton href="/club" icon="←" label="구단 정보로" />

      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">K리그1 순위표</h1>
        <Badge text={snapshotLabel(updatedAt)} variant="neutral" />
      </div>

      <StandingsTable standings={standings} />
    </Layout>
  );
}
