// docs/design/components/badge.md — '대표곡' 등 작은 표식 라벨
export default function Badge({
  text,
  variant = "primary",
}: {
  text: string;
  variant?: "primary" | "neutral";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
        variant === "primary"
          ? "bg-brand text-white"
          : "bg-bg-interactive text-text-secondary"
      }`}
    >
      {text}
    </span>
  );
}
