import { useEffect, useState, useRef } from "react";
import { Plus } from "lucide-react";
import {
  fetchStoriesByUser,
  fetchStoriesForFeed,
  type Story,
} from "../../../../api/stories.api";
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

function formatStoryTime(value?: string) {
  if (!value) return "Maintenant";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Maintenant";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

type StoryReelProps = {
  currentUserId?: string;
  isAdmin?: boolean;
  onStoryCreated?: () => void;
};

export function StoryReel({ currentUserId, isAdmin, onStoryCreated }: StoryReelProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const showUploadModalRef = useRef(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const loadStories = async () => {
    try {
      setLoading(true);
      const [feedStories, myUserStories] = await Promise.all([
        fetchStoriesForFeed(),
        currentUserId ? fetchStoriesByUser(currentUserId) : Promise.resolve([]),
      ]);

      setStories(feedStories ?? []);
      const sortedMyStories = [...(myUserStories ?? [])].sort((a, b) => {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return aTime - bTime;
      });
      setMyStories(sortedMyStories);
    } catch (err) {
      console.error("Erreur chargement stories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Start by loading stories once. While the upload modal is open we
    // avoid refreshing the list to prevent interrupting in-progress
    // story creation (which would reset file inputs / previews).
    void loadStories();
    const interval = setInterval(() => {
      // Respect current modal state; skip refresh while user is composing.
      if (showUploadModalRef.current) return;
      void loadStories();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  useEffect(() => {
    showUploadModalRef.current = showUploadModal;
  }, [showUploadModal]);

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

  const handleOpenMyStories = () => {
    if (!myStories.length) return;

    const preferredIndex = myStories.findIndex(
      (story) => getStoryMediaCount(story) > 0,
    );
    const nextIndex = preferredIndex >= 0 ? preferredIndex : 0;
    setSelectedStory(myStories[nextIndex]);
    setSelectedStoryIndex(nextIndex);
  };

  if (loading && !stories.length) {
    return null;
  }

  return (
    <>
      <section className="rounded-3xl border border-[#DDE9EC] bg-gradient-to-br from-white via-[#F8FCFD] to-[#EEF5F7] p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#436D75]">
            Stories
          </h3>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Dernieres 24h
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="group relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-[#D4E3E7] bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_30%_20%,#f5fafb_0,#edf5f7_55%,#e6eff2_100%)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-[#90AEB6] text-[#436D75] transition-colors group-hover:border-[#436D75]">
                <Plus size={20} />
              </div>
              <p className="px-2 text-center text-[11px] font-black text-[#436D75]">
                + Creer
              </p>
            </div>
          </button>

          {myStories.length > 0 && (
            <button
              type="button"
              onClick={handleOpenMyStories}
              className="group relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-[#D4E3E7] bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <>
                <div className="h-full w-full">
                  {myStories[0]?.user?.photo_profil_url ? (
                    <img
                      src={myStories[0].user.photo_profil_url}
                      alt="Votre story"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#436D75] via-[#4F7F88] to-[#8a5d2a]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                </div>

                <div className="absolute left-2 top-2 h-8 w-8 rounded-full border-2 border-white bg-white/15 p-[2px] backdrop-blur">
                  {myStories[0]?.user?.photo_profil_url ? (
                    <img
                      src={myStories[0].user.photo_profil_url}
                      alt="Vous"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white/25 text-[10px] font-black text-white">
                      {myStories[0]?.user?.nom?.[0]}
                      {myStories[0]?.user?.prenom?.[0]}
                    </div>
                  )}
                </div>

                <div className="absolute bottom-2 left-2 right-2">
                  <p className="truncate text-[11px] font-black text-white">
                    Votre story
                  </p>
                  <p className="truncate text-[10px] font-semibold text-white/80">
                    {formatStoryTime(myStories[0]?.created_at)}
                  </p>
                </div>

                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#436D75] shadow">
                  <Plus size={12} className="text-white" />
                </div>
              </>
            </button>
          )}

          {stories.map((story, index) => {
            const hasViewed = story.hasViewed;

            return (
              <button
                key={story.id}
                type="button"
                onClick={() => handleOpenStory(story, index)}
                className="group relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-[#D4E3E7] bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="h-full w-full">
                  {story.user?.photo_profil_url ? (
                    <img
                      src={story.user.photo_profil_url}
                      alt={`${story.user.nom} ${story.user.prenom}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#436D75] via-[#4F7F88] to-[#8a5d2a]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                </div>

                <div
                  className={`absolute left-2 top-2 h-8 w-8 rounded-full border-2 p-[2px] backdrop-blur ${
                    hasViewed
                      ? "border-white/70 bg-white/10"
                      : "border-[#FFD57A] bg-white/20"
                  }`}
                >
                  {story.user?.photo_profil_url ? (
                    <img
                      src={story.user.photo_profil_url}
                      alt={story.user.prenom}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white/25 text-[10px] font-black text-white">
                      {story.user?.nom?.[0]}
                      {story.user?.prenom?.[0]}
                    </div>
                  )}
                </div>

                <div className="absolute bottom-2 left-2 right-2">
                  <p className="truncate text-[11px] font-black text-white">
                    {story.user?.prenom}
                  </p>
                  <p className="truncate text-[10px] font-semibold text-white/80">
                    {formatStoryTime(story.created_at)}
                  </p>
                </div>

                {!hasViewed && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#FFD57A] shadow-[0_0_0_3px_rgba(255,213,122,0.25)]" />
                )}
              </button>
            );
          })}
        </div>
      </section>

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
          isAdmin={isAdmin}
          onClose={handleCloseStory}
        />
      )}
    </>
  );
}
