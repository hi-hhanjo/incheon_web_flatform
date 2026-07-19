"use client";

import { useState } from "react";
import { PLAYER_CATEGORY, UNUSED_TAG, type Song } from "@/lib/api/songs.schema";
import { findLyricLine, matchesSong, normalizeKeyword } from "@/lib/search";
import SongCard from "./SongCard";
import SearchBar from "./SearchBar";
import LyricsSnippet from "./LyricsSnippet";
import Feedback from "./Feedback";

// 제목 비교는 항상 한국어 로케일로 한다 — 코드포인트 순서로 정렬하면 영어 제목이 한글보다
// 앞서 버린다("Bandiera" < "회상"). localeCompare(ko)는 한글 → 영어 순으로 놓는다.
const byTitle = (a: Song, b: Song) => a.title.localeCompare(b.title, "ko");

// 정렬 그룹: 팀 응원가(0) → 선수 응원가·현역(1) → 미사용(2). 묶음 안에서는 제목 가나다순.
// 미사용 곡(팀을 떠난 선수의 응원가)이 맨 아래인 이유는, 신규팬이 지금 불리지 않는 곡을
// 목록 상단에서 먼저 만나지 않게 하기 위함이다(PRD 핵심 타겟).
// 분류 기준이 구단 공식 선수단 명단이라 주관적 판단이 들어가지 않는다
// (FUNCTION.md v1.1이 '대표곡 우선 정렬'을 뺀 이유를 반복하지 않기 위함).
function groupOf(song: Song): number {
  if (song.tags.includes(UNUSED_TAG)) return 2;
  return song.category === PLAYER_CATEGORY ? 1 : 0;
}

// F-01 목록 화면: 검색 상태를 들고 있는 클라이언트 컴포넌트
export default function SongList({ songs }: { songs: Song[] }) {
  const [query, setQuery] = useState("");

  // 공백만 친 경우는 검색하지 않은 것과 같게 다룬다.
  const keyword = normalizeKeyword(query);
  const visibleSongs = keyword ? songs.filter((song) => matchesSong(song, keyword)) : songs;

  // 검색으로 걸러낸 뒤에도 정렬 규칙은 그대로다 — 미사용 곡은 검색 결과에서도 맨 아래(FUNCTION.md F-11).
  const sortedSongs = [...visibleSongs].sort(
    (a, b) => groupOf(a) - groupOf(b) || byTitle(a, b)
  );

  return (
    <div className="flex flex-col gap-4">
      <SearchBar query={query} onChange={setQuery} />

      {/* 검색 결과가 없어도 검색창은 남긴다 — 검색어를 고쳐야 하기 때문(FUNCTION.md F-11). */}
      {sortedSongs.length === 0 ? (
        <Feedback type="empty" message={`"${query.trim()}" 검색 결과가 없습니다`} />
      ) : (
        <ul className="flex flex-col gap-3">
          {sortedSongs.map((song, index) => {
            // 가사에 걸린 곡만 스니펫을 붙인다. 제목에만 걸렸으면 카드 제목이 이미 근거다.
            const segments = keyword ? findLyricLine(song.lyrics, keyword) : null;

            return (
              <li key={song.id}>
                <SongCard id={song.id} title={song.title} tags={song.tags} index={index} />
                {/* 카드는 링크라 스니펫을 그 안에 넣으면 가사까지 링크가 된다 — 형제로 둔다. */}
                {segments && <LyricsSnippet segments={segments} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
