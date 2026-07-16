import type { TeamStanding } from "@/lib/api/standings";

// K리그1 전체 순위표 — 인천 유나이티드 행을 강조 표시. 좁은 화면에서는 표 내부만 스크롤(페이지 전체는 스크롤 없음)
export default function StandingsTable({ standings }: { standings: TeamStanding[] }) {
  return (
    <div className="overflow-x-auto rounded-md bg-bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-muted">
            <th className="px-2 py-3 text-left font-medium">순위</th>
            <th className="px-2 py-3 text-left font-medium">팀</th>
            <th className="px-2 py-3 text-center font-medium">승무패</th>
            <th className="px-2 py-3 text-center font-medium">득실</th>
            <th className="px-2 py-3 text-center font-medium">승점</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team) => (
            <tr
              key={team.rank}
              className={team.team === "인천 유나이티드" ? "bg-brand text-white" : ""}
            >
              <td className="px-2 py-3">{team.rank}</td>
              <td className="px-2 py-3 font-semibold">{team.team}</td>
              <td className="px-2 py-3 text-center whitespace-nowrap">
                {team.win}-{team.draw}-{team.lose}
              </td>
              <td className="px-2 py-3 text-center">
                {team.goalsFor - team.goalsAgainst}
              </td>
              <td className="px-2 py-3 text-center font-bold">{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
