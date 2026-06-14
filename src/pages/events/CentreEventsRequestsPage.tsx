/**
 * CentreEventsRequestsPage.tsx — Validation des demandes d'événements par le centre.
 *
 * RÔLE :
 *   Interface d'approbation/refus des demandes d'événements soumises par les clubs.
 *   Accessible via /centre/centre-events-requests.
 *
 * FONCTIONNALITÉS :
 *   - Liste des demandes EN_ATTENTE dans le périmètre du centre
 *   - Bouton Approuver → événement passe en statut APPROUVE
 *   - Bouton Refuser + message de refus optionnel
 *   - Filtres par statut, club, période
 *
 * ACCÈS : RESPONSABLE_CENTRE uniquement
 */
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  MapPin,
  RefreshCcw,
} from "lucide-react";
import api from "../../api/axios";
import EventFormModal from "./components/EventFormModal";
import type { AlertState, ClubLite, EventForm, LocalLite } from "./types";
import {
  formatDateOnly,
  getEmptyForm,
  getTodayDate,
  validateEventForm,
} from "./utils";

type RequestTab = "pending" | "approved" | "refused" | "all";

type RequestItem = {
  id: string;
  nom: string;
  description?: string | null;
  date_event: string;
  start_time: string;
  end_time: string;
  capacity?: number | null;
  timeline?: any[] | null;
  status: "PENDING" | "APPROVED" | "REFUSED" | string;
  club_id?: string | null;
  collaborating_club_ids?: string[];
  locaux_id: string;
  club?: { id: string; nom: string; categorie?: string } | null;
  local?: { id: string; nom: string; type?: string } | null;
};

type UserProfile = {
  id?: string;
  nom?: string;
  prenom?: string;
  role?: string;
  centre?: { id?: string };
  id_centre?: string;
};

function normalizeRequestStatus(event: RequestItem) {
  if (event.status === "PENDING") return "PENDING";
  if (event.status === "REFUSED") return "REFUSED";
  if (event.status === "APPROVED") return "APPROVED";
  return "PENDING";
}

function requestBadgeClasses(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-[#D9E8D1] text-[#436D75] border-[#436D75]/20";
    case "REFUSED":
      return "bg-[#FDE5E1] text-[#B23A2B] border-[#E98A7D]/40";
    default:
      return "bg-[#EEF4F5] text-[#244047] border-[#D8E5E8]";
  }
}

function requestBadgeLabel(status: string) {
  switch (status) {
    case "APPROVED":
      return "Événement officiel";
    case "REFUSED":
      return "Refusé";
    default:
      return "En attente";
  }
}

function formatTimeRange(event: RequestItem) {
  const date = formatDateOnly(event.date_event);
  const start = new Date(event.start_time).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = new Date(event.end_time).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${start} - ${end}`;
}

function mapRequestToEventItem(request: any): RequestItem {
  return {
    id: request.id,
    nom: request.nom,
    description: request.description ?? null,
    date_event: request.date_event,
    start_time: request.start_time,
    end_time: request.end_time,
    capacity: request.capacity ?? null,
    timeline: request.timeline ?? null,
    status: request.status,
    club_id: request.club_id ?? null,
    collaborating_club_ids: Array.isArray(request.collaborating_club_ids)
      ? request.collaborating_club_ids
      : [],
    locaux_id: request.locaux_id,
    club: request.club
      ? { id: request.club.id, nom: request.club.nom, categorie: undefined }
      : null,
    local: request.local
      ? { id: request.local.id, nom: request.local.nom, type: undefined }
      : undefined,
  };
}

export default function CentreEventsRequestsPage() {
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [user, setUser] = useState<UserProfile | null>(null);
  const [centreId, setCentreId] = useState<string>("");
  const [clubs, setClubs] = useState<ClubLite[]>([]);
  const [events, setEvents] = useState<RequestItem[]>([]);
  const [locaux, setLocaux] = useState<LocalLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(getEmptyForm());
  const [tab, setTab] = useState<RequestTab>("pending");
  const [eventsFilter, setEventsFilter] = useState<"upcoming" | "past" | "all">(
    "upcoming",
  );
  const [sortOption, setSortOption] = useState<"upcomingFirst" | "recentFirst">(
    "upcomingFirst",
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [notification, setNotification] = useState<AlertState>(null);
  const [formAlert, setFormAlert] = useState<AlertState>(null);

  const today = getTodayDate();

  const centreClubs = useMemo(
    () => clubs.filter((club) => club.id_centre === centreId),
    [clubs, centreId],
  );
  const centreLocaux = useMemo(
    () => locaux.filter((local) => local.id_centre === centreId),
    [locaux, centreId],
  );

  const primaryClubId =
    form.club_id || form.club_ids[0] || centreClubs[0]?.id || "";
  const primaryClub =
    centreClubs.find((club) => club.id === primaryClubId) ?? null;
  const formCentreId = primaryClub?.id_centre ?? centreId;

  const filteredLocaux = useMemo(() => {
    if (!formCentreId) return centreLocaux;
    return centreLocaux.filter((local) => local.id_centre === formCentreId);
  }, [centreLocaux, formCentreId]);

  const centreEvents = useMemo(() => {
    if (!centreId) return [];
    return events.filter((event) => {
      const local = centreLocaux.find((item) => item.id === event.locaux_id);
      return local?.id_centre === centreId;
    });
  }, [centreId, centreLocaux, events]);

  const filteredEvents = useMemo(() => {
    let list = centreEvents.filter((event) => {
      const status = normalizeRequestStatus(event);
      if (tab === "all") return true;
      if (tab === "pending") return status === "PENDING";
      if (tab === "approved") return status === "APPROVED";
      return status === "REFUSED";
    });

    // filter by upcoming / past
    const todayIso = today; // YYYY-MM-DD from utils
    if (eventsFilter === "upcoming") {
      list = list.filter((e) => e.date_event >= todayIso);
    } else if (eventsFilter === "past") {
      list = list.filter((e) => e.date_event < todayIso);
    }

    // sort
    list.sort((a, b) => {
      if (sortOption === "upcomingFirst") {
        // nearest upcoming first -> ascending by date_event then start_time
        if (a.date_event !== b.date_event)
          return a.date_event.localeCompare(b.date_event);
        return a.start_time.localeCompare(b.start_time);
      }
      // recentFirst: newest date on top
      if (a.date_event !== b.date_event)
        return b.date_event.localeCompare(a.date_event);
      return b.start_time.localeCompare(a.start_time);
    });

    return list;
  }, [centreEvents, tab, eventsFilter, sortOption, today]);

  const counts = useMemo(() => {
    const tally = { pending: 0, approved: 0, refused: 0 };
    centreEvents.forEach((event) => {
      const status = normalizeRequestStatus(event);
      if (status === "APPROVED") tally.approved += 1;
      else if (status === "REFUSED") tally.refused += 1;
      else tally.pending += 1;
    });
    return tally;
  }, [centreEvents]);

  const showToast = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, clubsRes, eventsRes, locauxRes] = await Promise.all([
        api.get("/users/me/profile", { headers }),
        api.get("/clubs/my-centre", { headers }),
        api.get("/event-request-creations/me", { headers }),
        api.get("/locaux", { headers }),
      ]);

      const profile = profileRes.data as UserProfile;
      const centrePayload = clubsRes.data as {
        centre?: { id?: string } | null;
        clubs?: ClubLite[];
      };
      const resolvedCentreId =
        centrePayload?.centre?.id ??
        profile?.centre?.id ??
        profile?.id_centre ??
        user?.centre?.id ??
        user?.id_centre ??
        "";

      setUser(profile);
      setCentreId(resolvedCentreId);
      setClubs(Array.isArray(centrePayload?.clubs) ? centrePayload.clubs! : []);
      setEvents(
        Array.isArray(eventsRes.data)
          ? (eventsRes.data as any[]).map(mapRequestToEventItem)
          : [],
      );
      setLocaux(
        Array.isArray(locauxRes.data) ? (locauxRes.data as LocalLite[]) : [],
      );

      if (!form.club_id && resolvedCentreId) {
        const firstClub = Array.isArray(centrePayload?.clubs)
          ? centrePayload.clubs!.find(
              (club) => club.id_centre === resolvedCentreId,
            )
          : null;
        if (firstClub) {
          setForm((prev) => ({
            ...prev,
            club_id: firstClub.id,
            club_ids: prev.club_ids.filter((clubId) => clubId !== firstClub.id),
            locaux_id: "",
          }));
        }
      }
    } catch {
      showToast("Impossible de charger les demandes du centre.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!form.locaux_id) return;
    const stillValid = filteredLocaux.some(
      (local) => local.id === form.locaux_id,
    );
    if (!stillValid) {
      setForm((prev) => ({ ...prev, locaux_id: "" }));
    }
  }, [filteredLocaux, form.locaux_id]);

  useEffect(() => {
    if (centreClubs.length === 0) return;
    const stillValid = centreClubs.some((club) => club.id === form.club_id);
    if (!stillValid && form.club_id) {
      const firstClub = centreClubs[0];
      setForm((prev) => ({
        ...prev,
        club_id: firstClub.id,
        club_ids: prev.club_ids.filter((clubId) => clubId !== firstClub.id),
        locaux_id: "",
      }));
    }
  }, [centreClubs, form.club_id]);

  const resetForm = () => {
    setForm(getEmptyForm());
    setFormAlert(null);
  };

  const openCreateModal = () => {
    const firstClubId = centreClubs[0]?.id ?? "";
    setForm({
      ...getEmptyForm(),
      club_id: firstClubId,
      club_ids: [],
    });
    setFormAlert(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    resetForm();
  };

  const submitForm = async () => {
    const validationMessage = validateEventForm(form, today);
    if (validationMessage) {
      setFormAlert({ msg: validationMessage, type: "error" });
      return;
    }

    setIsSaving(true);
    setFormAlert(null);

    try {
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

      payload.timeline = form.timeline.map((step) => ({
        title: step.title.trim(),
        start_time: step.start_time,
        end_time: step.end_time,
        details: step.details?.trim() || undefined,
      }));

      await api.post("/events", payload, { headers });
      showToast("Événement enregistré.", "success");
      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const detailedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(" | ")
        : apiMessage;
      setFormAlert({
        msg: detailedMessage || "Impossible d'enregistrer l'événement.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resolveRequestAction = async (
    eventId: string,
    action: "approve" | "refuse",
  ) => {
    setIsSaving(true);
    try {
      if (action === "approve") {
        await api.patch(
          `/event-request-creations/${eventId}/approve`,
          {},
          { headers },
        );
        showToast("Demande approuvée.", "success");
      } else {
        await api.patch(
          `/event-request-creations/${eventId}/refuse`,
          {},
          { headers },
        );
        showToast("Demande refusée.", "success");
      }
      await loadData();
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const detailedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(" | ")
        : apiMessage;
      showToast(
        detailedMessage || "Action impossible sur cette demande.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClubContext = centreClubs.find(
    (club) => club.id === primaryClubId,
  );

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto animate-in fade-in duration-500">
      {notification && (
        <div
          className={`fixed top-8 right-8 z-[1000] rounded-[24px] px-5 py-4 shadow-2xl border border-white/20 backdrop-blur-md ${
            notification.type === "error"
              ? "bg-[#E98A7D] text-white"
              : "bg-[#D9E8D1] text-[#436D75]"
          }`}
        >
          <p className="font-black uppercase tracking-[0.18em] text-[11px]">
            {notification.msg}
          </p>
        </div>
      )}

      <section className="rounded-[34px] border border-[#D8E5E8] bg-gradient-to-br from-[#23444C] via-[#2F5A63] to-[#436D75] p-7 md:p-9 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-[#D9E8D1]">
              Espace Responsable Centre
            </p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Validation des événements
            </h1>
            <p className="text-sm md:text-base text-[#E2EEF1] leading-7 max-w-2xl">
              Créez toujours vos événements depuis ce même espace, puis traitez
              les demandes déposées par les responsables club avant leur passage
              en événement officiel.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-[#244047] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] hover:bg-[#F3F7F8] transition"
          >
            <CalendarDays size={16} /> Créer un événement
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[30px] border border-gray-100 bg-white shadow-sm p-8">
          <p className="text-sm text-gray-500 font-semibold">Chargement...</p>
        </div>
      ) : !centreId ? (
        <div className="rounded-[30px] border border-[#F2D1CC] bg-[#FFF5F3] p-6 flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#B23A2B] mt-0.5" />
          <p className="text-sm font-bold text-[#B23A2B]">
            Aucun centre n'est associé à votre compte.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="En attente" value={counts.pending} tone="pending" />
            <StatCard label="Validées"   value={counts.approved} tone="approved" />
            <StatCard label="Refusées"   value={counts.refused}  tone="refused" />
          </div>

          <section className="rounded-[30px] border border-gray-100 bg-white shadow-sm p-5 md:p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#1A1C1E]">
                  Demandes à traiter
                </h2>
                <p className="text-xs text-gray-400 uppercase tracking-[0.2em] font-bold mt-1">
                  Confirmez ou refusez les demandes de création
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["pending", `En attente (${counts.pending})`],
                    ["approved", `Validées (${counts.approved})`],
                    ["refused", `Refusées (${counts.refused})`],
                    ["all", "Toutes"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setTab(value)}
                    className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                      tab === value
                        ? "bg-[#436D75] text-white"
                        : "bg-[#F7FBFC] text-[#244047]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500 mr-2">Filtrer :</div>
                {(
                  [
                    ["upcoming", "À venir"],
                    ["past", "Passés"],
                    ["all", "Tous"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setEventsFilter(val as any)}
                    className={`rounded-xl px-2 py-1 text-xs font-black transition ${
                      eventsFilter === val
                        ? "bg-[#436D75] text-white"
                        : "bg-[#F7FBFC] text-[#244047]"
                    }`}
                  >
                    {label}
                  </button>
                ))}

                <div className="w-px h-6 bg-gray-100 mx-2" />
                <div className="text-xs text-gray-500 mr-2">Trier :</div>
                <button
                  onClick={() => setSortOption("upcomingFirst")}
                  className={`rounded-xl px-2 py-1 text-xs font-black transition ${
                    sortOption === "upcomingFirst"
                      ? "bg-[#436D75] text-white"
                      : "bg-[#F7FBFC] text-[#244047]"
                  }`}
                >
                  À venir d'abord
                </button>
                <button
                  onClick={() => setSortOption("recentFirst")}
                  className={`rounded-xl px-2 py-1 text-xs font-black transition ${
                    sortOption === "recentFirst"
                      ? "bg-[#436D75] text-white"
                      : "bg-[#F7FBFC] text-[#244047]"
                  }`}
                >
                  Récents
                </button>
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-gray-200 bg-[#FAFBFC] p-6 text-sm text-gray-500 font-semibold">
                Aucune demande à afficher pour ce filtre.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEventId && (
                  <div className="sticky top-4 z-20 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-gray-400">
                          Sélection
                        </p>
                        <p className="mt-1 text-sm font-black text-[#244047]">
                          {
                            filteredEvents.find((e) => e.id === selectedEventId)
                              ?.nom
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {normalizeRequestStatus(
                          filteredEvents.find((e) => e.id === selectedEventId)!,
                        ) === "PENDING" && (
                          <>
                            <button
                              onClick={() =>
                                void resolveRequestAction(
                                  selectedEventId!,
                                  "approve",
                                )
                              }
                              disabled={isSaving}
                              className="rounded-xl bg-[#436D75] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() =>
                                void resolveRequestAction(
                                  selectedEventId!,
                                  "refuse",
                                )
                              }
                              disabled={isSaving}
                              className="rounded-xl border border-[#E98A7D]/40 bg-[#FDE5E1] px-3 py-2 text-xs font-black text-[#B23A2B] disabled:opacity-60"
                            >
                              Refuser
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedEventId(null)}
                          className="rounded-xl px-3 py-2 text-xs font-black bg-[#F7FBFC] text-[#244047]"
                        >
                          Désélectionner
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {filteredEvents.map((event) => {
                  const status = normalizeRequestStatus(event);
                  const collaborators = (event.collaborating_club_ids || [])
                    .map(
                      (clubId) => clubs.find((club) => club.id === clubId)?.nom,
                    )
                    .filter(Boolean);

                  const isSelected = selectedEventId === event.id;

                  return (
                    <article
                      key={event.id}
                      onClick={() => setSelectedEventId(event.id)}
                      className={`rounded-[26px] border p-4 md:p-5 shadow-sm transition ${isSelected ? "border-[#436D75] bg-[#EAF2F4]" : "border-gray-100 bg-[#FAFBFC] hover:bg-gray-50"}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${requestBadgeClasses(status)}`}
                            >
                              {requestBadgeLabel(status)}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
                              {event.status === "APPROVED"
                                ? "Actif"
                                : "Inactif"}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-lg font-black text-[#1A1C1E]">
                              {event.nom}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 leading-6">
                              {event.description || "Aucune description."}
                            </p>
                          </div>

                          {Array.isArray(event.timeline) &&
                            event.timeline.length > 0 && (
                              <div className="mt-2">
                                <p className="text-[11px] uppercase tracking-[0.18em] font-black text-gray-400">
                                  Timeline
                                </p>
                                <ul className="mt-2 text-sm text-gray-700 space-y-1">
                                  {(event.timeline as any[]).map((step, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-3"
                                    >
                                      <span className="font-mono text-xs text-gray-500 w-[80px]">
                                        {step.start_time || "--:--"} -{" "}
                                        {step.end_time || "--:--"}
                                      </span>
                                      <span className="font-medium">
                                        {step.title || "(Sans titre)"}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500">
                            <span className="inline-flex items-center gap-2">
                              <CalendarDays size={14} />{" "}
                              {formatTimeRange(event)}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <MapPin size={14} />
                              {event.local?.nom || event.locaux_id}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Clock3 size={14} />
                              Capacité {event.capacity ?? "—"}
                            </span>
                          </div>
                        </div>

                        <div className="min-w-[240px] rounded-2xl bg-white border border-gray-200 p-4 space-y-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] font-black text-gray-400">
                              Club principal
                            </p>
                            <p className="mt-1 text-sm font-black text-[#244047]">
                              {event.club?.nom || "Sans club principal"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] font-black text-gray-400">
                              Clubs collaborateurs
                            </p>
                            <p className="mt-1 text-sm text-[#244047]">
                              {collaborators.length > 0
                                ? collaborators.join(", ")
                                : "Aucun"}
                            </p>
                          </div>

                          {status === "PENDING" && (
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void resolveRequestAction(
                                    event.id,
                                    "approve",
                                  );
                                }}
                                disabled={isSaving}
                                className="flex-1 rounded-xl bg-[#436D75] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                              >
                                Confirmer
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void resolveRequestAction(event.id, "refuse");
                                }}
                                disabled={isSaving}
                                className="flex-1 rounded-xl border border-[#E98A7D]/40 bg-[#FDE5E1] px-3 py-2 text-xs font-black text-[#B23A2B] disabled:opacity-60"
                              >
                                Refuser
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {isModalOpen && (
        <EventFormModal
          isOpen={isModalOpen}
          editingEvent={null}
          isAdmin={false}
          form={form}
          clubs={centreClubs}
          filteredLocaux={filteredLocaux}
          gouvernorats={[]}
          centresByGouvernorat={[]}
          selectedGouvernorat=""
          selectedCentreForAdmin=""
          today={today}
          formAlert={formAlert}
          isSaving={isSaving}
          onClose={closeModal}
          onSubmit={submitForm}
          onChangeGouvernorat={() => undefined}
          onChangeCentreForAdmin={() => undefined}
          onChangeForm={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        />
      )}
    </div>
  );
}

type StatTone = "pending" | "approved" | "refused";

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: StatTone;
}) {
  const toneClasses = {
    pending: "bg-[#EEF4F5] text-[#244047]",
    approved: "bg-[#D9E8D1] text-[#436D75]",
    refused: "bg-[#FDE5E1] text-[#B23A2B]",
  }[tone];

  return (
    <div className={`rounded-[24px] border border-gray-100 p-4 ${toneClasses}`}>
      <p className="text-[10px] uppercase tracking-[0.22em] font-black opacity-80">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
