import { useEffect, useMemo, useState } from "react";
import {
  addReaction,
  createPublication,
  deletePublication,
  fetchFeed,
  fetchMentionUsers,
  removeReaction,
  updatePublication,
} from "../../../api/social-media.api";
import type {
  MentionUser,
  Publication,
  PublicationMediaItem,
  PublicationMediaType,
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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [composerText, setComposerText] = useState("");
  const [draftMediaItems, setDraftMediaItems] = useState<DraftMediaItem[]>([]);
  const [location, setLocation] = useState("");
  const [mentions, setMentions] = useState<MentionUser[]>([]);
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

  useEffect(() => {
    loadFeed();
    loadMentionUsers();
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
    setMentions([]);
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
    setMentions((post.mentions ?? []).map((item) => item.mentioned_user));
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
        location: location.trim() || undefined,
        media: mediaPayload.length ? mediaPayload : undefined,
        hashtags: hashtags.length ? hashtags : undefined,
        mentioned_user_ids: mentions.map((user) => user.id),
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

  return {
    posts,
    mentionUsers,
    loading,
    submitting,
    error,
    me,
    composerText,
    draftMediaItems,
    location,
    mentions,
    hashtagInput,
    hashtags,
    canSubmit,
    setComposerText,
    setLocation,
    setHashtagInput,
    loadFeed,
    addMediaFile,
    removeMediaLine,
    addMentionById,
    removeMention,
    addHashtag,
    removeHashtag,
    publish,
    removePost,
    editingPostId,
    startEditPost,
    cancelEdit,
    reactToPost,
    removePostReaction,
  };
}
