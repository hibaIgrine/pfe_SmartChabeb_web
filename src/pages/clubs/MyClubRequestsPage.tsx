/**
 * MyClubRequestsPage.tsx — Page de suivi des demandes d'inscription envoyées par l'adhérent.
 *
 * RÔLE :
 *   Vue adhérent listant toutes les demandes d'inscription aux clubs.
 *   Accessible via /adherent/my-requests.
 *
 * FONCTIONNALITÉS :
 *   - Liste des demandes avec statut: EN_ATTENTE, ACCEPTE, REFUSE, LISTE_ATTENTE
 *   - Badges colorés par statut
 *   - Date de demande et nom du club
 *   - Lien vers les détails du club (Link → /adherent/clubs/:id)
 *   - Filtre par statut via useMemo
 *
 * ACCÈS : ADHERENT uniquement
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  XCircle,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";
import api from "../../api/axios";

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  ACCEPTE: {
    label: "Acceptée",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  EN_ATTENTE: {
    label: "En attente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  },
  LISTE_ATTENTE: {
    label: "Liste d'attente",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    icon: Clock3,
  },
  REFUSE: {
    label: "Refusée",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  SUSPENDU: {
    label: "Suspendue",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    icon: XCircle,
  },
};

function getImageUrl(url?: string) {
  if (!url || url === "null" || url.trim() === "") return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const baseURL = api.defaults.baseURL || "http://localhost:3000";
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseURL}${cleanPath}`;
}

export default function MyClubRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get("/clubs/my-inscriptions", { headers });
      setRequests(response.data || []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Impossible de charger vos demandes d'adhésion.";
      setNotice({
        type: "error",
        message: Array.isArray(message) ? message[0] : message,
      });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const cancelRequest = async (clubId: string) => {
    try {
      await api.delete(`/clubs/${clubId}/leave`, { headers });
      await loadRequests();
      setNotice({
        type: "success",
        message: "Votre demande a été annulée avec succès.",
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Impossible d'annuler la demande.";
      setNotice({
        type: "error",
        message: Array.isArray(message) ? message[0] : message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#436D75]" size={44} />
      </div>
    );
  }

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
        Retour aux clubs
      </Link>

      <div className="rounded-[36px] border border-gray-100 bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-black text-[#436D75]">
          Mes demandes d'adhésion
        </h1>
        <p className="mt-2 text-sm font-semibold text-gray-500">
          Suivez l'état de vos demandes pour rejoindre les clubs
        </p>

        {requests.length === 0 ? (
          <div className="mt-10 rounded-[28px] bg-[#F7F3E9] p-10 text-center">
            <AlertCircle className="mx-auto mb-4 text-[#436D75]" size={48} />
            <p className="text-lg font-black text-[#436D75]">
              Aucune demande en cours
            </p>
            <p className="mt-2 text-sm font-semibold text-gray-600">
              Vous n'avez pas encore envoyé de demande d'adhésion à un club.
            </p>
            <Link
              to="/clubs"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#436D75] px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#2f4d54]"
            >
              Découvrir les clubs
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {requests.map((request) => {
              const status = statusConfig[request.statut] || statusConfig.EN_ATTENTE;
              const StatusIcon = status.icon;
              const club = request.club;
              const imageUrl = getImageUrl(club?.logo_url);

              return (
                <div
                  key={request.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F7F3E9]">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={club?.nom}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-black text-[#436D75]">
                          {club?.nom?.slice(0, 1) || "C"}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-[#436D75]">
                            {club?.nom}
                          </h3>
                          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-500">
                            <MapPin size={14} />
                            {club?.centre?.nom || club?.centre_nom}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(request.date_adhesion).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] ${status.className}`}
                          >
                            <StatusIcon size={14} />
                            {status.label}
                          </span>
                        </div>
                      </div>

                      {request.statut === "EN_ATTENTE" && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => cancelRequest(club.id)}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-700 hover:bg-rose-100"
                          >
                            Annuler la demande
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
