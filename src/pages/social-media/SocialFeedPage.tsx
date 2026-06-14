/**
 * SocialFeedPage.tsx — Fil d'actualité du réseau social Smart Chabeb.
 *
 * RÔLE :
 *   Page principale du module social. Affiche un fil de publications (posts) avec
 *   stories en haut, recherche par hashtag/mot-clé, et compositeur de posts.
 *
 * COMPOSITION :
 *   StoryReel       — Carrousel de stories éphémères (24h) en haut du fil
 *   FeedHeader      — Barre de recherche + filtres (hashtags, visibilité)
 *   PostComposer    — Formulaire de création de publication (texte, médias, hashtags, mentions)
 *   FeedList        — Liste infinie de publications paginées
 *   OriginalPostModal — Modal affichant le post original quand on clique "voir post partagé"
 *
 * HOOK PRINCIPAL : useSocialFeed()
 *   Encapsule toute la logique : fetchFeed, pagination, création, réactions, favoris,
 *   commentaires, suppression, partage, masquage, following
 *
 * DEEP LINK (URL Query) :
 *   ?postId=<id> → ouvre automatiquement un post spécifique (depuis NotificationBell)
 *   useEffect sur location.search → lit le paramètre et scroll/highlight le post
 *
 * ACCÈS : Tous les rôles authentifiés (ADMIN_OR_ANY_MEMBER)
 */
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { FeedHeader, FeedList, PostComposer } from "./components";
import { useSocialFeed } from "./hooks/useSocialFeed";
import { OriginalPostModal } from "./components/post-card/OriginalPostModal";
import { StoryReel } from "./components/story/StoryReel";

export default function SocialFeedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const feed = useSocialFeed();
  const [originalPostId, setOriginalPostId] = useState<string | null>(null);

  const targetPostId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const value = searchParams.get("postId");
    return value && value.trim() ? value.trim() : undefined;
  }, [location.search]);

  useEffect(() => {
    setOriginalPostId(targetPostId ?? null);
  }, [targetPostId]);

  useEffect(() => {
    if (!feed.editingPostId) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [feed.editingPostId]);

  const handleCloseOriginalPostModal = () => {
    setOriginalPostId(null);

    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has("postId")) {
      searchParams.delete("postId");
      const nextSearch = searchParams.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : "",
        },
        { replace: true },
      );
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void feed.publish();
  };

  const isEditingPost = Boolean(feed.editingPostId);
  const isAdmin = feed.me?.role === "ADMIN";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FeedHeader
        onRefresh={feed.loadFeed}
        hiddenUsers={feed.hiddenAuthors}
        onUnhideUser={feed.unhideAuthorPosts}
      />

      <StoryReel currentUserId={feed.me?.id} isAdmin={isAdmin} onStoryCreated={feed.loadFeed} />

      {!isEditingPost ? (
        <PostComposer
          composerText={feed.composerText}
          draftMediaItems={feed.draftMediaItems}
          location={feed.location}
          visibility={feed.visibility}
          mentions={feed.mentions}
          hiddenUsers={feed.hiddenUsers}
          hashtagInput={feed.hashtagInput}
          hashtags={feed.hashtags}
          mentionUsers={feed.mentionUsers}
          canSubmit={feed.canSubmit}
          submitting={feed.submitting}
          onSubmit={onSubmit}
          setComposerText={feed.setComposerText}
          setLocation={feed.setLocation}
          setVisibility={feed.setVisibility}
          setHashtagInput={feed.setHashtagInput}
          onAddMediaFile={feed.addMediaFile}
          onRemoveMediaLine={feed.removeMediaLine}
          onAddMentionById={feed.addMentionById}
          onRemoveMention={feed.removeMention}
          onAddHiddenUserById={feed.addHiddenUserById}
          onRemoveHiddenUser={feed.removeHiddenUser}
          onAddHashtag={feed.addHashtag}
          onRemoveHashtag={feed.removeHashtag}
          isEditing={false}
          onCancelEdit={feed.cancelEdit}
        />
      ) : null}

      {isEditingPost ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#e7dfcf] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#efe9db] px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">
                  Modifier la publication
                </p>
                <p className="text-sm text-gray-500">
                  Modifiez le contenu, les medias et la visibilite sans quitter
                  le feed.
                </p>
              </div>
              <button
                type="button"
                onClick={feed.cancelEdit}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Fermer"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <PostComposer
                composerText={feed.composerText}
                draftMediaItems={feed.draftMediaItems}
                location={feed.location}
                visibility={feed.visibility}
                mentions={feed.mentions}
                hiddenUsers={feed.hiddenUsers}
                hashtagInput={feed.hashtagInput}
                hashtags={feed.hashtags}
                mentionUsers={feed.mentionUsers}
                canSubmit={feed.canSubmit}
                submitting={feed.submitting}
                onSubmit={onSubmit}
                setComposerText={feed.setComposerText}
                setLocation={feed.setLocation}
                setVisibility={feed.setVisibility}
                setHashtagInput={feed.setHashtagInput}
                onAddMediaFile={feed.addMediaFile}
                onRemoveMediaLine={feed.removeMediaLine}
                onAddMentionById={feed.addMentionById}
                onRemoveMention={feed.removeMention}
                onAddHiddenUserById={feed.addHiddenUserById}
                onRemoveHiddenUser={feed.removeHiddenUser}
                onAddHashtag={feed.addHashtag}
                onRemoveHashtag={feed.removeHashtag}
                isEditing
                onCancelEdit={feed.cancelEdit}
              />
            </div>
          </div>
        </div>
      ) : null}

      {feed.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {feed.error}
        </div>
      )}

      <FeedList
        posts={feed.posts}
        loading={feed.loading}
        currentUserId={feed.me?.id}
        isAdmin={isAdmin}
        onDelete={feed.removePost}
        onEdit={feed.startEditPost}
        onReact={feed.reactToPost}
        onRemoveReaction={feed.removePostReaction}
        onShare={feed.sharePost}
        onToggleFavorite={feed.toggleFavoritePost}
        onHideAuthor={feed.hideAuthorPosts}
      />

      <OriginalPostModal
        originalPostId={originalPostId}
        onClose={handleCloseOriginalPostModal}
        currentUserId={feed.me?.id}
        onReact={feed.reactToPost}
        onRemoveReaction={feed.removePostReaction}
        onShare={feed.sharePost}
        onToggleFavorite={feed.toggleFavoritePost}
        onHideAuthor={feed.hideAuthorPosts}
      />
    </div>
  );
}
