// docs/design/components/youtube-player.md 기준 — 유튜브 영상 ID를 16:9 임베드로 표시
export default function YoutubePlayer({
  youtubeId,
  title,
}: {
  youtubeId: string;
  title: string;
}) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-md bg-bg-surface">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${youtubeId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
