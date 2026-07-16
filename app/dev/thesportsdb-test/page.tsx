import { runThesportsdbCheck, type Verdict } from "@/lib/dev/thesportsdb";

// 개발자 진단 전용 페이지. NavBar에는 노출하지 않는다.
// 새로고침할 때마다 TheSportsDB에 실시간으로 요청을 보내 결과를 그대로 보여준다.
export const dynamic = "force-dynamic";

const VERDICT_LABEL: Record<Verdict, string> = {
  pass: "PASS",
  partial: "PARTIAL",
  fail: "FAIL",
};

const VERDICT_STYLE: Record<Verdict, string> = {
  pass: "bg-brand text-white",
  partial: "bg-warning text-white",
  fail: "bg-negative text-white",
};

export default async function ThesportsdbTestPage() {
  const { results, team, checkedAt } = await runThesportsdbCheck();
  const allPassed = results.length > 0 && results.every((r) => r.verdict === "pass");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[760px] flex-col gap-6 px-4 py-8 sm:px-5 lg:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-brand">
          Dev Only · 실시간 API 진단
        </p>
        <h1 className="mt-1 text-2xl font-bold">TheSportsDB 연동 검증</h1>
        <p className="mt-2 text-sm text-text-muted">
          이 페이지를 새로고침할 때마다 TheSportsDB에 실시간으로 요청을 보내고 그 결과를
          그대로 보여줍니다. lib/api/*.ts 기존 mock 코드와는 무관합니다.
        </p>
        <p className="mt-1 text-xs text-text-muted">확인 시각: {checkedAt}</p>
      </div>

      {team && (
        <p className="text-sm text-text-secondary">
          대상: <span className="font-semibold text-text-primary">{team.strTeam}</span> ·
          idTeam={team.idTeam} · idLeague={team.idLeague} ({team.strLeague})
        </p>
      )}

      <div className={`rounded-md p-4 ${allPassed ? "bg-brand" : "bg-negative"}`}>
        <p className="font-bold text-white">
          {allPassed
            ? "전 항목 통과 — 실 API 연동 검토 가능"
            : "일부 항목 미충족 — mock 유지 권장"}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {results.map((r) => (
          <div key={r.id} className="rounded-md bg-bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${VERDICT_STYLE[r.verdict]}`}
              >
                {VERDICT_LABEL[r.verdict]}
              </span>
              <h2 className="font-semibold">{r.title}</h2>
            </div>
            <code className="mt-2 block text-xs text-text-muted">{r.endpoint}</code>
            <p className="mt-2 text-sm">{r.finding}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-brand">원본 응답 보기</summary>
              <pre className="mt-2 overflow-x-auto rounded bg-bg-base p-3 text-xs">
                {r.raw}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </main>
  );
}
