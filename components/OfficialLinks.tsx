const OFFICIAL_LINKS = [
  { href: "https://www.incheonutd.com/", label: "공식 홈페이지", icon: "🌐" },
  { href: "https://www.instagram.com/incheonutd/", label: "인스타그램", icon: "📷" },
  { href: "https://www.youtube.com/c/IncheonutdFC", label: "유튜브", icon: "▶️" },
];

// 구단 공식 채널(홈페이지/인스타그램/유튜브)로 이동하는 바로가기 버튼 — 정적 링크, API 불필요
// Layout에 배치되어 응원가/구단 정보 어느 화면에서든 접근 가능
export default function OfficialLinks() {
  return (
    <div className="flex gap-2">
      {OFFICIAL_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-bg-interactive px-2 text-sm font-semibold text-white hover:brightness-110"
        >
          <span aria-hidden>{link.icon}</span>
          {link.label}
        </a>
      ))}
    </div>
  );
}
