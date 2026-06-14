/**
 * stories.api.ts — Appels API pour les stories éphémères (24h).
 *
 * RÔLE :
 *   Gère les opérations CRUD sur les stories visibles dans le fil d'actualité.
 *   Les stories expirent automatiquement 24h après leur création (expires_at côté serveur).
 *
 * TYPE Story :
 *   media     — JSON stringifié d'un tableau MediaItem[] (type, url, textY)
 *   views     — Tableau des vues avec viewer_id, viewed_at, et profil du viewer
 *   hasViewed — Booléen calculé côté serveur (si l'utilisateur courant a vu cette story)
 *   isExpired — Booléen calculé si expires_at < now (archive uniquement)
 *
 * FONCTIONS EXPORTÉES :
 *   fetchStoriesForFeed()      — GET /stories/feed  → stories actives (< 24h) pour le fil
 *                                Groupées par utilisateur dans StoryReel
 *   fetchStoriesByUser(id)     — GET /stories/user/:id → stories d'un profil spécifique
 *   createStory(content, media)— POST /stories/create → nouvelle story avec image/vidéo
 *   markStoryAsViewed(id)      — POST /stories/:id/view → enregistre la vue (idempotent)
 *   deleteStory(id)            — DELETE /stories/:id → suppression immédiate
 *   fetchMyStoryArchive()      — GET /stories/me/archive → toutes mes stories (y compris expirées)
 */
import api from "./axios";
export interface MediaItem {
  type: "image" | "video";
  url: string;
  textY?: number;
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
  isExpired?: boolean;
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

export async function fetchMyStoryArchive(): Promise<Story[]> {
  const response = await api.get("/stories/me/archive");
  return response.data || [];
}
