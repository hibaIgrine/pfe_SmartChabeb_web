import type { Publication, ReactionType } from "../../../api/social-media.api";
import { PostCard } from "./post-card/PostCard";

type FeedListProps = {
  posts: Publication[];
  loading: boolean;
  currentUserId?: string;
  onDelete: (postId: string) => void;
  onEdit: (post: Publication) => void;
  onReact?: (postId: string, reactionType: ReactionType) => void;
  onRemoveReaction?: (postId: string) => void;
  onShare?: (postId: string, message?: string) => void | Promise<void>;
  onToggleFavorite?: (postId: string, isFavorite: boolean) => void;
};

export function FeedList({
  posts,
  loading,
  currentUserId,
  onDelete,
  onEdit,
  onReact,
  onRemoveReaction,
  onShare,
  onToggleFavorite,
}: FeedListProps) {
  if (loading) {
    return <div className="text-sm text-gray-500">Chargement du fil...</div>;
  }

  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
        Aucune publication pour le moment.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          canDelete={Boolean(
            currentUserId && post.user?.id && currentUserId === post.user.id,
          )}
          canEdit={Boolean(
            currentUserId && post.user?.id && currentUserId === post.user.id,
          )}
          currentUserId={currentUserId}
          onDelete={onDelete}
          onEdit={onEdit}
          onReact={onReact}
          onRemoveReaction={onRemoveReaction}
          onShare={onShare}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </section>
  );
}
