/**
 * EventRequestsPage.tsx — Demandes d'inscription aux événements (vue centre).
 *
 * RÔLE :
 *   Liste des demandes d'inscription en attente pour les événements du centre.
 *   Accessible via /centre/events-requests.
 *
 * PROPS :
 *   clubIds? — Filtre optionnel sur un sous-ensemble de clubs du centre
 *
 * FONCTIONNALITÉS :
 *   - Approuver ou refuser des demandes d'inscription individuelles
 *   - Actions en masse (approuver tout / refuser tout)
 *   - Vue par événement avec liste des candidats
 *
 * ACCÈS : RESPONSABLE_CENTRE uniquement
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { ROUTES } from "../../constants/routes";
import type { EventItem, EventParticipant } from "./types";
import { formatDateOnly } from "./utils";

export default function EventRequestsPage({ clubIds }: { clubIds?: string[] }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventName, setSelectedEventName] = useState<string>("");
  const [waitingList, setWaitingList] = useState<EventParticipant[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
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
        await loadRequests(
          nextSelectedId,
          list.find((e) => e.id === nextSelectedId)?.nom ?? "",
        );
      } else {
        setWaitingList([]);
      }
    } catch {
      setError("Impossible de charger les événements.");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const loadRequests = async (eventId: string, eventName?: string) => {
    setIsLoadingRequests(true);
    try {
      const response = await api.get(`/events/${eventId}/participants`, {
        headers,
      });
      setWaitingList(
        Array.isArray(response.data?.waitingList)
          ? response.data.waitingList
          : [],
      );
      setSelectedEventId(eventId);
      if (eventName) {
        setSelectedEventName(eventName);
      }
    } catch {
      setError("Impossible de charger les demandes de cet événement.");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const updateRequestStatus = async (
    participantId: string,
    status: "CONFIRME" | "REFUSE",
  ) => {
    if (!selectedEventId) return;

    setIsUpdating(true);
    try {
      await api.patch(
        `/events/${selectedEventId}/participants/${participantId}/status`,
        { status },
        { headers },
      );

      showNotice(
        status === "CONFIRME" ? "Demande confirmée." : "Demande refusée.",
      );
      await loadRequests(selectedEventId, selectedEventName);
      await loadEvents();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      const detailedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(" | ")
        : apiMessage;
      setError(detailedMessage || "Action impossible sur cette demande.");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic text-smart-teal">
            Demandes d'inscription
          </h2>
          <p className="text-sm text-gray-500 font-semibold">
            Gérez les demandes en attente pour les événements.
          </p>
        </div>
        <button
          onClick={() => void loadEvents()}
          className="px-4 py-2 rounded-xl bg-[#436D75] text-white text-xs font-black"
        >
          Actualiser
        </button>
      </div>

      <div className="flex items-center gap-1 p-1.5 bg-gray-100 rounded-2xl w-fit">
        <button
          className="px-4 py-2 rounded-xl text-xs font-black bg-white text-smart-teal shadow-sm"
        >
          Demandes
        </button>
        <button
          onClick={() => navigate(ROUTES.centre.eventParticipants)}
          className="px-4 py-2 rounded-xl text-xs font-black transition text-gray-500 hover:text-gray-700 hover:bg-white/70"
        >
          Participants
        </button>
        <button
          onClick={() => navigate(ROUTES.centre.eventWaitingList)}
          className="px-4 py-2 rounded-xl text-xs font-black transition text-gray-500 hover:text-gray-700 hover:bg-white/70"
        >
          Liste d'attente
        </button>
      </div>

      {notice && (
        <div className="px-4 py-3 rounded-xl bg-[#D9E8D1] text-[#436D75] border border-[#436D75]/20 text-sm font-bold">
          {notice}
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-[#FDE5E1] text-[#B23A2B] border border-[#E98A7D]/40 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 xl:col-span-1">
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
                    onClick={() => void loadRequests(event.id, event.nom)}
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

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 xl:col-span-2">
          <h3 className="text-lg font-black italic text-smart-teal mb-1">
            Demandes en attente
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            {selectedEventName || "Sélectionnez un événement"}
          </p>

          {!selectedEventId ? (
            <p className="text-sm text-gray-400">
              Sélectionnez un événement pour voir les demandes.
            </p>
          ) : isLoadingRequests ? (
            <p className="text-sm text-gray-400">Chargement des demandes...</p>
          ) : waitingList.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune demande en attente.</p>
          ) : (
            <div className="space-y-3">
              {waitingList.map((participant) => (
                <div
                  key={participant.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-[#F9FAFB] flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-black text-[#244047]">
                      {participant.user.nom} {participant.user.prenom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {participant.user.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={isUpdating}
                      onClick={() =>
                        void updateRequestStatus(participant.id, "CONFIRME")
                      }
                      className="px-3 py-2 rounded-xl text-xs font-black bg-[#436D75] text-white disabled:opacity-60"
                    >
                      Confirmer
                    </button>
                    <button
                      disabled={isUpdating}
                      onClick={() =>
                        void updateRequestStatus(participant.id, "REFUSE")
                      }
                      className="px-3 py-2 rounded-xl text-xs font-black bg-[#FDE5E1] text-[#B23A2B] border border-[#E98A7D]/40 disabled:opacity-60"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
