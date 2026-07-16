"use client";

import { useState } from "react";
import type { Song } from "@/lib/api/songs";
import SongCard from "./SongCard";
import SortToggle, { type SortMode } from "./SortToggle";

// F-01 목록 화면: 정렬 상태(기본/가나다순)를 들고 있는 클라이언트 컴포넌트
export default function SongList({ songs }: { songs: Song[] }) {
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const sortedSongs =
    sortMode === "alphabetical"
      ? [...songs].sort((a, b) => a.title.localeCompare(b.title, "ko"))
      : songs;

  return (
    <div className="flex flex-col gap-4">
      <SortToggle sortMode={sortMode} onChange={setSortMode} />

      <ul className="flex flex-col gap-3">
        {sortedSongs.map((song, index) => (
          <li key={song.id}>
            <SongCard id={song.id} title={song.title} tags={song.tags} index={index} />
          </li>
        ))}
      </ul>
    </div>
  );
}
