"use client";

// docs/design/components/search-bar.md 기준 — 제목·가사로 목록을 좁히는 검색창(F-11)
export default function SearchBar({
  query,
  onChange,
}: {
  query: string;
  onChange: (query: string) => void;
}) {
  return (
    <div className="relative flex items-center">
      <input
        type="search"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        aria-label="응원가 검색"
        placeholder="제목·가사로 검색"
        // 브라우저 기본 검색 지우기(×)는 크롬 계열에만 있고 모양도 제각각이라, 아래 버튼으로
        // 직접 그린다. [&::-webkit-search-cancel-button]:hidden이 기본 ×를 숨긴다.
        className="min-h-11 w-full rounded-lg bg-bg-interactive px-4 pr-12 text-[15px] text-white placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
      />

      {/* 지울 게 있을 때만 나타난다 — 빈 검색창에 ×가 떠 있으면 눌러도 아무 일이 없다. */}
      {query && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="검색어 지우기"
          className="absolute right-0 flex min-h-11 min-w-11 items-center justify-center text-text-secondary"
        >
          ×
        </button>
      )}
    </div>
  );
}
