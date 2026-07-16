"use client";

import type { Video } from "@/lib/api/songs";

// docs/design/components/video-tabs.md 기준 — 공식/현장 등 영상 선택 세그먼트 탭
export default function VideoTabs({
  videos,
  selectedIndex,
  onSelect,
}: {
  videos: Video[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="inline-flex gap-1 self-start rounded-full bg-bg-interactive p-1">
      {videos.map((video, index) => (
        <button
          key={video.type}
          type="button"
          onClick={() => onSelect(index)}
          className={`min-h-11 rounded-full px-4 text-[15px] font-semibold ${
            index === selectedIndex
              ? "bg-brand text-white"
              : "text-text-secondary"
          }`}
        >
          {video.label}
        </button>
      ))}
    </div>
  );
}
