import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import api from "../../api/axios";
import { FormUpdateInfo } from "./forms/FormUpdateInfo";
import { FormUpdateMdp } from "./forms/FormUpdateMdp";

type UserProfile = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role?: string;
  bio?: string | null;
  genre?: string | null;
  date_naissance?: string | null;
  photo_profil_url?: string | null;
};

type GamificationProfile = {
  points?: number;
};

function toInputDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function computeAge(inputDate?: string | null) {
  if (!inputDate) return null;
  const birth = new Date(inputDate);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export default function MyProfilePage() {
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [xpPoints, setXpPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"info" | "mdp" | null>(null);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    bio: "",
    genre: "",
    date_naissance: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const [profileResult, xpResult] = await Promise.allSettled([
          api.get("/users/me/profile", { headers }),
          api.get("/users/me/gamification", { headers }),
        ]);

        if (profileResult.status !== "fulfilled") {
          throw new Error("profile_load_failed");
        }

        const data = profileResult.value.data as UserProfile;
        setProfile(data);

        if (xpResult.status === "fulfilled") {
          const gamificationData = xpResult.value.data as GamificationProfile;
          setXpPoints(gamificationData?.points ?? 0);
        }

        setForm({
          nom: data.nom ?? "",
          prenom: data.prenom ?? "",
          email: data.email ?? "",
          bio: data.bio ?? "",
          genre: data.genre ?? "",
          date_naissance: toInputDate(data.date_naissance),
        });
      } catch {
        setError("Impossible de charger vos informations de profil.");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [headers]);

  const age = computeAge(form.date_naissance || profile?.date_naissance);

  const openModal = (value: "info" | "mdp") => {
    setError(null);
    setSuccess(null);
    setMenuOpen(false);
    setActiveModal(value);
  };

  const onSubmitInfo = async (values: {
    nom: string;
    prenom: string;
    email: string;
    bio: string;
    genre: string;
    date_naissance: string;
  }) => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        nom: values.nom.trim(),
        prenom: values.prenom.trim(),
        email: values.email.trim().toLowerCase(),
        bio: values.bio.trim() || null,
        genre: values.genre || null,
        date_naissance: values.date_naissance || null,
      };

      const response = await api.patch(`/users/${profile.id}`, payload, {
        headers,
      });

      const updated = (response.data?.user ?? response.data) as UserProfile;
      setProfile(updated);
      setSuccess("Profil mis a jour avec succes.");
      setForm({
        nom: updated.nom ?? "",
        prenom: updated.prenom ?? "",
        email: updated.email ?? "",
        bio: updated.bio ?? "",
        genre: updated.genre ?? "",
        date_naissance: toInputDate(updated.date_naissance),
      });

      const currentUserRaw = localStorage.getItem("user");
      if (currentUserRaw) {
        const currentUser = JSON.parse(currentUserRaw);
        const merged = {
          ...currentUser,
          nom: updated.nom,
          prenom: updated.prenom,
          email: updated.email,
          photo_profil_url: updated.photo_profil_url,
        };
        localStorage.setItem("user", JSON.stringify(merged));
      }
    } catch {
      setError("Echec de la mise a jour du profil.");
    } finally {
      setSaving(false);
    }
  };

  const onSubmitPassword = async (values: {
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (!profile) return;

    if (!values.newPassword || !values.confirmPassword) {
      setError("Veuillez remplir les deux champs mot de passe.");
      return;
    }

    if (values.newPassword.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caracteres.");
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await api.patch(
        `/users/${profile.id}`,
        { mot_de_passe: values.newPassword.trim() },
        { headers },
      );
      setSuccess("Mot de passe modifie avec succes.");
    } catch {
      setError("Echec de la mise a jour du mot de passe.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!form.email) {
      setError("Email manquant pour reinitialiser le mot de passe.");
      return;
    }

    try {
      setResettingPassword(true);
      setError(null);
      setSuccess(null);
      await api.post("/auth/forgot-password", {
        email: form.email.trim().toLowerCase(),
      });
      setSuccess("Code de reinitialisation envoye par email.");
    } catch {
      setError("Impossible d'envoyer la reinitialisation du mot de passe.");
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[36px] border border-gray-100 bg-white p-8 text-center font-bold text-gray-500 shadow-sm">
        Chargement du profil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-[36px] border border-red-100 bg-red-50 p-8 font-bold text-red-700">
        {error ?? "Profil introuvable."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[36px] border border-[#DDE9EC] bg-gradient-to-br from-white via-[#F8FCFD] to-[#EEF5F7] p-6 shadow-sm">
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black italic text-[#203A43]">
              Mon Profil
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">
              Consulter et modifier vos informations personnelles
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-full border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
              title="Actions profil"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-100 bg-white p-1 shadow-xl z-10">
                <button
                  type="button"
                  onClick={() => openModal("info")}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#203A43] hover:bg-[#F2F8FA]"
                >
                  Modifier informations personnelles
                </button>
                <button
                  type="button"
                  onClick={() => openModal("mdp")}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#203A43] hover:bg-[#FFF3F6]"
                >
                  Modifier mot de passe
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-[#CCE0E5] bg-[#F1F9FB] p-4">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">
              Nom complet
            </p>
            <p className="mt-2 text-lg font-black text-[#436D75]">
              {profile.nom} {profile.prenom}
            </p>
          </div>
          <div className="rounded-2xl border border-[#E3D8C1] bg-[#FFF8EA] p-4">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">
              Email
            </p>
            <p className="mt-2 text-sm font-bold text-[#203A43]">
              {profile.email}
            </p>
          </div>
          <div className="rounded-2xl border border-[#E2D5EF] bg-[#F7F1FD] p-4">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">
              Role
            </p>
            <p className="mt-2 text-sm font-black text-[#203A43]">
              {profile.role ?? "-"}
            </p>
          </div>
          <Link
            to="/profile"
            className="rounded-2xl border border-[#FFD8A8] bg-[#FFF2DE] p-4 transition-all hover:-translate-y-0.5 hover:border-[#F2B46C] hover:shadow-md"
            title="Voir le classement des membres"
          >
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">
              Score XP
            </p>
            <p className="mt-2 text-2xl font-black text-[#BE6A15]">
              {xpPoints}
            </p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#BE6A15]/80">
              Voir classement
            </p>
          </Link>
          <div className="rounded-2xl border border-[#CDE8CF] bg-[#EEF9EF] p-4">
            <p className="text-[11px] uppercase tracking-widest font-black text-gray-400">
              Age
            </p>
            <p className="mt-2 text-2xl font-black text-[#2C7A4B]">
              {age !== null ? `${age} ans` : "-"}
            </p>
          </div>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          {activeModal === "info" ? (
            <FormUpdateInfo
              initialValues={form}
              saving={saving}
              error={error}
              success={success}
              onCancel={() => setActiveModal(null)}
              onSubmit={onSubmitInfo}
            />
          ) : (
            <FormUpdateMdp
              saving={saving}
              resettingPassword={resettingPassword}
              error={error}
              success={success}
              onCancel={() => setActiveModal(null)}
              onSubmit={onSubmitPassword}
              onResetPassword={handlePasswordReset}
            />
          )}
        </div>
      )}
    </div>
  );
}
