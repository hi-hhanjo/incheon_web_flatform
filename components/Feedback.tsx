// docs/design/components/feedback.md — 로딩·빈 상태·에러 안내를 한 곳에서 관리
export default function Feedback({
  type,
  message,
  action,
}: {
  type: "loading" | "empty" | "error";
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center text-[15px] text-text-muted">
      {type === "loading" && (
        <span
          aria-hidden
          className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent"
        />
      )}
      <p>{message}</p>
      {action}
    </div>
  );
}
