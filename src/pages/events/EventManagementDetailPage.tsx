/**
 * EventManagementDetailPage.tsx — Page de détail avancée d'un événement (gestionnaire).
 *
 * RÔLE :
 *   Vue complète de gestion d'un événement pour ADMIN, CENTRE et CLUB.
 *   Accessible via /admin/events/:id/detail, /centre/events/:id/detail, /club/events/:id/detail.
 *
 * CONTENU :
 *   - Informations complètes de l'événement (titre, description, dates, lieu, capacité)
 *   - Timeline des étapes (EventTimelineStep)
 *   - Statistiques de participation (inscrits, présents, taux)
 *   - Actions selon le rôle :
 *     ADMIN/CENTRE : Approuver, Refuser, Modifier, Supprimer
 *     CLUB : Modifier sa propre demande d'événement
 *   - Téléchargement liste des participants (PDF)
 *   - Feedback moyen des participants après l'événement
 *
 * ACCÈS : ADMIN, RESPONSABLE_CENTRE, RESPONSABLE_CLUB (routes différentes par rôle)
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Calendar,
  Clock,
  Users,
  MapPin,
  Building2,
} from "lucide-react";
import api from "../../api/axios";
import { ROUTES } from "../../constants/routes";
import type { EventDetail, EventParticipant, ParticipantStatus } from "./types";
import { formatDateOnly, toTimeHHMM } from "./utils";

const statusBadge: Record<string, string> = {
  CONFIRME: "bg-green-100 text-green-700",
  EN_ATTENTE: "bg-amber-100 text-amber-700",
  REFUSE: "bg-red-100 text-red-700",
  ANNULE: "bg-gray-100 text-gray-700",
};

export default function EventManagementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "ADMIN";
  const canManageParticipants = ["ADMIN", "RESPONSABLE_CENTRE", "RESPONSABLE_CLUB"].includes(user?.role);

  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [myNote, setMyNote] = useState(0);
  const [myCommentaire, setMyCommentaire] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isSelfCheckingIn, setIsSelfCheckingIn] = useState(false);

  const backPath = isAdmin ? ROUTES.admin.eventsManagement : ROUTES.centre.eventsManagement;

  const showAlert = (msg: string, type: "success" | "error") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const loadDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/events/${id}`, { headers });
      setDetail(res.data);
    } catch {
      showAlert("Impossible de charger l'événement.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [id, headers]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    setMyNote(detail?.myFeedback?.note ?? 0);
    setMyCommentaire(detail?.myFeedback?.commentaire ?? "");
  }, [detail?.id, detail?.myFeedback?.note, detail?.myFeedback?.commentaire]);

  const updateParticipantStatus = async (participantId: string, status: ParticipantStatus) => {
    if (!id) return;
    try {
      await api.patch(`/events/${id}/participants/${participantId}/status`, { status }, { headers });
      showAlert("Statut mis à jour.", "success");
      await loadDetail();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      showAlert(Array.isArray(msg) ? msg.join(" | ") : msg || "Mise à jour impossible.", "error");
    }
  };

  const toggleCheckin = async (participantId: string, checkin: boolean) => {
    if (!id) return;
    try {
      await api.patch(`/events/${id}/participants/${participantId}/checkin`, { checkin }, { headers });
      showAlert("Check-in mis à jour.", "success");
      await loadDetail();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      showAlert(Array.isArray(msg) ? msg.join(" | ") : msg || "Check-in impossible.", "error");
    }
  };

  const handleSelfCheckin = async () => {
    if (!id) return;
    setIsSelfCheckingIn(true);
    try {
      await api.patch(`/events/${id}/participants/me/checkin`, {}, { headers });
      showAlert("Votre présence a été enregistrée ! Vous avez gagné des points.", "success");
      await loadDetail();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      showAlert(Array.isArray(msg) ? msg.join(" | ") : msg || "Check-in impossible.", "error");
    } finally {
      setIsSelfCheckingIn(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!id || myNote < 1) return;
    setIsSubmittingFeedback(true);
    try {
      await api.post(`/events/${id}/feedback`, { note: myNote, commentaire: myCommentaire }, { headers });
      showAlert("Merci, votre feedback a été enregistré.", "success");
      await loadDetail();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      showAlert(Array.isArray(msg) ? msg.join(" | ") : msg || "Impossible d'envoyer votre feedback.", "error");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const participants = detail?.participants ?? [];
  const confirmed = participants.filter((p) => p.status === "CONFIRME");
  const waiting = participants.filter((p) => p.status === "EN_ATTENTE");
  const feedbacks = detail?.recentFeedbacks ?? [];
  const timeline = Array.isArray(detail?.timeline) ? detail.timeline : [];
  const timelineSorted = [...timeline].sort((a, b) =>
    String(a.start_time ?? "").localeCompare(String(b.start_time ?? "")),
  );

  const myParticipation = participants.find((p) => p.user?.id === user.id);
  const isMyStatusConfirmed = myParticipation?.status === "CONFIRME";
  const isMyCheckInAlready = myParticipation?.checkin === true;
  const now = new Date();
  const eventStart = detail?.start_time ? new Date(detail.start_time) : null;
  const eventEnd = detail?.end_time ? new Date(detail.end_time) : null;
  const isEventOngoing = eventStart && eventEnd && now >= eventStart && now <= eventEnd;
  const isEventOver = eventEnd ? now > eventEnd : false;
  const canDoSelfCheckin = isMyStatusConfirmed && !isMyCheckInAlready && isEventOngoing;

  const renderStars = (value: number, size = 16) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const v = i + 1;
        return (
          <Star
            key={v}
            size={size}
            className={v <= Math.round(value) ? "text-amber-500 fill-amber-500" : "text-gray-300"}
          />
        );
      })}
    </div>
  );

  const renderParticipantRow = (participant: EventParticipant) => (
    <div key={participant.id} className="p-4 rounded-2xl border border-gray-100 bg-white space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-gray-800 text-sm">
          {participant.user.nom} {participant.user.prenom}
        </p>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${statusBadge[participant.status] ?? "bg-gray-100 text-gray-700"}`}
        >
          {participant.status}
        </span>
      </div>
      {participant.user.email && (
        <p className="text-xs text-gray-400">{participant.user.email}</p>
      )}
      {canManageParticipants && (
        <div className="flex flex-wrap gap-1.5">
          {(["EN_ATTENTE", "CONFIRME", "REFUSE", "ANNULE"] as ParticipantStatus[]).map((status) => (
            <button
              key={status}
              disabled={isEventOver}
              onClick={() => updateParticipantStatus(participant.id, status)}
              className={`px-2.5 py-1 text-[10px] font-black rounded-xl border transition ${
                participant.status === status
                  ? "border-smart-teal bg-smart-teal text-white"
                  : "border-gray-200 hover:bg-gray-100 text-gray-700"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {status}
            </button>
          ))}
          <button
            disabled={!isEventOngoing}
            onClick={() => toggleCheckin(participant.id, !participant.checkin)}
            className={`px-2.5 py-1 text-[10px] font-black rounded-xl border transition ${
              participant.checkin
                ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                : "border-gray-200 text-gray-700 hover:bg-gray-100"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {participant.checkin ? "✓ Check-in OK" : "Check-in"}
          </button>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-smart-teal border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-8 text-center text-gray-400 space-y-4">
        <p>Événement introuvable.</p>
        <button
          onClick={() => navigate(backPath)}
          className="text-smart-teal underline text-sm font-bold"
        >
          Retour à la gestion des événements
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {alert && (
        <div
          className={`px-5 py-4 rounded-2xl border text-sm font-bold ${
            alert.type === "success"
              ? "bg-[#D9E8D1] text-[#436D75] border-[#436D75]/20"
              : "bg-[#FDE5E1] text-[#B23A2B] border-[#E98A7D]/40"
          }`}
        >
          {alert.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(backPath)}
          className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-[#F7F3E9] text-smart-teal hover:bg-smart-teal hover:text-white transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">
            Détail événement
          </p>
          <h1 className="text-3xl font-black text-smart-teal tracking-tight leading-tight">
            {detail.nom}
          </h1>
        </div>
        {!detail.is_active && (
          <span className="shrink-0 mt-2 px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider">
            Inactif
          </span>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="md:col-span-2 xl:col-span-3 bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 mb-2">
            Description
          </p>
          <p className="text-gray-700 text-sm leading-relaxed">
            {detail.description || "Aucune description."}
          </p>
        </div>

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D9E8D1] flex items-center justify-center shrink-0">
            <Calendar size={22} className="text-smart-teal" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Date</p>
            <p className="font-black text-smart-teal text-lg leading-tight">
              {formatDateOnly(detail.date_event)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D9E8D1] flex items-center justify-center shrink-0">
            <Clock size={22} className="text-smart-teal" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Horaire</p>
            <p className="font-black text-smart-teal text-lg leading-tight">
              {toTimeHHMM(detail.start_time)} – {toTimeHHMM(detail.end_time)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D9E8D1] flex items-center justify-center shrink-0">
            <Users size={22} className="text-smart-teal" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Participants</p>
            <p className="font-black text-smart-teal text-lg leading-tight">
              {confirmed.length} / {detail.capacity ?? "∞"}
            </p>
            {waiting.length > 0 && (
              <p className="text-[10px] text-amber-500 font-bold">{waiting.length} en attente</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F3E9] flex items-center justify-center shrink-0">
            <Building2 size={22} className="text-smart-teal" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Club</p>
            <p className="font-bold text-gray-800 text-sm">{detail.club?.nom ?? "—"}</p>
          </div>
        </div>

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F3E9] flex items-center justify-center shrink-0">
            <MapPin size={22} className="text-smart-teal" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Local</p>
            <p className="font-bold text-gray-800 text-sm">{detail.local?.nom ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Self check-in */}
      {canDoSelfCheckin && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 flex items-center justify-between gap-4">
          <p className="text-sm font-black text-green-700">
            L'événement est en cours — enregistrez votre présence
          </p>
          <button
            onClick={handleSelfCheckin}
            disabled={isSelfCheckingIn}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-black disabled:opacity-60 hover:bg-green-700 transition"
          >
            {isSelfCheckingIn ? "Enregistrement..." : "✓ Je suis présent"}
          </button>
        </div>
      )}

      {/* Timeline */}
      {timelineSorted.length > 0 && (
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 mb-5">
            Programme
          </p>
          <div className="space-y-3">
            {timelineSorted.map((step, i) => {
              const [sh, sm] = String(step.start_time ?? "").split(":").map(Number);
              const [eh, em] = String(step.end_time ?? "").split(":").map(Number);
              const dur =
                Number.isFinite(sh) &&
                Number.isFinite(sm) &&
                Number.isFinite(eh) &&
                Number.isFinite(em)
                  ? Math.max(0, eh * 60 + em - (sh * 60 + sm))
                  : 0;
              return (
                <div key={`${i}-${step.title}`} className="relative pl-8">
                  <span className="absolute left-2 top-3 h-3 w-3 rounded-full bg-smart-teal" />
                  {i < timelineSorted.length - 1 && (
                    <span className="absolute left-[14px] top-6 h-[calc(100%-4px)] w-[2px] bg-smart-teal/20" />
                  )}
                  <div className="rounded-2xl border border-gray-100 bg-[#F8FCFD] px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-smart-teal text-sm">{step.title}</p>
                      <span className="text-xs font-black text-smart-teal shrink-0">
                        {step.start_time} – {step.end_time}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">
                      Durée : {dur} min
                    </p>
                    {step.details && (
                      <p className="text-xs text-gray-600 mt-1">{step.details}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 space-y-5">
        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Évaluations</p>

        <div className="flex items-center justify-between rounded-2xl bg-[#F7FAFC] border border-gray-100 p-4">
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2">Note moyenne</p>
            {renderStars(detail.ratingAverage ?? 0, 22)}
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-smart-teal">
              {(detail.ratingAverage ?? 0).toFixed(1)}
            </p>
            <p className="text-xs text-gray-400 font-semibold">{detail.ratingCount ?? 0} avis</p>
          </div>
        </div>

        {detail.canRate && (
          <div className="rounded-2xl border border-gray-100 p-5 bg-[#FAFAFA] space-y-4">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-gray-600">Votre note</p>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const v = i + 1;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMyNote(v)}
                    className="p-0.5"
                    aria-label={`${v} étoile${v > 1 ? "s" : ""}`}
                  >
                    <Star
                      size={26}
                      className={v <= myNote ? "text-amber-500 fill-amber-500" : "text-gray-300"}
                    />
                  </button>
                );
              })}
            </div>
            <textarea
              value={myCommentaire}
              onChange={(e) => setMyCommentaire(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ajoutez un commentaire (optionnel)"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-smart-teal/20 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isSubmittingFeedback || myNote < 1}
                onClick={handleSubmitFeedback}
                className="px-5 py-2.5 rounded-xl bg-smart-teal text-white text-xs font-black disabled:opacity-60 hover:bg-[#33545B] transition"
              >
                {isSubmittingFeedback ? "Envoi..." : "Envoyer mon feedback"}
              </button>
            </div>
          </div>
        )}

        {feedbacks.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase font-black tracking-[0.15em] text-gray-400">
              Derniers avis
            </p>
            {feedbacks.map((fb) => (
              <div key={fb.id} className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-bold text-gray-700">
                    {fb.user ? `${fb.user.nom} ${fb.user.prenom}` : "Membre"}
                  </p>
                  {renderStars(fb.note, 14)}
                </div>
                {fb.commentaire ? (
                  <p className="text-xs text-gray-600 leading-relaxed">{fb.commentaire}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucun commentaire.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Participants</p>
          {user?.role === "RESPONSABLE_CENTRE" && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate(ROUTES.centre.eventRequests)}
                className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-black hover:bg-amber-100 transition"
              >
                Demandes
              </button>
              <button
                onClick={() => navigate(ROUTES.centre.eventParticipants)}
                className="px-3 py-1.5 rounded-xl bg-[#D9E8D1] border border-[#436D75]/25 text-[#436D75] text-[11px] font-black hover:bg-[#C4DBBF] transition"
              >
                Participants
              </button>
              <button
                onClick={() => navigate(ROUTES.centre.eventWaitingList)}
                className="px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 text-[11px] font-black hover:bg-gray-200 transition"
              >
                Liste d'attente
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-green-100 text-green-700">
              Confirmés
            </span>
            <span className="text-xs font-black text-gray-400">{confirmed.length}</span>
          </div>
          {confirmed.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun participant confirmé.</p>
          ) : (
            <div className="space-y-2">{confirmed.map(renderParticipantRow)}</div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-700">
              En attente
            </span>
            <span className="text-xs font-black text-gray-400">{waiting.length}</span>
          </div>
          {waiting.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun participant en attente.</p>
          ) : (
            <div className="space-y-2">{waiting.map(renderParticipantRow)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
