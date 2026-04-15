import api from "./axios";

export type PublicationMediaType = "image" | "video" | "document";
export type ReactionType =
  | "like"
  | "love"
  | "wow"
  | "bravo"
  | "instructif"
  | "soutien"
  | "haha";

export type PublicationMediaItem = {
  type: PublicationMediaType;
  url: string;
  name?: string;
};

export type PublicationAuthor = {
  id: string;
  nom: string;
  prenom: string;
  photo_profil_url?: string | null;
};

export type MentionUser = {
  id: string;
  nom: string;
  prenom: string;
};

export type PublicationComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: PublicationAuthor;
};

export type ReactionSummary = {
  aggregated: Record<ReactionType, PublicationAuthor[]>;
  total: number;
  userReaction: ReactionType | null;
};

export type Publication = {
  id: string;
  content: string;
  location?: string | null;
  media?: PublicationMediaItem[] | null;
  hashtags?: Array<{ hashtag: string }>;
  mentions?: Array<{ mentioned_user: PublicationAuthor }>;
  reactions?: ReactionSummary;
  created_at: string;
  updated_at: string;
  user: PublicationAuthor;
  _count?: {
    comments: number;
  };
};

export type CreatePublicationPayload = {
  content?: string;
  location?: string;
  media?: PublicationMediaItem[];
  hashtags?: string[];
  mentioned_user_ids?: string[];
};

export async function fetchFeed(limit = 20, offset = 0) {
  const response = await api.get<Publication[]>("/social-media/posts", {
    params: { limit, offset },
  });
  return response.data;
}

export async function fetchPost(postId: string) {
  const response = await api.get<Publication>(`/social-media/posts/${postId}`);
  return response.data;
}

export async function createPublication(payload: CreatePublicationPayload) {
  const response = await api.post<Publication>("/social-media/posts", payload);
  return response.data;
}

export async function updatePublication(
  postId: string,
  payload: CreatePublicationPayload,
) {
  const response = await api.patch<Publication>(
    `/social-media/posts/${postId}`,
    payload,
  );
  return response.data;
}

export async function deletePublication(postId: string) {
  await api.delete(`/social-media/posts/${postId}`);
}

export async function sharePublication(postId: string, message?: string) {
  const response = await api.post<Publication>(
    `/social-media/posts/${postId}/share`,
    { message },
  );
  return response.data;
}

export async function fetchMentionUsers() {
  const response = await api.get<MentionUser[]>("/users");
  return response.data;
}

export async function addReaction(postId: string, reactionType: ReactionType) {
  const response = await api.post<ReactionSummary>(
    `/social-media/posts/${postId}/reactions`,
    { reaction_type: reactionType },
  );
  return response.data;
}

export async function removeReaction(postId: string) {
  const response = await api.delete<ReactionSummary>(
    `/social-media/posts/${postId}/reactions`,
  );
  return response.data;
}

export async function fetchReactions(postId: string) {
  const response = await api.get<ReactionSummary>(
    `/social-media/posts/${postId}/reactions`,
  );
  return response.data;
}

export async function fetchComments(postId: string) {
  const response = await api.get<PublicationComment[]>(
    `/social-media/posts/${postId}/comments`,
  );
  return response.data;
}

export async function createComment(postId: string, content: string) {
  const response = await api.post<PublicationComment>(
    `/social-media/posts/${postId}/comments`,
    { content },
  );
  return response.data;
}

export async function updateComment(
  postId: string,
  commentId: string,
  content: string,
) {
  const response = await api.patch<PublicationComment>(
    `/social-media/posts/${postId}/comments/${commentId}`,
    { content },
  );
  return response.data;
}

export async function deleteComment(postId: string, commentId: string) {
  await api.delete(`/social-media/posts/${postId}/comments/${commentId}`);
}
