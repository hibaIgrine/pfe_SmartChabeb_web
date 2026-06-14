/**
 * StoryArchiveModal.tsx — Modal d'archive des stories expirées.
 *
 * RÔLE :
 *   Modale accessible depuis MyProfilePage permettant de consulter les stories
 *   que l'utilisateur a publiées dans les dernières 24h (et au-delà si archivées).
 *
 * FONCTIONNALITÉS :
 *   - Liste des stories avec miniature (image/vidéo) + date de publication
 *   - Icône type: Image (ImageIcon) ou Vidéo (Film)
 *   - Affichage du nombre de vues (Eye icon)
 *   - Bouton Réessayer en cas d'erreur de chargement
 *   - Spinner pendant le chargement
 */
import { Calendar, Eye, Film, Image as ImageIcon, X } from "lucide-react";
import { type Story } from "../../../api/stories.api";

type StoryArchiveModalProps = {
  stories: Story[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
};

type MediaItem = {
  type: "image" | "video";
  url: string;
};

function parseStoryMedia(story: Story): MediaItem[] {
  const mediaValue = story.media;

  if (!mediaValue) return [];

  if (Array.isArray(mediaValue)) {
    return mediaValue.filter(
      (item): item is MediaItem =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as MediaItem).url === "string" &&
        typeof (item as MediaItem).type === "string",
    );
  }

  if (typeof mediaValue === "string") {
    try {
      const parsed = JSON.parse(mediaValue);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is MediaItem =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof item.url === "string" &&
            typeof item.type === "string",
        );
      }
    } catch {
      return [];
    }
  }

  if (typeof mediaValue === "object" && mediaValue !== null) {
    const candidate = mediaValue as MediaItem;
    if (
      typeof candidate.url === "string" &&
      typeof candidate.type === "string"
    ) {
      return [candidate];
    }
  }

  return [];
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StoryArchiveModal({
  stories,
  loading,
  error,
  onClose,
  onRetry,
}: StoryArchiveModalProps) {
  const now = Date.now();
  const activeCount = stories.filter(
    (story) => new Date(story.expires_at).getTime() > now,
  ).length;
  const expiredCount = Math.max(0, stories.length - activeCount);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
      <div className="h-[88vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-[#DDE9EC] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E4EDF0] bg-gradient-to-r from-[#F6FBFC] to-[#EDF5F7] px-5 py-4">
          <div>
            <h3 className="text-lg font-black tracking-wide text-[#1F3E48]">
              Archive Stories
            </h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5D7882]">
              Vos stories publiees
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
            aria-label="Fermer archive stories"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-[#EEF3F5] bg-[#F9FCFD] px-5 py-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#D7E8EC] bg-white px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">
              Total
            </p>
            <p className="mt-1 text-xl font-black text-[#2D5560]">
              {stories.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#D7E8EC] bg-white px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">
              Actives
            </p>
            <p className="mt-1 text-xl font-black text-[#2C7A4B]">
              {activeCount}
            </p>
          </div>
          <div className="rounded-2xl border border-[#D7E8EC] bg-white px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">
              Expirees
            </p>
            <p className="mt-1 text-xl font-black text-[#A24E2A]">
              {expiredCount}
            </p>
          </div>
        </div>

        <div className="h-[calc(88vh-170px)] overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="rounded-2xl border border-[#E2ECF0] bg-[#F9FCFD] p-6 text-center font-semibold text-gray-500">
              Chargement de l'archive...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-semibold text-red-700">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Reessayer
              </button>
            </div>
          ) : stories.length === 0 ? (
            <div className="rounded-2xl border border-[#E2ECF0] bg-[#F9FCFD] p-6 text-center">
              <p className="text-sm font-semibold text-gray-600">
                Vous n'avez encore publie aucune story.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {stories.map((story) => {
                const media = parseStoryMedia(story);
                const firstMedia = media[0];
                const isExpired = new Date(story.expires_at).getTime() <= now;

                return (
                  <article
                    key={story.id}
                    className="group overflow-hidden rounded-2xl border border-[#DBE7EB] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#EEF5F7]">
                      {firstMedia ? (
                        firstMedia.type === "video" ? (
                          <video
                            src={firstMedia.url}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={firstMedia.url}
                            alt="Story media"
                            className="h-full w-full object-cover"
                          />
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#4B7780] to-[#8A6131] px-3 text-center text-sm font-bold text-white">
                          {story.content?.trim() || "Story sans media"}
                        </div>
                      )}

                      <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white">
                        {firstMedia?.type === "video" ? (
                          <Film size={12} />
                        ) : (
                          <ImageIcon size={12} />
                        )}
                        {firstMedia?.type === "video" ? "Video" : "Image"}
                      </div>

                      <div className="absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-black text-white bg-black/55">
                        {isExpired ? "Expiree" : "Active"}
                      </div>
                    </div>

                    <div className="space-y-2 p-3">
                      <p className="line-clamp-2 min-h-[36px] text-xs font-semibold text-[#22414B]">
                        {story.content?.trim() || "Aucun texte"}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Eye size={12} />
                          {story.viewCount ?? story.views?.length ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDateTime(story.created_at)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
