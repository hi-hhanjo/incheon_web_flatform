"use client";

import { useEffect, useState, useRef } from "react";

interface Section {
  id: string;
  label: string;
}

interface FloatingNavProps {
  sections: Section[];
}

export default function FloatingNav({ sections }: FloatingNavProps) {
  const [activeId, setActiveId] = useState<string>("");
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId: number;

    const handleScrollEvent = () => {
      if (frameId) window.cancelAnimationFrame(frameId);

      frameId = window.requestAnimationFrame(() => {
        // 스크롤이 맨 밑에 도달했는지 확인 (여유 버퍼 20px)
        const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 20;

        let newActiveId = sections[0]?.id;

        if (isBottom) {
          newActiveId = sections[sections.length - 1]?.id;
        } else {
          const scrollPosition = window.scrollY + 120; // 탭바 오프셋보다 살짝 넉넉하게 잡음

          for (const section of sections) {
            const element = document.getElementById(section.id);
            if (element) {
              const elementTop = element.getBoundingClientRect().top + window.scrollY;
              if (elementTop <= scrollPosition) {
                newActiveId = section.id;
              }
            }
          }
        }

        if (newActiveId && newActiveId !== activeId) {
          setActiveId(newActiveId);

          // 모바일 가로 스크롤 시 선택된 탭이 화면 중앙에 오도록 스크롤 이동
          if (navRef.current) {
            const activeBtn = navRef.current.querySelector(`[data-id="${newActiveId}"]`) as HTMLElement;
            if (activeBtn) {
              const containerWidth = navRef.current.offsetWidth;
              const btnLeft = activeBtn.offsetLeft;
              const btnWidth = activeBtn.offsetWidth;
              navRef.current.scrollTo({
                left: btnLeft - containerWidth / 2 + btnWidth / 2,
                behavior: "smooth",
              });
            }
          }
        }
      });
    };

    window.addEventListener("scroll", handleScrollEvent);
    handleScrollEvent(); // 초기 1회 실행

    return () => {
      window.removeEventListener("scroll", handleScrollEvent);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [sections, activeId]);

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // sticky 탭바 높이를 고려하여 오프셋 적용
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* 모바일 탭 바 (lg 미만에서는 상단 sticky 노출) */}
      <div 
        ref={navRef}
        className="lg:hidden sticky top-0 z-50 flex overflow-x-auto bg-[#0E1116]/95 backdrop-blur-sm border-b border-border-dim whitespace-nowrap -mx-4 px-4 py-3 gap-2 hide-scrollbar shadow-md"
      >
        {sections.map((section) => (
          <button
            key={section.id}
            data-id={section.id}
            onClick={() => handleScroll(section.id)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors shrink-0 shadow-sm ${
              activeId === section.id
                ? "bg-brand text-white"
                : "bg-bg-surface text-text-muted hover:text-white border border-border-dim"
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* 데스크톱 세로 탭 (lg 이상에서 우측 고정) */}
      <div className="hidden lg:flex fixed top-1/2 -translate-y-1/2 right-4 xl:right-8 z-50 flex-col gap-1.5 p-3 rounded-2xl bg-[#0E1116]/80 backdrop-blur-md border border-border-dim shadow-xl">
        <h3 className="text-xs font-bold text-text-muted px-2 mb-1">빠른 탐색</h3>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => handleScroll(section.id)}
            className={`text-sm px-3 py-2 rounded-lg transition-colors text-left w-36 relative ${
              activeId === section.id
                ? "text-white font-bold bg-bg-surface"
                : "text-text-muted hover:text-white hover:bg-bg-surface/50"
            }`}
          >
            {activeId === section.id && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-brand rounded-r-full" />
            )}
            {section.label}
          </button>
        ))}
      </div>
    </>
  );
}
