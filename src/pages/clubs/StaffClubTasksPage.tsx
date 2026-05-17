import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Filter,
  Flag,
  Hourglass,
  Layers3,
  Loader2,
  PanelRight,
  PlayCircle,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

interface StaffTaskUser {
  id: string;
  nom: string;
  prenom: string;
  photo_profil_url?: string;
}

interface StaffTask {
  id: string;
  titre: string;
  description?: string;
  priorite: "HAUTE" | "MOYENNE" | "FAIBLE";
  date_limite: string;
  type_tache: string;
  statut: string;
  created_at: string;
  createur?: StaffTaskUser;
  affectations?: Array<{
    id: string;
    statut: string;
    date_affectation: string;
    utilisateur: StaffTaskUser;
  }>;
}

interface TaskStatusAction {
  label: string;
  nextStatus:
    | "EN_ATTENTE"
    | "EN_COURS"
    | "TERMINE"
    | "VALIDEE"
    | "REFUSE"
    | "ANNULE";
  tone: string;
  icon: ReactNode;
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
  A_FAIRE: "bg-slate-100 text-slate-700 border-slate-200",
};

const priorityOrder = ["HAUTE", "MOYENNE", "FAIBLE"] as const;
const statusOrder = [
  "EN_ATTENTE",
  "EN_COURS",
  "TERMINE",
  "VALIDEE",
  "REFUSE",
  "ANNULE",
] as const;

type FilterState = {
  priority: string;
  status: string;
  date: string;
};

export default function StaffClubTasksPage() {
  const { clubId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<StaffTask | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    priority: "",
    status: "",
    date: "",
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const userRole =
    currentUser?.role === "ADHERANT" ? "ADHERENT" : currentUser?.role;
  const canValidate = [
    "RESPONSABLE_CLUB",
    "RESPONSABLE_CENTRE",
    "ADMIN",
  ].includes(userRole);

  useEffect(() => {
    if (!clubId) {
      return;
    }

    void loadTasks();
  }, [clubId]);

  useEffect(() => {
    if (!searchParams.get("taskId") || tasks.length === 0) {
      return;
    }

    const taskId = searchParams.get("taskId");
    const task = tasks.find((item) => item.id === taskId);
    if (task) {
      setSelectedTask(task);
    }
  }, [searchParams, tasks]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => setSuccess(null), 2500);
    return () => clearTimeout(timer);
  }, [success]);

  const loadTasks = async () => {
    if (!clubId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/clubs/${clubId}/tasks/assigned`, {
        headers,
      });
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erreur lors du chargement des taches assignees",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const normalizedStatus = normalizeStatus(task.statut);
      const matchesPriority =
        !filters.priority || task.priorite === filters.priority;
      const matchesStatus =
        !filters.status || normalizedStatus === filters.status;
      const matchesDate =
        !filters.date || toInputDate(task.date_limite) === filters.date;
      return matchesPriority && matchesStatus && matchesDate;
    });
  }, [tasks, filters]);

  const groupedSummary = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter(
        (task) => normalizeStatus(task.statut) === "EN_ATTENTE",
      ).length,
      active: tasks.filter(
        (task) => normalizeStatus(task.statut) === "EN_COURS",
      ).length,
      done: tasks.filter((task) => normalizeStatus(task.statut) === "TERMINE")
        .length,
    };
  }, [tasks]);

  const changeStatus = async (
    taskId: string,
    nextStatus: TaskStatusAction["nextStatus"],
  ) => {
    if (!clubId) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const response = await api.patch(
        `/clubs/${clubId}/tasks/${taskId}/status`,
        { statut: nextStatus },
        { headers },
      );

      setTasks((current) =>
        current.map((task) => (task.id === taskId ? response.data : task)),
      );

      if (selectedTask?.id === taskId) {
        setSelectedTask(response.data);
      }

      setSuccess("Statut mis a jour avec succes");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Impossible de changer le statut",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const detailsTask = selectedTask
    ? tasks.find((task) => task.id === selectedTask.id) || selectedTask
    : null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#2E5A66]" />
          <p className="mt-3 text-sm text-slate-600">
            Chargement de vos taches...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-[#2E5A66] to-[#447d8d] p-5 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
              <Layers3 size={14} />
              Espace staff
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Mes taches assignees
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
              Consultez vos taches, ouvrez les details et mettez a jour le
              statut selon votre progression.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadTasks()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <ArrowLeft size={16} className="rotate-180" />
            Actualiser
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total" value={groupedSummary.total} />
          <StatCard label="En attente" value={groupedSummary.pending} />
          <StatCard label="En cours" value={groupedSummary.active} />
          <StatCard label="Terminees" value={groupedSummary.done} />
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Filtres</h2>
            <p className="text-sm text-slate-500">
              Filtrez par priorite, date et statut.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFilters({ priority: "", status: "", date: "" })}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Filter size={16} />
            Reinitialiser
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <SelectField
            label="Priorite"
            value={filters.priority}
            onChange={(priority) =>
              setFilters((current) => ({ ...current, priority }))
            }
            options={[
              { label: "Toutes", value: "" },
              ...priorityOrder.map((priority) => ({
                label: priorityLabel(priority),
                value: priority,
              })),
            ]}
          />
          <SelectField
            label="Statut"
            value={filters.status}
            onChange={(status) =>
              setFilters((current) => ({ ...current, status }))
            }
            options={[
              { label: "Tous", value: "" },
              ...statusOrder.map((status) => ({
                label: statusLabel(status),
                value: status,
              })),
            ]}
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Date limite
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2E5A66] focus:ring-2 focus:ring-[#2E5A66]/20"
            />
          </div>
        </div>
      </section>

      <section>
        {filteredTasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Aucune tache ne correspond aux filtres actuels.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {filteredTasks.map((task) => {
              const status = normalizeStatus(task.statut);
              const currentUserId = currentUser?.id;
              const isAssigned = Boolean(
                task.affectations?.some(
                  (a) => a.utilisateur?.id === currentUserId,
                ),
              );
              const actions = getTaskActions(status, canValidate, isAssigned);
              return (
                <article
                  key={task.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${priorityColors[task.priorite]}`}
                        >
                          <Flag size={14} />
                          {priorityLabel(task.priorite)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${statusColors[status] || statusColors.A_FAIRE}`}
                        >
                          {statusIcon(status)}
                          {statusLabel(status)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {task.titre}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {task.type_tache}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTask(task);
                        setSearchParams((current) => {
                          current.set("taskId", task.id);
                          return current;
                        });
                      }}
                      className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                      aria-label="Voir les details"
                    >
                      <PanelRight size={18} />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-slate-400" />
                      <span>
                        Echeance:{" "}
                        <strong>{formatDateTime(task.date_limite)}</strong>
                      </span>
                    </div>
                    {task.description && (
                      <p className="line-clamp-3 whitespace-pre-wrap leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTask(task);
                        setSearchParams((current) => {
                          current.set("taskId", task.id);
                          return current;
                        });
                      }}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Details
                    </button>
                    {actions.map((action) => (
                      <button
                        key={action.nextStatus}
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          void changeStatus(task.id, action.nextStatus)
                        }
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${action.tone}`}
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {detailsTask && (
        <TaskDetailsModal
          task={detailsTask}
          canValidate={canValidate}
          submitting={submitting}
          onClose={() => {
            setSelectedTask(null);
            setSearchParams((current) => {
              current.delete("taskId");
              return current;
            });
          }}
          onChangeStatus={(nextStatus) =>
            void changeStatus(detailsTask.id, nextStatus)
          }
        />
      )}
    </div>
  );
}

function TaskDetailsModal({
  task,
  canValidate,
  submitting,
  onClose,
  onChangeStatus,
}: {
  task: StaffTask;
  canValidate: boolean;
  submitting: boolean;
  onClose: () => void;
  onChangeStatus: (nextStatus: TaskStatusAction["nextStatus"]) => void;
}) {
  const status = normalizeStatus(task.statut);
  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null")?.id;
    } catch {
      return null;
    }
  })();
  const isAssigned = Boolean(
    task.affectations?.some((a) => a.utilisateur?.id === currentUserId),
  );
  const actions = getTaskActions(status, canValidate, isAssigned);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
      <div className="w-full rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Details de la tache
            </p>
            <h3 className="text-lg font-bold text-slate-800 sm:text-2xl">
              {task.titre}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap gap-2">
            <Badge
              tone={priorityColors[task.priorite]}
              label={priorityLabel(task.priorite)}
              icon={<Flag size={14} />}
            />
            <Badge
              tone={statusColors[status] || statusColors.A_FAIRE}
              label={statusLabel(status)}
              icon={statusIcon(status)}
            />
            <Badge
              tone="bg-sky-100 text-sky-700 border-sky-200"
              label={task.type_tache}
              icon={<Layers3 size={14} />}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoBlock
              label="Echeance"
              value={formatDateTime(task.date_limite)}
              icon={<Calendar size={16} />}
            />
            <InfoBlock
              label="Creee le"
              value={formatDate(task.created_at)}
              icon={<Hourglass size={16} />}
            />
          </div>

          {task.description && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Description
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {task.description}
              </p>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Affectations
            </p>
            <div className="flex flex-wrap gap-2">
              {task.affectations?.map((affectation) => (
                <span
                  key={affectation.id}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                >
                  {affectation.utilisateur.prenom} {affectation.utilisateur.nom}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Actions disponibles
            </p>
            <div className="flex flex-wrap gap-3">
              {actions.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aucune action disponible pour ce statut.
                </p>
              ) : (
                actions.map((action) => (
                  <button
                    key={action.nextStatus}
                    type="button"
                    disabled={submitting}
                    onClick={() => onChangeStatus(action.nextStatus)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${action.tone}`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2E5A66] focus:ring-2 focus:ring-[#2E5A66]/20"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Badge({
  tone,
  label,
  icon,
}: {
  tone: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${tone}`}
    >
      {icon}
      {label}
    </span>
  );
}

function InfoBlock({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function getTaskActions(
  status: string,
  canValidate: boolean,
  isAssigned: boolean,
): TaskStatusAction[] {
  // Staff actions (Commencer / Terminer) require the user to be assigned.
  if (status === "EN_ATTENTE") {
    if (!isAssigned) return [];
    return [
      {
        label: "Commencer",
        nextStatus: "EN_COURS",
        tone: "bg-blue-600 hover:bg-blue-700",
        icon: <PlayCircle size={16} />,
      },
    ];
  }

  if (status === "EN_COURS") {
    if (!isAssigned) return [];
    return [
      {
        label: "Terminer",
        nextStatus: "TERMINE",
        tone: "bg-emerald-600 hover:bg-emerald-700",
        icon: <CheckCircle2 size={16} />,
      },
    ];
  }

  // Validation actions are only for responsables / admins.
  if (status === "TERMINE" && canValidate) {
    return [
      {
        label: "Valider",
        nextStatus: "VALIDEE",
        tone: "bg-violet-600 hover:bg-violet-700",
        icon: <ShieldCheck size={16} />,
      },
      {
        label: "Refuser",
        nextStatus: "REFUSE",
        tone: "bg-rose-600 hover:bg-rose-700",
        icon: <XCircle size={16} />,
      },
    ];
  }

  return [];
}

function priorityLabel(priority: string) {
  if (priority === "HAUTE") return "Haute";
  if (priority === "MOYENNE") return "Moyenne";
  return "Faible";
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

function normalizeStatus(status: string) {
  if (!status) return "EN_ATTENTE";
  const upper = status.toUpperCase();
  if (upper === "A_FAIRE") return "EN_ATTENTE";
  return upper;
}

function statusIcon(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "EN_ATTENTE") return <Hourglass size={14} />;
  if (normalized === "EN_COURS") return <PlayCircle size={14} />;
  if (normalized === "TERMINE") return <CheckCircle2 size={14} />;
  if (normalized === "VALIDEE") return <ShieldCheck size={14} />;
  if (normalized === "REFUSE") return <XCircle size={14} />;
  return <AlertCircle size={14} />;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${dateStr} à ${timeStr}`;
}

function toInputDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().split("T")[0];
}
