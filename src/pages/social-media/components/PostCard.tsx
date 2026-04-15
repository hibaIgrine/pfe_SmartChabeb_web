import { useEffect, useMemo, useRef, useState } from "react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import {
  createComment,
  deleteComment,
  fetchComments,
  updateComment,
} from "../../../api/social-media.api";
import type {
  Publication,
  PublicationComment,
  ReactionType,
} from "../../../api/social-media.api";
import { Edit2, FileText, ImagePlus, MapPin, Smile } from "lucide-react";
import { ReactionBar } from "./ReactionBar";

const COMMENT_IMAGE_TOKEN_REGEX = /\[\[img:(.*?)\]\]/g;

function serializeCommentContent(text: string, imageUrl?: string) {
  const cleanText = text.trim();
  const cleanImageUrl = imageUrl?.trim();

  if (!cleanImageUrl) {
    return cleanText;
  }

  return cleanText
    ? `${cleanText}\n[[img:${cleanImageUrl}]]`
    : `[[img:${cleanImageUrl}]]`;
}

function parseCommentContent(content: string) {
  const imageUrls: string[] = [];
  const text = content
    .replace(COMMENT_IMAGE_TOKEN_REGEX, (_, rawUrl: string) => {
      const url = String(rawUrl ?? "").trim();
      if (url) imageUrls.push(url);
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, imageUrls };
}

type PostCardProps = {
  post: Publication;
  canDelete: boolean;
  canEdit: boolean;
  currentUserId?: string;
  onDelete: (postId: string) => void;
  onEdit: (post: Publication) => void;
  onReact?: (postId: string, reactionType: ReactionType) => void;
  onRemoveReaction?: (postId: string) => void;
};

export function PostCard({
  post,
  canDelete,
  canEdit,
  currentUserId,
  onDelete,
  onEdit,
  onReact,
  onRemoveReaction,
}: PostCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(
    null,
  );
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PublicationComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentImageUrl, setCommentImageUrl] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentInput, setEditingCommentInput] = useState("");
  const [editingCommentImageUrl, setEditingCommentImageUrl] = useState("");
  const [showEditEmojiPickerFor, setShowEditEmojiPickerFor] = useState<
    string | null
  >(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const commentImageInputRef = useRef<HTMLInputElement | null>(null);
  const editCommentImageInputRef = useRef<HTMLInputElement | null>(null);

  const imageMedia = useMemo(
    () => (post.media ?? []).filter((item) => item.type === "image"),
    [post.media],
  );

  const nonImageMedia = useMemo(
    () => (post.media ?? []).filter((item) => item.type !== "image"),
    [post.media],
  );

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

  const submitComment = async () => {
    const content = serializeCommentContent(commentInput, commentImageUrl);
    if (!content) return;

    try {
      setCommentSubmitting(true);
      const created = await createComment(post.id, content);
      setComments((prev) => [...prev, created]);
      setCommentInput("");
      setCommentImageUrl("");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const beginEditComment = (comment: PublicationComment) => {
    const parsed = parseCommentContent(comment.content);
    setEditingCommentId(comment.id);
    setEditingCommentInput(parsed.text);
    setEditingCommentImageUrl(parsed.imageUrls[0] ?? "");
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentInput("");
    setEditingCommentImageUrl("");
    setShowEditEmojiPickerFor(null);
  };

  const saveEditComment = async (commentId: string) => {
    const content = serializeCommentContent(
      editingCommentInput,
      editingCommentImageUrl,
    );
    if (!content) return;

    try {
      setCommentSubmitting(true);
      const updated = await updateComment(post.id, commentId, content);
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

  return (
    <article className="rounded-2xl border border-[#e7dfcf] bg-white p-5 shadow-sm">
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

      {post.content ? (
        <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">
          {post.content}
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
        />
      )}

      {showComments && (
        <div className="mt-3 space-y-3 border-t border-[#efe9db] pt-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <textarea
                  value={commentInput}
                  onChange={(event) => setCommentInput(event.target.value)}
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
                      void attachImageToComment(event.target.files?.[0] ?? null);
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
              <p className="text-xs text-gray-500">Chargement des commentaires...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-500">Aucun commentaire pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {comments.map((comment) => {
                  const parsedComment = parseCommentContent(comment.content);
                  const canManageComment =
                    Boolean(currentUserId) && currentUserId === comment.user_id;

                  return (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-[#ece6d8] bg-[#faf8f3] px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-[#436D75]">
                            {comment.user.nom} {comment.user.prenom}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(comment.created_at).toLocaleString("fr-FR")}
                          </p>
                        </div>

                        {canManageComment && (
                          <div className="flex items-center gap-2">
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
                          </div>
                        )}
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
                          {parsedComment.text ? (
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {parsedComment.text}
                            </p>
                          ) : null}
                          {parsedComment.imageUrls.length > 0 && (
                            <div className="space-y-2">
                              {parsedComment.imageUrls.map((url, idx) => (
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
                  );
                })}
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
  );
}
