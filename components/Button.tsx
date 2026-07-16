import Link from "next/link";

// docs/design/components/button.md — Primary pill 버튼 / Icon 원형 버튼
// 이 앱의 실제 사용처(뒤로 가기, 목록으로 가기)가 모두 고정 경로 이동이라 href 기반 Link로 구현한다.
export function Button({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full bg-brand px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-brand-hover"
    >
      {label}
    </Link>
  );
}

export function IconButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex min-h-11 min-w-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-interactive text-white hover:brightness-110"
    >
      {icon}
    </Link>
  );
}
