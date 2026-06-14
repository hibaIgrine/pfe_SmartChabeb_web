import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { ROUTES } from "../../constants/routes";
import api from "../../api/axios";
import EventFormModal from "./components/EventFormModal";
import EventHeader from "./components/EventHeader";
import EventPresenceModal from "./components/EventPresenceModal";
import EventsCalendar from "./components/EventsCalendar";
import EventsList from "./components/EventsList";
import type { AlertState, ClubLite, EventForm, EventItem, LocalLite } from "./types";
import { getEmptyForm, getTodayDate, toTimeHHMM, validateEventForm } from "./utils";

export default function ClubEventsPage() {
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const navigate = useNavigate();
  const today = getTodayDate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [managedClubs, setManagedClubs] = useState<ClubLite[]>([]);
  const [centreClubs, setCentreClubs] = useState<ClubLite[]>([]);
  const [locaux, setLocaux] = useState<LocalLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [eventFilter, setEventFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<EventItem | null>(null);
  const [presenceEvent, setPresenceEvent] = useState<EventItem | null>(null);
  const [presenceParticipants, setPresenceParticipants] = useState<any[]>([]);
  const [isPresenceLoading, setIsPresenceLoading] = useState(false);
  const [isPresenceUpdating, setIsPresenceUpdating] = useState(false);
  const [form, setForm] = useState<EventForm>(getEmptyForm());
  const [notification, setNotification] = useState<AlertState>(null);
  const [formAlert, setFormAlert] = useState<AlertState>(null);

  const managedClubIds = useMemo(
    () => new Set(managedClubs.map((c) => c.id)),
    [managedClubs],
  );

  const scopedEvents = useMemo(() => {
    if (managedClubIds.size === 0) return [];
    return events.filter((e) => {
      const ids = [e.club_id, ...(e.collaborating_club_ids ?? [])].filter(Boolean) as string[];
      return ids.some((id) => managedClubIds.has(id));
    });
  }, [events, managedClubIds]);

  const visibleEvents = useMemo(() => {
    const filtered = scopedEvents.filter((e) => {
      if (eventFilter === "all") return true;
      const d = e.date_event?.split("T")[0] ?? e.date_event;
      return eventFilter === "upcoming" ? d >= today : d < today;
    });
    return [...filtered].sort((a, b) => {
      const d = b.date_event.localeCompare(a.date_event);
      return d !== 0 ? d : b.start_time.localeCompare(a.start_time);
    });
  }, [scopedEvents, eventFilter, today]);

  const filteredLocaux = useMemo(() => {
    const centreId = managedClubs[0]?.id_centre;
    if (!centreId) return locaux;
    return locaux.filter((l) => l.id_centre === centreId);
  }, [locaux, managedClubs]);

  const showAlert = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, managedRes, centreRes, locauxRes] = await Promise.all([
        api.get(`/events?includeInactive=${showInactive}`, { headers }),
        api.get("/presences/my-clubs", { headers }),
        api.get("/clubs/my-centre", { headers }),
        api.get("/locaux", { headers }),
      ]);

      const managed: ClubLite[] = Array.isArray(managedRes.data) ? managedRes.data : [];
      const centrePayload = centreRes.data as { clubs?: ClubLite[] } | null;

      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      setManagedClubs(managed);
      setCentreClubs(Array.isArray(centrePayload?.clubs) ? centrePayload!.clubs! : []);
      setLocaux(Array.isArray(locauxRes.data) ? locauxRes.data : []);

      if (managed.length > 0) {
        setForm((prev) => ({
          ...prev,
          club_id: prev.club_id || managed[0].id,
        }));
      }
    } catch {
      showAlert("Erreur lors du chargement des événements.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, [showInactive]);

  const resetForm = () => {
    setForm({ ...getEmptyForm(), club_id: managedClubs[0]?.id ?? "" });
    setEditingEvent(null);
    setFormAlert(null);
  };

  const navigateToDetail = (eventId: string) =>
    navigate(ROUTES.club.eventDetail.replace(":id", eventId));

  const openCreateModal = () => { resetForm(); setIsModalOpen(true); };

  const openEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setForm({
      nom: event.nom,
      description: event.description ?? "",
      date_event: event.date_event.split("T")[0],
      start_time: toTimeHHMM(event.start_time),
      end_time: toTimeHHMM(event.end_time),
      club_id: event.club_id ?? managedClubs[0]?.id ?? "",
      club_ids: event.collaborating_club_ids ?? [],
      locaux_id: event.locaux_id,
      capacity: event.capacity ? String(event.capacity) : "",
      timeline: Array.isArray(event.timeline)
        ? event.timeline.map((s) => ({
            title: s.title ?? "",
            start_time: s.start_time ?? "",
            end_time: s.end_time ?? "",
            details: s.details ?? "",
          }))
        : [],
    });
    setFormAlert(null);
    setIsModalOpen(true);
  };

  const submitForm = async () => {
    const validationMessage = validateEventForm(form, today);
    if (validationMessage) { setFormAlert({ msg: validationMessage, type: "error" }); return; }
    setFormAlert(null);
    setIsSaving(true);
    try {
      const availRes = await api.get("/events/availability/check", {
        headers,
        params: {
          id_local: form.locaux_id,
          date: form.date_event,
          start: form.start_time,
          end: form.end_time,
          excludeEventId: editingEvent?.id,
        },
      });
      if (!availRes.data?.available) {
        setFormAlert({ msg: "Conflit de planning: le local n'est pas disponible sur ce créneau.", type: "error" });
        setIsSaving(false);
        return;
      }

      const payload: Record<string, any> = {
        nom: form.nom,
        description: form.description || undefined,
        date_event: form.date_event,
        start_time: form.start_time,
        end_time: form.end_time,
        locaux_id: form.locaux_id,
        club_id: form.club_id || undefined,
      };

      const collaboratingIds = form.club_ids.filter((id) => id !== form.club_id);
      if (collaboratingIds.length > 0) payload.club_ids = collaboratingIds;
      if (form.capacity.trim() !== "") payload.capacity = Number(form.capacity);
      payload.timeline = form.timeline.map((s) => ({
        title: s.title.trim(),
        start_time: s.start_time,
        end_time: s.end_time,
        details: s.details?.trim() || undefined,
      }));

      if (editingEvent) {
        await api.patch(`/events/${editingEvent.id}`, payload, { headers });
        showAlert("Événement modifié avec succès.", "success");
      } else {
        await api.post("/events", payload, { headers });
        showAlert("Événement créé avec succès.", "success");
      }

      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      setFormAlert({ msg: (Array.isArray(msg) ? msg.join(" | ") : msg) || "Action impossible.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (event: EventItem) => {
    try {
      await api.patch(`/events/${event.id}/${event.is_active ? "deactivate" : "activate"}`, {}, { headers });
      showAlert(event.is_active ? "Événement désactivé." : "Événement activé.", "success");
      await loadData();
    } catch { showAlert("Impossible de modifier le statut.", "error"); }
  };

  const openCancelConfirmation = (event: EventItem) => setCancelTarget(event);
  const closeCancelConfirmation = () => { if (!isSaving) setCancelTarget(null); };

  const confirmCancelEvent = async () => {
    if (!cancelTarget) return;
    setIsSaving(true);
    try {
      await api.patch(`/events/${cancelTarget.id}/cancel`, {}, { headers });
      showAlert("Événement annulé et notifications envoyées.", "success");
      await loadData();
      setCancelTarget(null);
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      showAlert((Array.isArray(msg) ? msg.join(" | ") : msg) || "Impossible d'annuler.", "error");
    } finally { setIsSaving(false); }
  };

  const openPresence = async (event: EventItem) => {
    setPresenceEvent(event);
    setPresenceParticipants([]);
    setIsPresenceLoading(true);
    try {
      const res = await api.get(`/events/${event.id}/participants`, { headers });
      setPresenceParticipants(Array.isArray(res.data?.all) ? res.data.all : []);
    } catch {
      showAlert("Impossible de charger les présences.", "error");
      setPresenceEvent(null);
    } finally { setIsPresenceLoading(false); }
  };

  const togglePresence = async (participantId: string, checkin: boolean) => {
    if (!presenceEvent) return;
    setIsPresenceUpdating(true);
    try {
      await api.patch(`/events/${presenceEvent.id}/participants/${participantId}/checkin`, { checkin }, { headers });
      const res = await api.get(`/events/${presenceEvent.id}/participants`, { headers });
      setPresenceParticipants(Array.isArray(res.data?.all) ? res.data.all : []);
      showAlert("Présence mise à jour.", "success");
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      showAlert((Array.isArray(msg) ? msg.join(" | ") : msg) || "Mise à jour présence impossible.", "error");
    } finally { setIsPresenceUpdating(false); }
  };

  return (
    <div className="space-y-8 pb-8">
      {notification && (
        <div className={`px-5 py-4 rounded-2xl border text-sm font-bold ${
          notification.type === "success"
            ? "bg-[#D9E8D1] text-[#436D75] border-[#436D75]/20"
            : "bg-[#FDE5E1] text-[#B23A2B] border-[#E98A7D]/40"
        }`}>
          {notification.msg}
        </div>
      )}

      <EventHeader
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        onCreate={openCreateModal}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-[28px] border border-gray-100 bg-white shadow-sm p-4">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mr-2">
          Filtrer les événements
        </span>
        {([ ["upcoming", "À venir"], ["past", "Passés"], ["all", "Tous"] ] as const).map(
          ([value, label]) => (
            <button
              key={value}
              onClick={() => setEventFilter(value)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                eventFilter === value
                  ? "bg-[#436D75] text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <EventsList
        isLoading={isLoading}
        events={visibleEvents}
        selectedEventId={null}
        onView={navigateToDetail}
        onPresence={openPresence}
        onEdit={openEditModal}
        onToggleActive={toggleActive}
        onCancel={openCancelConfirmation}
      />

      <EventsCalendar events={visibleEvents} onSelectEvent={navigateToDetail} />

      <EventFormModal
        isOpen={isModalOpen}
        editingEvent={editingEvent}
        isAdmin={false}
        form={form}
        clubs={centreClubs.length > 0 ? centreClubs : managedClubs}
        ownedClubs={managedClubs}
        filteredLocaux={filteredLocaux}
        gouvernorats={[]}
        centresByGouvernorat={[]}
        selectedGouvernorat=""
        selectedCentreForAdmin=""
        today={today}
        formAlert={formAlert}
        isSaving={isSaving}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        onSubmit={submitForm}
        onChangeGouvernorat={() => undefined}
        onChangeCentreForAdmin={() => undefined}
        onChangeForm={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
      />

      <EventPresenceModal
        isOpen={Boolean(presenceEvent)}
        eventName={presenceEvent?.nom ?? ""}
        eventEndTime={presenceEvent?.end_time ?? ""}
        isLoading={isPresenceLoading}
        isUpdating={isPresenceUpdating}
        participants={presenceParticipants}
        onClose={() => setPresenceEvent(null)}
        onToggleCheckin={togglePresence}
      />

      {cancelTarget && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={closeCancelConfirmation}
            aria-label="Fermer"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-center text-xl font-black text-[#203A43]">
              Confirmer l'annulation
            </h3>
            <p className="mt-2 text-center text-sm text-gray-600 leading-relaxed">
              Vous allez annuler l'événement{" "}
              <span className="font-black">{cancelTarget.nom}</span>. Les
              participants recevront une notification.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeCancelConfirmation}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition disabled:opacity-60"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={confirmCancelEvent}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-black hover:bg-rose-700 transition disabled:opacity-60"
              >
                {isSaving ? "Annulation..." : "Oui, annuler"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
