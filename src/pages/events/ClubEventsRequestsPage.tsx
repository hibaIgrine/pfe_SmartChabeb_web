/**
 * ClubEventsRequestsPage.tsx — Suivi des demandes d'événement du club.
 *
 * RÔLE :
 *   Page du RESPONSABLE_CLUB pour voir l'état de ses demandes d'événements
 *   soumises au centre pour validation. Accessible via /club-events-requests.
 *
 * STATUTS VISIBLES :
 *   EN_ATTENTE (horloge orange), APPROUVE (vert), REFUSE (rouge)
 *   Pour chaque demande : titre, dates, capacité demandée, commentaire de refus (si applicable)
 *
 * ACCÈS : RESPONSABLE_CLUB uniquement
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

export default function ClubEventsRequestsPage() {
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [user, setUser] = useState<UserProfile | null>(null);
  const [managedClubs, setManagedClubs] = useState<ClubLite[]>([]);
  const [centreClubs, setCentreClubs] = useState<ClubLite[]>([]);
  const [events, setEvents] = useState<RequestItem[]>([]);
  const [locaux, setLocaux] = useState<LocalLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(getEmptyForm());
  const [tab, setTab] = useState<RequestTab>("pending");
  const [notification, setNotification] = useState<AlertState>(null);
  const [formAlert, setFormAlert] = useState<AlertState>(null);

  const today = getTodayDate();

  const managedClubIds = useMemo(
    () => new Set(managedClubs.map((club) => club.id)),
    [managedClubs],
  );

  const primaryClubId =
    form.club_id || form.club_ids[0] || managedClubs[0]?.id || "";
  const primaryClub =
    managedClubs.find((club) => club.id === primaryClubId) ?? null;
  const activeCentreId =
    primaryClub?.id_centre ??
    managedClubs[0]?.id_centre ??
    user?.centre?.id ??
    user?.id_centre ??
    "";

  const scopedLocaux = useMemo(() => {
    if (!activeCentreId) return locaux;
    return locaux.filter((local) => local.id_centre === activeCentreId);
  }, [activeCentreId, locaux]);

  const scopedEvents = useMemo(() => {
    if (managedClubs.length === 0) return [];
    return events.filter((event) => {
      const relatedClubIds = [
        event.club_id,
        ...(event.collaborating_club_ids || []),
      ].filter(Boolean) as string[];

      return relatedClubIds.some((clubId) => managedClubIds.has(clubId));
    });
  }, [events, managedClubIds, managedClubs.length]);

  const filteredEvents = useMemo(() => {
    return scopedEvents.filter((event) => {
      const status = normalizeRequestStatus(event);
      if (tab === "all") return true;
      if (tab === "pending") return status === "PENDING";
      if (tab === "approved") return status === "APPROVED";
      return status === "REFUSED";
    });
  }, [scopedEvents, tab]);

  const counts = useMemo(() => {
    const tally = { pending: 0, approved: 0, refused: 0 };
    scopedEvents.forEach((event) => {
      const status = normalizeRequestStatus(event);
      if (status === "APPROVED") tally.approved += 1;
      else if (status === "REFUSED") tally.refused += 1;
      else tally.pending += 1;
    });
    return tally;
  }, [scopedEvents]);

  const showToast = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        profileRes,
        managedClubsRes,
        centreClubsRes,
        eventsRes,
        locauxRes,
      ] = await Promise.all([
        api.get("/users/me/profile", { headers }),
        api.get("/presences/my-clubs", { headers }),
        api.get("/clubs/my-centre", { headers }),
        api.get("/event-request-creations/me", { headers }),
        api.get("/locaux", { headers }),
      ]);

      const profile = profileRes.data as UserProfile;
      const profileClubs = Array.isArray(profileRes.data?.clubs_diriges)
        ? (profileRes.data.clubs_diriges as ClubLite[])
        : [];
      const managedClubs = Array.isArray(managedClubsRes.data)
        ? (managedClubsRes.data as ClubLite[])
        : [];
      const centrePayload = centreClubsRes.data as {
        clubs?: ClubLite[];
      } | null;
      const centreClubsList = Array.isArray(centrePayload?.clubs)
        ? centrePayload!.clubs!
        : [];
      const clubs = managedClubs.length > 0 ? managedClubs : profileClubs;
      const allEvents = Array.isArray(eventsRes.data)
        ? (eventsRes.data as any[]).map(mapRequestToEventItem)
        : [];
      const allLocaux = Array.isArray(locauxRes.data)
        ? (locauxRes.data as LocalLite[])
        : [];

      setUser(profile);
      setManagedClubs(clubs);
      setCentreClubs(centreClubsList);
      setEvents(allEvents);
      setLocaux(allLocaux);

      if (!form.club_id && clubs.length > 0) {
        setForm((prev) => ({
          ...prev,
          club_id: clubs[0].id,
          club_ids: prev.club_ids.filter((clubId) => clubId !== clubs[0].id),
          locaux_id: "",
        }));
      }
    } catch {
      showToast("Impossible de charger les demandes d'événements.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!form.locaux_id) return;
    const stillValid = scopedLocaux.some(
      (local) => local.id === form.locaux_id,
    );
    if (!stillValid) {
      setForm((prev) => ({ ...prev, locaux_id: "" }));
    }
  }, [form.locaux_id, scopedLocaux]);

  useEffect(() => {
    if (managedClubs.length === 0) return;
    const stillValid = managedClubs.some((club) => club.id === form.club_id);
    if (!stillValid && form.club_id) {
      setForm((prev) => ({
        ...prev,
        club_id: managedClubs[0].id,
        club_ids: prev.club_ids.filter(
          (clubId) => clubId !== managedClubs[0].id,
        ),
        locaux_id: "",
      }));
    }
  }, [form.club_id, managedClubs]);

  const resetForm = () => {
    setForm(getEmptyForm());
    setFormAlert(null);
  };

  const openCreateModal = () => {
    const firstClubId = managedClubs[0]?.id ?? "";
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

    if (!form.club_id) {
      setFormAlert({
        msg: "Sélectionnez votre club principal avant d'envoyer la demande.",
        type: "error",
      });
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
        club_id: form.club_id,
      };

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

      await api.post("/event-request-creations", payload, { headers });
      showToast("Demande d'événement envoyée.", "success");
      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const detailedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(" | ")
        : apiMessage;
      setFormAlert({
        msg: detailedMessage || "Impossible d'envoyer la demande.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClubContext = managedClubs.find(
    (club) => club.id === primaryClubId,
  );
  const filteredLocaux = scopedLocaux.length > 0 ? scopedLocaux : locaux;

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
              Espace Responsable Club
            </p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Demandes d'événements
            </h1>
            <p className="text-sm md:text-base text-[#E2EEF1] leading-7 max-w-2xl">
              Créez une demande à partir du formulaire événement, puis suivez
              son état jusqu'à validation par le responsable centre.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            disabled={managedClubs.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-[#244047] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] hover:bg-[#F3F7F8] transition disabled:opacity-60"
          >
            <CalendarDays size={16} /> Nouvelle demande
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[30px] border border-gray-100 bg-white shadow-sm p-8">
          <p className="text-sm text-gray-500 font-semibold">Chargement...</p>
        </div>
      ) : managedClubs.length === 0 ? (
        <div className="rounded-[30px] border border-[#F2D1CC] bg-[#FFF5F3] p-6 flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#B23A2B] mt-0.5" />
          <p className="text-sm font-bold text-[#B23A2B]">
            Aucun club ne vous est rattaché. Vous ne pouvez pas déposer de
            demande d'événement.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
          <section className="rounded-[30px] border border-gray-100 bg-white shadow-sm p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#1A1C1E]">Mes clubs</h2>
                <p className="text-xs text-gray-400 uppercase tracking-[0.2em] font-bold mt-1">
                  {managedClubs.length} club(s) géré(s)
                </p>
              </div>
              <button
                onClick={() => void loadData()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F7FBFC] px-3 py-2 text-xs font-black text-[#244047]"
              >
                <RefreshCcw size={14} /> Actualiser
              </button>
            </div>

            <div className="grid gap-3">
              {managedClubs.map((club) => {
                const active = club.id === primaryClubId;
                return (
                  <button
                    key={club.id}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        club_id: club.id,
                        club_ids: prev.club_ids.filter((id) => id !== club.id),
                        locaux_id: "",
                      }))
                    }
                    className={`text-left rounded-2xl border p-4 transition ${
                      active
                        ? "border-[#436D75] bg-[#EAF2F4]"
                        : "border-gray-100 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-sm font-black text-[#244047]">
                      {club.nom}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {club.id_centre
                        ? "Club principal sélectionné"
                        : "Club lié à votre compte"}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-[24px] border border-[#D8E5E8] bg-[#F7FBFC] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] font-black text-gray-500">
                Centre du club actif
              </p>
              <p className="mt-2 text-sm font-bold text-[#244047]">
                {selectedClubContext ? "Centre associé" : "Non défini"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="En attente"
                value={counts.pending}
                tone="pending"
              />
              <StatCard
                label="Validées"
                value={counts.approved}
                tone="approved"
              />
              <StatCard
                label="Refusées"
                value={counts.refused}
                tone="refused"
              />
            </div>
          </section>

          <section className="rounded-[30px] border border-gray-100 bg-white shadow-sm p-5 md:p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#1A1C1E]">
                  Demandes d'événements
                </h2>
                <p className="text-xs text-gray-400 uppercase tracking-[0.2em] font-bold mt-1">
                  Suivez l'état de vos demandes
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
            </div>

            {filteredEvents.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-gray-200 bg-[#FAFBFC] p-6 text-sm text-gray-500 font-semibold">
                Aucune demande à afficher pour ce filtre.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => {
                  const status = normalizeRequestStatus(event);
                  const collaborators = (event.collaborating_club_ids || [])
                    .map(
                      (clubId) =>
                        managedClubs.find((club) => club.id === clubId)?.nom,
                    )
                    .filter(Boolean);

                  return (
                    <article
                      key={event.id}
                      className="rounded-[26px] border border-gray-100 bg-[#FAFBFC] p-4 md:p-5 shadow-sm"
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

                        <div className="min-w-[220px] rounded-2xl bg-white border border-gray-200 p-4 space-y-3">
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
