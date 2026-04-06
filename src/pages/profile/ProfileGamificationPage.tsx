import { useEffect, useMemo, useState } from "react";
import { Crown, Medal, Sparkles, Trophy } from "lucide-react";
import api from "../../api/axios";

type Badge = {
  key: string;
  label: string;
  minPoints: number;
};

type GamificationProfile = {
  user: {
    id: string;
    nom: string;
    prenom: string;
    photo_profil_url?: string | null;
  };
  points: number;
  rank: number;
  badge: Badge;
  nextBadge: {
    label: string;
    targetPoints: number | null;
    remainingPoints: number;
    progressPercent: number;
  };
};

type LeaderboardRow = {
  rank: number;
  id: string;
  nom: string;
  prenom: string;
  points: number;
  badge: Badge;
};

const badgeClass: Record<string, string> = {
  STARTER: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-[#D9E8D1] text-[#2D4E56]",
  ELITE: "bg-[#FDE5E1] text-[#B23A2B]",
  LEGEND: "bg-amber-100 text-amber-700",
};

export default function ProfileGamificationPage() {
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, leaderboardRes] = await Promise.all([
          api.get("/users/me/gamification", { headers }),
          api.get("/users/gamification/leaderboard", { headers }),
        ]);

        setProfile(profileRes.data ?? null);
        setLeaderboard(
          Array.isArray(leaderboardRes.data) ? leaderboardRes.data : [],
        );
      } catch {
        setError("Impossible de charger la gamification.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [headers]);

  if (loading) {
    return (
      <div className="rounded-[36px] border border-gray-100 bg-white p-10 shadow-sm text-center text-gray-500 font-bold">
        Chargement de votre progression...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-[36px] border border-red-100 bg-red-50 p-8 text-red-700 font-bold">
        {error ?? "Erreur inattendue."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black italic text-[#203A43]">
              Profil Gamification
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">
              Points, badge et progression
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-[#F7F3E9] px-4 py-2">
            <Sparkles size={16} className="text-[#436D75]" />
            <span className="text-xs font-black text-[#436D75]">
              Rang #{profile.rank}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-[#F7FAFC] p-4">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">
              Points
            </p>
            <p className="text-4xl font-black text-[#436D75] mt-2">
              {profile.points}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#F7FAFC] p-4">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">
              Badge actuel
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#D9E8D1] px-3 py-1 text-xs font-black text-[#2D4E56]">
              <Medal size={14} />
              {profile.badge.label}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#F7FAFC] p-4">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">
              Prochain badge
            </p>
            <p className="text-sm font-black text-[#203A43] mt-2">
              {profile.nextBadge.label}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-semibold">
              {profile.nextBadge.targetPoints
                ? `${profile.nextBadge.remainingPoints} points restants`
                : "Niveau maximum atteint"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-[#436D75]"
              style={{ width: `${profile.nextBadge.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black italic text-[#203A43]">
            Classement des membres
          </h3>
          <Trophy size={18} className="text-amber-500" />
        </div>

        <div className="mt-4 space-y-2">
          {leaderboard.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-gray-100 bg-[#F9FBFC] px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-black text-xs text-[#436D75]">
                  #{row.rank}
                </div>
                <p className="font-bold text-sm text-[#203A43] truncate">
                  {row.prenom} {row.nom}
                </p>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${badgeClass[row.badge.key] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {row.badge.label}
                </span>
              </div>
              <div className="text-right">
                <p className="font-black text-[#436D75]">{row.points} pts</p>
                {row.rank === 1 ? (
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 inline-flex items-center gap-1">
                    <Crown size={11} /> Leader
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
