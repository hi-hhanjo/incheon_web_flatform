import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "인천 유나이티드 응원가",
  description:
    "인천 유나이티드 응원가 목록과 공식/현장 영상, 가사를 함께 볼 수 있는 모바일 친화형 웹페이지",
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
