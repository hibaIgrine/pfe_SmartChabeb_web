/**
 * AdherentEventsPage.tsx — Catalogue des événements pour l'adhérent.
 *
 * RÔLE :
 *   Page de découverte et d'inscription aux événements pour les adhérents.
 *   Affiche les événements approuvés et ouverts à l'inscription.
 *
 * FONCTIONNALITÉS :
 *   - Liste des événements avec filtres (type, période, statut d'inscription)
 *   - EventDetailsModal : détail d'un événement (description, dates, lieu, capacité)
 *   - Inscription à un événement (s'il reste de la place)
 *   - Ajout à la liste d'attente si l'événement est complet
 *   - Évaluation post-événement (feedback étoiles + commentaire)
 *   - Téléchargement du certificat de participation (si événement terminé + présent)
 *
 * STATUTS DE PARTICIPATION :
 *   INSCRIT → CONFIRME (après checkin) → Certificat disponible
 *   LISTE_ATTENTE → INSCRIT (si une place se libère)
 *
 * ACCÈS : ADMIN + ADHERENT (ADMIN_OR_ADHERENT dans App.tsx)
 */
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Users,
  Eye,
  Loader2,
  MapPin,
  CheckCircle2,
  Star,
  Award,
} from "lucide-react";
import api from "../../api/axios";
// navigation not needed; modal is used for details
import EventDetailsModal from "./components/EventDetailsModal";
import type { EventItem, EventDetail } from "./types";
import { formatDateOnly, toTimeHHMM } from "./utils";
import CertificateModal from "./components/CertificateModal";

type EventFilter = "upcoming" | "past";

export default function AdherentEventsPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [filter, setFilter] = useState<EventFilter>("upcoming");
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [myNote, setMyNote] = useState(0);
  const [myCommentaire, setMyCommentaire] = useState("");
  const [notification, setNotification] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isCertificateLoading, setIsCertificateLoading] = useState(false);
  const [certificateData, setCertificateData] = useState<{
    image: string;
    filename: string;
    participantName: string;
  } | null>(null);

  const showAlert = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 3500);
  };

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/events?includeInactive=false", {
        headers,
      });
      setEvents(Array.isArray(response.data) ? response.data : []);
    } catch {
      showAlert("Erreur lors du chargement des événements.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventDetail = async (eventId: string) => {
    setIsDetailLoading(true);
    try {
      const response = await api.get(`/events/${eventId}`, { headers });
      setSelectedEvent(response.data);
    } catch {
      showAlert("Impossible de charger les détails de l'événement.", "error");
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const isPastEvent = (event: EventItem | EventDetail) => {
    const endTime = new Date(event.end_time).getTime();
    return Number.isFinite(endTime) && endTime < Date.now();
  };

  const filteredEvents = events.filter((event) =>
    filter === "past" ? isPastEvent(event) : !isPastEvent(event),
  );

  const selectedParticipation = selectedEvent?.participants?.find(
    (participant) => participant.user?.id === user.id,
  );

  useEffect(() => {
    setMyNote(selectedEvent?.myFeedback?.note ?? 0);
    setMyCommentaire(selectedEvent?.myFeedback?.commentaire ?? "");
  }, [
    selectedEvent?.id,
    selectedEvent?.myFeedback?.note,
    selectedEvent?.myFeedback?.commentaire,
  ]);

  useEffect(() => {
    if (filteredEvents.length === 0) {
      setSelectedEvent(null);
      return;
    }

    if (
      !selectedEvent ||
      !filteredEvents.some((event) => event.id === selectedEvent.id)
    ) {
      void loadEventDetail(filteredEvents[0].id);
    }
  }, [filter, events]);

  const handleRequestParticipation = async (eventId: string) => {
    setIsActionLoading(true);
    try {
      await api.post(
        `/events/${eventId}/participants/register`,
        {},
        { headers },
      );
      showAlert("Demande de participation envoyée avec succès!", "success");
      await loadEvents();
      await loadEventDetail(eventId);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      showAlert(
        apiMessage || "Impossible d'envoyer la demande de participation.",
        "error",
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelParticipation = async (eventId: string) => {
    setIsActionLoading(true);
    try {
      await api.patch(
        `/events/${eventId}/participants/me/cancel`,
        {},
        { headers },
      );
      showAlert("Votre inscription a été annulée.", "success");
      await loadEvents();
      await loadEventDetail(eventId);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      showAlert(
        apiMessage || "Impossible d'annuler votre inscription.",
        "error",
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitFeedback = async (
    eventId: string,
    note: number,
    commentaire: string,
  ) => {
    setIsSubmittingFeedback(true);
    try {
      await api.post(
        `/events/${eventId}/feedback`,
        { note, commentaire },
        { headers },
      );
      showAlert("Merci, votre feedback a été enregistré.", "success");
      await loadEventDetail(eventId);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const detailedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(" | ")
        : apiMessage;
      showAlert(
        detailedMessage || "Impossible d'envoyer votre feedback.",
        "error",
      );
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleGenerateCertificate = async (eventId: string) => {
    setIsCertificateLoading(true);
    try {
      const response = await api.get(`/certificates/event/${eventId}`, {
        headers,
      });
      setCertificateData({
        image: response.data.image,
        filename: response.data.filename,
        participantName: response.data.participantName,
      });
      setIsCertificateModalOpen(true);
      showAlert("Certificat genere avec succes !", "success");
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const detailedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(" | ")
        : apiMessage;
      showAlert(
        detailedMessage || "Impossible de generer votre certificat.",
        "error",
      );
    } finally {
      setIsCertificateLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModalForEvent = async (eventId: string) => {
    await loadEventDetail(eventId);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-8">
      {notification && (
        <div
          className={`px-5 py-4 rounded-2xl border text-sm font-bold ${
            notification.type === "success"
              ? "bg-[#D9E8D1] text-[#436D75] border-[#436D75]/20"
              : "bg-[#FDE5E1] text-[#B23A2B] border-[#E98A7D]/40"
          }`}
        >
          {notification.msg}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black italic text-smart-teal">
            Événements Disponibles
          </h1>
          <p className="text-sm text-gray-500">
            Inscrivez-vous aux événements à venir ou consultez les événements
            passés.
          </p>
        </div>

        <div className="inline-flex rounded-2xl bg-gray-100 p-1 w-full md:w-auto">
          <button
            onClick={() => setFilter("upcoming")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-black transition ${
              filter === "upcoming"
                ? "bg-white text-[#436D75] shadow-sm"
                : "text-gray-500"
            }`}
          >
            À venir
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-black transition ${
              filter === "past"
                ? "bg-white text-[#436D75] shadow-sm"
                : "text-gray-500"
            }`}
          >
            Passés
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[30px] border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-smart-teal" size={42} />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                Chargement des événements...
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-20 text-center text-gray-400 font-bold">
              {filter === "upcoming"
                ? "Aucun événement à venir pour le moment."
                : "Aucun événement passé à consulter."}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEvents.map((event) => {
                const isSelected = selectedEvent?.id === event.id;
                const past = isPastEvent(event);
                return (
                  <div
                    key={event.id}
                    className={`p-5 transition cursor-pointer ${
                      isSelected ? "bg-[#D9E8D1]/25" : "hover:bg-gray-50"
                    }`}
                    onClick={() => void openModalForEvent(event.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-base font-black italic text-smart-teal mb-2">
                          {event.nom}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3 font-semibold">
                          {event.club?.nom ?? "Club"} •{" "}
                          {event.local?.nom ?? "Local"}
                        </p>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                              past
                                ? "bg-gray-100 text-gray-500"
                                : "bg-[#D9E8D1] text-[#436D75]"
                            }`}
                          >
                            <CheckCircle2 size={12} />
                            {past ? "Passé" : "À venir"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-bold">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={14} />
                            {formatDateOnly(event.date_event)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 size={14} />
                            {toTimeHHMM(event.start_time)} -{" "}
                            {toTimeHHMM(event.end_time)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users size={14} />
                            {event._count?.participants ?? 0} /{" "}
                            {event.capacity ?? "∞"} participants
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} />
                            {event.local?.nom ?? "Lieu à déterminer"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void openModalForEvent(event.id);
                        }}
                        className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-[#436D75] hover:text-white transition"
                        title="Voir détails"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 shadow-sm p-5">
          <h3 className="text-xl font-black italic text-smart-teal mb-4">
            Détails de l'événement
          </h3>

          {!selectedEvent ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Sélectionnez un événement pour voir les détails.
            </p>
          ) : isDetailLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="animate-spin text-smart-teal" size={32} />
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                  Nom
                </p>
                <p className="font-bold text-smart-teal">{selectedEvent.nom}</p>
              </div>

              <div>
                <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                  Description
                </p>
                <p className="text-gray-700">
                  {selectedEvent.description || "Aucune description"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                    Date
                  </p>
                  <p className="font-bold">
                    {formatDateOnly(selectedEvent.date_event)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                    Heure
                  </p>
                  <p className="font-bold">
                    {toTimeHHMM(selectedEvent.start_time)} -{" "}
                    {toTimeHHMM(selectedEvent.end_time)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                  Lieu
                </p>
                <p className="font-semibold text-gray-700">
                  {selectedEvent.local?.nom ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                  Capacité
                </p>
                <p className="font-semibold text-gray-700">
                  {selectedEvent._count?.participants ?? 0} /{" "}
                  {selectedEvent.capacity ?? "Non définie"} participants
                </p>
              </div>

              {selectedEvent.createur && (
                <div>
                  <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                    Organisé par
                  </p>
                  <p className="font-semibold text-gray-700">
                    {selectedEvent.club?.nom ?? "Club"}
                  </p>
                </div>
              )}

              {Array.isArray(selectedEvent.timeline) &&
                selectedEvent.timeline.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider mb-3">
                      Programme
                    </p>
                    <div className="rounded-2xl border border-[#D6E5E8] bg-[#F8FCFD] p-4 space-y-4">
                      {selectedEvent.timeline.map((step, index) => {
                        const stepStart = String(step.start_time ?? "");
                        const stepEnd = String(step.end_time ?? "");
                        const [sh, sm] = stepStart.split(":").map(Number);
                        const [eh, em] = stepEnd.split(":").map(Number);
                        const durationMinutes =
                          Number.isFinite(sh) &&
                          Number.isFinite(sm) &&
                          Number.isFinite(eh) &&
                          Number.isFinite(em)
                            ? Math.max(0, eh * 60 + em - (sh * 60 + sm))
                            : 0;

                        return (
                          <div
                            key={`${index}-${step.start_time}-${step.end_time}-${step.title}`}
                            className="relative pl-7"
                          >
                            <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-[#436D75]" />
                            {Array.isArray(selectedEvent.timeline) &&
                            index < selectedEvent.timeline.length - 1 ? (
                              <span className="absolute left-[14px] top-5 h-[calc(100%-8px)] w-[2px] bg-[#C7DCE1]" />
                            ) : null}

                            <div className="rounded-xl border border-[#E0ECEF] bg-white px-3 py-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-[#203A43] text-xs">
                                  {step.title}
                                </p>
                                <span className="text-[11px] font-black text-[#436D75]">
                                  {stepStart} - {stepEnd}
                                </span>
                              </div>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#6B8790]">
                                Durée: {durationMinutes} min
                              </p>
                              {step.details ? (
                                <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                                  {step.details}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              <div className="pt-4 border-t border-gray-100">
                {isPastEvent(selectedEvent) ? (
                  <div className="space-y-4">
                    {selectedParticipation && selectedEvent.canRate && (
                      <div className="rounded-2xl border border-[#D6E5E8] bg-[#F8FCFD] p-4 space-y-3">
                        <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                          Feedback & notation
                        </p>

                        <div>
                          <p className="text-xs font-black text-[#203A43] uppercase tracking-wider mb-2">
                            Votre note
                          </p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, index) => {
                              const starValue = index + 1;
                              const active = starValue <= myNote;
                              return (
                                <button
                                  key={starValue}
                                  type="button"
                                  onClick={() => setMyNote(starValue)}
                                  className="p-0.5"
                                  aria-label={`Noter ${starValue} sur 5`}
                                >
                                  <Star
                                    size={20}
                                    className={
                                      active
                                        ? "text-amber-500 fill-amber-500"
                                        : "text-gray-300"
                                    }
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <textarea
                          value={myCommentaire}
                          onChange={(event) =>
                            setMyCommentaire(event.target.value)
                          }
                          rows={3}
                          maxLength={500}
                          placeholder="Ajoutez un commentaire (optionnel)"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#436D75]/20"
                        />

                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={isSubmittingFeedback || myNote < 1}
                            onClick={() =>
                              handleSubmitFeedback(
                                selectedEvent.id,
                                myNote,
                                myCommentaire,
                              )
                            }
                            className="px-3 py-2 rounded-lg bg-[#436D75] text-white text-xs font-black disabled:opacity-60 hover:bg-[#33545B] transition"
                          >
                            {isSubmittingFeedback
                              ? "Envoi..."
                              : "Envoyer mon feedback"}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center text-sm font-bold text-gray-600">
                      Événement passé: consultation uniquement.
                    </div>

                    {selectedParticipation?.checkin && (
                      <button
                        disabled={isCertificateLoading}
                        onClick={() =>
                          handleGenerateCertificate(selectedEvent.id)
                        }
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-60"
                      >
                        <Award size={18} />
                        {isCertificateLoading
                          ? "Generation..."
                          : "Telecharger mon certificat"}
                      </button>
                    )}

                    {Array.isArray(selectedEvent.recentFeedbacks) &&
                      selectedEvent.recentFeedbacks.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                            Derniers commentaires
                          </p>
                          {selectedEvent.recentFeedbacks.map((feedback) => (
                            <div
                              key={feedback.id}
                              className="rounded-xl border border-gray-100 p-3 bg-white"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-bold text-gray-700">
                                  {feedback.user
                                    ? `${feedback.user.nom} ${feedback.user.prenom}`
                                    : "Membre"}
                                </p>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, index) => (
                                    <Star
                                      key={index + 1}
                                      size={14}
                                      className={
                                        index + 1 <= Math.round(feedback.note)
                                          ? "text-amber-500 fill-amber-500"
                                          : "text-gray-300"
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                              {feedback.commentaire ? (
                                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                                  {feedback.commentaire}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400 mt-2 italic">
                                  Aucun commentaire.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ) : selectedParticipation ? (
                  <div className="space-y-3">
                    <div
                      className={`rounded-xl border p-3 text-center ${
                        selectedParticipation.status === "EN_ATTENTE"
                          ? "bg-amber-50 border-amber-200"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <p
                        className={`text-sm font-bold ${
                          selectedParticipation.status === "EN_ATTENTE"
                            ? "text-amber-700"
                            : "text-green-700"
                        }`}
                      >
                        {selectedParticipation.status === "EN_ATTENTE"
                          ? "Votre demande est en attente d'acceptation par l'admin"
                          : "Vous êtes inscrit à cet événement"}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          selectedParticipation.status === "EN_ATTENTE"
                            ? "text-amber-600"
                            : "text-green-600"
                        }`}
                      >
                        Statut: {selectedParticipation.status}
                      </p>
                    </div>
                    <button
                      disabled={isActionLoading}
                      onClick={() =>
                        handleCancelParticipation(selectedEvent.id)
                      }
                      className="w-full px-4 py-3 rounded-xl bg-gray-300 text-black text-sm font-black hover:bg-gray-400 transition disabled:opacity-60"
                    >
                      {isActionLoading
                        ? "Traitement..."
                        : selectedParticipation.status === "EN_ATTENTE"
                          ? "Annuler ma demande"
                          : "Annuler ma participation"}
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={isActionLoading}
                    onClick={() => handleRequestParticipation(selectedEvent.id)}
                    className="w-full px-4 py-3 rounded-xl bg-[#E98A7D] text-white text-sm font-black hover:bg-[#d97a6d] transition disabled:opacity-60"
                  >
                    {isActionLoading
                      ? "Traitement..."
                      : "Demander à participer"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CertificateModal
        isOpen={isCertificateModalOpen}
        isLoading={isCertificateLoading}
        imageBase64={certificateData?.image}
        filename={certificateData?.filename}
        participantName={certificateData?.participantName}
        eventName={selectedEvent?.nom}
        onClose={() => setIsCertificateModalOpen(false)}
      />

      <EventDetailsModal
        isOpen={isModalOpen}
        selectedDetail={selectedEvent}
        onClose={() => setIsModalOpen(false)}
        onRequestParticipation={(eventId) =>
          void handleRequestParticipation(eventId)
        }
        onCancelParticipation={(eventId) =>
          void handleCancelParticipation(eventId)
        }
        isActionLoading={isActionLoading}
        onSubmitFeedback={(eventId, note, commentaire) =>
          void handleSubmitFeedback(eventId, note, commentaire)
        }
        isSubmittingFeedback={isSubmittingFeedback}
        onSelfCheckin={async (eventId: string) => {
          try {
            await api.patch(
              `/events/${eventId}/participants/me/checkin`,
              {},
              { headers },
            );
            showAlert("Votre présence a été enregistrée!", "success");
            await loadEventDetail(eventId);
            await loadEvents();
          } catch {
            showAlert("Check-in impossible.", "error");
          }
        }}
      />
    </div>
  );
}
