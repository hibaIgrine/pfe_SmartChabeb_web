import { useEffect, useMemo, useRef, useState } from 'react';
import type { Publication } from '../../../api/social-media.api';
import { Edit2, FileText, Image, MapPin, Video } from 'lucide-react';

type PostCardProps = {
  post: Publication;
  canDelete: boolean;
  canEdit: boolean;
  onDelete: (postId: string) => void;
  onEdit: (post: Publication) => void;
};

export function PostCard({ post, canDelete, canEdit, onDelete, onEdit }: PostCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const imageMedia = useMemo(
    () => (post.media ?? []).filter((item) => item.type === 'image'),
    [post.media],
  );

  const nonImageMedia = useMemo(
    () => (post.media ?? []).filter((item) => item.type !== 'image'),
    [post.media],
  );

  useEffect(() => {
    setActiveImageIndex(0);
  }, [post.id, imageMedia.length]);

  useEffect(() => {
    if (previewImageIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewImageIndex]);

  const scrollToImage = (index: number) => {
    const container = carouselRef.current;
    if (!container) return;

    const nextIndex = Math.max(0, Math.min(index, imageMedia.length - 1));
    const slideWidth = container.clientWidth;
    container.scrollTo({ left: slideWidth * nextIndex, behavior: 'smooth' });
    setActiveImageIndex(nextIndex);
  };

  const handleCarouselScroll = () => {
    const container = carouselRef.current;
    if (!container || imageMedia.length <= 1) return;

    const slideWidth = container.clientWidth;
    if (!slideWidth) return;

    const nextIndex = Math.round(container.scrollLeft / slideWidth);
    setActiveImageIndex(Math.max(0, Math.min(nextIndex, imageMedia.length - 1)));
  };

  const openPreview = (index: number) => {
    setPreviewImageIndex(index);
  };

  const closePreview = () => {
    setPreviewImageIndex(null);
  };

  const movePreview = (direction: number) => {
    if (previewImageIndex === null || imageMedia.length === 0) {
      return;
    }

    const nextIndex = previewImageIndex + direction;
    if (nextIndex < 0 || nextIndex >= imageMedia.length) {
      return;
    }

    setPreviewImageIndex(nextIndex);
  };

  return (
    <article className="rounded-2xl border border-[#e7dfcf] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-[#436D75]">
            {post.user?.nom} {post.user?.prenom}
          </h3>
          {post.location ? (
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#f8f1e9] px-3 py-1 text-xs font-semibold text-[#8a5d2a]">
              <MapPin size={14} />
              {post.location}
            </div>
          ) : null}
          <p className="text-xs text-gray-400 font-medium">
            {new Date(post.created_at).toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(post)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d8d1c2] px-3 py-1 text-xs font-bold text-[#436D75] hover:bg-[#f7f3e9]"
            >
              <Edit2 size={13} />
              Modifier
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="text-red-600 hover:text-red-700 text-xs font-bold"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      {post.content ? (
        <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
      ) : null}

      {post.mentions?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.mentions.map((mention) => (
            <span
              key={`${post.id}-${mention.mentioned_user.id}`}
              className="rounded-full bg-[#edf6fb] px-2.5 py-1 text-xs font-semibold text-[#2f6f8b]"
            >
              @{mention.mentioned_user.nom}_{mention.mentioned_user.prenom}
            </span>
          ))}
        </div>
      ) : null}

      {post.hashtags?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.hashtags.map((item) => (
            <span
              key={`${post.id}-${item.hashtag}`}
              className="rounded-full bg-[#f4f0ff] px-2.5 py-1 text-xs font-semibold text-[#6457a2]"
            >
              #{item.hashtag}
            </span>
          ))}
        </div>
      ) : null}

      {imageMedia.length > 0 && (
        <div className="mt-4 relative overflow-hidden rounded-xl border border-[#ece6d8] bg-[#faf8f3]">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {imageMedia.map((media, index) => (
              <div
                key={`${post.id}-${media.url}-${index}`}
                className="min-w-full snap-center"
              >
                <img
                  src={media.url}
                  alt={media.name || `Image ${index + 1}`}
                  className="h-80 w-full cursor-zoom-in object-cover"
                  onClick={() => openPreview(index)}
                />
              </div>
            ))}
          </div>

          {imageMedia.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollToImage(activeImageIndex - 1)}
                disabled={activeImageIndex === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-white disabled:opacity-35"
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={() => scrollToImage(activeImageIndex + 1)}
                disabled={activeImageIndex === imageMedia.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-white disabled:opacity-35"
              >
                &gt;
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-1">
                {imageMedia.map((_, index) => (
                  <button
                    key={`${post.id}-dot-${index}`}
                    type="button"
                    onClick={() => scrollToImage(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === activeImageIndex ? 'bg-white w-4' : 'bg-white/60'
                    }`}
                    aria-label={`Image ${index + 1}`}
                  />
                ))}
              </div>
              <div className="absolute top-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white">
                {activeImageIndex + 1}/{imageMedia.length}
              </div>
            </>
          )}
        </div>
      )}

      {nonImageMedia.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {nonImageMedia.map((media, index) => (
            <div
              key={`${post.id}-${media.url}-${index}`}
              className="overflow-hidden rounded-xl border border-[#ece6d8] bg-[#faf8f3]"
            >
              {media.type === 'video' && (
                <video
                  controls
                  src={media.url}
                  className="h-72 w-full object-cover bg-black"
                />
              )}
              {media.type === 'document' && (
                <a
                  href={media.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-3 py-3 text-sm text-[#436D75] hover:bg-[#f2eee4]"
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText size={16} />
                    {media.name || media.url}
                  </span>
                  <span className="text-xs font-semibold uppercase text-gray-400">
                    document
                  </span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {previewImageIndex !== null && imageMedia[previewImageIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={imageMedia[previewImageIndex].url}
              alt={imageMedia[previewImageIndex].name || `Image ${previewImageIndex + 1}`}
              className="max-h-[85vh] w-full object-contain"
            />

            <button
              type="button"
              onClick={closePreview}
              className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-2 text-sm font-bold text-white hover:bg-black/80"
            >
              X
            </button>

            {imageMedia.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => movePreview(-1)}
                  disabled={previewImageIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-4 py-3 text-white disabled:opacity-30"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={() => movePreview(1)}
                  disabled={previewImageIndex === imageMedia.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-4 py-3 text-white disabled:opacity-30"
                >
                  &gt;
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
