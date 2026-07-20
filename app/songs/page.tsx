import { getSongs } from "@/lib/api/songs";
import Layout from "@/components/Layout";
import SongList from "@/components/SongList";
import Feedback from "@/components/Feedback";

// F-01 목록 화면: Layout → SongList(정렬 토글 + 카드 목록) 또는 Feedback(빈 상태)
export default async function Home() {
  const songs = await getSongs();

  return (
    <Layout>
      <h1 className="text-2xl font-bold">인천 유나이티드 응원가</h1>

      {songs.length === 0 ? (
        <Feedback type="empty" message="등록된 응원가가 없습니다" />
      ) : (
        <SongList songs={songs} />
      )}
    </Layout>
  );
}
