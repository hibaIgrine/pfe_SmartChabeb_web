import api from "./axios";
export interface MediaItem {
  type: "image" | "video";
  url: string;
}

export interface Story {
  id: string;
  user_id: string;
  content?: string;
  media?: string; // JSON stringified
  created_at: string;
  expires_at: string;
  user: {
    id: string;
    nom: string;
    prenom: string;
    photo_profil_url?: string;
  };
  views: Array<{
    viewer_id: string;
    viewed_at: string;
    viewer?: {
      id: string;
      nom: string;
      prenom: string;
      photo_profil_url?: string;
    };
  }>;
  hasViewed?: boolean;
  viewCount?: number;
}

export async function fetchStoriesForFeed(): Promise<Story[]> {
  const response = await api.get("/stories/feed");
  return response.data || [];
}

export async function fetchStoriesByUser(userId: string): Promise<Story[]> {
  const response = await api.get(`/stories/user/${userId}`);
  return response.data || [];
}

export async function createStory(
  content?: string,
  media?: MediaItem[],
): Promise<Story> {
  const response = await api.post("/stories/create", {
    content,
    media,
  });
  return response.data;
}

export async function markStoryAsViewed(storyId: string): Promise<void> {
  await api.post(`/stories/${storyId}/view`);
}

export async function deleteStory(storyId: string): Promise<void> {
  await api.delete(`/stories/${storyId}`);
}
