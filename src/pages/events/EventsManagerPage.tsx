import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, RefreshCcw, Users } from "lucide-react";
import api from "../../api/axios";
import { getStoredRole } from "../../utils/authSession";
import type { ClubLite, EventItem, EventParticipant } from "./types";
import { formatDateOnly } from "./utils";

type Filter = "tous" | "avenir" | "passe";

type ParticipantsResponse = {
  waitingList?: EventParticipant[];
};

export default function EventsManagerPage() {
  const isClub = getStoredRole() === "RESPONSABLE_CLUB";
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [clubIds, setClubIds] = useState<string[] | undefined>(undefined);
  const [filter, setFilter] = useState<Filter>("tous");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [waitingList, setWaitingList] = useState<EventParticipant[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2500);
  };

  // Charge les clubs gérés si responsable club
  useEffect(() => {
    if (!isClub) return;
    api
      .get("/presences/my-clubs", { headers })
      .then((res) => {
        const clubs = Array.isArray(res.data) ? (res.data as ClubLite[]) : [];
        setClubIds(clubs.map((c) => c.id));
      })
      .catch(() => setClubIds([]));
  }, [isClub]);

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    setError(null);
    try {
      const res = await api.get("/events?includeInactive=false", { headers });
      const raw: EventItem[] = Array.isArray(res.data) ? res.data : [];
      const filtered =
        clubIds && clubIds.length > 0
          ? raw.filter((e) => {
              const ids = [e.club_id, ...(e.collaborating_club_ids ?? [])];
              return ids.some((id) => id && clubIds.includes(id));
            })
          : raw;
      setEvents(filtered);
    } catch {
      setError("Impossible de charger les événements.");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, [clubIds]);

  const today = new Date().toISOString().slice(0, 10);

  const filteredEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(b.date_event).getTime() - new Date(a.date_event).getTime(),
    );
    if (filter === "avenir") return sorted.filter((e) => e.date_event >= today);
    if (filter === "passe") return sorted.filter((e) => e.date_event < today);
    return sorted;
  }, [events, filter, today]);

  const isPast = (event: EventItem) => event.date_event < today;

  const selectEvent = async (event: EventItem) => {
    setSelectedEvent(event);
    setWaitingList([]);
    setIsLoadingRequests(true);
    setError(null);
    try {
      const res = await api.get(`/events/${event.id}/participants`, { headers });
      const data = (res.data || {}) as ParticipantsResponse;
      setWaitingList(Array.isArray(data.waitingList) ? data.waitingList : []);
    } catch {
      setError("Impossible de charger les demandes.");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const updateStatus = async (participantId: string, status: "CONFIRME" | "REFUSE") => {
    if (!selectedEvent) return;
    setIsUpdating(true);
    try {
      await api.patch(
        `/events/${selectedEvent.id}/participants/${participantId}/status`,
        { status },
        { headers },
      );
      showNotice(status === "CONFIRME" ? "Demande confirmée." : "Demande refusée.");
      await selectEvent(selectedEvent);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(" | ") : msg || "Action impossible.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-[32px] border border-[#D8E5E8] bg-gradient-to-br from-[#23444C] via-[#2F5A63] to-[#436D75] p-7 md:p-8 text-white shadow-2xl flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Gestion des Participants
          </h2>
          <p className="mt-1 text-sm text-[#E2EEF1] font-medium">
            Sélectionnez un événement pour traiter ses demandes en attente.
          </p>
        </div>
        <button
          onClick={() => void loadEvents()}
          className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-black text-white transition"
        >
          <RefreshCcw size={14} /> Actualiser
        </button>
      </div>

      {/* Alertes */}
      {notice && (
        <div className="px-4 py-3 rounded-2xl bg-[#D9E8D1] text-[#436D75] border border-[#436D75]/20 text-sm font-bold">
          {notice}
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-2xl bg-[#FDE5E1] text-[#B23A2B] border border-[#E98A7D]/40 text-sm font-bold">
          {error}
        </div>
      )}

      {/* Layout master-detail */}
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5 items-start">

        {/* Colonne gauche — liste des événements */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 xl:sticky xl:top-6 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-black text-[#244047]">Événements</h3>
          </div>

          {/* Filtres */}
          <div className="flex gap-1.5 mb-4">
            {(["tous", "avenir", "passe"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition ${
                  filter === f
                    ? "bg-[#436D75] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f === "tous" ? "Tous" : f === "avenir" ? "À venir" : "Passé"}
              </button>
            ))}
          </div>

          {isLoadingEvents ? (
            <p className="text-sm text-gray-400">Chargement...</p>
          ) : filteredEvents.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun événement disponible.</p>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((event) => {
                const active = selectedEvent?.id === event.id;
                const past = isPast(event);
                return (
                  <button
                    key={event.id}
                    onClick={() => void selectEvent(event)}
                    className={`w-full text-left rounded-2xl border p-3.5 transition ${
                      active
                        ? "border-[#436D75] bg-[#EAF2F4]"
                        : past
                          ? "border-gray-100 bg-gray-50 hover:bg-gray-100 opacity-60"
                          : "border-gray-100 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-sm font-black text-[#244047] leading-snug">
                      {event.nom}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] font-bold text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={11} />
                        {formatDateOnly(event.date_event)}
                      </span>
                      {past && (
                        <span className="inline-flex items-center gap-1 text-gray-400 italic">
                          Passé
                        </span>
                      )}
                      {event.club?.nom && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} />
                          {event.club.nom}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne droite — demandes en attente */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
          {!selectedEvent ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <Users size={36} className="text-gray-200" />
              <p className="text-sm font-bold text-gray-400">
                Cliquez sur un événement pour afficher ses demandes en attente.
              </p>
            </div>
          ) : (
            <>
              {(() => {
                const eventPast = isPast(selectedEvent);
                return (
                  <>
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-[#244047]">
                          {selectedEvent.nom}
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                          {formatDateOnly(selectedEvent.date_event)} · Demandes en attente
                        </p>
                      </div>
                      {eventPast && (
                        <span className="shrink-0 px-2.5 py-1 rounded-xl bg-gray-100 text-gray-400 text-[11px] font-black">
                          Événement passé
                        </span>
                      )}
                    </div>

                    {isLoadingRequests ? (
                      <p className="text-sm text-gray-400">Chargement des demandes...</p>
                    ) : waitingList.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                        <p className="text-sm font-bold text-gray-400">
                          Aucune demande en attente pour cet événement.
                        </p>
                      </div>
                    ) : (
                      <div className={`space-y-3 ${eventPast ? "opacity-50 pointer-events-none" : ""}`}>
                        {waitingList.map((participant) => (
                          <div
                            key={participant.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gray-100 bg-[#F9FAFB] p-4"
                          >
                            <div>
                              <p className="text-sm font-black text-[#244047]">
                                {participant.user.nom} {participant.user.prenom}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {participant.user.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                disabled={isUpdating || eventPast}
                                onClick={() => void updateStatus(participant.id, "CONFIRME")}
                                className="px-4 py-2 rounded-xl text-xs font-black bg-[#436D75] text-white disabled:opacity-60 hover:bg-[#2F5A63] transition"
                              >
                                Confirmer
                              </button>
                              <button
                                disabled={isUpdating || eventPast}
                                onClick={() => void updateStatus(participant.id, "REFUSE")}
                                className="px-4 py-2 rounded-xl text-xs font-black bg-[#FDE5E1] text-[#B23A2B] border border-[#E98A7D]/40 disabled:opacity-60 hover:bg-[#fbd0cb] transition"
                              >
                                Refuser
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
