import { useState, useRef } from "react";
import { X, Upload } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setPreview(url);
      setMedia([
        {
          type: file.type.startsWith("video") ? "video" : "image",
          url,
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
      await createStory(
        content || undefined,
        media.length > 0 ? media : undefined,
      );
      onStoryCreated?.();
      onClose();
    } catch (err) {
      console.error("Erreur creation story:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#DDE9EC] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E7EFF2] bg-gradient-to-r from-[#F6FBFC] to-[#EEF5F7] px-6 py-4">
          <div>
            <h3 className="text-lg font-black text-[#203A43]">Creer une story</h3>
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

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {preview && (
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-[#DDE9EC] bg-gray-100">
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
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setMedia([]);
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

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ajouter un texte (optionnel)..."
            className="w-full rounded-2xl border border-[#D4E2E6] p-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#436D75]/35"
            rows={3}
          />

          <button
            type="submit"
            disabled={uploading || (!content && !media.length)}
            className="w-full rounded-2xl bg-gradient-to-r from-[#436D75] to-[#2F525A] px-4 py-2.5 text-sm font-black text-white hover:from-[#355860] hover:to-[#294A51] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Creation..." : "Publier la story"}
          </button>
        </form>
      </div>
    </div>
  );
}
