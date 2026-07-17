"use client";

import { useState } from "react";
import { PLAYER_CATEGORY, UNUSED_TAG, type Song } from "@/lib/api/songs";
import SongCard from "./SongCard";
import SortToggle, { type SortMode } from "./SortToggle";

// 제목 비교는 항상 한국어 로케일로 한다 — 코드포인트 순서로 정렬하면 영어 제목이 한글보다
// 앞서 버린다("Bandiera" < "회상"). localeCompare(ko)는 한글 → 영어 순으로 놓는다.
const byTitle = (a: Song, b: Song) => a.title.localeCompare(b.title, "ko");

// 미사용 곡(팀을 떠난 선수의 응원가)은 정렬 방식과 무관하게 항상 맨 아래 묶음이다.
// 신규팬이 지금 불리지 않는 곡을 목록 상단에서 먼저 만나지 않도록 하기 위함(PRD 핵심 타겟).
const isUnused = (song: Song) => (song.tags.includes(UNUSED_TAG) ? 1 : 0);

// 기본 정렬 그룹: 팀 응원가(0) → 선수 응원가·현역(1) → 미사용(2).
// 분류 기준이 구단 공식 선수단 명단이라 주관적 판단이 들어가지 않는다
// (FUNCTION.md v1.1이 '대표곡 우선 정렬'을 뺀 이유를 반복하지 않기 위함).
function groupOf(song: Song): number {
  if (isUnused(song)) return 2;
  return song.category === PLAYER_CATEGORY ? 1 : 0;
}

// F-01 목록 화면: 정렬 상태(기본/가나다순)를 들고 있는 클라이언트 컴포넌트
export default function SongList({ songs }: { songs: Song[] }) {
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const sortedSongs = [...songs].sort((a, b) =>
    sortMode === "alphabetical"
      ? isUnused(a) - isUnused(b) || byTitle(a, b)
      : groupOf(a) - groupOf(b) || byTitle(a, b)
  );

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
