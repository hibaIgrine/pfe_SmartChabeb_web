/**
 * LocauxPlanningPage.tsx — Planning de l'occupation des locaux (vue calendrier).
 *
 * RÔLE :
 *   Vue hebdomadaire ou journalière de l'occupation de toutes les salles du centre.
 *   Accessible via /centre/locaux-planning.
 *
 * CONTENU :
 *   - Grille calendrier avec créneaux horaires × locaux
 *   - Code couleur par type de réservation (club, événement, autre)
 *   - Navigation semaine précédente / suivante
 *   - RoomOccupancyModal : détail des réservations d'une salle pour un créneau donné
 *
 * ACCÈS : RESPONSABLE_CENTRE uniquement
 */
import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Grid2x2,
  Loader2,
  Table2,
} from "lucide-react";

type PlanningReservation = {
  id: string;
  statut: string;
  objet: string;
  date_reservation: string;
  heure_debut: string;
  heure_fin: string;
  local?: {
    id: string;
    nom: string;
    type?: string;
    prix_heure?: string | number | null;
    centre?: { id?: string; nom?: string };
  };
  utilisateur?: { nom?: string; prenom?: string; email?: string };
};

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateKeyFromApi(dateValue: string): string {
  if (!dateValue) return "";
  const raw = String(dateValue);
  if (raw.includes("T")) {
    return raw.split("T")[0];
  }
  return raw;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatHour(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LocauxPlanningPage() {
  const [locaux, setLocaux] = useState<any[]>([]);
  const [planningLocalId, setPlanningLocalId] = useState<string>("");
  const [planningView, setPlanningView] = useState<"day" | "week" | "month">(
    "day",
  );
  const [planningDate, setPlanningDate] = useState<Date>(new Date());
  const [planningReservations, setPlanningReservations] = useState<
    PlanningReservation[]
  >([]);
  const [loadingLocaux, setLoadingLocaux] = useState(true);
  const [loadingPlanning, setLoadingPlanning] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const token = localStorage.getItem("token");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const selectedLocal = useMemo(
    () => locaux.find((local) => local.id === planningLocalId) ?? null,
    [locaux, planningLocalId],
  );

  const loadLocaux = async () => {
    setLoadingLocaux(true);
    try {
      const res = await api.get("/locaux", { headers });
      setLocaux(res.data || []);
    } catch {
      setFeedback({
        type: "error",
        message: "Impossible de charger les locaux.",
      });
    } finally {
      setLoadingLocaux(false);
    }
  };

  const loadPlanning = async (localId: string) => {
    if (!localId) {
      setPlanningReservations([]);
      return;
    }

    setLoadingPlanning(true);
    try {
      const res = await api.get(`/reservations/planning/${localId}`, {
        headers,
      });
      const reservations = Array.isArray(res.data) ? res.data : [];
      setPlanningReservations(reservations);

      if (reservations.length > 0) {
        const sortedByDate = [...reservations].sort(
          (a, b) =>
            new Date(a.date_reservation).getTime() -
            new Date(b.date_reservation).getTime(),
        );
        const firstReservationDate = new Date(sortedByDate[0].date_reservation);
        setPlanningDate(firstReservationDate);
      }
    } catch {
      setPlanningReservations([]);
      setFeedback({
        type: "error",
        message: "Impossible de charger le planning du local.",
      });
    } finally {
      setLoadingPlanning(false);
    }
  };

  useEffect(() => {
    void loadLocaux();
  }, []);

  useEffect(() => {
    if (!planningLocalId && locaux.length > 0) {
      setPlanningLocalId(locaux[0].id);
    }
  }, [locaux, planningLocalId]);

  useEffect(() => {
    if (planningLocalId) {
      void loadPlanning(planningLocalId);
    }
  }, [planningLocalId]);

  const planningByDate = useMemo(() => {
    return planningReservations.reduce(
      (acc: Record<string, PlanningReservation[]>, item) => {
        const key = formatDateKeyFromApi(item.date_reservation);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {},
    );
  }, [planningReservations]);

  const currentDayItems = planningByDate[formatDateKey(planningDate)] ?? [];
  const weekStart = startOfWeek(planningDate);
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const monthStart = new Date(
    planningDate.getFullYear(),
    planningDate.getMonth(),
    1,
  );
  const monthGridStart = startOfWeek(monthStart);
  const monthCells = Array.from({ length: 42 }, (_, index) =>
    addDays(monthGridStart, index),
  );

  const goPrevious = () => {
    if (planningView === "day") {
      setPlanningDate(addDays(planningDate, -1));
      return;
    }
    if (planningView === "week") {
      setPlanningDate(addDays(planningDate, -7));
      return;
    }
    setPlanningDate(
      new Date(planningDate.getFullYear(), planningDate.getMonth() - 1, 1),
    );
  };

  const goNext = () => {
    if (planningView === "day") {
      setPlanningDate(addDays(planningDate, 1));
      return;
    }
    if (planningView === "week") {
      setPlanningDate(addDays(planningDate, 7));
      return;
    }
    setPlanningDate(
      new Date(planningDate.getFullYear(), planningDate.getMonth() + 1, 1),
    );
  };

  const renderDayView = () => {
    const halfHourSlots = Array.from({ length: 28 }, (_, index) => {
      const slotStart = 8 * 60 + index * 30;
      const slotEnd = slotStart + 30;
      const occupied = currentDayItems.find((item) => {
        const start = new Date(item.heure_debut);
        const end = new Date(item.heure_fin);
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();
        return slotStart < endMinutes && slotEnd > startMinutes;
      });

      return {
        label: `${String(Math.floor(slotStart / 60)).padStart(2, "0")}:${String(slotStart % 60).padStart(2, "0")}`,
        occupied,
      };
    });

    return (
      <div className="space-y-3">
        {halfHourSlots.map((slot) => (
          <div
            key={slot.label}
            className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${slot.occupied ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"}`}
          >
            <div>
              <p className="text-xs font-black text-[#436D75]">{slot.label}</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold">
                {slot.occupied ? "Occupé" : "Libre"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500">
                {slot.occupied
                  ? `${formatHour(slot.occupied.heure_debut)} - ${formatHour(slot.occupied.heure_fin)}`
                  : "Créneau disponible"}
              </p>
              {slot.occupied && (
                <p className="text-[10px] text-gray-400">
                  {slot.occupied.objet}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {weekDays.map((day) => {
        const key = formatDateKey(day);
        const items = planningByDate[key] ?? [];
        const occupiedCount = items.length;
        const freeCount = Math.max(0, 28 - occupiedCount * 2);

        return (
          <div
            key={key}
            className={`rounded-2xl border p-4 ${key === formatDateKey(planningDate) ? "border-smart-teal bg-smart-bg" : "border-gray-100 bg-white"}`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {day.toLocaleDateString([], { weekday: "short" })}
            </p>
            <p className="text-lg font-black text-[#436D75]">{day.getDate()}</p>
            <p className="text-[10px] text-gray-500 mt-2">
              {occupiedCount} occupé(s)
            </p>
            <p className="text-[10px] text-emerald-600 font-bold">
              {freeCount} créneau(x) libre(s)
            </p>
            <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <p className="text-[10px] italic text-gray-300">
                  Aucune réservation validée
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2"
                  >
                    <p className="text-[10px] font-black text-rose-700">
                      {formatHour(item.heure_debut)} -{" "}
                      {formatHour(item.heure_fin)}
                    </p>
                    <p className="text-[10px] text-gray-500">{item.objet}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderMonthView = () => (
    <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
      {monthCells.map((day) => {
        const key = formatDateKey(day);
        const items = planningByDate[key] ?? [];
        const isCurrentMonth = day.getMonth() === planningDate.getMonth();
        const isSelected = key === formatDateKey(planningDate);

        return (
          <div
            key={key}
            className={`min-h-28 rounded-2xl border p-3 ${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-300"} ${isSelected ? "border-smart-teal ring-2 ring-smart-teal/20" : "border-gray-100"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black">{day.getDate()}</span>
              {items.length > 0 && (
                <span className="text-[10px] rounded-full bg-rose-100 px-2 py-1 font-bold text-rose-700">
                  {items.length}
                </span>
              )}
            </div>
            <div className="mt-2 space-y-1">
              {items.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="h-2 rounded-full bg-rose-400"
                  title={`${formatHour(item.heure_debut)} - ${formatHour(item.heure_fin)}`}
                />
              ))}
              {items.length === 0 && (
                <div className="text-[10px] text-emerald-600 font-bold">
                  Libre
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-16">
      {feedback && (
        <div
          className={`fixed top-10 right-10 z-[1000] flex items-center space-x-4 p-5 rounded-[30px] shadow-2xl border border-white/20 backdrop-blur-md ${feedback.type === "error" ? "bg-[#E98A7D] text-white" : "bg-[#D9E8D1] text-[#436d75]"}`}
        >
          <div className="font-black italic text-sm uppercase tracking-widest">
            {feedback.message}
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pt-6">
        <div>
          <h1 className="text-6xl font-black text-smart-teal tracking-tighter italic leading-none">
            Planning des salles
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.5em] mt-4 ml-1 italic">
            Agenda visuel des créneaux libres et occupés
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <select
            value={planningLocalId}
            onChange={(e) => setPlanningLocalId(e.target.value)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-[#436D75]"
          >
            <option value="">Choisir un local</option>
            {locaux.map((local: any) => (
              <option key={local.id} value={local.id}>
                {local.nom}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={formatDateKey(planningDate)}
            onChange={(e) =>
              setPlanningDate(new Date(`${e.target.value}T00:00:00`))
            }
            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-[#436D75]"
          />

          <div className="inline-flex rounded-2xl border border-gray-200 overflow-hidden">
            {[
              { id: "day", label: "Jour", icon: CalendarDays },
              { id: "week", label: "Semaine", icon: Table2 },
              { id: "month", label: "Mois", icon: Grid2x2 },
            ].map((item) => {
              const Icon = item.icon;
              const active = planningView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlanningView(item.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-black ${active ? "bg-[#436D75] text-white" : "bg-white text-gray-500"}`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedLocal && (
        <div className="flex flex-wrap gap-3 text-xs font-bold text-gray-500">
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">
            Libre = créneau sans réservation validée
          </span>
          <span className="rounded-full bg-rose-50 px-3 py-2 text-rose-700">
            Occupé = réservation validée par l&apos;admin
          </span>
          <span className="rounded-full bg-smart-bg px-3 py-2 text-smart-teal">
            Local: {selectedLocal.nom}
          </span>
        </div>
      )}

      {loadingLocaux ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-smart-teal" size={46} />
        </div>
      ) : selectedLocal ? (
        <div className="rounded-[40px] border border-gray-100 bg-[#F7F3E9] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <button
              type="button"
              onClick={goPrevious}
              className="rounded-2xl bg-white p-3 shadow-sm border border-gray-100 text-[#436D75]"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                {planningView === "day"
                  ? planningDate.toLocaleDateString([], {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : planningView === "week"
                    ? `Semaine du ${weekStart.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })}`
                    : planningDate.toLocaleDateString([], {
                        month: "long",
                        year: "numeric",
                      })}
              </p>
              <h3 className="text-lg font-black text-[#436D75]">
                {selectedLocal.nom}
              </h3>
            </div>

            <button
              type="button"
              onClick={goNext}
              className="rounded-2xl bg-white p-3 shadow-sm border border-gray-100 text-[#436D75]"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {loadingPlanning ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-smart-teal" size={42} />
            </div>
          ) : (
            <>
              {planningView === "day" && renderDayView()}
              {planningView === "week" && renderWeekView()}
              {planningView === "month" && renderMonthView()}
            </>
          )}
        </div>
      ) : (
        <div className="py-16 text-center rounded-[32px] border border-dashed border-gray-200 bg-gray-50">
          <p className="text-gray-400 font-black italic">
            Choisissez un local pour voir son planning.
          </p>
        </div>
      )}
    </div>
  );
}
