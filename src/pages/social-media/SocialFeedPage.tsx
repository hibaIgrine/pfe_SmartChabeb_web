import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FeedHeader, FeedList, PostComposer } from "./components";
import { StoryReel } from "./components/StoryReel";
import { useSocialFeed } from "./hooks/useSocialFeed";
import { OriginalPostModal } from "./components/post-card/OriginalPostModal";

export default function SocialFeedPage() {
  const location = useLocation();
  const feed = useSocialFeed();
  const [originalPostId, setOriginalPostId] = useState<string | null>(null);

  const targetPostId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const value = searchParams.get("postId");
    return value && value.trim() ? value.trim() : undefined;
  }, [location.search]);

  // Ouvrir le modal si postId dans l'URL
  useMemo(() => {
    if (targetPostId && !originalPostId) {
      setOriginalPostId(targetPostId);
    }
  }, [targetPostId, originalPostId]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void feed.publish();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FeedHeader onRefresh={feed.loadFeed} />

      <StoryReel currentUserId={feed.me?.id} onStoryCreated={feed.loadFeed} />

      <PostComposer
        composerText={feed.composerText}
        draftMediaItems={feed.draftMediaItems}
        location={feed.location}
        mentions={feed.mentions}
        hashtagInput={feed.hashtagInput}
        hashtags={feed.hashtags}
        mentionUsers={feed.mentionUsers}
        canSubmit={feed.canSubmit}
        submitting={feed.submitting}
        onSubmit={onSubmit}
        setComposerText={feed.setComposerText}
        setLocation={feed.setLocation}
        setHashtagInput={feed.setHashtagInput}
        onAddMediaFile={feed.addMediaFile}
        onRemoveMediaLine={feed.removeMediaLine}
        onAddMentionById={feed.addMentionById}
        onRemoveMention={feed.removeMention}
        onAddHashtag={feed.addHashtag}
        onRemoveHashtag={feed.removeHashtag}
        isEditing={Boolean(feed.editingPostId)}
        onCancelEdit={feed.cancelEdit}
      />

      {feed.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {feed.error}
        </div>
      )}

      <FeedList
        posts={feed.posts}
        loading={feed.loading}
        currentUserId={feed.me?.id}
        onDelete={feed.removePost}
        onEdit={feed.startEditPost}
        onReact={feed.reactToPost}
        onRemoveReaction={feed.removePostReaction}
        onShare={feed.sharePost}
      />

      <OriginalPostModal
        originalPostId={originalPostId}
        onClose={() => setOriginalPostId(null)}
        currentUserId={feed.me?.id}
        onReact={feed.reactToPost}
        onRemoveReaction={feed.removePostReaction}
        onShare={feed.sharePost}
      />
    </div>
  );
}
