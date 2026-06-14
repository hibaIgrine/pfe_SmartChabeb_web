/**
 * StaffCalendarPage.tsx — Calendrier personnel des tâches du staff.
 *
 * RÔLE :
 *   Vue calendrier mensuel des tâches assignées au membre du staff connecté.
 *   Accessible via /staff-calendar (ROUTES.club.staffCalendar).
 *
 * CONTENU :
 *   - Calendrier mensuel avec positionnement des tâches par date limite
 *   - Code couleur : EN_ATTENTE (gris) / EN_COURS (bleu) / TERMINEE (vert) / REFUSEE (rouge)
 *   - Clic sur une tâche → détail avec description + statut actuel
 *   - Navigation mois précédent / suivant
 *
 * DONNÉES :
 *   Agrège les tâches de tous les clubs dont l'utilisateur est staff
 *   (même source que StaffClubTasksPage mais vue calendrier)
 *
 * ACCÈS : RESPONSABLE_CLUB (CLUB_ONLY dans App.tsx)
 */
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Loader2,
  RefreshCw,
  Flag,
  CheckCircle2,
  PlayCircle,
  Hourglass,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import api from "../../api/axios";

interface StaffTask {
  id: string;
  titre: string;
  description?: string;
  priorite: "HAUTE" | "MOYENNE" | "FAIBLE";
  date_limite: string;
  type_tache: string;
  statut: string;
  created_at: string;
  club?: {
    id: string;
    nom: string;
  };
}

const priorityColors = {
  HAUTE: "bg-red-100 text-red-700 border-red-200",
  MOYENNE: "bg-amber-100 text-amber-700 border-amber-200",
  FAIBLE: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusColors: Record<string, string> = {
  EN_ATTENTE: "bg-slate-100 text-slate-700 border-slate-200",
  EN_COURS: "bg-blue-100 text-blue-700 border-blue-200",
  TERMINE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  VALIDEE: "bg-violet-100 text-violet-700 border-violet-200",
  REFUSE: "bg-rose-100 text-rose-700 border-rose-200",
  ANNULE: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function StaffCalendarPage() {
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    void loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/staff/tasks/assigned", { headers });
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erreur lors du chargement du calendrier personnel",
      );
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const summary = useMemo(() => {
    const clubIds = new Set(
      tasks.map((task) => task.club?.id).filter(Boolean) as string[],
    );
    return {
      total: tasks.length,
      clubs: clubIds.size,
      today: tasks.filter((task) => toInputDate(task.date_limite) === today)
        .length,
    };
  }, [tasks, today]);

  const selectedDayTasks = useMemo(
    () =>
      tasks.filter((task) => toInputDate(task.date_limite) === selectedDate),
    [tasks, selectedDate],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-[#2E5A66] to-[#447d8d] p-5 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
              <CalendarDays size={14} />
              Calendrier staff
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Toutes mes tâches du jour
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
              Consultez dans un seul calendrier les tâches affectées à votre
              compte sur tous les clubs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadTasks()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total tâches" value={summary.total} />
          <StatCard label="Clubs" value={summary.clubs} />
          <StatCard label="Aujourd'hui" value={summary.today} />
          <StatCard
            label="À venir"
            value={
              tasks.filter(
                (task) => new Date(task.date_limite) >= new Date(today),
              ).length
            }
          />
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[45vh] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#2E5A66]" />
            <p className="mt-3 text-sm text-slate-600">
              Chargement du calendrier...
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth() - 1,
                      1,
                    ),
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                ‹
              </button>
              <div className="text-sm font-semibold text-slate-700">
                {calendarMonth.toLocaleString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth() + 1,
                      1,
                    ),
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-400">
              {"Dim Lun Mar Mer Jeu Ven Sam".split(" ").map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthGrid(calendarMonth).map((week, weekIndex) => (
                <div key={weekIndex} className="contents">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return <div key={dayIndex} className="h-16 rounded-xl" />;
                    }
                    const iso = day.toISOString().split("T")[0];
                    const dayTasks = tasksForDate(tasks, iso);
                    const selected = selectedDate === iso;
                    return (
                      <button
                        key={dayIndex}
                        type="button"
                        onClick={() => setSelectedDate(iso)}
                        className={`h-16 rounded-xl border p-2 text-left transition ${selected ? "border-[#2E5A66] bg-[#2E5A66] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold">
                            {day.getDate()}
                          </span>
                          {dayTasks.length > 0 && (
                            <span
                              className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${selected ? "bg-white text-[#2E5A66]" : "bg-[#2E5A66] text-white"}`}
                            >
                              {dayTasks.length}
                            </span>
                          )}
                        </div>
                        {dayTasks.length > 0 && (
                          <p
                            className={`mt-2 line-clamp-1 text-[11px] ${selected ? "text-white/85" : "text-slate-500"}`}
                          >
                            {dayTasks[0].club?.nom || "Club"}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Tâches du jour
                </h2>
                <p className="text-sm text-slate-700">
                  {new Date(selectedDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {selectedDayTasks.length} tâche(s)
              </span>
            </div>

            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {selectedDayTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Aucune tâche ce jour-là.
                </div>
              ) : (
                selectedDayTasks.map((task) => {
                  const normalizedStatus = normalizeStatus(task.statut);
                  return (
                    <article
                      key={`${task.id}-${task.club?.id || "global"}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            {task.titre}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {task.club?.nom || "Club inconnu"} •{" "}
                            {task.type_tache}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusColors[normalizedStatus] || statusColors.EN_ATTENTE}`}
                        >
                          {statusIcon(normalizedStatus)}
                          {statusLabel(normalizedStatus)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span>{formatDateTime(task.date_limite)}</span>
                        <span
                          className={`rounded-full px-2 py-1 font-medium ${priorityColors[task.priorite]}`}
                        >
                          {priorityLabel(task.priorite)}
                        </span>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
      <p className="text-xs uppercase tracking-wide text-white/80">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function tasksForDate(tasks: StaffTask[], dateISO: string) {
  return tasks.filter((task) => toInputDate(task.date_limite) === dateISO);
}

function normalizeStatus(status: string) {
  const upper = (status || "EN_ATTENTE").toUpperCase();
  return upper === "A_FAIRE" ? "EN_ATTENTE" : upper;
}

function statusLabel(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "EN_ATTENTE") return "En attente";
  if (normalized === "EN_COURS") return "En cours";
  if (normalized === "TERMINE") return "Terminee";
  if (normalized === "VALIDEE") return "Validee";
  if (normalized === "REFUSE") return "Refusee";
  if (normalized === "ANNULE") return "Annulee";
  return "En attente";
}

function statusIcon(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "EN_ATTENTE") return <Hourglass size={14} />;
  if (normalized === "EN_COURS") return <PlayCircle size={14} />;
  if (normalized === "TERMINE") return <CheckCircle2 size={14} />;
  if (normalized === "VALIDEE") return <ShieldCheck size={14} />;
  if (normalized === "REFUSE") return <XCircle size={14} />;
  return <Hourglass size={14} />;
}

function priorityLabel(priority: string) {
  if (priority === "HAUTE") return "Haute";
  if (priority === "MOYENNE") return "Moyenne";
  return "Faible";
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toInputDate(dateString: string) {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthGrid(monthDate: Date) {
  const start = startOfMonth(monthDate);
  const startDay = start.getDay();
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }
  while (cells.length < 42) cells.push(null);

  const weeks: Array<Array<Date | null>> = [];
  for (let i = 0; i < 6; i++) {
    weeks.push(cells.slice(i * 7, i * 7 + 7));
  }

  return weeks;
}
