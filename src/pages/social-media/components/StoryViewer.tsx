import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  markStoryAsViewed,
  deleteStory,
  type Story,
} from "../../../api/stories.api";

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
  const [displayDuration, setDisplayDuration] = useState(duration); // Start fresh for each story
  const viewedStoryIdsRef = useRef(new Set<string>());

  const currentStory = stories[currentIndex];

  // Mark as viewed
  useEffect(() => {
    if (currentStory && !viewedStoryIdsRef.current.has(currentStory.id)) {
      viewedStoryIdsRef.current.add(currentStory.id);
      void markStoryAsViewed(currentStory.id);
    }
  }, [currentStory?.id]);

  // Auto progress
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/30">
        <div
          className="h-full bg-white transition-all"
          style={{
            width: `${((duration - displayDuration) / duration) * 100}%`,
          }}
        />
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
      >
        <X size={24} />
      </button>

      {/* Story Content */}
      <div className="relative w-full max-w-2xl aspect-video max-h-screen overflow-hidden rounded-lg">
        {hasMedia ? (
          mediaList[0].type === "video" ? (
            <video
              src={mediaList[0].url}
              autoPlay
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={mediaList[0].url}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#436D75] to-[#8a5d2a] flex items-center justify-center">
            <div className="text-center text-white px-8">
              <p className="text-2xl font-bold mb-4">
                {currentStory?.user?.prenom} {currentStory?.user?.nom}
              </p>
              <p className="text-lg">{currentStory?.content}</p>
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="absolute top-12 left-4 flex items-center gap-3">
          {currentStory?.user?.photo_profil_url ? (
            <img
              src={currentStory.user.photo_profil_url}
              alt={currentStory.user.prenom}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/30 border border-white flex items-center justify-center text-white font-bold">
              {currentStory?.user?.nom?.[0]}
              {currentStory?.user?.prenom?.[0]}
            </div>
          )}
          <div className="text-white">
            <p className="font-semibold">
              {currentStory?.user?.prenom} {currentStory?.user?.nom}
            </p>
            <p className="text-xs opacity-75">
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

        {/* Navigation & Actions */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="rounded-full bg-white/30 p-3 text-white hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === stories.length - 1}
            className="rounded-full bg-white/30 p-3 text-white hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* View Count & Delete */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-sm">
          <p>{currentStory?.viewCount || 0} vue(s)</p>
          {isOwnStory && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg bg-red-500/80 px-3 py-1 hover:bg-red-600"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Story Counter */}
      <div className="absolute bottom-4 right-4 text-white text-sm">
        {currentIndex + 1} / {stories.length}
      </div>
    </div>
  );
}
