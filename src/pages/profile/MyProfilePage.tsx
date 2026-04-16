import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ImagePlus,
  Mars,
  MoreVertical,
  Plus,
  UserCircle,
  Venus,
} from "lucide-react";
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

const hommeAvatars = [
  "avatar1.png",
  "avatar2.png",
  "avatar3.png",
  "avatar4.png",
  "avatar5.png",
  "avatar6.png",
  "avatar7.png",
  "avatar8.png",
  "avatar9.png",
  "avatar10.png",
  "avatar11.png",
  "avatar12.png",
  "avatar13.png",
  "avatar14.png",
];

const femmeAvatars = [
  "img1.png",
  "img2.png",
  "img3.png",
  "img4.png",
  "img5.png",
  "img6.png",
  "img7.png",
  "img8.png",
  "img9.png",
  "img10.png",
  "img11.png",
  "img12.png",
  "img13.png",
  "img14.png",
  "img15.png",
];

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
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarTab, setAvatarTab] = useState<"homme" | "femme" | "galerie">(
    "homme",
  );
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    bio: "",
    genre: "",
    date_naissance: "",
  });

  const profileImageSrc = useMemo(() => {
    if (!profile?.photo_profil_url) return null;
    return profile.photo_profil_url;
  }, [profile?.photo_profil_url]);

  useEffect(() => {
    setProfileImageError(false);
  }, [profileImageSrc]);

  const showProfileImage = Boolean(profileImageSrc) && !profileImageError;

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

  const openAvatarModalFromMenu = () => {
    setError(null);
    setSuccess(null);
    setMenuOpen(false);
    setAvatarModalOpen(true);
  };

  const applyUpdatedUser = (updated: UserProfile) => {
    setProfile(updated);
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

    window.dispatchEvent(new Event("user-updated"));
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
      applyUpdatedUser(updated);
      setSuccess("Profil mis a jour avec succes.");
    } catch {
      setError("Echec de la mise a jour du profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarAssetSelect = async (
    folder: "homme" | "femme",
    fileName: string,
  ) => {
    if (!profile) return;

    try {
      setAvatarSaving(true);
      setError(null);
      setSuccess(null);
      const avatarPath = `/avatars/${folder}/${fileName}`;
      const response = await api.patch(
        `/users/${profile.id}`,
        { photo_profil_url: avatarPath },
        { headers },
      );
      const updated = (response.data?.user ?? response.data) as UserProfile;
      applyUpdatedUser(updated);
      setSuccess("Avatar mis a jour avec succes.");
      setAvatarModalOpen(false);
    } catch {
      setError("Impossible de mettre a jour l'avatar.");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handlePersonalImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!profile) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAvatarSaving(true);
      setError(null);
      setSuccess(null);
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.patch(`/users/${profile.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updated = (response.data?.user ?? response.data) as UserProfile;
      applyUpdatedUser(updated);
      setSuccess("Image de profil mise a jour avec succes.");
      setAvatarModalOpen(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = "";
      }
    } catch {
      setError("Impossible d'envoyer l'image personnelle.");
    } finally {
      setAvatarSaving(false);
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
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-[#F1F6F8] shadow-md flex items-center justify-center">
                {showProfileImage ? (
                  <img
                    src={profileImageSrc!}
                    alt="Photo de profil"
                    className="h-full w-full object-cover"
                    onError={() => setProfileImageError(true)}
                  />
                ) : (
                  <UserCircle size={40} className="text-[#9AA3AF]" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="absolute -bottom-1 -right-1 rounded-full bg-[#436D75] p-1.5 text-white shadow-md hover:bg-[#355860]"
                title="Ajouter ou changer photo de profil"
              >
                <Plus size={14} />
              </button>
            </div>

            <div>
              <h2 className="text-3xl font-black italic text-[#203A43]">
                Mon Profil
              </h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                Consulter et modifier vos informations personnelles
              </p>
            </div>
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
                  onClick={openAvatarModalFromMenu}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#203A43] hover:bg-[#ECF5F8]"
                >
                  Modifier photo de profil
                </button>
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

      {avatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-[#DDE9EC] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black italic text-[#203A43]">
                Choisir une photo de profil
              </h3>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                className="rounded-2xl border border-gray-200 px-3 py-1.5 text-xs font-black text-gray-600 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#F7FAFC] p-1">
              <button
                type="button"
                onClick={() => setAvatarTab("homme")}
                className={`flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-black ${
                  avatarTab === "homme"
                    ? "bg-white text-[#2F525A] shadow"
                    : "text-gray-500"
                }`}
              >
                <Mars size={14} /> HOMME
              </button>
              <button
                type="button"
                onClick={() => setAvatarTab("femme")}
                className={`flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-black ${
                  avatarTab === "femme"
                    ? "bg-white text-[#8F2F48] shadow"
                    : "text-gray-500"
                }`}
              >
                <Venus size={14} /> FEMME
              </button>
              <button
                type="button"
                onClick={() => setAvatarTab("galerie")}
                className={`flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-black ${
                  avatarTab === "galerie"
                    ? "bg-white text-[#436D75] shadow"
                    : "text-gray-500"
                }`}
              >
                <ImagePlus size={14} /> GALERIE
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-[#FAFCFD] px-4 py-3">
              <div className="h-14 w-14 overflow-hidden rounded-full border border-gray-200 bg-[#ECEFF3] flex items-center justify-center">
                {showProfileImage ? (
                  <img
                    src={profileImageSrc!}
                    alt="Apercu photo profil"
                    className="h-full w-full object-cover"
                    onError={() => setProfileImageError(true)}
                  />
                ) : (
                  <UserCircle size={30} className="text-[#9AA3AF]" />
                )}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-500">
                  Photo actuelle
                </p>
                <p className="text-xs font-semibold text-gray-400">
                  {showProfileImage
                    ? "Image selectionnee"
                    : "Aucune image, icone par defaut"}
                </p>
              </div>
            </div>

            {avatarTab === "galerie" ? (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePersonalImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={avatarSaving}
                  onClick={() => galleryInputRef.current?.click()}
                  className="rounded-2xl bg-[#436D75] px-4 py-2 text-sm font-black text-white hover:bg-[#355860] disabled:opacity-60"
                >
                  {avatarSaving ? "Upload..." : "Choisir image personnelle"}
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {(avatarTab === "homme" ? hommeAvatars : femmeAvatars).map(
                  (fileName) => {
                    const folder = avatarTab;
                    const src = `/avatars/${folder}/${fileName}`;

                    return (
                      <button
                        key={fileName}
                        type="button"
                        disabled={avatarSaving}
                        onClick={() =>
                          void handleAvatarAssetSelect(folder, fileName)
                        }
                        className="h-20 w-20 overflow-hidden rounded-full border-2 border-transparent transition hover:border-[#436D75] disabled:opacity-60"
                        title={fileName}
                      >
                        <img
                          src={src}
                          alt={fileName}
                          className="h-full w-full rounded-full object-cover"
                        />
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
