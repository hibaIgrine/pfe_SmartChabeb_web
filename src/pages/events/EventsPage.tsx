/**
 * EventsPage.tsx — Gestion des événements (ADMIN + RESPONSABLE_CENTRE).
 *
 * RÔLE :
 *   Interface de gestion complète des événements pour les administrateurs et
 *   responsables de centre. Vue calendrier + liste des événements.
 *
 * FONCTIONNALITÉS :
 *   - EventsCalendar : calendrier mensuel avec les événements positionnés par date
 *   - EventsList : liste avec filtres (statut, club, période)
 *   - EventFormModal : création/édition d'un événement (titre, description, dates, lieu,
 *                      capacité, timeline en étapes)
 *   - EventPresenceModal : enregistrement des présences à un événement
 *   - Navigation vers le détail d'un événement (EventManagementDetailPage)
 *
 * TYPES D'ÉVÉNEMENTS :
 *   Statut : EN_ATTENTE (pending) | APPROUVE (approved) | REFUSE (rejected)
 *   Actions ADMIN/CENTRE : Approuver / Refuser une demande de club
 *
 * ACCÈS : ADMIN (ROUTES.admin.eventsManagement) + RESPONSABLE_CENTRE (ROUTES.centre.eventsManagement)
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { ROUTES } from "../../constants/routes";
import api from "../../api/axios";
import EventFormModal from "./components/EventFormModal";
import EventHeader from "./components/EventHeader";
import EventPresenceModal from "./components/EventPresenceModal";
import EventsCalendar from "./components/EventsCalendar";
import EventsList from "./components/EventsList";
import type {
  AlertState,
  ClubLite,
  EventForm,
  EventItem,
  LocalLite,
} from "./types";
import {
  getEmptyForm,
  getTodayDate,
  toTimeHHMM,
  validateEventForm,
} from "./utils";

export default function EventsPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "ADMIN";
  const isResponsableCentre = user?.role === "RESPONSABLE_CENTRE";
  const canManageParticipants = [
    "ADMIN",
    "RESPONSABLE_CENTRE",
    "RESPONSABLE_CLUB",
  ].includes(user?.role);

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [events, setEvents] = useState<EventItem[]>([]);
  const [clubs, setClubs] = useState<ClubLite[]>([]);
  const [locaux, setLocaux] = useState<LocalLite[]>([]);
  const [allCentres, setAllCentres] = useState<{ id: string; nom: string; gouvernorat: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showInactive, setShowInactive] = useState(true);
  const [eventFilter, setEventFilter] = useState<"upcoming" | "past" | "all">(
    "upcoming",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<EventItem | null>(null);
  const [presenceEvent, setPresenceEvent] = useState<EventItem | null>(null);
  const [presenceParticipants, setPresenceParticipants] = useState<any[]>([]);
  const [isPresenceLoading, setIsPresenceLoading] = useState(false);
  const [isPresenceUpdating, setIsPresenceUpdating] = useState(false);
  const [form, setForm] = useState<EventForm>(getEmptyForm());
  const [resolvedCentreId, setResolvedCentreId] = useState(
    user?.centre?.id ?? user?.id_centre ?? "",
  );
  const [selectedGouvernorat, setSelectedGouvernorat] = useState("");
  const [selectedCentreForAdmin, setSelectedCentreForAdmin] = useState("");

  // Filtres liste (indépendants du formulaire)
  const [filterGouvernorat, setFilterGouvernorat] = useState("");
  const [filterCentreId, setFilterCentreId] = useState("");

  const [notification, setNotification] = useState<AlertState>(null);
  const [formAlert, setFormAlert] = useState<AlertState>(null);

  const today = getTodayDate();

  const scopedClubs = useMemo(() => {
    if (isResponsableCentre && resolvedCentreId)
      return clubs.filter((c) => c.id_centre === resolvedCentreId);
    if (isAdmin && (selectedCentreForAdmin || filterCentreId))
      return clubs.filter((c) => c.id_centre === (selectedCentreForAdmin || filterCentreId));
    return clubs;
  }, [clubs, isResponsableCentre, isAdmin, resolvedCentreId, selectedCentreForAdmin, filterCentreId]);

  const adminFilteredCentreIds = useMemo<Set<string> | null>(() => {
    if (!isAdmin) return null;
    if (filterCentreId) return new Set([filterCentreId]);
    if (filterGouvernorat) {
      const ids = new Set(
        allCentres.filter((c) => c.gouvernorat === filterGouvernorat).map((c) => c.id),
      );
      return ids.size > 0 ? ids : null;
    }
    return null;
  }, [isAdmin, filterCentreId, filterGouvernorat, allCentres]);

  const scopedEvents = useMemo(() => {
    if (isResponsableCentre && resolvedCentreId) {
      const clubIds = new Set(scopedClubs.map((c) => c.id));
      return events.filter((e) => {
        const related = [e.club_id, ...(e.collaborating_club_ids || [])].filter(Boolean) as string[];
        return related.some((id) => clubIds.has(id));
      });
    }
    if (isAdmin && adminFilteredCentreIds) {
      const localIds = new Set(
        locaux.filter((l) => {
          const cid = l.id_centre || l.centre?.id;
          return cid && adminFilteredCentreIds.has(cid);
        }).map((l) => l.id),
      );
      const clubIds = new Set(
        clubs.filter((c) => c.id_centre && adminFilteredCentreIds.has(c.id_centre)).map((c) => c.id),
      );
      return events.filter((e) => {
        if (e.locaux_id && localIds.has(e.locaux_id)) return true;
        const related = [e.club_id, ...(e.collaborating_club_ids || [])].filter(Boolean) as string[];
        return related.some((id) => clubIds.has(id));
      });
    }
    return events;
  }, [events, isResponsableCentre, isAdmin, resolvedCentreId, adminFilteredCentreIds, scopedClubs, locaux, clubs]);

  const visibleEvents = useMemo(() => {
    const filtered = scopedEvents.filter((event) => {
      if (eventFilter === "all") return true;
      const eventDate = event.date_event?.split("T")[0] ?? event.date_event;
      if (eventFilter === "upcoming") return eventDate >= today;
      return eventDate < today;
    });

    return [...filtered].sort((a, b) => {
      const dateCompare = b.date_event.localeCompare(a.date_event);
      if (dateCompare !== 0) return dateCompare;
      return b.start_time.localeCompare(a.start_time);
    });
  }, [scopedEvents, eventFilter, today]);

  const selectedClubContextId = form.club_id || form.club_ids[0] || "";
  const selectedClub = scopedClubs.find((c) => c.id === selectedClubContextId);

  const gouvernorats = useMemo(() => {
    if (isAdmin)
      return Array.from(new Set(allCentres.map((c) => c.gouvernorat).filter(Boolean))).sort();
    return Array.from(
      new Set(
        locaux
          .map((local) => local?.centre?.gouvernorat)
          .filter((g): g is string => Boolean(g)),
      ),
    );
  }, [locaux, allCentres, isAdmin]);

  const filterCentresByGouvernorat = useMemo(
    () => allCentres.filter((c) => !filterGouvernorat || c.gouvernorat === filterGouvernorat),
    [allCentres, filterGouvernorat],
  );

  const centresByGouvernorat = useMemo(() => {
    const map = new Map<string, { id: string; nom: string }>();
    locaux.forEach((local) => {
      const centreId = local.id_centre || local.centre?.id;
      const centreNom = local.centre?.nom;
      const gouv = local.centre?.gouvernorat;

      if (!centreId || !centreNom) return;
      if (selectedGouvernorat && gouv !== selectedGouvernorat) return;

      if (!map.has(centreId)) {
        map.set(centreId, { id: centreId, nom: centreNom });
      }
    });
    return Array.from(map.values());
  }, [locaux, selectedGouvernorat]);

  const filteredLocaux = useMemo(() => {
    if (isAdmin) {
      if (!selectedCentreForAdmin) return [];
      return locaux.filter(
        (local) => local.id_centre === selectedCentreForAdmin,
      );
    }

    if (isResponsableCentre && resolvedCentreId) {
      return locaux.filter((local) => local.id_centre === resolvedCentreId);
    }

    if (selectedClub?.id_centre) {
      return locaux.filter(
        (local) => local.id_centre === selectedClub.id_centre,
      );
    }

    return locaux;
  }, [
    isAdmin,
    isResponsableCentre,
    locaux,
    resolvedCentreId,
    selectedCentreForAdmin,
    selectedClub?.id_centre,
  ]);

  const showAlert = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 3500);
  };

  const loadBaseData = async () => {
    setIsLoading(true);
    try {
      if (isResponsableCentre) {
        try {
          const meRes = await api.get("/users/me/profile", { headers });
          const me = meRes.data;
          setResolvedCentreId(me?.centre?.id ?? me?.id_centre ?? "");
        } catch {
          setResolvedCentreId(user?.centre?.id ?? user?.id_centre ?? "");
        }
      }

      const requests: Promise<any>[] = [
        api.get(`/events?includeInactive=${showInactive}`, { headers }),
        api.get("/clubs", { headers }),
        api.get("/locaux", { headers }),
      ];
      if (isAdmin) requests.push(api.get("/centres", { headers }));

      const [eventsRes, clubsRes, locauxRes, centresRes] = await Promise.all(requests);

      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      setClubs(Array.isArray(clubsRes.data) ? clubsRes.data : []);
      setLocaux(Array.isArray(locauxRes.data) ? locauxRes.data : []);
      if (isAdmin && centresRes) {
        setAllCentres(
          (Array.isArray(centresRes.data) ? centresRes.data : []).map((c: any) => ({
            id: c.id,
            nom: c.nom,
            gouvernorat: c.gouvernorat ?? "",
          })),
        );
      }
    } catch {
      showAlert("Erreur lors du chargement des événements.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const navigate = useNavigate();

  const navigateToDetail = (eventId: string) => {
    navigate(
      isAdmin
        ? `/admin/events/${eventId}/detail`
        : `/centre/events/${eventId}/detail`,
    );
  };

  useEffect(() => {
    void loadBaseData();
  }, [showInactive]);

  useEffect(() => {
    if (!form.locaux_id) return;
    const stillValid = filteredLocaux.some((l) => l.id === form.locaux_id);
    if (!stillValid) {
      setForm((prev) => ({ ...prev, locaux_id: "" }));
    }
  }, [form.locaux_id, filteredLocaux]);

  useEffect(() => {
    if (!isAdmin || !selectedClubContextId) return;
    const club = clubs.find((c) => c.id === selectedClubContextId);
    if (!club?.id_centre) return;

    const matchedLocal = locaux.find((l) => l.id_centre === club.id_centre);
    const inferredGouv = matchedLocal?.centre?.gouvernorat ?? "";

    if (inferredGouv) {
      setSelectedGouvernorat(inferredGouv);
    }
    setSelectedCentreForAdmin(club.id_centre);
  }, [isAdmin, selectedClubContextId, clubs, locaux]);

  useEffect(() => {
    if (!isAdmin || !selectedCentreForAdmin) return;
    const stillExists = centresByGouvernorat.some(
      (centre) => centre.id === selectedCentreForAdmin,
    );
    if (!stillExists) {
      setSelectedCentreForAdmin("");
      setForm((prev) => ({ ...prev, locaux_id: "" }));
    }
  }, [isAdmin, selectedCentreForAdmin, centresByGouvernorat]);

  const resetForm = () => {
    setForm(getEmptyForm());
    setSelectedGouvernorat("");
    setSelectedCentreForAdmin("");
    setEditingEvent(null);
    setFormAlert(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (event: EventItem) => {
    const timeline = Array.isArray(event.timeline)
      ? event.timeline.map((step) => ({
          title: step.title ?? "",
          start_time: step.start_time ?? "",
          end_time: step.end_time ?? "",
          details: step.details ?? "",
        }))
      : [];

    setEditingEvent(event);
    setForm({
      nom: event.nom,
      description: event.description ?? "",
      date_event: event.date_event.split("T")[0],
      start_time: toTimeHHMM(event.start_time),
      end_time: toTimeHHMM(event.end_time),
      club_id: event.club_id ?? "",
      club_ids: event.collaborating_club_ids ?? [],
      locaux_id: event.locaux_id,
      capacity: event.capacity ? String(event.capacity) : "",
      timeline,
    });
    setFormAlert(null);
    setIsModalOpen(true);

    if (isAdmin) {
      const local = locaux.find((l) => l.id === event.locaux_id);
      setSelectedCentreForAdmin(local?.id_centre || "");
      setSelectedGouvernorat(local?.centre?.gouvernorat || "");
    }
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
      const availabilityResponse = await api.get("/events/availability/check", {
        headers,
        params: {
          id_local: form.locaux_id,
          date: form.date_event,
          start: form.start_time,
          end: form.end_time,
          excludeEventId: editingEvent?.id,
        },
      });

      if (!availabilityResponse.data?.available) {
        setFormAlert({
          msg: "Conflit de planning: le local n'est pas disponible sur ce créneau.",
          type: "error",
        });
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
      };

      if (form.club_id) {
        payload.club_id = form.club_id;
      }

      const collaboratingClubIds = form.club_ids.filter(
        (clubId) => clubId !== form.club_id,
      );
      if (collaboratingClubIds.length > 0) {
        payload.club_ids = collaboratingClubIds;
      }

      if (form.capacity.trim() !== "") {
        payload.capacity = Number(form.capacity);
      }

      // recurrence removed; single occurrence only

      payload.timeline = form.timeline.map((step) => ({
        title: step.title.trim(),
        start_time: step.start_time,
        end_time: step.end_time,
        details: step.details?.trim() || undefined,
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
      await loadBaseData();
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const detailedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(" | ")
        : apiMessage;

      setFormAlert({
        msg:
          detailedMessage || "Action impossible. Vérifiez les données saisies.",
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
    } catch {
      showAlert("Impossible de modifier le statut.", "error");
    }
  };

  const openCancelConfirmation = (event: EventItem) => {
    setCancelTarget(event);
  };

  const closeCancelConfirmation = () => {
    if (isSaving) return;
    setCancelTarget(null);
  };

  const confirmCancelEvent = async () => {
    if (!cancelTarget) return;
    setIsSaving(true);
    try {
      await api.patch(`/events/${cancelTarget.id}/cancel`, {}, { headers });
      showAlert("Événement annulé et notifications envoyées.", "success");
      await loadBaseData();
      setCancelTarget(null);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const detailedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(" | ")
        : apiMessage;
      showAlert(
        detailedMessage || "Impossible d'annuler l'événement.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openPresence = async (event: EventItem) => {
    setPresenceEvent(event);
    setPresenceParticipants([]);
    setIsPresenceLoading(true);
    try {
      const response = await api.get(`/events/${event.id}/participants`, {
        headers,
      });
      const all = Array.isArray(response.data?.all) ? response.data.all : [];
      setPresenceParticipants(all);
    } catch {
      showAlert("Impossible de charger les présences.", "error");
      setPresenceEvent(null);
    } finally {
      setIsPresenceLoading(false);
    }
  };

  const togglePresence = async (participantId: string, checkin: boolean) => {
    if (!presenceEvent) return;
    setIsPresenceUpdating(true);
    try {
      await api.patch(
        `/events/${presenceEvent.id}/participants/${participantId}/checkin`,
        { checkin },
        { headers },
      );

      const response = await api.get(
        `/events/${presenceEvent.id}/participants`,
        {
          headers,
        },
      );
      const all = Array.isArray(response.data?.all) ? response.data.all : [];
      setPresenceParticipants(all);
      showAlert("Présence mise à jour.", "success");
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const detailedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(" | ")
        : apiMessage;
      showAlert(detailedMessage || "Mise à jour présence impossible.", "error");
    } finally {
      setIsPresenceUpdating(false);
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

      {(isAdmin || isResponsableCentre) && (
        <div className="flex justify-end">
          <Link
            to={isAdmin ? ROUTES.admin.eventsStats : ROUTES.centre.eventsStats}
            className="inline-flex items-center gap-2 rounded-2xl bg-smart-teal px-5 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-white hover:bg-black transition"
          >
            Voir les statistiques
          </Link>
        </div>
      )}

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3 rounded-[28px] border border-gray-100 bg-white shadow-sm p-4">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 shrink-0">
            Filtrer par
          </span>
          <select
            value={filterGouvernorat}
            onChange={(e) => { setFilterGouvernorat(e.target.value); setFilterCentreId(""); }}
            className="rounded-xl border border-gray-200 bg-[#F7F3E9] px-3 py-2 text-xs font-bold text-smart-teal outline-none focus:ring-2 focus:ring-smart-teal/20 cursor-pointer"
          >
            <option value="">Tous les gouvernorats</option>
            {gouvernorats.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            value={filterCentreId}
            onChange={(e) => setFilterCentreId(e.target.value)}
            className="rounded-xl border border-gray-200 bg-[#F7F3E9] px-3 py-2 text-xs font-bold text-smart-teal outline-none focus:ring-2 focus:ring-smart-teal/20 cursor-pointer"
          >
            <option value="">Tous les centres</option>
            {filterCentresByGouvernorat.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
          {(filterGouvernorat || filterCentreId) && (
            <>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-smart-teal">
                {scopedEvents.length} événement{scopedEvents.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => { setFilterGouvernorat(""); setFilterCentreId(""); }}
                className="ml-auto px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-black text-gray-500 hover:bg-gray-200 transition"
              >
                Réinitialiser
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-[28px] border border-gray-100 bg-white shadow-sm p-4">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mr-2">
          Filtrer les événements
        </span>
        {(
          [
            ["upcoming", "À venir"],
            ["past", "Passés"],
            ["all", "Tous"],
          ] as const
        ).map(([value, label]) => (
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
        ))}
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
        isAdmin={isAdmin}
        form={form}
        clubs={scopedClubs}
        filteredLocaux={filteredLocaux}
        gouvernorats={gouvernorats}
        centresByGouvernorat={centresByGouvernorat}
        selectedGouvernorat={selectedGouvernorat}
        selectedCentreForAdmin={selectedCentreForAdmin}
        today={today}
        formAlert={formAlert}
        isSaving={isSaving}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={submitForm}
        onChangeGouvernorat={(value) => {
          setSelectedGouvernorat(value);
          setSelectedCentreForAdmin("");
          setForm((prev) => ({ ...prev, locaux_id: "" }));
        }}
        onChangeCentreForAdmin={(value) => {
          setSelectedCentreForAdmin(value);
          setForm((prev) => ({ ...prev, locaux_id: "" }));
        }}
        onChangeForm={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
      />

      <EventPresenceModal
        isOpen={Boolean(presenceEvent)}
        eventName={presenceEvent?.nom ?? ""}
        eventStartTime={presenceEvent?.start_time ?? ""}
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
              participants recevront une notification d'annulation.
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
