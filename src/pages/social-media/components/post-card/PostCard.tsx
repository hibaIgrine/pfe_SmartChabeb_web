import { useEffect, useMemo, useRef, useState } from "react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import {
  createComment,
  deleteComment,
  fetchComments,
  fetchFeed,
  fetchMentionUsers,
  updateComment,
} from "../../../../api/social-media.api";
import type {
  MentionUser,
  Publication,
  PublicationComment,
  ReactionType,
} from "../../../../api/social-media.api";
import {
  Edit2,
  FileText,
  Heart,
  ImagePlus,
  MapPin,
  Reply,
  Send,
  Smile,
  X,
} from "lucide-react";
import { ReactionBar } from "../ReactionBar";
import {
  parseCommentContent,
  serializeCommentContent,
  type ParsedComment,
} from "./comment-content";
import { parseSharedPostContent } from "./shared-post-content";
import { OriginalPostModal } from "./OriginalPostModal";

type CommentWithMeta = PublicationComment & {
  parsed: ParsedComment;
};

type PostCardProps = {
  post: Publication;
  canDelete: boolean;
  canEdit: boolean;
  defaultCommentsOpen?: boolean;
  currentUserId?: string;
  onDelete: (postId: string) => void;
  onEdit: (post: Publication) => void;
  onReact?: (postId: string, reactionType: ReactionType) => void;
  onRemoveReaction?: (postId: string) => void;
  onShare?: (postId: string, message?: string) => void | Promise<void>;
  onToggleFavorite?: (postId: string, isFavorite: boolean) => void;
};

export function PostCard({
  post,
  canDelete,
  canEdit,
  defaultCommentsOpen = false,
  currentUserId,
  onDelete,
  onEdit,
  onReact,
  onRemoveReaction,
  onShare,
  onToggleFavorite,
}: PostCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(
    null,
  );
  const [showComments, setShowComments] = useState(defaultCommentsOpen);
  const [comments, setComments] = useState<PublicationComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [mentionUsersLoaded, setMentionUsersLoaded] = useState(false);
  const [commentMentionOpen, setCommentMentionOpen] = useState(false);
  const [commentMentionQuery, setCommentMentionQuery] = useState("");
  const [commentMentionStart, setCommentMentionStart] = useState<number | null>(
    null,
  );
  const [commentImageUrl, setCommentImageUrl] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [replyImageUrl, setReplyImageUrl] = useState("");
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentInput, setEditingCommentInput] = useState("");
  const [editingCommentImageUrl, setEditingCommentImageUrl] = useState("");
  const [editingCommentReplyToId, setEditingCommentReplyToId] = useState<
    string | null
  >(null);
  const [showEditEmojiPickerFor, setShowEditEmojiPickerFor] = useState<
    string | null
  >(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [viewingOriginalPostId, setViewingOriginalPostId] = useState<
    string | null
  >(null);
  const [sharedOpenError, setSharedOpenError] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const commentImageInputRef = useRef<HTMLInputElement | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const replyImageInputRef = useRef<HTMLInputElement | null>(null);
  const editCommentImageInputRef = useRef<HTMLInputElement | null>(null);

  const formatMentionHandle = (user: MentionUser) =>
    `${user.nom.trim().replace(/\s+/g, "_")}_${user.prenom
      .trim()
      .replace(/\s+/g, "_")}`;

  const normalizeMentionHandle = (user: MentionUser) =>
    formatMentionHandle(user).toLowerCase();

  const getMentionContext = (value: string, caretPosition: number) => {
    const beforeCaret = value.slice(0, caretPosition);
    const match = beforeCaret.match(/(^|\s)@([^\s@]*)$/);
    if (!match) {
      return null;
    }

    return {
      query: (match[2] ?? "").toLowerCase(),
      start: caretPosition - (match[2]?.length ?? 0) - 1,
      end: caretPosition,
    };
  };

  const getMentionedUserIdsFromContent = (value: string) => {
    const matches = Array.from(value.matchAll(/@([^\s@]+)/g));
    if (!matches.length) return [];

    const handles = new Set(matches.map((item) => item[1].toLowerCase()));
    return mentionUsers
      .filter((user) => handles.has(normalizeMentionHandle(user)))
      .map((user) => user.id);
  };

  const filteredCommentMentionUsers = useMemo(() => {
    const query = commentMentionQuery.trim();
    if (!commentMentionOpen) return [];

    if (!query) {
      return mentionUsers.slice(0, 8);
    }

    return mentionUsers
      .filter((user) => {
        const fullName = `${user.nom} ${user.prenom}`.toLowerCase();
        const handle = normalizeMentionHandle(user);
        return fullName.includes(query) || handle.includes(query);
      })
      .slice(0, 8);
  }, [commentMentionOpen, commentMentionQuery, mentionUsers]);

  const imageMedia = useMemo(
    () => (post.media ?? []).filter((item) => item.type === "image"),
    [post.media],
  );

  const nonImageMedia = useMemo(
    () => (post.media ?? []).filter((item) => item.type !== "image"),
    [post.media],
  );
  const isFavorite = Boolean(post.is_favorite);
  const favoriteCount = post.favorite_count ?? 0;

  useEffect(() => {
    setActiveImageIndex(0);
  }, [post.id, imageMedia.length]);

  useEffect(() => {
    if (previewImageIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewImageIndex]);

  const scrollToImage = (index: number) => {
    const container = carouselRef.current;
    if (!container) return;

    const nextIndex = Math.max(0, Math.min(index, imageMedia.length - 1));
    const slideWidth = container.clientWidth;
    container.scrollTo({ left: slideWidth * nextIndex, behavior: "smooth" });
    setActiveImageIndex(nextIndex);
  };

  const handleCarouselScroll = () => {
    const container = carouselRef.current;
    if (!container || imageMedia.length <= 1) return;

    const slideWidth = container.clientWidth;
    if (!slideWidth) return;

    const nextIndex = Math.round(container.scrollLeft / slideWidth);
    setActiveImageIndex(
      Math.max(0, Math.min(nextIndex, imageMedia.length - 1)),
    );
  };

  const openPreview = (index: number) => {
    setPreviewImageIndex(index);
  };

  const closePreview = () => {
    setPreviewImageIndex(null);
  };

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const data = await fetchComments(post.id);
      setComments(data);
    } finally {
      setCommentsLoading(false);
    }
  };

  const toggleComments = () => {
    setShowComments((prev) => {
      const next = !prev;
      if (next && comments.length === 0) {
        void loadComments();
      }
      return next;
    });
  };

  useEffect(() => {
    setShowComments(defaultCommentsOpen);
  }, [defaultCommentsOpen, post.id]);

  useEffect(() => {
    if (showComments && comments.length === 0) {
      void loadComments();
    }
  }, [showComments, comments.length, post.id]);

  const submitComment = async () => {
    const content = serializeCommentContent(commentInput, commentImageUrl);
    if (!content) return;

    try {
      setCommentSubmitting(true);
      const mentionedUserIds = getMentionedUserIdsFromContent(commentInput);
      const created = await createComment(post.id, content, mentionedUserIds);
      setComments((prev) => [...prev, created]);
      setCommentInput("");
      setCommentImageUrl("");
      setCommentMentionOpen(false);
      setCommentMentionQuery("");
      setCommentMentionStart(null);
      setShowEmojiPicker(false);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const loadMentionUsersIfNeeded = async () => {
    if (mentionUsersLoaded) return;
    const users = await fetchMentionUsers();
    setMentionUsers(Array.isArray(users) ? users : []);
    setMentionUsersLoaded(true);
  };

  const updateCommentMentionState = async (
    nextValue: string,
    caretPosition: number,
  ) => {
    const context = getMentionContext(nextValue, caretPosition);
    if (!context) {
      setCommentMentionOpen(false);
      setCommentMentionQuery("");
      setCommentMentionStart(null);
      return;
    }

    setCommentMentionOpen(true);
    setCommentMentionQuery(context.query);
    setCommentMentionStart(context.start);
    await loadMentionUsersIfNeeded();
  };

  const selectCommentMentionUser = (user: MentionUser) => {
    const textarea = commentTextareaRef.current;
    if (!textarea || commentMentionStart === null) {
      setCommentMentionOpen(false);
      return;
    }

    const caret = textarea.selectionStart ?? commentInput.length;
    const mentionLabel = `@${formatMentionHandle(user)}`;
    const nextValue = `${commentInput.slice(0, commentMentionStart)}${mentionLabel} ${commentInput.slice(caret)}`;
    const nextCaret = commentMentionStart + mentionLabel.length + 1;

    setCommentInput(nextValue);
    setCommentMentionOpen(false);
    setCommentMentionQuery("");
    setCommentMentionStart(null);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const startReplyToComment = (commentId: string) => {
    setReplyToCommentId(commentId);
    setReplyInput("");
    setReplyImageUrl("");
    setShowReplyEmojiPicker(false);
  };

  const cancelReply = () => {
    setReplyToCommentId(null);
    setReplyInput("");
    setReplyImageUrl("");
    setShowReplyEmojiPicker(false);
  };

  const submitReply = async () => {
    if (!replyToCommentId) return;

    const content = serializeCommentContent(
      replyInput,
      replyImageUrl,
      replyToCommentId,
    );
    if (!content) return;

    try {
      setCommentSubmitting(true);
      const mentionedUserIds = getMentionedUserIdsFromContent(replyInput);
      const created = await createComment(post.id, content, mentionedUserIds);
      setComments((prev) => [...prev, created]);
      cancelReply();
    } finally {
      setCommentSubmitting(false);
    }
  };

  const beginEditComment = (comment: PublicationComment) => {
    const parsed = parseCommentContent(comment.content);
    setEditingCommentId(comment.id);
    setEditingCommentInput(parsed.text);
    setEditingCommentImageUrl(parsed.imageUrls[0] ?? "");
    setEditingCommentReplyToId(parsed.replyToCommentId);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentInput("");
    setEditingCommentImageUrl("");
    setEditingCommentReplyToId(null);
    setShowEditEmojiPickerFor(null);
  };

  const saveEditComment = async (commentId: string) => {
    const content = serializeCommentContent(
      editingCommentInput,
      editingCommentImageUrl,
      editingCommentReplyToId,
    );
    if (!content) return;

    try {
      setCommentSubmitting(true);
      const mentionedUserIds =
        getMentionedUserIdsFromContent(editingCommentInput);
      const updated = await updateComment(
        post.id,
        commentId,
        content,
        mentionedUserIds,
      );
      setComments((prev) =>
        prev.map((comment) => (comment.id === commentId ? updated : comment)),
      );
      cancelEditComment();
    } finally {
      setCommentSubmitting(false);
    }
  };

  const onNewCommentEmojiClick = (emojiData: EmojiClickData) => {
    setCommentInput((prev) => `${prev}${emojiData.emoji}`);
  };

  const onEditCommentEmojiClick = (emojiData: EmojiClickData) => {
    setEditingCommentInput((prev) => `${prev}${emojiData.emoji}`);
  };

  const onReplyEmojiClick = (emojiData: EmojiClickData) => {
    setReplyInput((prev) => `${prev}${emojiData.emoji}`);
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
      reader.readAsDataURL(file);
    });

  const attachImageToComment = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;

    const dataUrl = await fileToDataUrl(file);
    setCommentImageUrl(dataUrl);
  };

  const attachImageToEditComment = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;

    const dataUrl = await fileToDataUrl(file);
    setEditingCommentImageUrl(dataUrl);
  };

  const attachImageToReply = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;

    const dataUrl = await fileToDataUrl(file);
    setReplyImageUrl(dataUrl);
  };

  const removeComment = async (commentId: string) => {
    try {
      setCommentSubmitting(true);
      await deleteComment(post.id, commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      if (editingCommentId === commentId) {
        cancelEditComment();
      }
    } finally {
      setCommentSubmitting(false);
    }
  };

  const movePreview = (direction: number) => {
    if (previewImageIndex === null || imageMedia.length === 0) {
      return;
    }

    const nextIndex = previewImageIndex + direction;
    if (nextIndex < 0 || nextIndex >= imageMedia.length) {
      return;
    }

    setPreviewImageIndex(nextIndex);
  };

  const commentsWithMeta = useMemo<CommentWithMeta[]>(
    () =>
      comments.map((comment) => ({
        ...comment,
        parsed: parseCommentContent(comment.content),
      })),
    [comments],
  );

  const commentIds = useMemo(
    () => new Set(commentsWithMeta.map((comment) => comment.id)),
    [commentsWithMeta],
  );

  const repliesByParent = useMemo(() => {
    const grouped: Record<string, CommentWithMeta[]> = {};

    for (const comment of commentsWithMeta) {
      const parentId = comment.parsed.replyToCommentId;
      if (!parentId || !commentIds.has(parentId)) continue;

      if (!grouped[parentId]) {
        grouped[parentId] = [];
      }
      grouped[parentId].push(comment);
    }

    return grouped;
  }, [commentIds, commentsWithMeta]);

  const topLevelComments = useMemo(
    () =>
      commentsWithMeta.filter((comment) => {
        const parentId = comment.parsed.replyToCommentId;
        return !parentId || !commentIds.has(parentId);
      }),
    [commentIds, commentsWithMeta],
  );

  const parsedSharedPost = useMemo(
    () => parseSharedPostContent(post.content ?? ""),
    [post.content],
  );

  const openSharePopup = () => {
    setShareMessage("");
    setIsSharePopupOpen(true);
  };

  const closeSharePopup = () => {
    if (shareSubmitting) return;
    setIsSharePopupOpen(false);
    setShareMessage("");
  };

  const submitShare = async () => {
    if (!onShare) return;

    try {
      setShareSubmitting(true);
      const message = shareMessage.trim();
      await onShare(post.id, message || undefined);
      setIsSharePopupOpen(false);
      setShareMessage("");
    } finally {
      setShareSubmitting(false);
    }
  };

  const openOriginalSharedPost = async () => {
    const shared = parsedSharedPost.shared;
    if (!shared) {
      return;
    }

    setSharedOpenError(null);

    if (shared.originalPostId?.trim()) {
      setViewingOriginalPostId(shared.originalPostId.trim());
      return;
    }

    // Fallback for legacy shared posts created before originalPostId existed.
    try {
      const candidates = await fetchFeed(100, 0);
      const targetAuthor = shared.author.trim().toLowerCase();
      const targetContent = shared.content.trim();
      const targetCreatedAt = new Date(shared.created_at).getTime();

      const matched = candidates.find((candidate) => {
        const candidateAuthor =
          `${candidate.user?.nom ?? ""} ${candidate.user?.prenom ?? ""}`
            .trim()
            .toLowerCase();
        const candidateContent = (candidate.content ?? "").trim();
        const candidateCreatedAt = new Date(candidate.created_at).getTime();

        const sameAuthor = candidateAuthor === targetAuthor;
        const sameContent = candidateContent === targetContent;
        const sameTimestamp =
          Number.isFinite(targetCreatedAt) &&
          Number.isFinite(candidateCreatedAt) &&
          Math.abs(candidateCreatedAt - targetCreatedAt) < 1000;

        return sameAuthor && sameContent && sameTimestamp;
      });

      if (matched?.id) {
        setViewingOriginalPostId(matched.id);
        return;
      }

      setSharedOpenError(
        "Impossible d'ouvrir l'original pour cet ancien partage. Repartagez la publication pour activer le lien direct.",
      );
    } catch {
      setSharedOpenError("Impossible d'ouvrir la publication originale.");
    }
  };

  const renderCommentCard = (comment: CommentWithMeta, isReply = false) => {
    const canManageComment =
      Boolean(currentUserId) && currentUserId === comment.user_id;
    const nestedReplies = repliesByParent[comment.id] ?? [];

    return (
      <div key={comment.id} className={isReply ? "ml-7 mt-2" : ""}>
        <div className="rounded-xl border border-[#ece6d8] bg-[#faf8f3] px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-[#436D75]">
                {comment.user.nom} {comment.user.prenom}
              </p>
              <p className="text-[11px] text-gray-400">
                {new Date(comment.created_at).toLocaleString("fr-FR")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startReplyToComment(comment.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#436D75] hover:underline"
              >
                <Reply size={12} />
                Repondre
              </button>

              {canManageComment && (
                <>
                  <button
                    type="button"
                    onClick={() => beginEditComment(comment)}
                    className="text-xs font-semibold text-[#436D75] hover:underline"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeComment(comment.id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                </>
              )}
            </div>
          </div>

          {editingCommentId === comment.id ? (
            <div className="mt-2 space-y-2">
              <div className="relative">
                <textarea
                  value={editingCommentInput}
                  onChange={(event) =>
                    setEditingCommentInput(event.target.value)
                  }
                  rows={2}
                  className="w-full rounded-lg border border-[#ddd2bc] px-2.5 py-1.5 pr-14 text-sm outline-none focus:border-[#7f6f50]"
                />

                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setShowEditEmojiPickerFor((prev) =>
                        prev === comment.id ? null : comment.id,
                      )
                    }
                    className="text-[#436D75] hover:text-[#2f5560]"
                    title="Ajouter un emoji"
                  >
                    <Smile size={18} />
                  </button>

                  <input
                    ref={editCommentImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      void attachImageToEditComment(
                        event.target.files?.[0] ?? null,
                      );
                      event.currentTarget.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => editCommentImageInputRef.current?.click()}
                    className="text-[#436D75] hover:text-[#2f5560]"
                    title="Choisir une image depuis le PC"
                  >
                    <ImagePlus size={18} />
                  </button>
                </div>
              </div>

              {showEditEmojiPickerFor === comment.id && (
                <div>
                  <EmojiPicker
                    onEmojiClick={onEditCommentEmojiClick}
                    theme={Theme.LIGHT}
                    width="100%"
                    height={320}
                    searchPlaceholder="Rechercher un emoji"
                    lazyLoadEmojis
                  />
                </div>
              )}

              {editingCommentImageUrl && (
                <div className="space-y-2">
                  <img
                    src={editingCommentImageUrl}
                    alt="Apercu image commentaire"
                    className="max-h-44 w-auto rounded-lg border border-[#ece6d8]"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingCommentImageUrl("")}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Retirer l'image
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void saveEditComment(comment.id)}
                  disabled={
                    commentSubmitting ||
                    (!editingCommentInput.trim() && !editingCommentImageUrl)
                  }
                  className="rounded-lg bg-[#436D75] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={cancelEditComment}
                  className="rounded-lg border border-[#d8d1c2] px-2.5 py-1 text-xs font-semibold text-gray-600"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {comment.parsed.text ? (
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {comment.parsed.text}
                </p>
              ) : null}
              {comment.parsed.imageUrls.length > 0 && (
                <div className="space-y-2">
                  {comment.parsed.imageUrls.map((url, idx) => (
                    <img
                      key={`${comment.id}-img-${idx}`}
                      src={url}
                      alt="Image commentaire"
                      className="max-h-56 w-auto rounded-lg border border-[#ece6d8]"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {replyToCommentId === comment.id && (
          <div className="ml-7 mt-2 space-y-2 rounded-xl border border-dashed border-[#ddd2bc] bg-[#fffdf8] p-2.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <textarea
                  value={replyInput}
                  onChange={(event) => setReplyInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submitReply();
                    }
                  }}
                  placeholder={`Repondre a ${comment.user.nom}...`}
                  rows={2}
                  className="w-full rounded-xl border border-[#ddd2bc] px-3 py-2 pr-16 text-sm outline-none focus:border-[#7f6f50]"
                />

                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReplyEmojiPicker((prev) => !prev)}
                    className="text-[#436D75] hover:text-[#2f5560]"
                    title="Ajouter un emoji"
                  >
                    <Smile size={18} />
                  </button>

                  <input
                    ref={replyImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      void attachImageToReply(event.target.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => replyImageInputRef.current?.click()}
                    className="text-[#436D75] hover:text-[#2f5560]"
                    title="Choisir une image depuis le PC"
                  >
                    <ImagePlus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {showReplyEmojiPicker && (
              <div>
                <EmojiPicker
                  onEmojiClick={onReplyEmojiClick}
                  theme={Theme.LIGHT}
                  width="100%"
                  height={280}
                  searchPlaceholder="Rechercher un emoji"
                  lazyLoadEmojis
                />
              </div>
            )}

            {replyImageUrl && (
              <div className="space-y-2">
                <img
                  src={replyImageUrl}
                  alt="Apercu reponse"
                  className="max-h-44 w-auto rounded-lg border border-[#ece6d8]"
                />
                <button
                  type="button"
                  onClick={() => setReplyImageUrl("")}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Retirer l'image
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void submitReply()}
                disabled={
                  commentSubmitting || (!replyInput.trim() && !replyImageUrl)
                }
                className="rounded-lg bg-[#436D75] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
              >
                Repondre
              </button>
              <button
                type="button"
                onClick={cancelReply}
                className="rounded-lg border border-[#d8d1c2] px-2.5 py-1 text-xs font-semibold text-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {nestedReplies.length > 0 && (
          <div className="mt-2 space-y-2">
            {nestedReplies.map((reply) => renderCommentCard(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <article className="rounded-2xl border border-[#e7dfcf] bg-white p-5 shadow-sm transition-all">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-[#436D75]">
              {post.user?.nom} {post.user?.prenom}
            </h3>
            {post.location ? (
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#f8f1e9] px-3 py-1 text-xs font-semibold text-[#8a5d2a]">
                <MapPin size={14} />
                {post.location}
              </div>
            ) : null}
            <p className="text-xs text-gray-400 font-medium">
              {new Date(post.created_at).toLocaleString("fr-FR")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(post.id, isFavorite)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                  isFavorite
                    ? "border-[#ef8f84] bg-[#fff1ef] text-[#c65142] hover:bg-[#ffe7e3]"
                    : "border-[#d8d1c2] text-[#7a6a58] hover:bg-[#f7f3e9]"
                }`}
                title={
                  isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
                }
              >
                <Heart size={13} className={isFavorite ? "fill-current" : ""} />
                {favoriteCount}
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(post)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d8d1c2] px-3 py-1 text-xs font-bold text-[#436D75] hover:bg-[#f7f3e9]"
              >
                <Edit2 size={13} />
                Modifier
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(post.id)}
                className="text-red-600 hover:text-red-700 text-xs font-bold"
              >
                Supprimer
              </button>
            )}
          </div>
        </div>

        {parsedSharedPost.messageText ? (
          <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">
            {parsedSharedPost.messageText}
          </p>
        ) : null}

        {parsedSharedPost.shared && (
          <div
            onClick={() => void openOriginalSharedPost()}
            className="mt-3 cursor-pointer rounded-lg border-l-4 border-[#c9a967] bg-[#faf6f0] pl-3 pr-2 py-2 transition-colors hover:bg-[#f3ede3]"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9b7d54]">
              Message partagé
            </p>
            <p className="mt-0.5 text-xs font-medium text-[#7a6345]">
              {parsedSharedPost.shared.author}
            </p>
            {parsedSharedPost.shared.location ? (
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-[#8a5d2a]">
                <MapPin size={10} />
                {parsedSharedPost.shared.location}
              </div>
            ) : null}
            {parsedSharedPost.shared.content ? (
              <p className="mt-1.5 text-xs text-[#4a4035] whitespace-pre-wrap break-words leading-relaxed">
                {parsedSharedPost.shared.content}
              </p>
            ) : null}
          </div>
        )}

        {sharedOpenError ? (
          <p className="mt-2 text-xs font-semibold text-[#a4552a]">
            {sharedOpenError}
          </p>
        ) : null}

        {post.mentions?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.mentions.map((mention) => (
              <span
                key={`${post.id}-${mention.mentioned_user.id}`}
                className="rounded-full bg-[#edf6fb] px-2.5 py-1 text-xs font-semibold text-[#2f6f8b]"
              >
                @{mention.mentioned_user.nom}_{mention.mentioned_user.prenom}
              </span>
            ))}
          </div>
        ) : null}

        {post.hashtags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.hashtags.map((item) => (
              <span
                key={`${post.id}-${item.hashtag}`}
                className="rounded-full bg-[#f4f0ff] px-2.5 py-1 text-xs font-semibold text-[#6457a2]"
              >
                #{item.hashtag}
              </span>
            ))}
          </div>
        ) : null}

        {imageMedia.length > 0 && (
          <div className="mt-4 relative overflow-hidden rounded-xl border border-[#ece6d8] bg-[#faf8f3]">
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {imageMedia.map((media, index) => (
                <div
                  key={`${post.id}-${media.url}-${index}`}
                  className="min-w-full snap-center"
                >
                  <img
                    src={media.url}
                    alt={media.name || `Image ${index + 1}`}
                    className="h-80 w-full cursor-zoom-in object-cover"
                    onClick={() => openPreview(index)}
                  />
                </div>
              ))}
            </div>

            {imageMedia.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollToImage(activeImageIndex - 1)}
                  disabled={activeImageIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-white disabled:opacity-35"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={() => scrollToImage(activeImageIndex + 1)}
                  disabled={activeImageIndex === imageMedia.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-white disabled:opacity-35"
                >
                  &gt;
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-1">
                  {imageMedia.map((_, index) => (
                    <button
                      key={`${post.id}-dot-${index}`}
                      type="button"
                      onClick={() => scrollToImage(index)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === activeImageIndex
                          ? "bg-white w-4"
                          : "bg-white/60"
                      }`}
                      aria-label={`Image ${index + 1}`}
                    />
                  ))}
                </div>
                <div className="absolute top-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white">
                  {activeImageIndex + 1}/{imageMedia.length}
                </div>
              </>
            )}
          </div>
        )}

        {nonImageMedia.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {nonImageMedia.map((media, index) => (
              <div
                key={`${post.id}-${media.url}-${index}`}
                className="overflow-hidden rounded-xl border border-[#ece6d8] bg-[#faf8f3]"
              >
                {media.type === "video" && (
                  <video
                    controls
                    src={media.url}
                    className="h-72 w-full object-cover bg-black"
                  />
                )}
                {media.type === "document" && (
                  <a
                    href={media.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-3 py-3 text-sm text-[#436D75] hover:bg-[#f2eee4]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FileText size={16} />
                      {media.name || media.url}
                    </span>
                    <span className="text-xs font-semibold uppercase text-gray-400">
                      document
                    </span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {onReact && onRemoveReaction && (
          <ReactionBar
            reactions={post.reactions}
            userReaction={post.reactions?.userReaction ?? undefined}
            onReact={(type) => onReact(post.id, type)}
            onRemoveReaction={() => onRemoveReaction(post.id)}
            onCommentClick={toggleComments}
            commentCount={comments.length || post._count?.comments || 0}
            commentsOpen={showComments}
            onShareClick={onShare ? openSharePopup : undefined}
          />
        )}

        {isSharePopupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-[#e7dfcf] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#efe9db] px-4 py-3">
                <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#436D75]">
                  Partager la publication
                </h3>
                <button
                  type="button"
                  onClick={closeSharePopup}
                  className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                  disabled={shareSubmitting}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 p-4">
                <p className="text-xs text-gray-500">
                  Ajoutez un message personnel au-dessus de la publication
                  partagée.
                </p>
                <textarea
                  value={shareMessage}
                  onChange={(event) => setShareMessage(event.target.value)}
                  placeholder="Votre message (optionnel)..."
                  rows={4}
                  className="w-full rounded-xl border border-[#d8d1c2] px-3 py-2 text-sm outline-none focus:border-[#436D75]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#efe9db] px-4 py-3">
                <button
                  type="button"
                  onClick={closeSharePopup}
                  className="rounded-lg border border-[#d8d1c2] px-3 py-1.5 text-sm font-semibold text-gray-600"
                  disabled={shareSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void submitShare()}
                  disabled={shareSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#436D75] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Send size={14} />
                  {shareSubmitting ? "Partage..." : "Partager"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showComments && (
          <div className="mt-3 space-y-3 border-t border-[#efe9db] pt-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={commentTextareaRef}
                  value={commentInput}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setCommentInput(nextValue);
                    void updateCommentMentionState(
                      nextValue,
                      event.target.selectionStart ?? nextValue.length,
                    );
                  }}
                  onClick={(event) => {
                    const target = event.currentTarget;
                    void updateCommentMentionState(
                      target.value,
                      target.selectionStart ?? target.value.length,
                    );
                  }}
                  onKeyUp={(event) => {
                    const target = event.currentTarget;
                    void updateCommentMentionState(
                      target.value,
                      target.selectionStart ?? target.value.length,
                    );
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submitComment();
                    }
                  }}
                  placeholder="Laisser un commentaire..."
                  rows={2}
                  className="w-full rounded-xl border border-[#ddd2bc] px-3 py-2 pr-16 text-sm outline-none focus:border-[#7f6f50]"
                />

                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="text-[#436D75] hover:text-[#2f5560]"
                    title="Ajouter un emoji"
                  >
                    <Smile size={18} />
                  </button>

                  <input
                    ref={commentImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      void attachImageToComment(
                        event.target.files?.[0] ?? null,
                      );
                      event.currentTarget.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => commentImageInputRef.current?.click()}
                    className="text-[#436D75] hover:text-[#2f5560]"
                    title="Choisir une image depuis le PC"
                  >
                    <ImagePlus size={18} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void submitComment()}
                disabled={
                  commentSubmitting ||
                  (!commentInput.trim() && !commentImageUrl.trim())
                }
                className="rounded-xl bg-[#436D75] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Envoyer
              </button>
            </div>

            {commentMentionOpen && filteredCommentMentionUsers.length > 0 && (
              <div className="rounded-xl border border-[#d9e7eb] bg-white p-2 shadow-sm">
                {filteredCommentMentionUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectCommentMentionUser(user)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-[#F2F8FA]"
                  >
                    <span className="text-sm font-semibold text-[#22414B]">
                      {user.nom} {user.prenom}
                    </span>
                    <span className="text-xs font-bold text-[#5D7A84]">
                      @{formatMentionHandle(user)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showEmojiPicker && (
              <div>
                <EmojiPicker
                  onEmojiClick={onNewCommentEmojiClick}
                  theme={Theme.LIGHT}
                  width="100%"
                  height={340}
                  searchPlaceholder="Rechercher un emoji"
                  lazyLoadEmojis
                />
              </div>
            )}

            {commentImageUrl && (
              <div className="space-y-2">
                <img
                  src={commentImageUrl}
                  alt="Apercu commentaire"
                  className="max-h-48 w-auto rounded-lg border border-[#ece6d8]"
                />
                <button
                  type="button"
                  onClick={() => setCommentImageUrl("")}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Retirer l'image
                </button>
              </div>
            )}

            {commentsLoading ? (
              <p className="text-xs text-gray-500">
                Chargement des commentaires...
              </p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-500">
                Aucun commentaire pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {topLevelComments.map((comment) => renderCommentCard(comment))}
              </div>
            )}
          </div>
        )}

        {previewImageIndex !== null && imageMedia[previewImageIndex] && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={closePreview}
          >
            <div
              className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={imageMedia[previewImageIndex].url}
                alt={
                  imageMedia[previewImageIndex].name ||
                  `Image ${previewImageIndex + 1}`
                }
                className="max-h-[85vh] w-full object-contain"
              />

              <button
                type="button"
                onClick={closePreview}
                className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-2 text-sm font-bold text-white hover:bg-black/80"
              >
                X
              </button>

              {imageMedia.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => movePreview(-1)}
                    disabled={previewImageIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-4 py-3 text-white disabled:opacity-30"
                  >
                    &lt;
                  </button>
                  <button
                    type="button"
                    onClick={() => movePreview(1)}
                    disabled={previewImageIndex === imageMedia.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-4 py-3 text-white disabled:opacity-30"
                  >
                    &gt;
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </article>

      <OriginalPostModal
        originalPostId={viewingOriginalPostId}
        onClose={() => setViewingOriginalPostId(null)}
        currentUserId={currentUserId}
        onReact={onReact}
        onRemoveReaction={onRemoveReaction}
        onShare={onShare}
      />
    </>
  );
}
