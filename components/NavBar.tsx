"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "응원가" },
  { href: "/club", label: "구단 정보" },
];

// 전 화면 상단 탭 내비게이션 — 응원가 목록 / 구단 정보 섹션 전환
export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex w-full max-w-[640px] gap-1 px-4 pt-4 sm:px-5 lg:px-6">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              isActive ? "bg-brand text-white" : "text-text-secondary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
