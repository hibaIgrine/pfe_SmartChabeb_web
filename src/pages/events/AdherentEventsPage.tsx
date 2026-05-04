
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Users, Eye, Loader2, MapPin } from "lucide-react";
import api from "../../api/axios";
import type { EventItem, EventDetail } from "./types";
import { toTimeHHMM } from "./utils";

export default function AdherentEventsPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showAlert = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 3500);
  };

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/events?includeInactive=false", { headers });
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

  const handleRequestParticipation = async (eventId: string) => {
    try {
      await api.post(`/events/${eventId}/participants/me`, {}, { headers });
      showAlert("Demande de participation envoyée avec succès!", "success");
      await loadEventDetail(eventId);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      showAlert(apiMessage || "Impossible d'envoyer la demande de participation.", "error");
    }
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

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black italic text-smart-teal">
          Événements Disponibles
        </h1>
        <p className="text-sm text-gray-500">
          Découvrez et participez aux événements organisés par les clubs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des événements */}
        <div className="lg:col-span-2 bg-white rounded-[30px] border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-smart-teal" size={42} />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                Chargement des événements...
              </p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center text-gray-400 font-bold">
              Aucun événement disponible pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {events.map((event) => {
                const isSelected = selectedEvent?.id === event.id;
                return (
                  <div
                    key={event.id}
                    className={`p-5 transition cursor-pointer ${
                      isSelected ? "bg-[#D9E8D1]/25" : "hover:bg-gray-50"
                    }`}
                    onClick={() => loadEventDetail(event.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-black italic text-smart-teal mb-2">
                          {event.nom}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3 font-semibold">
                          {event.club?.nom ?? "Club"} • {event.local?.nom ?? "Local"}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-bold">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={14} />
                            {new Date(event.date_event).toLocaleDateString()}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 size={14} />
                            {toTimeHHMM(event.start_time)} - {toTimeHHMM(event.end_time)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users size={14} />
                            {event._count?.participants ?? 0} / {event.capacity ?? "∞"} participants
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} />
                            {event.local?.centre?.gouvernorat ?? "Lieu à déterminer"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadEventDetail(event.id);
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

        {/* Détails de l'événement */}
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
                    {new Date(selectedEvent.date_event).toLocaleDateString()}
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
                  {selectedEvent.local?.nom ?? "-"} •{" "}
                  {selectedEvent.local?.centre?.gouvernorat ?? "-"}
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

              {Array.isArray(selectedEvent.timeline) && selectedEvent.timeline.length > 0 && (
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
                          {index < selectedEvent.timeline.length - 1 ? (
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
                {selectedEvent.participants?.find((p) => p.user?.id === user.id) ? (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
                    <p className="text-sm font-bold text-green-700">
                      Vous êtes déjà inscrit à cet événement
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Statut:{" "}
                      {selectedEvent.participants.find((p) => p.user?.id === user.id)?.status}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRequestParticipation(selectedEvent.id)}
                    className="w-full px-4 py-3 rounded-xl bg-[#E98A7D] text-white text-sm font-black hover:bg-[#d97a6d] transition"
                  >
                    Demander à participer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
