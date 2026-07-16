"use client";

// docs/design/components/sort-toggle.md 기준 — 기본/가나다순 정렬 전환 세그먼트 토글
export type SortMode = "default" | "alphabetical";

const OPTIONS: { value: SortMode; label: string }[] = [
  { value: "default", label: "기본" },
  { value: "alphabetical", label: "가나다순" },
];

export default function SortToggle({
  sortMode,
  onChange,
}: {
  sortMode: SortMode;
  onChange: (mode: SortMode) => void;
}) {
  return (
    <div className="inline-flex gap-1 self-start rounded-full bg-bg-interactive p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={sortMode === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-11 rounded-full px-4 text-[15px] font-semibold ${
            sortMode === option.value ? "bg-brand text-white" : "text-text-secondary"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
