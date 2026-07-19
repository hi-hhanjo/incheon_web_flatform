"use client";

import { useState } from "react";
import type { Video } from "@/lib/api/songs.schema";
import VideoTabs from "./VideoTabs";
import YoutubePlayer from "./YoutubePlayer";
import Feedback from "./Feedback";

// F-04: videos 개수에 따라 탭 표시 여부를 결정하고, 선택된 영상 1개만 불러온다.
export default function VideoSection({
  videos,
  title,
}: {
  videos: Video[];
  title: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (videos.length === 0) {
    return <Feedback type="empty" message="영상 준비 중입니다" />;
  }

  const selectedVideo = videos[selectedIndex];

  return (
    <div className="flex flex-col gap-3">
      {videos.length > 1 && (
        <VideoTabs
          videos={videos}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      )}
      <YoutubePlayer youtubeId={selectedVideo.youtubeId} title={title} />
    </div>
  );
}
