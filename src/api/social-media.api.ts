/**
 * social-media.api.ts — Appels API REST pour le réseau social (fil d'actualité).
 *
 * RÔLE :
 *   Centralise toutes les opérations HTTP du module social : publications, réactions,
 *   commentaires, favoris, stories, profils publics, following/followers, masquage.
 *
 * TYPES PRINCIPAUX :
 *   PublicationVisibility  — 'PUBLIC' | 'PRIVATE' | 'MASKED'
 *                            PUBLIC = tout le monde, PRIVATE = abonnés, MASKED = caché pour certains
 *   ReactionType           — 'like' | 'love' | 'wow' | 'bravo' | 'instructif' | 'soutien' | 'haha'
 *   Publication            — Post complet avec auteur, médias, hashtags, mentions, réactions
 *   ReactionSummary        — { aggregated: {type: auteurs[]}, total, userReaction }
 *   PublicUserProfile      — Profil public d'un utilisateur avec compteurs (followers, posts…)
 *
 * FONCTIONS PAR CATÉGORIE :
 *
 *   PUBLICATIONS :
 *     fetchFeed(limit, offset)         — Fil d'actualité paginé (GET /social-media/posts)
 *     fetchPost(id)                    — Détail d'un post
 *     fetchPostsByUser(userId)         — Posts d'un utilisateur spécifique
 *     createPublication(payload)       — Crée un post (contenu, visibilité, médias, hashtags, mentions)
 *     updatePublication(id, payload)   — Modifie un post existant
 *     deletePublication(id)            — Supprime un post
 *     sharePublication(id, message)    — Repartage avec token [[shared:<base64>]] côté serveur
 *
 *   RÉACTIONS :
 *     addReaction(postId, type)        — Ajoute/change une réaction (upsert côté serveur)
 *     removeReaction(postId)           — Retire la réaction
 *     fetchReactions(postId)           — Récupère le résumé des réactions
 *
 *   FAVORIS :
 *     fetchFavoritePosts()             — Mes posts favoris
 *     fetchFavoritePostsCount()        — Nombre de favoris (badge dans FavoritePostsBell)
 *     addFavorite(postId)              — Ajoute aux favoris
 *     removeFavorite(postId)           — Retire des favoris
 *
 *   COMMENTAIRES :
 *     fetchComments(postId)            — Liste les commentaires d'un post
 *     createComment(postId, content)   — Ajoute un commentaire (avec mentions optionnelles)
 *     updateComment(postId, id, content) — Modifie un commentaire
 *     deleteComment(postId, id)        — Supprime un commentaire
 *
 *   PROFILS & FOLLOWING :
 *     fetchPublicUserProfile(userId)   — Profil public + compteurs + isFollowing
 *     followUser(userId)               — Abonne au fil d'un utilisateur
 *     unfollowUser(userId)             — Se désabonne
 *     fetchMyFollowingUsers()          — Liste des utilisateurs que je suis
 *     fetchMentionUsers()              — Tous les users (pour l'autocomplétion @mention)
 *
 *   MASQUAGE :
 *     hideUser(userId)                 — Cache les posts d'un utilisateur dans son feed
 *     unhideUser(userId)               — Rétablit la visibilité
 *     fetchHiddenUsers()               — Liste des utilisateurs masqués
 */
import api from "./axios";

export type PublicationMediaType = "image" | "video" | "document";
export type PublicationVisibility = "PUBLIC" | "PRIVATE" | "MASKED";
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
  visibility?: PublicationVisibility;
  location?: string | null;
  media?: PublicationMediaItem[] | null;
  hashtags?: Array<{ hashtag: string }>;
  mentions?: Array<{ mentioned_user: PublicationAuthor }>;
  hidden_users?: Array<{
    hidden_user_id: string;
    hidden_user: PublicationAuthor;
  }>;
  reactions?: ReactionSummary;
  created_at: string;
  updated_at: string;
  user: PublicationAuthor;
  is_favorite?: boolean;
  favorite_count?: number;
  _count?: {
    comments: number;
  };
};

export type FavoriteCountResponse = {
  count: number;
};

export type CreatePublicationPayload = {
  content?: string;
  visibility?: PublicationVisibility;
  location?: string;
  media?: PublicationMediaItem[];
  hashtags?: string[];
  mentioned_user_ids?: string[];
  hidden_user_ids?: string[];
};

export type HiddenUserLink = {
  id: string;
  user_id: string;
  hidden_user_id: string;
  created_at: string;
  hidden_user: PublicationAuthor;
};

export type PublicUserProfile = {
  id: string;
  nom: string;
  prenom: string;
  role?: string | null;
  bio?: string | null;
  genre?: string | null;
  date_naissance?: string | null;
  photo_profil_url?: string | null;
  lieu_habite?: string | null;
  etablissement_etude?: string | null;
  points?: number;
  centre?: {
    id: string;
    nom: string;
    gouvernorat?: string | null;
  } | null;
  _count?: {
    followers: number;
    following: number;
    posts: number;
  };
  isMe: boolean;
  isFollowing: boolean;
};

export type FollowedUserLink = {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
  followed: PublicationAuthor & {
    role?: string | null;
  };
};

export type FollowerUserLink = {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
  follower: PublicationAuthor & {
    role?: string | null;
  };
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

export async function fetchPostsByUser(userId: string, limit = 20, offset = 0) {
  const response = await api.get<Publication[]>(
    `/social-media/users/${userId}/posts`,
    {
      params: { limit, offset },
    },
  );
  return response.data;
}

export async function fetchFavoritePosts(limit = 20, offset = 0) {
  const response = await api.get<Publication[]>(
    "/social-media/favorites/posts",
    {
      params: { limit, offset },
    },
  );
  return response.data;
}

export async function fetchFavoritePostsCount() {
  const response = await api.get<FavoriteCountResponse>(
    "/social-media/favorites/count",
  );
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

export async function addFavorite(postId: string) {
  const response = await api.post<Publication>(
    `/social-media/posts/${postId}/favorites`,
  );
  return response.data;
}

export async function removeFavorite(postId: string) {
  const response = await api.delete<Publication>(
    `/social-media/posts/${postId}/favorites`,
  );
  return response.data;
}

export async function fetchComments(postId: string) {
  const response = await api.get<PublicationComment[]>(
    `/social-media/posts/${postId}/comments`,
  );
  return response.data;
}

export async function createComment(
  postId: string,
  content: string,
  mentionedUserIds?: string[],
) {
  const response = await api.post<PublicationComment>(
    `/social-media/posts/${postId}/comments`,
    { content, mentioned_user_ids: mentionedUserIds },
  );
  return response.data;
}

export async function updateComment(
  postId: string,
  commentId: string,
  content: string,
  mentionedUserIds?: string[],
) {
  const response = await api.patch<PublicationComment>(
    `/social-media/posts/${postId}/comments/${commentId}`,
    { content, mentioned_user_ids: mentionedUserIds },
  );
  return response.data;
}

export async function deleteComment(postId: string, commentId: string) {
  await api.delete(`/social-media/posts/${postId}/comments/${commentId}`);
}

export async function hideUser(userId: string) {
  const response = await api.post<{ success: boolean }>(
    `/social-media/users/${userId}/hide`,
  );
  return response.data;
}

export async function unhideUser(userId: string) {
  const response = await api.delete<{ success: boolean }>(
    `/social-media/users/${userId}/hide`,
  );
  return response.data;
}

export async function fetchHiddenUsers() {
  const response = await api.get<HiddenUserLink[]>(
    "/social-media/users/hidden",
  );
  return response.data;
}

export async function fetchPublicUserProfile(userId: string) {
  const response = await api.get<PublicUserProfile>(
    `/users/${userId}/public-profile`,
  );
  return response.data;
}

export async function followUser(userId: string) {
  const response = await api.post<{ success: boolean }>(
    `/users/${userId}/follow`,
  );
  return response.data;
}

export async function unfollowUser(userId: string) {
  const response = await api.delete<{ success: boolean }>(
    `/users/${userId}/follow`,
  );
  return response.data;
}

export async function fetchMyFollowingUsers() {
  const response = await api.get<FollowedUserLink[]>(`/users/me/following`);
  return response.data;
}

export async function fetchUserFollowers(userId: string) {
  const response = await api.get<FollowerUserLink[]>(`/users/${userId}/followers`);
  return response.data;
}

export async function fetchUserFollowing(userId: string) {
  const response = await api.get<FollowedUserLink[]>(`/users/${userId}/following`);
  return response.data;
}
