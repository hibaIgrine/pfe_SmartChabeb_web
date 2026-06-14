/**
 * FeedList.tsx — Liste des publications du feed social.
 *
 * RÔLE :
 *   Rendu de la liste des Publications via PostCard.
 *   Gère l'état vide ("Aucune publication") et le spinner chargement.
 *
 * PROPS :
 *   posts[]        — Publications à afficher
 *   loading        — Affiche un spinner si vrai
 *   currentUserId  — ID de l'utilisateur connecté (pour les droits d'édition)
 *   isAdmin        — Si vrai, active les boutons de modération
 *   onDelete/onEdit/onShare/onReact/onFavorite/onHideUser — Callbacks du hook useSocialFeed
 */
import type { Publication, ReactionType } from "../../../api/social-media.api";
import { PostCard } from "./post-card/PostCard";

type FeedListProps = {
  posts: Publication[];
  loading: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
  onDelete: (postId: string) => void;
  onEdit: (post: Publication) => void;
  onReact?: (postId: string, reactionType: ReactionType) => void;
  onRemoveReaction?: (postId: string) => void;
  onShare?: (postId: string, message?: string) => void | Promise<void>;
  onToggleFavorite?: (postId: string, isFavorite: boolean) => void;
  onHideAuthor?: (userId: string) => void | Promise<void>;
};

export function FeedList({
  posts,
  loading,
  currentUserId,
  isAdmin,
  onDelete,
  onEdit,
  onReact,
  onRemoveReaction,
  onShare,
  onToggleFavorite,
  onHideAuthor,
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
            isAdmin ||
            (currentUserId && post.user?.id && currentUserId === post.user.id),
          )}
          canEdit={Boolean(
            currentUserId && post.user?.id && currentUserId === post.user.id,
          )}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onDelete={onDelete}
          onEdit={onEdit}
          onReact={onReact}
          onRemoveReaction={onRemoveReaction}
          onShare={onShare}
          onToggleFavorite={onToggleFavorite}
          onHideAuthor={onHideAuthor}
        />
      ))}
    </section>
  );
}
