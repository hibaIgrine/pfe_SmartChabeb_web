import type { FormEvent } from "react";
import { FeedHeader, FeedList, PostComposer } from "./components";
import { useSocialFeed } from "./hooks/useSocialFeed";

export default function SocialFeedPage() {
  const feed = useSocialFeed();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void feed.publish();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FeedHeader onRefresh={feed.loadFeed} />

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
      />
    </div>
  );
}
