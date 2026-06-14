/**
 * StoryUploadModal.tsx — Modale de création d'une nouvelle story.
 *
 * RÔLE :
 *   Interface pour publier une story (image ou vidéo éphémère 24h).
 *   Ouverte depuis le bouton "+" dans StoryReel.
 *
 * FONCTIONNALITÉS :
 *   - Upload fichier (image/vidéo) via FileReader → dataUrl
 *   - Saisie de texte accompagnant la story
 *   - EmojiPicker (Theme.LIGHT) pour enrichir le texte
 *   - createStory({ media: MediaItem[], texte }) → POST /stories
 *   - onStoryCreated() → rafraîchit StoryReel après publication
 */
import { useState, useRef } from "react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { Smile, X, Upload } from "lucide-react";
import { createStory, type MediaItem } from "../../../../api/stories.api";

type StoryUploadModalProps = {
  onClose: () => void;
  onStoryCreated?: () => void;
};

export function StoryUploadModal({
  onClose,
  onStoryCreated,
}: StoryUploadModalProps) {
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [textYOffset, setTextYOffset] = useState(0);
  const [draggingText, setDraggingText] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const clampTextOffset = (value: number) => {
    return Math.max(-35, Math.min(35, value));
  };

  const updateTextOffsetFromClientY = (clientY: number) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect || rect.height <= 0) return;
    const ratio = (clientY - rect.top) / rect.height;
    const percent = (ratio - 0.5) * 100;
    setTextYOffset(clampTextOffset(percent));
  };

  const onTextDragStart = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    setDraggingText(true);

    if ("touches" in event) {
      const touch = event.touches[0];
      if (touch) {
        updateTextOffsetFromClientY(touch.clientY);
      }
      return;
    }

    updateTextOffsetFromClientY(event.clientY);
  };

  const onPreviewMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingText) return;
    updateTextOffsetFromClientY(event.clientY);
  };

  const onPreviewTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingText) return;
    const touch = event.touches[0];
    if (!touch) return;
    updateTextOffsetFromClientY(touch.clientY);
  };

  const onPreviewPointerEnd = () => {
    if (!draggingText) return;
    setDraggingText(false);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => `${prev}${emojiData.emoji}`);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setPreview(url);
      setTextYOffset(0);
      setMedia([
        {
          type: file.type.startsWith("video") ? "video" : "image",
          url,
          textY: 0,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && !media.length) return;

    try {
      setUploading(true);
      const preparedMedia =
        media.length > 0
          ? media.map((item, index) =>
              index === 0 ? { ...item, textY: textYOffset } : item,
            )
          : undefined;

      await createStory(content || undefined, preparedMedia);
      onStoryCreated?.();
      onClose();
    } catch (err) {
      console.error("Erreur creation story:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 py-4 sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#DDE9EC] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E7EFF2] bg-gradient-to-r from-[#F6FBFC] to-[#EEF5F7] px-6 py-4">
          <div>
            <h3 className="text-lg font-black text-[#203A43]">
              Creer une story
            </h3>
            <p className="text-xs font-semibold text-[#5A7380]">
              Photo, video ou texte rapide
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-500 hover:bg-white"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-4 overflow-y-auto p-6"
        >
          {preview && (
            <div
              ref={previewRef}
              className="relative aspect-video overflow-hidden rounded-2xl border border-[#DDE9EC] bg-gray-100"
              onMouseMove={onPreviewMouseMove}
              onMouseUp={onPreviewPointerEnd}
              onMouseLeave={onPreviewPointerEnd}
              onTouchMove={onPreviewTouchMove}
              onTouchEnd={onPreviewPointerEnd}
            >
              {media[0]?.type === "video" ? (
                <video
                  src={preview}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}

              {content.trim() && (
                <div
                  onMouseDown={onTextDragStart}
                  onTouchStart={onTextDragStart}
                  className="absolute left-0 right-0 -translate-y-1/2 cursor-grab bg-black/50 px-4 py-2 text-center text-sm font-bold text-white active:cursor-grabbing"
                  style={{ top: `calc(50% + ${textYOffset}%)` }}
                  title="Glissez le texte en haut ou en bas"
                >
                  {content}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setMedia([]);
                  setTextYOffset(0);
                  setShowEmojiPicker(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white hover:bg-black/75"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {preview && content.trim() && (
            <div className="space-y-2 rounded-2xl border border-[#DCE9ED] bg-[#F7FBFC] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                Position du texte
              </p>
              <input
                type="range"
                min={-35}
                max={35}
                step={1}
                value={textYOffset}
                onChange={(e) => setTextYOffset(Number(e.target.value))}
                className="w-full accent-[#436D75]"
              />
              <p className="text-[11px] font-semibold text-gray-500">
                Astuce: glissez directement le texte sur l'image pour le
                deplacer.
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-[#9FB7BE] bg-[radial-gradient(circle_at_20%_20%,#f8fcfd_0,#f1f7f9_60%,#ecf3f6_100%)] py-8 text-center transition-colors hover:border-[#436D75]"
          >
            <Upload className="mx-auto mb-2 text-[#5E7C86]" size={24} />
            <p className="text-sm font-bold text-[#355860]">
              Cliquez pour ajouter une photo/video
            </p>
          </button>

          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ajouter un texte (optionnel)..."
              className="w-full rounded-2xl border border-[#D4E2E6] p-3 pr-11 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#436D75]/35"
              rows={3}
            />

            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="absolute right-3 top-3 text-[#436D75] hover:text-[#2f5560]"
              title="Ajouter un emoji"
            >
              <Smile size={18} />
            </button>
          </div>

          {showEmojiPicker && (
            <div className="rounded-2xl border border-[#DCE9ED] bg-white p-2">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={Theme.LIGHT}
                width="100%"
                height={340}
                searchPlaceholder="Rechercher un emoji"
                lazyLoadEmojis
              />
            </div>
          )}

          <div className="rounded-2xl border border-[#DCE9ED] bg-[#F7FBFC] p-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
              Astuce
            </p>
            <div className="text-[11px] font-semibold text-gray-500">
              Cliquez sur l'icone emoji pour ouvrir toutes les categories.
            </div>
          </div>

          <div className="sticky bottom-0 -mx-6 border-t border-[#E6EFF2] bg-white/95 px-6 pb-1 pt-3 backdrop-blur">
            <button
              type="submit"
              disabled={uploading || (!content && !media.length)}
              className="w-full rounded-2xl bg-gradient-to-r from-[#436D75] to-[#2F525A] px-4 py-2.5 text-sm font-black text-white hover:from-[#355860] hover:to-[#294A51] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Creation..." : "Publier la story"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
