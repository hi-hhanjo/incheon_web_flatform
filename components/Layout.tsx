import OfficialLinks from "./OfficialLinks";

// docs/design/components/layout.md — 전 화면 공통 틀: 배경·최대폭·여백
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col gap-6 px-4 py-8 sm:px-5 lg:px-6">
      {children}
      <footer className="mt-auto flex flex-col gap-3 border-t border-border pt-6">
        <p className="text-center text-xs text-text-muted">공식 채널 바로가기</p>
        <OfficialLinks />
      </footer>
    </main>
  );
}
