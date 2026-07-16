import type { OpponentScouting } from "@/lib/api/opponentScouting";
import Badge from "../Badge";

const RESULT_LABEL: Record<"W" | "D" | "L", string> = { W: "승", D: "무", L: "패" };

// 다가오는 상대 스카우팅 정보 — 최근 폼(실데이터) / 주요 선수 · 부상·결장(예시 데이터)
export default function OpponentScoutingCard({
  scouting,
}: {
  scouting: OpponentScouting;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">상대팀 최근 5경기</h2>
        {scouting.recentForm.length === 0 ? (
          <p className="text-text-muted">최근 경기 정보가 없습니다</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {scouting.recentForm.map((entry) => (
              <li
                key={entry.date}
                className="flex items-center justify-between rounded-md bg-bg-surface px-4 py-3 text-sm"
              >
                <span className="text-text-secondary">{entry.date}</span>
                <span>vs {entry.opponentFaced}</span>
                <span className="font-bold">
                  {RESULT_LABEL[entry.result]} {entry.score}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">주요 선수</h2>
          <Badge text="예시 데이터" variant="neutral" />
        </div>
        <ul className="flex flex-col gap-2">
          {scouting.keyPlayers.map((player) => (
            <li key={player.name} className="rounded-md bg-bg-surface px-4 py-3">
              <p className="font-semibold">
                {player.name} <span className="text-text-muted">({player.position})</span>
              </p>
              <p className="text-sm text-text-secondary">{player.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">부상·결장 이슈</h2>
          <Badge text="예시 데이터" variant="neutral" />
        </div>
        {scouting.injuries.length === 0 ? (
          <p className="text-text-muted">보고된 이슈가 없습니다</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {scouting.injuries.map((injury) => (
              <li key={injury.name} className="rounded-md bg-bg-surface px-4 py-3">
                <p className="font-semibold">{injury.name}</p>
                <p className="text-sm text-text-secondary">
                  {injury.status} · 복귀 예상: {injury.expectedReturn}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
