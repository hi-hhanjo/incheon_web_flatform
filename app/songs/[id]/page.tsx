import { getSongById } from "@/lib/api/songs";
import Layout from "@/components/Layout";
import { Button, IconButton } from "@/components/Button";
import VideoSection from "@/components/VideoSection";
import Lyrics from "@/components/Lyrics";
import Feedback from "@/components/Feedback";
import SourceNote from "@/components/SourceNote";

export const revalidate = 3600; // 1시간 단위 정적 재생성 (ISR)

// F-02 상세 화면 (영상 탭 → 영상 → 가사 순서).
export default async function SongDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const song = await getSongById(Number(id));

  if (!song) {
    return (
      <Layout>
        <Feedback
          type="error"
          message="해당 응원가를 찾을 수 없습니다"
          action={<Button href="/" label="목록으로 가기" />}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <IconButton href="/" icon="←" label="목록으로" />

      <h1 className="text-xl font-bold">{song.title}</h1>

      <div className="rounded-md bg-brand p-4">
        <VideoSection videos={song.videos} title={song.title} />
      </div>

      {song.lyrics ? (
        <Lyrics text={song.lyrics} />
      ) : (
        <div className="rounded-md bg-border-light px-5 py-6">
          <Feedback type="empty" message="가사 준비 중입니다" />
        </div>
      )}

      {/* 가사 출처(PRD 9장). 손으로 등록한 곡은 source가 없어 표기하지 않는다. */}
      {song.source && (
        <SourceNote
          label="가사 출처"
          name={song.source.name}
          url={song.source.url}
        />
      )}
    </Layout>
  );
}
