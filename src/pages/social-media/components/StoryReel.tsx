import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  fetchStoriesByUser,
  fetchStoriesForFeed,
  type Story,
} from "../../../api/stories.api";
import { StoryUploadModal } from "./StoryUploadModal";
import { StoryViewer } from "./StoryViewer";

function getStoryMediaCount(story: Story) {
  if (!story.media) {
    return 0;
  }

  if (Array.isArray(story.media)) {
    return story.media.length;
  }

  if (typeof story.media === "string") {
    try {
      const parsed = JSON.parse(story.media);
      if (Array.isArray(parsed)) {
        return parsed.length;
      }

      return parsed && typeof parsed === "object" ? 1 : 0;
    } catch {
      return 0;
    }
  }

  if (typeof story.media === "object") {
    return 1;
  }

  return 0;
}

type StoryReelProps = {
  currentUserId?: string;
  onStoryCreated?: () => void;
};

export function StoryReel({ currentUserId, onStoryCreated }: StoryReelProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const loadStories = async () => {
    try {
      setLoading(true);
      const [feedStories, myStories] = await Promise.all([
        fetchStoriesForFeed(),
        currentUserId ? fetchStoriesByUser(currentUserId) : Promise.resolve([]),
      ]);

      const data = feedStories ?? [];
      setStories(data || []);
      setMyStories(myStories ?? []);
    } catch (err) {
      console.error("Erreur chargement stories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStories();
    const interval = setInterval(() => {
      void loadStories();
    }, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [currentUserId]);

  const handleStoryCreated = () => {
    setShowUploadModal(false);
    onStoryCreated?.();
    void loadStories();
  };

  const handleOpenStory = (story: Story, index: number) => {
    setSelectedStory(story);
    setSelectedStoryIndex(index);
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
    setSelectedStoryIndex(0);
  };

  const handleMyStoryClick = () => {
    if (myStories.length > 0) {
      const preferredIndex = myStories.findIndex(
        (story) => getStoryMediaCount(story) > 0,
      );
      const nextIndex = preferredIndex >= 0 ? preferredIndex : 0;
      setSelectedStory(myStories[nextIndex]);
      setSelectedStoryIndex(nextIndex);
      return;
    }

    setShowUploadModal(true);
  };

  if (loading && !stories.length) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#e7dfcf] p-4 shadow-sm">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {/* Add Story Button */}
          <button
            type="button"
            onClick={handleMyStoryClick}
            className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer"
          >
            {myStories.length > 0 ? (
              <div className="relative w-16 h-16 rounded-full flex-shrink-0 border-2 border-[#436D75] ring-2 ring-[#436D75]/30 overflow-hidden">
                {myStories[0]?.user?.photo_profil_url ? (
                  <img
                    src={myStories[0].user.photo_profil_url}
                    alt="Votre story"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#436D75] to-[#8a5d2a] flex items-center justify-center text-white font-bold">
                    {myStories[0]?.user?.nom?.[0]}
                    {myStories[0]?.user?.prenom?.[0]}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#436D75] border-2 border-white flex items-center justify-center">
                  <Plus size={12} className="text-white" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-[#436D75] transition-colors">
                <Plus
                  size={24}
                  className="text-gray-400 group-hover:text-[#436D75]"
                />
              </div>
            )}
            <p className="text-xs text-center text-gray-600 w-16 truncate">
              Votre story
            </p>
          </button>

          {/* Stories */}
          {stories.map((story, index) => {
            const hasViewed = story.hasViewed;
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => handleOpenStory(story, index)}
                className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer"
              >
                <div
                  className={`w-16 h-16 rounded-full flex-shrink-0 border-2 overflow-hidden ${
                    hasViewed
                      ? "border-gray-300"
                      : "border-[#436D75] ring-2 ring-[#436D75]/30"
                  }`}
                >
                  {story.user?.photo_profil_url ? (
                    <img
                      src={story.user.photo_profil_url}
                      alt={`${story.user.nom} ${story.user.prenom}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#436D75] to-[#8a5d2a] flex items-center justify-center text-white font-bold">
                      {story.user?.nom?.[0]}
                      {story.user?.prenom?.[0]}
                    </div>
                  )}
                </div>
                <p className="text-xs text-center text-gray-600 w-16 truncate">
                  {story.user?.prenom}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {showUploadModal && (
        <StoryUploadModal
          onClose={() => setShowUploadModal(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}

      {selectedStory && (
        <StoryViewer
          stories={
            selectedStory.user_id === currentUserId ? myStories : stories
          }
          initialIndex={selectedStoryIndex}
          currentUserId={currentUserId}
          onClose={handleCloseStory}
        />
      )}
    </>
  );
}
