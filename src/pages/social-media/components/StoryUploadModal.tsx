import { useState, useRef } from "react";
import { X, Upload } from "lucide-react";
import { createStory, type MediaItem } from "../../../api/stories.api";

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
      console.error("Erreur création story:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Créer une story</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Preview */}
          {preview && (
            <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
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
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* File Upload */}
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
            className="w-full rounded-lg border-2 border-dashed border-gray-300 py-8 text-center hover:border-[#436D75] hover:bg-blue-50 transition-colors"
          >
            <Upload className="mx-auto mb-2 text-gray-400" size={24} />
            <p className="text-sm font-medium text-gray-600">
              Cliquez pour ajouter une photo/vidéo
            </p>
          </button>

          {/* Text Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ajouter un texte (optionnel)..."
            className="w-full rounded-lg border border-gray-300 p-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#436D75]"
            rows={3}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || (!content && !media.length)}
            className="w-full rounded-lg bg-[#436D75] px-4 py-2 text-white font-semibold hover:bg-[#2d4a53] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Création..." : "Publier la story"}
          </button>
        </form>
      </div>
    </div>
  );
}
