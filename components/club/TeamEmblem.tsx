import Image from "next/image";
import { getTeamMeta } from "@/lib/api/teams";

type EmblemSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<EmblemSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

/**
 * K리그1 구단 엠블럼 — 팀명을 넘기면 다음 CDN 로고를 렌더링한다.
 *
 * - `linked=true`(기본값)이면 클릭 시 다음 스포츠 팀 상세 페이지를 새 탭으로 연다.
 * - 매핑에 없는 팀은 팀명 첫 글자를 원형 배지로 보여주는 fallback.
 */
export default function TeamEmblem({
  teamName,
  size = "md",
  linked = true,
}: {
  teamName: string;
  size?: EmblemSize;
  linked?: boolean;
}) {
  const meta = getTeamMeta(teamName);
  const px = SIZE_MAP[size];

  // 매핑에 없는 팀: 팀명 첫 글자 원형 배지
  if (!meta) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-bg-interactive text-xs font-bold text-text-secondary"
        style={{ width: px, height: px }}
        aria-label={teamName}
      >
        {teamName.charAt(0)}
      </span>
    );
  }

  const img = (
    <Image
      src={meta.emblemUrl}
      alt={`${teamName} 엠블럼`}
      width={px}
      height={px}
      className="shrink-0 object-contain"
      // 엠블럼은 장식 요소이므로 priority 끄고 lazy load
      unoptimized
    />
  );

  if (linked) {
    return (
      <a
        href={meta.daumUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 transition-opacity hover:opacity-80"
        title={`${teamName} — 다음 스포츠에서 보기`}
      >
        {img}
      </a>
    );
  }

  return <span className="inline-flex shrink-0">{img}</span>;
}
