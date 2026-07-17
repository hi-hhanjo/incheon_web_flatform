import Link from "next/link";
import Badge from "./Badge";
import { UNUSED_TAG } from "@/lib/api/songs";

// docs/design/components/song-card.md — 목록 카드: 제목 + 배지를 카드 전체 색상으로 통합 표시
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
  // 팀을 떠난 선수의 응원가 — 지금은 불리지 않는다는 걸 목록에서 바로 알 수 있어야 한다.
  const isUnused = tags.includes(UNUSED_TAG);
  const isBrand = index % 2 === 0;

  return (
    <Link
      href={`/songs/${id}`}
      className={`flex min-h-11 items-center gap-2 rounded-md px-4 py-4 font-semibold text-white hover:brightness-110 ${
        isBrand ? "bg-brand" : "bg-border-light"
      }`}
    >
      <span className="flex-1">{title}</span>
      {isUnused && <Badge text={UNUSED_TAG} variant={isBrand ? "neutral" : "primary"} />}
      {isFeatured && (
        <Badge text="대표곡" variant={isBrand ? "neutral" : "primary"} />
      )}
    </Link>
  );
}
