/**
 * useSocialFeed.ts — Hook custom centralisant toute la logique du fil d'actualité.
 *
 * RÔLE :
 *   Encapsule l'ensemble des opérations du feed social pour SocialFeedPage.
 *   Séparation propre entre la logique métier (hook) et le rendu (composant).
 *
 * ÉTAT GÉRÉ :
 *   posts[]          — Publications chargées (paginées)
 *   hasMore          — Y a-t-il d'autres pages ?
 *   isLoading        — Chargement initial
 *   isLoadingMore    — Chargement de la page suivante (infinite scroll)
 *   hiddenUsers[]    — Utilisateurs masqués (filtrés du feed en front-end)
 *   mentionUsers[]   — Utilisateurs pour l'autocomplétion @mention
 *   currentUserId    — ID de l'utilisateur connecté (pour les actions "c'est moi")
 *
 * FONCTIONS EXPOSÉES :
 *   loadMore()           — Charge la page suivante (offset += limit)
 *   handleCreatePost()   — createPublication() + prepend au feed
 *   handleDeletePost()   — deletePublication() + remove du feed
 *   handleUpdatePost()   — updatePublication() + replace dans le feed
 *   handleSharePost()    — sharePublication() + prepend
 *   handleReaction()     — addReaction() ou removeReaction() + update optimiste
 *   handleFavorite()     — addFavorite() ou removeFavorite() + dispatch 'social-favorites-updated'
 *   handleHideUser()     — hideUser() + filtre les posts de cet auteur
 *   handleUnhideUser()   — unhideUser() + rechargement du feed
 *
 * ÉVÉNEMENTS WINDOW DISPATCHED :
 *   'social-favorites-updated' → pour FavoritePostsBell (rafraîchit le badge)
 */
import { useEffect, useMemo, useState } from "react";
import {
  addFavorite,
  addReaction,
  createPublication,
  deletePublication,
  fetchHiddenUsers,
  fetchFeed,
  hideUser,
  fetchMentionUsers,
  removeFavorite,
  removeReaction,
  sharePublication,
  unhideUser,
  updatePublication,
} from "../../../api/social-media.api";
import type {
  HiddenUserLink,
  MentionUser,
  Publication,
  PublicationMediaItem,
  PublicationMediaType,
  PublicationVisibility,
  ReactionType,
} from "../../../api/social-media.api";
import {
  EMPTY_MEDIA,
  type DraftMediaItem,
  type SocialFeedCurrentUser,
} from "../types";

export function useSocialFeed() {
  const [posts, setPosts] = useState<Publication[]>([]);
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [hiddenAuthors, setHiddenAuthors] = useState<HiddenUserLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [composerText, setComposerText] = useState("");
  const [draftMediaItems, setDraftMediaItems] = useState<DraftMediaItem[]>([]);
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState<PublicationVisibility>("PUBLIC");
  const [mentions, setMentions] = useState<MentionUser[]>([]);
  const [hiddenUsers, setHiddenUsers] = useState<MentionUser[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const me = useMemo(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser) as SocialFeedCurrentUser;
    } catch {
      return null;
    }
  }, []);

  const canSubmit =
    composerText.trim().length > 0 ||
    draftMediaItems.some((media) => media.url.trim().length > 0) ||
    location.trim().length > 0 ||
    mentions.length > 0 ||
    hashtags.length > 0;

  const loadFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFeed(30, 0);
      setPosts(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de charger le fil d actualite.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMentionUsers = async () => {
    try {
      const users = await fetchMentionUsers();
      setMentionUsers(Array.isArray(users) ? users : []);
    } catch {
      setMentionUsers([]);
    }
  };

  const loadHiddenAuthors = async () => {
    try {
      const hidden = await fetchHiddenUsers();
      setHiddenAuthors(Array.isArray(hidden) ? hidden : []);
    } catch {
      setHiddenAuthors([]);
    }
  };

  useEffect(() => {
    loadFeed();
    loadMentionUsers();
    loadHiddenAuthors();
  }, []);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Lecture fichier impossible"));
      reader.readAsDataURL(file);
    });

  const addMediaFile = async (
    type: PublicationMediaType,
    file: File | null,
  ) => {
    if (!file) {
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 20MB).");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setDraftMediaItems((prev) => [
        ...prev,
        {
          ...EMPTY_MEDIA,
          type,
          url: dataUrl,
          name: file.name,
          mimeType: file.type,
        },
      ]);
      setError(null);
    } catch {
      setError("Impossible de charger ce fichier depuis votre PC.");
    }
  };

  const removeMediaLine = (index: number) => {
    setDraftMediaItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addMentionById = (id: string) => {
    if (!id) return;
    const selected = mentionUsers.find((user) => user.id === id);
    if (!selected) return;

    setMentions((prev) => {
      if (prev.some((user) => user.id === selected.id)) return prev;
      return [...prev, selected];
    });
  };

  const removeMention = (id: string) => {
    setMentions((prev) => prev.filter((user) => user.id !== id));
  };

  const addHiddenUserById = (id: string) => {
    if (!id) return;
    const selected = mentionUsers.find((user) => user.id === id);
    if (!selected) return;

    setHiddenUsers((prev) => {
      if (prev.some((user) => user.id === selected.id)) return prev;
      return [...prev, selected];
    });
  };

  const removeHiddenUser = (id: string) => {
    setHiddenUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const addHashtag = () => {
    const clean = hashtagInput.trim().replace(/^#+/, "").replace(/\s+/g, "_");
    if (!clean) return;

    setHashtags((prev) => {
      if (prev.includes(clean)) return prev;
      return [...prev, clean];
    });
    setHashtagInput("");
  };

  const removeHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((item) => item !== tag));
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setComposerText("");
    setDraftMediaItems([]);
    setLocation("");
    setVisibility("PUBLIC");
    setMentions([]);
    setHiddenUsers([]);
    setHashtagInput("");
    setHashtags([]);
  };

  const startEditPost = (post: Publication) => {
    setEditingPostId(post.id);
    setComposerText(post.content ?? "");
    setDraftMediaItems(
      (post.media ?? []).map((item) => ({
        type: item.type,
        url: item.url,
        name: item.name ?? "",
        mimeType: undefined,
      })),
    );
    setLocation(post.location ?? "");
    setVisibility(post.visibility ?? "PUBLIC");
    setMentions((post.mentions ?? []).map((item) => item.mentioned_user));
    setHiddenUsers((post.hidden_users ?? []).map((item) => item.hidden_user));
    setHashtagInput("");
    setHashtags((post.hashtags ?? []).map((item) => item.hashtag));
  };

  const publish = async () => {
    if (!canSubmit) return;

    const mediaPayload: PublicationMediaItem[] = draftMediaItems
      .filter((item) => item.url.trim().length > 0)
      .map((item) => ({
        type: item.type,
        url: item.url.trim(),
        name: item.name.trim() || undefined,
      }));

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        content: composerText.trim() || undefined,
        visibility,
        location: location.trim() || undefined,
        media: mediaPayload.length ? mediaPayload : undefined,
        hashtags: hashtags.length ? hashtags : undefined,
        mentioned_user_ids: mentions.map((user) => user.id),
        hidden_user_ids:
          visibility === "MASKED" ? hiddenUsers.map((user) => user.id) : [],
      };

      if (editingPostId) {
        const updated = await updatePublication(editingPostId, payload);
        setPosts((prev) =>
          prev.map((post) => (post.id === editingPostId ? updated : post)),
        );
      } else {
        const created = await createPublication(payload);
        setPosts((prev) => [created, ...prev]);
      }

      cancelEdit();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Publication echouee.");
    } finally {
      setSubmitting(false);
    }
  };

  const removePost = async (postId: string) => {
    try {
      await deletePublication(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Suppression impossible pour cette publication.",
      );
    }
  };

  const reactToPost = async (postId: string, reactionType: ReactionType) => {
    try {
      const reactions = await addReaction(postId, reactionType);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, reactions } : post,
        ),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de réagir à cette publication.",
      );
    }
  };

  const removePostReaction = async (postId: string) => {
    try {
      const reactions = await removeReaction(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, reactions } : post,
        ),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de retirer la réaction de cette publication.",
      );
    }
  };

  const sharePost = async (postId: string, message?: string) => {
    try {
      setError(null);
      const shared = await sharePublication(postId, message);
      setPosts((prev) => [shared, ...prev]);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de partager cette publication.",
      );
    }
  };

  const toggleFavoritePost = async (postId: string, isFavorite: boolean) => {
    try {
      const updatedPost = isFavorite
        ? await removeFavorite(postId)
        : await addFavorite(postId);

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, ...updatedPost } : post,
        ),
      );
      window.dispatchEvent(new Event("social-favorites-updated"));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de mettre a jour les favoris pour cette publication.",
      );
    }
  };

  const hideAuthorPosts = async (userIdToHide: string) => {
    if (!userIdToHide || userIdToHide === me?.id) {
      return;
    }

    try {
      await hideUser(userIdToHide);
      setPosts((prev) => prev.filter((post) => post.user?.id !== userIdToHide));
      await loadHiddenAuthors();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de masquer cette personne pour le moment.",
      );
    }
  };

  const unhideAuthorPosts = async (userIdToUnhide: string) => {
    if (!userIdToUnhide) {
      return;
    }

    try {
      await unhideUser(userIdToUnhide);
      setHiddenAuthors((prev) =>
        prev.filter((item) => item.hidden_user_id !== userIdToUnhide),
      );
      await loadFeed();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de demasquer cette personne pour le moment.",
      );
    }
  };

  return {
    posts,
    mentionUsers,
    hiddenAuthors,
    loading,
    submitting,
    error,
    me,
    composerText,
    draftMediaItems,
    location,
    visibility,
    mentions,
    hiddenUsers,
    hashtagInput,
    hashtags,
    canSubmit,
    setComposerText,
    setLocation,
    setVisibility,
    setHashtagInput,
    loadFeed,
    loadHiddenAuthors,
    addMediaFile,
    removeMediaLine,
    addMentionById,
    removeMention,
    addHiddenUserById,
    removeHiddenUser,
    addHashtag,
    removeHashtag,
    publish,
    removePost,
    editingPostId,
    startEditPost,
    cancelEdit,
    reactToPost,
    removePostReaction,
    sharePost,
    toggleFavoritePost,
    hideAuthorPosts,
    unhideAuthorPosts,
  };
}
