import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import type { EventItem, EventParticipant } from "./types";
import { formatDateOnly } from "./utils";

type ParticipantsResponse = {
  confirmed?: EventParticipant[];
  waitingList?: EventParticipant[];
  refused?: EventParticipant[];
  cancelled?: EventParticipant[];
};

export default function EventParticipantsPage({ clubIds }: { clubIds?: string[] }) {
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventName, setSelectedEventName] = useState<string>("");
  const [confirmed, setConfirmed] = useState<EventParticipant[]>([]);
  const [waitingList, setWaitingList] = useState<EventParticipant[]>([]);
  const [refused, setRefused] = useState<EventParticipant[]>([]);
  const [cancelled, setCancelled] = useState<EventParticipant[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadParticipants = async (eventId: string, eventName?: string) => {
    setIsLoadingParticipants(true);
    setError(null);
    try {
      const response = await api.get(`/events/${eventId}/participants`, {
        headers,
      });
      const data = (response.data || {}) as ParticipantsResponse;
      setConfirmed(Array.isArray(data.confirmed) ? data.confirmed : []);
      setWaitingList(Array.isArray(data.waitingList) ? data.waitingList : []);
      setRefused(Array.isArray(data.refused) ? data.refused : []);
      setCancelled(Array.isArray(data.cancelled) ? data.cancelled : []);
      setSelectedEventId(eventId);
      if (eventName) setSelectedEventName(eventName);
    } catch {
      setError("Impossible de charger la liste des participants.");
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    setError(null);
    try {
      const response = await api.get("/events?includeInactive=false", {
        headers,
      });
      const raw = Array.isArray(response.data)
        ? (response.data as EventItem[])
        : [];
      const list =
        clubIds && clubIds.length > 0
          ? raw.filter((e) => {
              const ids = [e.club_id, ...(e.collaborating_club_ids ?? [])];
              return ids.some((id) => id && clubIds.includes(id));
            })
          : raw;
      setEvents(list);

      const nextSelectedId =
        selectedEventId && list.some((e) => e.id === selectedEventId)
          ? selectedEventId
          : (list[0]?.id ?? null);

      setSelectedEventId(nextSelectedId);
      setSelectedEventName(
        list.find((e) => e.id === nextSelectedId)?.nom ?? "",
      );

      if (nextSelectedId) {
        await loadParticipants(
          nextSelectedId,
          list.find((e) => e.id === nextSelectedId)?.nom ?? "",
        );
      } else {
        setConfirmed([]);
        setWaitingList([]);
        setRefused([]);
        setCancelled([]);
      }
    } catch {
      setError("Impossible de charger les événements.");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const renderUsers = (title: string, list: EventParticipant[]) => (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider font-black text-gray-400">
        {title} ({list.length})
      </p>
      {list.length === 0 ? (
        <p className="text-xs text-gray-400">Aucun participant.</p>
      ) : (
        list.map((participant) => (
          <div
            key={participant.id}
            className="p-3 rounded-xl border border-gray-100 bg-white/70"
          >
            <p className="text-sm font-black text-[#244047]">
              {participant.user.nom} {participant.user.prenom}
            </p>
            <p className="text-xs text-gray-500">{participant.user.email}</p>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic text-smart-teal">
            Liste Des Participants
          </h2>
          <p className="text-sm text-gray-500 font-semibold">
            Consultez tous les participants d'un événement.
          </p>
        </div>
        <button
          onClick={() => void loadEvents()}
          className="px-4 py-2 rounded-xl bg-[#436D75] text-white text-xs font-black"
        >
          Actualiser
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-[#FDE5E1] text-[#B23A2B] border border-[#E98A7D]/40 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.4fr)] gap-6 items-start">
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto xl:self-start">
          <h3 className="text-lg font-black italic text-smart-teal mb-4">
            Événements
          </h3>
          {isLoadingEvents ? (
            <p className="text-sm text-gray-400">Chargement...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun événement disponible.</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => {
                const active = event.id === selectedEventId;
                return (
                  <button
                    key={event.id}
                    onClick={() => void loadParticipants(event.id, event.nom)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      active
                        ? "border-[#436D75] bg-[#D9E8D1]"
                        : "border-gray-100 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-sm font-black text-[#244047]">
                      {event.nom}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateOnly(event.date_event)} ·{" "}
                      {event.club?.nom ?? "-"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 space-y-4 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto xl:self-start">
          <h3 className="text-lg font-black italic text-smart-teal mb-1">
            Participants
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            {selectedEventName || "Sélectionnez un événement"}
          </p>

          {!selectedEventId ? (
            <p className="text-sm text-gray-400">
              Sélectionnez un événement pour voir les participants.
            </p>
          ) : isLoadingParticipants ? (
            <p className="text-sm text-gray-400">
              Chargement des participants...
            </p>
          ) : (
            <>
              {renderUsers("Confirmés", confirmed)}
              {renderUsers("En Attente", waitingList)}
              {renderUsers("Refusés", refused)}
              {renderUsers("Annulés", cancelled)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
