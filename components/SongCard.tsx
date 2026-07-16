import Link from "next/link";
import Badge from "./Badge";

// docs/design/components/song-card.md — 목록 카드: 제목 + 대표곡 배지를 카드 전체 색상으로 통합 표시
export default function SongCard({
  id,
  title,
  tags,
  index,
}: {
  id: number;
  title: string;
  tags: string[];
  index: number;
}) {
  const isFeatured = tags.includes("대표곡");
  const isBrand = index % 2 === 0;

  return (
    <Link
      href={`/songs/${id}`}
      className={`flex min-h-11 items-center gap-2 rounded-md px-4 py-4 font-semibold text-white hover:brightness-110 ${
        isBrand ? "bg-brand" : "bg-border-light"
      }`}
    >
      <span className="flex-1">{title}</span>
      {isFeatured && (
        <Badge text="대표곡" variant={isBrand ? "neutral" : "primary"} />
      )}
    </Link>
  );
}
