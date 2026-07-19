import type { OpponentScouting } from "@/lib/api/opponentScouting";
import Badge from "../Badge";
import { snapshotLabel } from "@/lib/format";
import TeamEmblem from "./TeamEmblem";

const RESULT_LABEL: Record<"W" | "D" | "L", string> = { W: "승", D: "무", L: "패" };
const RESULT_STYLE: Record<"W" | "D" | "L", string> = {
  W: "bg-brand text-white",
  D: "bg-border-light text-white",
  L: "bg-negative text-white",
};

// 다가오는 상대 스카우팅 정보 — 최근 폼(크롤 스냅샷) / 주요 선수 · 부상·결장(예시 데이터)
// 배지는 섹션마다 데이터 출처를 그대로 반영한다: 최근 폼은 "○○ 기준", 나머지는 "예시 데이터".
export default function OpponentScoutingCard({
  scouting,
  incheonScouting,
  formsUpdatedAt,
}: {
  scouting: OpponentScouting;
  incheonScouting: Pick<OpponentScouting, "keyPlayers" | "injuries">;
  formsUpdatedAt: string | null;
}) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <section id="opponent-form" className="flex flex-col gap-4 bg-bg-surface p-5 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-brand rounded-full" />
            <h2 className="text-lg font-bold">상대팀 최근 경기</h2>
          </div>
          <Badge text={snapshotLabel(formsUpdatedAt)} variant="neutral" />
        </div>
        {scouting.recentForm.length === 0 ? (
          <p className="text-text-muted">최근 경기 정보가 없습니다</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto">
            {scouting.recentForm.map((entry) => (
              <div
                key={entry.date}
                className="flex flex-1 min-w-[64px] flex-col items-center gap-1 rounded-md bg-[#0E1116] border border-border-dim p-2"
              >
                <span className="text-[10px] text-text-muted whitespace-nowrap">
                  {entry.date}
                </span>
                <span className="text-[10px] text-text-muted whitespace-nowrap">
                  {entry.round ? entry.round.replace("K리그1 ", "") : ""}
                </span>
                <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[8px] font-bold ${entry.isHome ? "bg-border-light text-text-primary" : "bg-bg-interactive text-text-primary"}`}>
                  {entry.isHome ? "HOME" : "AWAY"}
                </span>
                <div className="mt-1 flex flex-col items-center gap-1">
                  <TeamEmblem teamName={entry.opponentFaced} size="sm" />
                  <span className="w-full truncate text-center text-[10px] font-medium text-text-muted">
                    {entry.opponentFaced}
                  </span>
                </div>
                <span className="mt-1 text-xs font-bold whitespace-nowrap">
                  {entry.score || "vs"}
                </span>
                <span
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${RESULT_STYLE[entry.result]}`}
                >
                  {RESULT_LABEL[entry.result]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="key-players" className="flex flex-col gap-4 bg-bg-surface p-5 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-border-light rounded-full" />
            <h2 className="text-lg font-bold">주요 선수</h2>
          </div>
          <Badge text="다음 스포츠" variant="neutral" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-brand">
              <TeamEmblem teamName="인천 유나이티드" size="sm" /> 인천 유나이티드
            </h3>
            <ul className="flex flex-col gap-2">
              {incheonScouting.keyPlayers.map((player) => (
                <li key={player.name} className="rounded-md bg-brand/10 border border-brand/20 px-4 py-3">
                  <p className="font-semibold">
                    {player.name} <span className="text-text-muted">({player.position})</span>
                  </p>
                  <p className="text-sm text-text-secondary">{player.note}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-text-muted">
              <TeamEmblem teamName={scouting.opponent} size="sm" /> {scouting.opponent}
            </h3>
            <ul className="flex flex-col gap-2">
              {scouting.keyPlayers.map((player) => (
                <li key={player.name} className="rounded-md bg-[#0E1116] border border-border-dim px-4 py-3">
                  <p className="font-semibold">
                    {player.name} <span className="text-text-muted">({player.position})</span>
                  </p>
                  <p className="text-sm text-text-secondary">{player.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="injuries" className="flex flex-col gap-4 bg-bg-surface p-5 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-brand rounded-full" />
            <h2 className="text-lg font-bold">부상·결장 이슈</h2>
          </div>
          <Badge text="Transfermarkt" variant="neutral" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-brand">
              <TeamEmblem teamName="인천 유나이티드" size="sm" /> 인천 유나이티드
            </h3>
            {incheonScouting.injuries.length === 0 ? (
              <p className="text-brand/60 text-sm">보고된 이슈가 없습니다</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {incheonScouting.injuries.map((injury) => (
                  <li key={injury.name} className="rounded-md bg-brand/10 border border-brand/20 px-4 py-3">
                    <p className="font-semibold">{injury.name}</p>
                    <p className="text-sm text-text-secondary">
                      {injury.status} · 복귀 예상: {injury.expectedReturn}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-text-muted">
              <TeamEmblem teamName={scouting.opponent} size="sm" /> {scouting.opponent}
            </h3>
            {scouting.injuries.length === 0 ? (
              <p className="text-text-muted text-sm">보고된 이슈가 없습니다</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {scouting.injuries.map((injury) => (
                  <li key={injury.name} className="rounded-md bg-[#0E1116] border border-border-dim px-4 py-3">
                    <p className="font-semibold">{injury.name}</p>
                    <p className="text-sm text-text-secondary">
                      {injury.status} · 복귀 예상: {injury.expectedReturn}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
