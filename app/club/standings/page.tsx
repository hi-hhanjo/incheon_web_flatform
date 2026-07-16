import { getStandings, getStandingsUpdatedAt } from "@/lib/api/standings";
import Layout from "@/components/Layout";
import Badge from "@/components/Badge";
import { IconButton } from "@/components/Button";
import StandingsTable from "@/components/club/StandingsTable";

// 순위표는 실시간이 아니라 주간 갱신 스냅샷이므로, 사용자 접속일이 아니라
// 데이터가 수집·반영된 날(updated_at)을 "기준일"로 표시한다.
function formatSnapshotLabel(updatedAt: string | null): string {
  if (!updatedAt) return "예시 데이터";
  const formatted = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(updatedAt));
  return `${formatted} 기준`;
}

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
        <Badge text={formatSnapshotLabel(updatedAt)} variant="neutral" />
      </div>

      <StandingsTable standings={standings} />
    </Layout>
  );
}
