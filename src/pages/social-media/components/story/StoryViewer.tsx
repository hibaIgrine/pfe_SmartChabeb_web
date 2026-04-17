import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Trash2, X } from "lucide-react";
import {
  markStoryAsViewed,
  deleteStory,
  type Story,
} from "../../../../api/stories.api";

type StoryViewerProps = {
  stories: Story[];
  initialIndex: number;
  currentUserId?: string;
  onClose: () => void;
};

export function StoryViewer({
  stories,
  initialIndex,
  currentUserId,
  onClose,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const duration = 5;
  const [displayDuration, setDisplayDuration] = useState(duration);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const viewedStoryIdsRef = useRef(new Set<string>());

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (currentStory && !viewedStoryIdsRef.current.has(currentStory.id)) {
      viewedStoryIdsRef.current.add(currentStory.id);
      void markStoryAsViewed(currentStory.id);
    }
  }, [currentStory?.id]);

  useEffect(() => {
    if (displayDuration <= 0) {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setDisplayDuration(duration);
      } else {
        onClose();
      }
      return;
    }

    const interval = setInterval(() => {
      setDisplayDuration((prev) => prev - 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [displayDuration, currentIndex, stories.length, duration, onClose]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDisplayDuration(duration);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setDisplayDuration(duration);
    }
  };

  const handleDelete = async () => {
    if (currentStory && currentStory.user_id === currentUserId) {
      try {
        await deleteStory(currentStory.id);
        setConfirmDeleteOpen(false);
        handleNext();
      } catch (err) {
        console.error("Erreur suppression story:", err);
      }
    }
  };

  const mediaList = (() => {
    const mediaValue = currentStory?.media;
    if (!mediaValue) {
      return [];
    }

    if (Array.isArray(mediaValue)) {
      return mediaValue;
    }

    if (typeof mediaValue === "string") {
      try {
        const parsed = JSON.parse(mediaValue);
        if (Array.isArray(parsed)) {
          return parsed;
        }

        if (parsed && typeof parsed === "object") {
          return [parsed];
        }
      } catch {
        return [];
      }
    }

    if (typeof mediaValue === "object") {
      return [mediaValue];
    }

    return [];
  })().filter((item) => item && typeof item.url === "string");
  const hasMedia = mediaList.length > 0;
  const isOwnStory = currentStory?.user_id === currentUserId;
  const progressPercent = ((duration - displayDuration) / duration) * 100;
  const viewers = currentStory?.views ?? [];

  useEffect(() => {
    setViewersOpen(false);
  }, [currentStory?.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(67,109,117,0.35),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(138,93,42,0.28),transparent_35%)]" />

      <div className="absolute left-1/2 top-3 z-20 flex w-full max-w-3xl -translate-x-1/2 gap-1.5 px-4">
        {stories.map((story, index) => (
          <div
            key={story.id}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20"
          >
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{
                width:
                  index < currentIndex
                    ? "100%"
                    : index === currentIndex
                      ? `${progressPercent}%`
                      : "0%",
              }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-30 rounded-full border border-white/20 bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70"
      >
        <X size={24} />
      </button>

      <div className="relative z-10 w-full max-w-3xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_30px_80px_rgba(0,0,0,0.45)] aspect-[9/16] sm:aspect-video max-h-[82vh]">
          {hasMedia ? (
            mediaList[0].type === "video" ? (
              <video
                src={mediaList[0].url}
                autoPlay
                controls
                className="h-full w-full bg-black object-contain"
              />
            ) : (
              <img
                src={mediaList[0].url}
                alt="Story"
                className="h-full w-full bg-black object-contain"
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#436D75] via-[#4F7F88] to-[#8a5d2a]">
              <div className="px-8 text-center text-white">
                <p className="text-2xl font-bold mb-4">
                  {currentStory?.user?.prenom} {currentStory?.user?.nom}
                </p>
                <p className="text-lg">{currentStory?.content}</p>
              </div>
            </div>
          )}

          <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3">
              {currentStory?.user?.photo_profil_url ? (
                <img
                  src={currentStory.user.photo_profil_url}
                  alt={currentStory.user.prenom}
                  className="h-10 w-10 rounded-full object-cover border-2 border-white/70"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/20 font-bold text-white">
                  {currentStory?.user?.nom?.[0]}
                  {currentStory?.user?.prenom?.[0]}
                </div>
              )}
              <div className="text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
                <p className="text-sm font-semibold leading-tight">
                  {currentStory?.user?.prenom} {currentStory?.user?.nom}
                </p>
                <p className="text-xs text-white/80">
                  {new Date(currentStory?.created_at || "").toLocaleTimeString(
                    "fr-FR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-full border border-white/30 bg-black/30 px-2.5 py-1 text-xs font-bold text-white">
              {currentIndex + 1} / {stories.length}
            </div>
          </div>

          {currentStory?.content?.trim() && (
            <div className="absolute bottom-16 left-3 right-3 rounded-xl bg-black/55 px-3 py-2 text-sm text-white">
              {currentStory.content}
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-between px-3 sm:px-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-full border border-white/20 bg-black/35 p-2.5 text-white hover:bg-black/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === stories.length - 1}
              className="rounded-full border border-white/20 bg-black/35 p-2.5 text-white hover:bg-black/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        {isOwnStory && (
          <div className="mt-2 flex items-center justify-between px-1 text-white">
            <button
              type="button"
              onClick={() => setViewersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-sm font-semibold hover:bg-black/55"
            >
              <Eye size={16} />
              {currentStory?.viewCount || 0} vue(s)
            </button>

            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              title="Supprimer la story"
              aria-label="Supprimer la story"
              className="rounded-full bg-red-500/85 p-2 text-white hover:bg-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        {isOwnStory && viewersOpen && (
          <div className="absolute inset-0 z-40 flex items-end" role="dialog" aria-modal="true">
            <button
              type="button"
              onClick={() => setViewersOpen(false)}
              className="absolute inset-0 bg-black/50"
              aria-label="Fermer la liste des vues"
            />

            <div className="relative z-10 w-full rounded-t-3xl bg-white px-4 pb-4 pt-3 text-gray-900 shadow-2xl">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-wider text-[#355860]">
                  Vu par
                </h4>
                <span className="text-xs font-bold text-gray-500">
                  {viewers.length} utilisateur(s)
                </span>
              </div>

              {viewers.length === 0 ? (
                <p className="py-4 text-sm text-gray-500">Aucune vue pour le moment.</p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {viewers.map((view) => {
                    const name = view.viewer
                      ? `${view.viewer.prenom} ${view.viewer.nom}`
                      : view.viewer_id;

                    return (
                      <div
                        key={`${view.viewer_id}-${view.viewed_at}`}
                        className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#F7FAFC] px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5">
                          {view.viewer?.photo_profil_url ? (
                            <img
                              src={view.viewer.photo_profil_url}
                              alt={name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCE9EC] text-[11px] font-black text-[#355860]">
                              {(view.viewer?.prenom?.[0] || "?").toUpperCase()}
                              {(view.viewer?.nom?.[0] || "").toUpperCase()}
                            </div>
                          )}
                          <p className="text-sm font-semibold text-[#203A43]">{name}</p>
                        </div>

                        <p className="text-xs text-gray-500">
                          {new Date(view.viewed_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">
              Supprimer cette story ?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Cette action est irreversible.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
