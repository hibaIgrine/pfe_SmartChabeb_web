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
  FileText,
  Plus,
  Sparkles,
} from "lucide-react";
import api from "../../api/axios";

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  ACCEPTE: {
    label: "Acceptée",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  ACCEPTEE: {
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
  REFUSEE: {
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

export default function MyAllRequestsPage() {
  const navigate = useNavigate();
  const [membershipRequests, setMembershipRequests] = useState<any[]>([]);
  const [creationRequests, setCreationRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"membership" | "creation">("membership");

  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [membershipRes, creationRes] = await Promise.all([
        api.get("/clubs/my-inscriptions", { headers }),
        api.get("/club-creation-requests/mine", { headers }),
      ]);

      setMembershipRequests(Array.isArray(membershipRes.data) ? membershipRes.data : []);
      setCreationRequests(Array.isArray(creationRes.data) ? creationRes.data : []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Impossible de charger vos demandes.";
      setNotice({
        type: "error",
        message: Array.isArray(message) ? message[0] : message,
      });
      setMembershipRequests([]);
      setCreationRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const cancelMembershipRequest = async (clubId: string) => {
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

      <div className="flex items-center justify-between">
        <Link
          to="/clubs"
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#436D75] shadow-sm hover:bg-[#F7F3E9]"
        >
          <ArrowLeft size={16} />
          Retour aux clubs
        </Link>
      </div>

      <div className="rounded-[36px] border border-gray-100 bg-white p-8 shadow-xl">
        {/* Barre d'onglets */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("membership")}
            className={`flex-1 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-[0.16em] transition-colors ${
              activeTab === "membership"
                ? "bg-[#436D75] text-white"
                : "bg-[#F7F3E9] text-[#436D75] hover:bg-[#e8e3d5]"
            }`}
          >
            Adhésions aux clubs
          </button>
          <button
            onClick={() => setActiveTab("creation")}
            className={`flex-1 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-[0.16em] transition-colors ${
              activeTab === "creation"
                ? "bg-[#E98A7D] text-white"
                : "bg-[#F7F3E9] text-[#E98A7D] hover:bg-[#f5e6e3]"
            }`}
          >
            Créations de clubs
          </button>
        </div>

        {activeTab === "membership" ? (
          <>
            <h1 className="text-3xl font-black text-[#436D75]">
              Mes demandes d'adhésion
            </h1>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              Suivez l'état de vos demandes pour rejoindre les clubs
            </p>

            <div className="mt-8 grid gap-4">
              {membershipRequests.map((request) => {
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
                              onClick={() => cancelMembershipRequest(club.id)}
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
          </>
        ) : activeTab === "creation" ? (
          <>
            <h1 className="text-3xl font-black text-[#E98A7D]">
              Mes demandes de création de club
            </h1>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              Suivez l'état de vos demandes de création de clubs
            </p>

            {creationRequests.length === 0 ? (
              <div className="mt-10 rounded-[28px] bg-[#F7F3E9] p-10 text-center">
                <AlertCircle className="mx-auto mb-4 text-[#E98A7D]" size={48} />
                <p className="text-lg font-black text-[#E98A7D]">
                  Aucune demande en cours
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-600">
                  Vous n'avez pas encore envoyé de demande de création de club.
                </p>
                <Link
                  to="/club-creation-requests"
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#E98A7D] px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#d67a6e]"
                >
                  <Plus size={16} />
                  Créer une demande
                </Link>
              </div>
            ) : (
              <div className="mt-8 grid gap-4">
                {creationRequests.map((request) => {
                  const status = statusConfig[request.statut] || statusConfig.EN_ATTENTE;
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Sparkles className="text-[#E98A7D]" size={20} />
                            <h3 className="text-lg font-black text-[#436D75]">
                              {request.nom_club}
                            </h3>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-gray-500">
                            {request.categorie}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(request.created_at).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}
                            </span>
                            {request.local_souhaite && (
                              <span className="flex items-center gap-1">
                                <MapPin size={14} />
                                {request.local_souhaite.nom}
                              </span>
                            )}
                          </div>
                          {request.description && (
                            <p className="mt-3 text-sm font-medium text-gray-600 line-clamp-2">
                              {request.description}
                            </p>
                          )}
                          {(request.cv_url || request.attestation_url) && (
                            <div className="mt-3 flex gap-2">
                              {request.cv_url && (
                                <a
                                  href={getImageUrl(request.cv_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                                >
                                  <FileText size={14} />
                                  CV
                                </a>
                              )}
                              {request.attestation_url && (
                                <a
                                  href={getImageUrl(request.attestation_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                                >
                                  <FileText size={14} />
                                  Attestation
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] ${status.className}`}
                          >
                            <StatusIcon size={14} />
                            {status.label}
                          </span>
                          {request.statut === "REFUSEE" && request.commentaire_decision && (
                            <p className="text-xs font-semibold text-rose-600 mt-1">
                              {request.commentaire_decision}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
