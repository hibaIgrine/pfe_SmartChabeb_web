import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchPostsByUser,
  fetchPublicUserProfile,
  followUser,
  unfollowUser,
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
              <div className="rounded-xl border border-[#e8eef2] bg-[#f7fbfd] px-3 py-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
                  Followers
                </p>
                <p className="text-lg font-black text-[#436D75]">
                  {profile._count?.followers ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-[#e8eef2] bg-[#f7fbfd] px-3 py-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
                  Following
                </p>
                <p className="text-lg font-black text-[#436D75]">
                  {profile._count?.following ?? 0}
                </p>
              </div>
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
    </div>
  );
}
