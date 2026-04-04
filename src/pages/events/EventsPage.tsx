import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import EventDetailsPanel from "./components/EventDetailsPanel";
import EventFormModal from "./components/EventFormModal";
import EventHeader from "./components/EventHeader";
import EventsList from "./components/EventsList";
import type { AlertState, ClubLite, EventDetail, EventForm, EventItem, LocalLite } from "./types";
import { getEmptyForm, getTodayDate, toTimeHHMM, validateEventForm } from "./utils";

export default function EventsPage() {
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [events, setEvents] = useState<EventItem[]>([]);
  const [clubs, setClubs] = useState<ClubLite[]>([]);
  const [locaux, setLocaux] = useState<LocalLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showInactive, setShowInactive] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<EventDetail | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [form, setForm] = useState<EventForm>(getEmptyForm());

  const [notification, setNotification] = useState<AlertState>(null);
  const [formAlert, setFormAlert] = useState<AlertState>(null);

  const today = getTodayDate();

  const selectedClub = clubs.find((c) => c.id === form.club_id);
  const filteredLocaux = selectedClub?.id_centre
    ? locaux.filter((local) => local.id_centre === selectedClub.id_centre)
    : locaux;

  const showAlert = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 3500);
  };

  const loadBaseData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, clubsRes, locauxRes] = await Promise.all([
        api.get(`/events?includeInactive=${showInactive}`, { headers }),
        api.get("/clubs", { headers }),
        api.get("/locaux", { headers }),
      ]);

      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      setClubs(Array.isArray(clubsRes.data) ? clubsRes.data : []);
      setLocaux(Array.isArray(locauxRes.data) ? locauxRes.data : []);
    } catch {
      showAlert("Erreur lors du chargement des événements.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDetail = async (eventId: string) => {
    try {
      const response = await api.get(`/events/${eventId}`, { headers });
      setSelectedDetail(response.data);
      setSelectedEventId(eventId);
    } catch {
      showAlert("Impossible de charger le détail de l'événement.", "error");
    }
  };

  useEffect(() => {
    void loadBaseData();
  }, [showInactive]);

  useEffect(() => {
    if (!form.club_id || !form.locaux_id) return;
    const stillValid = filteredLocaux.some((l) => l.id === form.locaux_id);
    if (!stillValid) {
      setForm((prev) => ({ ...prev, locaux_id: "" }));
    }
  }, [form.club_id, form.locaux_id, filteredLocaux]);

  const resetForm = () => {
    setForm(getEmptyForm());
    setEditingEvent(null);
    setFormAlert(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setForm({
      nom: event.nom,
      description: event.description ?? "",
      date_event: event.date_event.split("T")[0],
      start_time: toTimeHHMM(event.start_time),
      end_time: toTimeHHMM(event.end_time),
      club_id: event.club_id,
      locaux_id: event.locaux_id,
      capacity: event.capacity ? String(event.capacity) : "",
    });
    setFormAlert(null);
    setIsModalOpen(true);
  };

  const submitForm = async () => {
    const validationMessage = validateEventForm(form, today);
    if (validationMessage) {
      setFormAlert({ msg: validationMessage, type: "error" });
      return;
    }

    setFormAlert(null);
    setIsSaving(true);

    try {
      const payload: Record<string, any> = {
        nom: form.nom,
        description: form.description || undefined,
        date_event: form.date_event,
        start_time: form.start_time,
        end_time: form.end_time,
        club_id: form.club_id,
        locaux_id: form.locaux_id,
      };

      if (form.capacity.trim() !== "") {
        payload.capacity = Number(form.capacity);
      }

      if (editingEvent) {
        await api.patch(`/events/${editingEvent.id}`, payload, { headers });
        showAlert("Événement modifié avec succès.", "success");
      } else {
        await api.post("/events", payload, { headers });
        showAlert("Événement créé avec succès.", "success");
      }

      setIsModalOpen(false);
      resetForm();
      await loadBaseData();

      if (selectedEventId) {
        await loadDetail(selectedEventId);
      }
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const detailedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(" | ")
        : apiMessage;

      setFormAlert({
        msg: detailedMessage || "Action impossible. Vérifiez les données saisies.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (event: EventItem) => {
    try {
      if (event.is_active) {
        await api.patch(`/events/${event.id}/deactivate`, {}, { headers });
        showAlert("Événement désactivé.", "success");
      } else {
        await api.patch(`/events/${event.id}/activate`, {}, { headers });
        showAlert("Événement activé.", "success");
      }

      await loadBaseData();

      if (selectedEventId === event.id) {
        await loadDetail(event.id);
      }
    } catch {
      showAlert("Impossible de modifier le statut.", "error");
    }
  };

  return (
    <div className="space-y-8 pb-8">
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

      <EventHeader
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        onCreate={openCreateModal}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <EventsList
          isLoading={isLoading}
          events={events}
          selectedEventId={selectedEventId}
          onView={loadDetail}
          onEdit={openEditModal}
          onToggleActive={toggleActive}
        />

        <EventDetailsPanel selectedDetail={selectedDetail} />
      </div>

      <EventFormModal
        isOpen={isModalOpen}
        editingEvent={editingEvent}
        form={form}
        clubs={clubs}
        filteredLocaux={filteredLocaux}
        today={today}
        formAlert={formAlert}
        isSaving={isSaving}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={submitForm}
        onChangeForm={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
      />
    </div>
  );
}
