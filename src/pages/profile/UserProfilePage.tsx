/**
 * UserProfilePage.tsx — Profil public d'un autre utilisateur.
 *
 * RÔLE :
 *   Page de profil consultable par tous les utilisateurs authentifiés.
 *   Accessible via /utilisateurs/:id (paramètre URL).
 *
 * CONTENU :
 *   - Photo de profil, nom, rôle, bio, lieu, établissement
 *   - Compteurs : abonnés (followers), abonnements (following), publications
 *   - Bouton Suivre/Ne plus suivre si ce n'est pas notre propre profil
 *   - Publications de cet utilisateur (FeedList filtré par userId)
 *
 * DONNÉES :
 *   fetchPublicUserProfile(id)  → GET /users/:id/public-profile
 *   fetchPostsByUser(id)        → GET /social-media/users/:id/posts
 *   followUser(id) / unfollowUser(id)
 *
 * REDIRECTION :
 *   Si :id est l'id de l'utilisateur courant → redirige vers /mon-profil
 *
 * ACCÈS : Tous les rôles authentifiés (ADMIN_OR_ANY_MEMBER)
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import {
  fetchPostsByUser,
  fetchPublicUserProfile,
  fetchUserFollowers,
  fetchUserFollowing,
  followUser,
  unfollowUser,
  type FollowedUserLink,
  type FollowerUserLink,
  type PublicUserProfile,
  type Publication,
} from "../../api/social-media.api";
import { FeedList } from "../social-media/components";

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [posts, setPosts] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingFollow, setSubmittingFollow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  const [followList, setFollowList] = useState<Array<{ id: string; nom: string; prenom: string; photo_profil_url?: string | null; role?: string | null }>>([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);

  const currentUserId = useMemo(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(raw) as { id?: string };
      return parsed.id;
    } catch {
      return undefined;
    }
  }, []);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const [profileData, userPosts] = await Promise.all([
        fetchPublicUserProfile(id),
        fetchPostsByUser(id, 40, 0),
      ]);
      setProfile(profileData);
      setPosts(userPosts);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Impossible de charger ce profil.",
      );
      setProfile(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  const handleToggleFollow = async () => {
    if (!id || !profile || profile.isMe) {
      return;
    }

    try {
      setSubmittingFollow(true);
      if (profile.isFollowing) {
        await unfollowUser(id);
      } else {
        await followUser(id);
      }

      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isFollowing: !prev.isFollowing,
          _count: {
            followers: Math.max(
              0,
              (prev._count?.followers ?? 0) + (prev.isFollowing ? -1 : 1),
            ),
            following: prev._count?.following ?? 0,
            posts: prev._count?.posts ?? posts.length,
          },
        };
      });

      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de mettre a jour le suivi pour cet utilisateur.",
      );
    } finally {
      setSubmittingFollow(false);
    }
  };

  const openFollowList = async (type: "followers" | "following") => {
    if (!id) return;
    setFollowModal(type);
    setFollowList([]);
    setLoadingFollowList(true);
    try {
      if (type === "followers") {
        const data = await fetchUserFollowers(id);
        setFollowList(data.map((l: FollowerUserLink) => l.follower));
      } else {
        const data = await fetchUserFollowing(id);
        setFollowList(data.map((l: FollowedUserLink) => l.followed));
      }
    } finally {
      setLoadingFollowList(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-[#e7dfcf] bg-white p-5 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Chargement du profil...</p>
        ) : profile ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#436D75]">
                  {profile.nom} {profile.prenom}
                </h1>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                  {profile.role ?? "Membre"}
                </p>
                {profile.bio ? (
                  <p className="mt-2 text-sm text-gray-600">{profile.bio}</p>
                ) : null}
              </div>

              {profile.isMe ? (
                <button
                  type="button"
                  onClick={() => navigate("/mon-profil")}
                  className="rounded-xl border border-[#d8d1c2] px-3 py-1.5 text-xs font-bold text-[#436D75] hover:bg-[#f7f3e9]"
                >
                  Voir mon profil
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleToggleFollow()}
                  disabled={submittingFollow}
                  className={`rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] ${
                    profile.isFollowing
                      ? "border border-[#d8d1c2] bg-white text-[#705a44] hover:bg-[#f7f3e9]"
                      : "bg-[#436D75] text-white hover:bg-[#2f4d53]"
                  } disabled:opacity-60`}
                >
                  {submittingFollow
                    ? "..."
                    : profile.isFollowing
                      ? "Ne plus suivre"
                      : "Suivre"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#e8eef2] bg-[#f7fbfd] px-3 py-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
                  Publications
                </p>
                <p className="text-lg font-black text-[#436D75]">
                  {profile._count?.posts ?? posts.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void openFollowList("followers")}
                className="rounded-xl border border-[#e8eef2] bg-[#f7fbfd] px-3 py-2 text-center hover:border-[#436D75]/30 hover:bg-[#edf5f7] transition group"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 group-hover:text-[#436D75]">
                  Followers
                </p>
                <p className="text-lg font-black text-[#436D75]">
                  {profile._count?.followers ?? 0}
                </p>
              </button>
              <button
                type="button"
                onClick={() => void openFollowList("following")}
                className="rounded-xl border border-[#e8eef2] bg-[#f7fbfd] px-3 py-2 text-center hover:border-[#436D75]/30 hover:bg-[#edf5f7] transition group"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 group-hover:text-[#436D75]">
                  Following
                </p>
                <p className="text-lg font-black text-[#436D75]">
                  {profile._count?.following ?? 0}
                </p>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Profil introuvable.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[#436D75]">
          Publications
        </h2>
        <FeedList
          posts={posts}
          loading={loading}
          currentUserId={currentUserId}
          onDelete={() => {}}
          onEdit={() => {}}
        />
      </section>

      {followModal && (
        <div className="fixed inset-0 z-[2000] bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-[28px] border border-gray-100 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {profile?.nom} {profile?.prenom}
                </p>
                <h3 className="text-lg font-black text-[#436D75]">
                  {followModal === "followers" ? "Followers" : "Following"}
                </h3>
              </div>
              <button
                onClick={() => setFollowModal(null)}
                className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {loadingFollowList ? (
                <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>
              ) : followList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Aucun utilisateur.</p>
              ) : (
                followList.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => { setFollowModal(null); navigate(`/utilisateurs/${user.id}`); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#436D75]/30 hover:bg-[#f7fbfd] transition text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#D9E8D1] flex items-center justify-center shrink-0 overflow-hidden">
                      {user.photo_profil_url ? (
                        <img src={user.photo_profil_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-black text-[#436D75]">
                          {user.nom[0]}{user.prenom[0]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[#203A43] truncate">
                        {user.nom} {user.prenom}
                      </p>
                      {user.role && (
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider truncate">
                          {user.role}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
