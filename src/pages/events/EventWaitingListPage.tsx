import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import type { EventItem, EventParticipant } from "./types";

type WaitingEvent = {
  event: EventItem;
  confirmedCount: number;
  waitingList: EventParticipant[];
};

type ParticipantsResponse = {
  confirmed?: EventParticipant[];
  waitingList?: EventParticipant[];
};

export default function EventWaitingListPage() {
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [waitingEvents, setWaitingEvents] = useState<WaitingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const eventsResponse = await api.get("/events?includeInactive=false", {
        headers,
      });
      const events = Array.isArray(eventsResponse.data)
        ? (eventsResponse.data as EventItem[])
        : [];

      const withCapacity = events.filter(
        (event) =>
          typeof event.capacity === "number" && (event.capacity ?? 0) > 0,
      );

      const evaluated = await Promise.all(
        withCapacity.map(async (event) => {
          try {
            const participantsResponse = await api.get(
              `/events/${event.id}/participants`,
              {
                headers,
              },
            );
            const data = (participantsResponse.data ||
              {}) as ParticipantsResponse;
            const confirmed = Array.isArray(data.confirmed)
              ? data.confirmed
              : [];
            const waitingList = Array.isArray(data.waitingList)
              ? data.waitingList
              : [];

            return {
              event,
              confirmedCount: confirmed.length,
              waitingList,
            };
          } catch {
            return null;
          }
        }),
      );

      const fullWithWaiting = evaluated
        .filter((item): item is WaitingEvent => Boolean(item))
        .filter(
          (item) =>
            typeof item.event.capacity === "number" &&
            item.confirmedCount >= (item.event.capacity ?? 0) &&
            item.waitingList.length > 0,
        )
        .sort(
          (a, b) =>
            new Date(a.event.date_event).getTime() -
            new Date(b.event.date_event).getTime(),
        );

      setWaitingEvents(fullWithWaiting);
    } catch {
      setError("Impossible de charger la liste d'attente.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic text-smart-teal">
            Liste D'attente Des Événements Complets
          </h2>
          <p className="text-sm text-gray-500 font-semibold">
            Événements complets selon capacité avec demandes en attente.
          </p>
        </div>
        <button
          onClick={() => void loadData()}
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

      {isLoading ? (
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-400">Chargement...</p>
        </div>
      ) : waitingEvents.length === 0 ? (
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-400">
            Aucun événement complet avec liste d'attente.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {waitingEvents.map(({ event, confirmedCount, waitingList }) => (
            <div
              key={event.id}
              className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-lg font-black text-[#244047]">
                    {event.nom}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(event.date_event).toLocaleDateString()} ·{" "}
                    {event.club?.nom ?? "-"}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#FDE5E1] text-[#B23A2B] text-xs font-black">
                  Complet: {confirmedCount} / {event.capacity}
                </div>
              </div>

              <p className="text-xs uppercase tracking-wider font-black text-gray-400 mb-2">
                Liste d'attente ({waitingList.length})
              </p>

              <div className="space-y-2">
                {waitingList.map((participant) => (
                  <div
                    key={participant.id}
                    className="p-3 rounded-xl border border-gray-100 bg-[#F9FAFB]"
                  >
                    <p className="text-sm font-black text-[#244047]">
                      {participant.user.nom} {participant.user.prenom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {participant.user.email}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
