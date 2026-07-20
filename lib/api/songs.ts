import { supabase } from "../supabase";
import type { Song, Video, DataSource } from "./songs.schema";

export async function getSongs(): Promise<Song[]> {
  const { data, error } = await supabase
    .from("songs")
    .select("*, videos(*)");

  if (error) {
    console.error("Error fetching songs:", error);
    return [];
  }

  return (data || []).map(mapToSong);
}

export async function getSongById(id: number): Promise<Song | undefined> {
  const { data, error } = await supabase
    .from("songs")
    .select("*, videos(*)")
    .eq("id", id)
    .single();

  if (error || !data) return undefined;
  return mapToSong(data);
}

function mapToSong(row: any): Song {
  const videos = (row.videos || [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((v: any) => ({
      type: v.type,
      label: v.label,
      youtubeId: v.youtube_id,
    }));

  const source: DataSource | undefined = row.source_name
    ? { name: row.source_name, url: row.source_url }
    : undefined;

  return {
    id: row.id,
    title: row.title,
    lyrics: row.lyrics,
    category: row.category,
    tags: row.tags || [],
    isFavorite: row.is_favorite,
    videos,
    source,
  };
}
