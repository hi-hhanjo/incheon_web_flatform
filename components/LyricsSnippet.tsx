import type { Segment } from "@/lib/search";

// docs/design/components/lyrics-snippet.md — 검색어에 걸린 가사 한 줄. 카드 아래에 붙어
// "왜 이 곡이 검색됐는지"를 목록에서 바로 보여준다(F-11). 어느 줄을 어떻게 쪼갤지는
// lib/search.ts가 정하고, 이 부품은 받은 조각을 그리기만 한다.
export default function LyricsSnippet({ segments }: { segments: Segment[] }) {
  return (
    <p className="mt-1 rounded-sm bg-bg-surface px-4 py-3 text-[15px] text-text-secondary">
      {segments.map((segment, index) =>
        segment.matched ? (
          // <mark>의 브라우저 기본색(노란 배경·검은 글자)은 다크 테마 팔레트 밖이라 덮어쓴다.
          // 파랑은 "당신의 검색어가 여기 걸렸다"는 상태 표시라 BASE.md 1장의 기능적 사용에 해당한다.
          <mark key={index} className="rounded-xs bg-brand px-0.5 text-white">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </p>
  );
}
