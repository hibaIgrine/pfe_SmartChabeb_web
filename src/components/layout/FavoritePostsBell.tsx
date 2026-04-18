import { useEffect, useMemo, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  fetchFavoritePosts,
  fetchFavoritePostsCount,
  type Publication,
} from "../../api/social-media.api";

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "A l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

function getPostPreviewText(post: Publication) {
  const text = (post.content ?? "").trim();
  if (!text) {
    return "Publication sans texte";
  }

  return text.length > 82 ? `${text.slice(0, 82)}...` : text;
}

export function FavoritePostsBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [favorites, setFavorites] = useState<Publication[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 80, right: 16 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const displayFavorites = useMemo(() => favorites.slice(0, 12), [favorites]);

  const refreshFavoritesCount = async () => {
    try {
      const data = await fetchFavoritePostsCount();
      setFavoritesCount(data.count ?? 0);
    } catch (error) {
      console.error("Erreur chargement compteur favoris:", error);
    }
  };

  const refreshFavorites = async () => {
    try {
      setIsLoading(true);
      const data = await fetchFavoritePosts(30, 0);
      setFavorites(data ?? []);
    } catch (error) {
      console.error("Erreur chargement favoris:", error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshFavoritesCount();
    const interval = window.setInterval(() => {
      void refreshFavoritesCount();
    }, 25000);

    const handleFavoritesUpdated = () => {
      void refreshFavoritesCount();
      if (isOpen) {
        void refreshFavorites();
      }
    };

    window.addEventListener(
      "social-favorites-updated",
      handleFavoritesUpdated as EventListener,
    );

    return () => {
      window.clearInterval(interval);
      window.removeEventListener(
        "social-favorites-updated",
        handleFavoritesUpdated as EventListener,
      );
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      void refreshFavorites();
      void refreshFavoritesCount();

      const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setPanelPosition({
          top: Math.round(rect.bottom + 10),
          right: Math.max(16, Math.round(window.innerWidth - rect.right)),
        });
      };

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          panelRef.current &&
          !panelRef.current.contains(target) &&
          buttonRef.current &&
          !buttonRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleOpenPost = (postId: string) => {
    setIsOpen(false);
    navigate(`/fil-actualite?postId=${encodeURIComponent(postId)}`);
  };

  return (
    <div className="relative z-50">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#436D75] transition hover:border-[#ef8f84] hover:bg-[#fff3f1]"
        aria-label="Favoris"
        title="Favoris"
      >
        <Heart size={18} />
        {favoritesCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#ef8f84] px-1 text-[10px] font-black text-white">
            {favoritesCount > 99 ? "99+" : favoritesCount}
          </span>
        ) : null}
      </button>

      {isOpen
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-[3000] w-[360px] max-w-[92vw] rounded-2xl border border-gray-200 bg-white shadow-2xl"
              style={{ top: panelPosition.top, right: panelPosition.right }}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#436D75]">
                  Favoris
                </p>
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#ef8f84]">
                  {favoritesCount} enregistree{favoritesCount > 1 ? "s" : ""}
                </span>
              </div>

              <div className="max-h-[360px] overflow-y-auto p-2">
                {isLoading ? (
                  <div className="px-3 py-6 text-center text-xs font-bold text-gray-400">
                    Chargement...
                  </div>
                ) : displayFavorites.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs font-bold text-gray-400">
                    Aucune publication favorite.
                  </div>
                ) : (
                  displayFavorites.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => handleOpenPost(post.id)}
                      className="w-full rounded-xl px-3 py-3 text-left transition hover:bg-[#fff3f1]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#436D75]">
                          {post.user?.nom} {post.user?.prenom}
                        </p>
                        <span className="text-[10px] font-bold text-gray-400">
                          {formatRelativeDate(post.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-gray-700">
                        {getPostPreviewText(post)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
