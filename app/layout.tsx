import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "인천 유나이티드 팬 플랫폼",
  description:
    "인천 유나이티드의 응원가, 경기 일정, 전력 분석, 구단 정보 등을 한곳에서 확인할 수 있는 팬 통합 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full antialiased">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
