import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flag,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  Target,
  Trophy,
  UserCircle,
  Users,
  XCircle,
} from "lucide-react";
import api from "../../api/axios";

const statusCopy: Record<string, { label: string; className: string }> = {
  ACCEPTE: {
    label: "Vous etes inscrit",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  EN_ATTENTE: {
    label: "Demande en attente",
    className: "bg-amber-50 text-amber-700 border-amber-100",
  },
  LISTE_ATTENTE: {
    label: "Sur liste d'attente",
    className: "bg-sky-50 text-sky-700 border-sky-100",
  },
  REFUSE: {
    label: "Demande refusee",
    className: "bg-rose-50 text-rose-700 border-rose-100",
  },
};

function getImageUrl(url?: string) {
  if (!url || url === "null" || url.trim() === "") return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;

  const baseURL = api.defaults.baseURL || "http://localhost:3000";
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseURL}${cleanPath}`;
}

function getPlanningSlots(planning: any) {
  if (!planning) return [];

  try {
    const parsed = typeof planning === "string" ? JSON.parse(planning) : planning;
    const slots = parsed?.slots || (Array.isArray(parsed) ? parsed : []);
    return Array.isArray(slots) ? slots : [];
  } catch {
    return [];
  }
}

function getPlanningText(planning: any) {
  const slots = getPlanningSlots(planning);
  if (slots.length > 0) {
    return slots
      .map((slot: any) => `${slot.day} ${slot.startTime}-${slot.endTime}`)
      .join(" | ");
  }

  try {
    const parsed = typeof planning === "string" ? JSON.parse(planning) : planning;
    if (typeof parsed?.texte === "string") return parsed.texte;
    if (typeof parsed === "string") return parsed;
  } catch {
    if (typeof planning === "string") return planning;
  }

  return "";
}

function getObjectives(planning: any): string[] {
  try {
    const parsed = typeof planning === "string" ? JSON.parse(planning) : planning;
    if (Array.isArray(parsed?.objectifs)) {
      return parsed.objectifs.filter((o: any) => typeof o === "string" && o.trim());
    }
    if (typeof parsed?.objectifs === "string") {
      return parsed.objectifs.split("\n").filter((o: string) => o.trim());
    }
  } catch {}
  return [];
}

export default function AdherentClubDetailsPage() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState<any>(null);
  const [centre, setCentre] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadClub = async () => {
    if (!clubId) return;

    setLoading(true);
    try {
      const response = await api.get(`/clubs/my-centre/${clubId}`, { headers });
      setCentre(response.data?.centre ?? null);
      setClub(response.data?.club ?? null);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Impossible de charger les details du club.";
      setNotice({
        type: "error",
        message: Array.isArray(message) ? message[0] : message,
      });
      setClub(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClub();
  }, [clubId]);

  const applyToClub = async () => {
    if (!club?.id) return;

    setActionLoading(true);
    try {
      await api.post(`/clubs/${club.id}/apply`, {}, { headers });
      await loadClub();
      setNotice({
        type: "success",
        message: "Votre demande d'inscription a ete envoyee.",
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Impossible d'envoyer la demande.";
      setNotice({
        type: "error",
        message: Array.isArray(message) ? message[0] : message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const cancelRequest = async () => {
    if (!club?.id) return;

    setActionLoading(true);
    try {
      await api.delete(`/clubs/${club.id}/leave`, { headers });
      await loadClub();
      setNotice({
        type: "success",
        message: "Votre demande a ete annulee.",
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Impossible d'annuler la demande.";
      setNotice({
        type: "error",
        message: Array.isArray(message) ? message[0] : message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[26rem] items-center justify-center rounded-[32px] bg-white">
        <Loader2 className="animate-spin text-[#436D75]" size={44} />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="rounded-[32px] border border-rose-100 bg-rose-50 p-10 text-center text-rose-700">
        <AlertCircle className="mx-auto mb-4" size={38} />
        <p className="text-lg font-black">Club introuvable</p>
        <p className="mt-2 text-sm font-semibold opacity-75">
          Ce club n'existe pas dans votre centre ou n'est pas disponible.
        </p>
        <button
          onClick={() => navigate("/clubs")}
          className="mt-6 rounded-2xl bg-[#436D75] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
        >
          Retour aux clubs
        </button>
      </div>
    );
  }

  const imageUrl = getImageUrl(club.logo_url);
  const planningText = getPlanningText(club.planning);
  const planningSlots = getPlanningSlots(club.planning);
  const inscription = club.my_inscription;
  const status = inscription?.statut ? statusCopy[inscription.statut] : null;
  const canCancel =
    inscription?.statut === "EN_ATTENTE" || inscription?.statut === "LISTE_ATTENTE";
  const canApply = !inscription || inscription.statut === "REFUSE";
  const acceptedCount = club._count?.inscriptions ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {notice && (
        <div
          className={`fixed right-6 top-6 z-[90] flex max-w-md items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold shadow-2xl ${
            notice.type === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-rose-100 bg-rose-50 text-rose-700"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      <Link
        to="/clubs"
        className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#436D75] shadow-sm hover:bg-[#F7F3E9]"
      >
        <ArrowLeft size={16} />
        Retour
      </Link>

      <section className="overflow-hidden rounded-[36px] border border-gray-100 bg-white shadow-xl">
        <div className="relative h-72 bg-[#D9E8D1]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={club.nom}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-8xl font-black text-[#436D75]">
              {club.nom?.slice(0, 1) ?? "C"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-3 inline-flex rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#436D75]">
                {club.categorie || "Club"}
              </span>
              <h1 className="text-4xl font-black leading-tight text-white">
                {club.nom}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm font-bold text-white/80">
                <MapPin size={16} />
                {centre?.nom || club.centre?.nom}
                {centre?.gouvernorat ? ` - ${centre.gouvernorat}` : ""}
              </p>
            </div>
            {status && (
              <span
                className={`w-fit rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${status.className}`}
              >
                {status.label}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            <div className="rounded-[28px] bg-[#F7F3E9] p-5">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#436D75]">
                Description
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-gray-600">
                {club.description || "Aucune description disponible."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-gray-100 p-5">
                <Users className="text-[#E98A7D]" size={22} />
                <p className="mt-3 text-2xl font-black text-[#436D75]">
                  {acceptedCount}
                </p>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                  Membres
                </p>
              </div>
              <div className="rounded-[24px] border border-gray-100 p-5">
                <Clock3 className="text-[#E98A7D]" size={22} />
                <p className="mt-3 text-sm font-black text-[#436D75]">
                  {club.start_status?.is_started ? "Demarre" : "Preparation"}
                </p>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                  Statut
                </p>
              </div>
              <div className="rounded-[24px] border border-gray-100 p-5">
                <MapPin className="text-[#E98A7D]" size={22} />
                <p className="mt-3 text-sm font-black text-[#436D75]">
                  {club.locale_fixe || "Non precise"}
                </p>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                  Local
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-100 p-5">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-[#436D75]">
                <CalendarDays size={17} />
                Planning
              </h2>
              {planningSlots.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {planningSlots.map((slot: any, index: number) => (
                    <div
                      key={`${slot.day}-${index}`}
                      className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600"
                    >
                      <span className="text-[#436D75]">{slot.day}</span>{" "}
                      {slot.startTime}-{slot.endTime}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm font-semibold text-gray-500">
                  {planningText || "Planning non renseigne."}
                </p>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#436D75]">
                Votre statut
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-gray-500">
                {status
                  ? status.label
                  : "Vous n'avez pas encore envoye de demande pour ce club."}
              </p>

              <div className="mt-5 space-y-3">
                {canApply && (
                  <button
                    onClick={applyToClub}
                    disabled={actionLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#436D75] text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#2f4d54] disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                    S'inscrire
                  </button>
                )}

                {canCancel && (
                  <button
                    onClick={cancelRequest}
                    disabled={actionLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 text-xs font-black uppercase tracking-[0.18em] text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <XCircle size={16} />
                    )}
                    Annuler la demande
                  </button>
                )}

                {inscription?.statut === "ACCEPTE" && (
                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    <CheckCircle2 size={17} />
                    Vous faites partie de ce club.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#436D75]">
                Encadrement
              </h2>
              <div className="mt-4 space-y-3">
                {club.responsable && (
                  <StaffLine label="Responsable" user={club.responsable} />
                )}
                {(club.staff ?? []).slice(0, 6).map((item: any) => (
                  <StaffLine
                    key={item.id}
                    label={item.role_dans_club || "Staff"}
                    user={item.utilisateur}
                  />
                ))}
                {!club.responsable && (club.staff ?? []).length === 0 && (
                  <p className="text-sm font-semibold text-gray-400">
                    Aucun encadrant renseigne.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function StaffLine({ label, user }: { label: string; user: any }) {
  const imageUrl = getImageUrl(user?.photo_profil_url);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-3">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white text-gray-300">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${user?.nom ?? ""} ${user?.prenom ?? ""}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserCircle size={24} />
        )}
      </div>
      <div>
        <p className="text-sm font-black text-[#436D75]">
          {user?.prenom} {user?.nom}
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
          {label}
        </p>
      </div>
    </div>
  );
}
