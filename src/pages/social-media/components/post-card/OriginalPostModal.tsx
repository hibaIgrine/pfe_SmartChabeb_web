/**
 * OriginalPostModal.tsx — Modale affichant la publication originale partagée.
 *
 * RÔLE :
 *   Quand un post partagé est affiché dans le feed, l'aperçu de la publication
 *   originale est cliquable. Ce modal charge et affiche la version complète.
 *
 * COMPORTEMENT :
 *   1. Appel fetchPost(originalPostId) pour charger la publication originale
 *   2. Appel fetchReactions(postId) pour charger les réactions
 *   3. Rendu de PostCard en lecture seule (pas d'actions de modification)
 *   4. Fermeture par clic overlay ou bouton X
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type {
  Publication,
  ReactionType,
} from "../../../../api/social-media.api";
import { fetchPost, fetchReactions } from "../../../../api/social-media.api";
import { PostCard } from "./PostCard";

type OriginalPostModalProps = {
  originalPostId: string | null;
  onClose: () => void;
  currentUserId?: string;
  onReact?: (postId: string, reactionType: ReactionType) => void;
  onRemoveReaction?: (postId: string) => void;
  onShare?: (postId: string, message?: string) => void | Promise<void>;
  onToggleFavorite?: (postId: string, isFavorite: boolean) => void;
  onHideAuthor?: (userId: string) => void | Promise<void>;
};

export function OriginalPostModal({
  originalPostId,
  onClose,
  currentUserId,
  onReact,
  onRemoveReaction,
  onShare,
  onToggleFavorite,
  onHideAuthor,
}: OriginalPostModalProps) {
  const [post, setPost] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!originalPostId) {
      setPost(null);
      return;
    }

    const loadPost = async () => {
      try {
        setLoading(true);
        const postData = await fetchPost(originalPostId);
        const reactions = await fetchReactions(originalPostId);
        setPost({ ...postData, reactions });
      } catch (error) {
        console.error("Erreur lors du chargement du post original:", error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    void loadPost();
  }, [originalPostId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="rounded-lg bg-white p-6">
          <p className="text-sm text-gray-600">
            Chargement du post original...
          </p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Publication originale
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <PostCard
            post={post}
            canDelete={false}
            canEdit={false}
            defaultCommentsOpen
            currentUserId={currentUserId}
            onDelete={() => {}}
            onEdit={() => {}}
            onReact={onReact}
            onRemoveReaction={onRemoveReaction}
            onShare={onShare}
            onToggleFavorite={onToggleFavorite}
            onHideAuthor={onHideAuthor}
          />
        </div>
      </div>
    </div>
  );
}
