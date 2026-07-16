// docs/design/components/lyrics.md — 가사 표시: 큰 글자·넓은 행간, 카드 전체 색상으로 통합 표시
export default function Lyrics({ text }: { text: string }) {
  return (
    <div className="rounded-md bg-border-light px-5 py-6">
      <p className="whitespace-pre-line text-center text-[17px] leading-[1.75] text-white">
        {text}
      </p>
    </div>
  );
}
