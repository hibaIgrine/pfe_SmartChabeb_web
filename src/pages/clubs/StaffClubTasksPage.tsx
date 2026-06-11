import { useEffect, useMemo, useRef, useState } from "react";
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
  club?: {
    id: string;
    nom: string;
    id_coach?: string;
  };
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

type ProofItem = {
  id: string;
  url: string;
  filename?: string | null;
  type?: string | null;
};

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
  const [clubResponsableId, setClubResponsableId] = useState<string | null>(
    null,
  );
  // Seul le responsable principal (id_coach) du club peut valider ou refuser
  const canValidate =
    userRole === "ADMIN" ||
    (currentUser?.id != null && clubResponsableId === currentUser.id);

  useEffect(() => {
    if (!clubId) {
      return;
    }

    void loadTasks();

    // Charger l'id_coach du club pour déterminer si l'utilisateur peut valider
    const loadClubInfo = async () => {
      try {
        const res = await api.get(`/clubs/${clubId}`, { headers });
        setClubResponsableId(res.data?.id_coach ?? null);
      } catch {
        // ignoré — fallback sur les données des tâches
      }
    };
    void loadClubInfo();
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
      try {
        // eslint-disable-next-line no-console
        console.debug("loadTasks: fetching assigned tasks for club", clubId);
      } catch (e) {}
      setLoading(true);
      setError(null);
      const response = await api.get(`/clubs/${clubId}/tasks/assigned`, {
        headers,
      });
      try {
        // eslint-disable-next-line no-console
        console.debug(
          "loadTasks: response count",
          Array.isArray(response.data) ? response.data.length : 0,
        );
      } catch (e) {}
      const allTasks: StaffTask[] = Array.isArray(response.data)
        ? response.data
        : [];
      const myId = currentUser?.id;
      // Keep only tasks where the current user is explicitly in the affectations
      const myTasks = myId
        ? allTasks.filter((t) =>
            t.affectations?.some((a) => a.utilisateur?.id === myId),
          )
        : allTasks;
      setTasks(myTasks);
      // Extraire le responsable du club depuis n'importe quelle tâche (même club pour toutes)
      const firstClubCoach =
        allTasks.find((t) => t.club?.id_coach)?.club?.id_coach ?? null;
      setClubResponsableId(firstClubCoach);
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
    proofs?: Array<{ url: string; filename: string; type?: string }>,
    options?: { closeOnSuccess?: boolean; successMessage?: string },
  ): Promise<boolean> => {
    if (!clubId) {
      return false;
    }
    if (
      nextStatus === "TERMINE" &&
      !canValidate &&
      (!proofs || proofs.length === 0)
    ) {
      setError(
        "Ajoutez au moins une preuve avant de marquer la tache comme terminee.",
      );
      return false;
    }
    if (submitting) return false; // prevent concurrent status changes
    try {
      setSubmitting(true);
      setError(null);
      const baseUrl = (
        import.meta.env.VITE_API_URL ||
        api.defaults.baseURL ||
        "http://localhost:3000"
      ).replace(/\/$/, "");
      const authToken = localStorage.getItem("token");
      const request = await fetch(
        `${baseUrl}/clubs/${clubId}/tasks/${taskId}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ statut: nextStatus, proofs }),
        },
      );

      const responseData = await request.json().catch(() => ({}));
      if (!request.ok) {
        // log for debugging
        // eslint-disable-next-line no-console
        console.error("changeStatus failed", {
          url: request.url,
          status: request.status,
          body: responseData,
        });
        throw { response: { data: responseData, status: request.status } };
      }

      const response = { data: responseData };

      setTasks((current) =>
        current.map((task) => (task.id === taskId ? response.data : task)),
      );

      if (selectedTask?.id === taskId) {
        setSelectedTask(response.data);
      }

      setError(null);
      setSuccess(options?.successMessage || "Statut mis a jour avec succes");
      if (options?.closeOnSuccess) {
        try {
          // refresh tasks to reflect the latest state
          await loadTasks();
        } catch (e) {
          // ignore reload errors, still proceed to close modal
        }
        setSelectedTask(null);
        setSearchParams((current) => {
          current.delete("taskId");
          return current;
        });
      }
      return true;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        `Impossible de changer le statut (HTTP ${err.response?.status || "unknown"})`;
      // Suppress backend 'proof required' message on the main page — modal handles this locally
      if (
        msg ===
        "Une preuve (photo ou document) est requise pour marquer la tache comme terminee"
      ) {
        // do not set global error banner
      } else {
        setError(msg);
      }
      return false;
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
                        onClick={() => {
                          if (action.nextStatus === "TERMINE") {
                            setSelectedTask(task);
                            setSearchParams((current) => {
                              current.set("taskId", task.id);
                              return current;
                            });
                            return;
                          }
                          void changeStatus(task.id, action.nextStatus);
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          action.nextStatus === "TERMINE"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : `${action.tone} text-white`
                        }`}
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
          onChangeStatus={async (nextStatus, proofs) =>
            changeStatus(detailsTask.id, nextStatus, proofs, {
              closeOnSuccess: true,
              successMessage:
                nextStatus === "TERMINE"
                  ? "Votre tache est terminee avec succes"
                  : "Statut mis a jour avec succes",
            })
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
  onChangeStatus: (
    nextStatus: TaskStatusAction["nextStatus"],
    proofs?: Array<{ url: string; filename: string; type?: string }>,
  ) => Promise<boolean>;
}) {
  const { clubId } = useParams();
  const [comments, setComments] = useState<Array<any>>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [proofFiles, setProofFiles] = useState<
    Array<{ id: string; file: File }>
  >([]);
  const [proofError, setProofError] = useState<string | null>(null);
  const [viewerProof, setViewerProof] = useState<ProofItem | null>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  const createProofId = (file: File) => {
    const randomPart =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `${file.name}-${file.lastModified}-${file.size}-${randomPart}`;
  };

  useEffect(() => {
    if (!clubId) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingComments(true);
        const res = await import("../../api/comments.api").then((m) =>
          m.getTaskComments(clubId!, task.id),
        );
        if (mounted) setComments(res || []);
      } catch (_) {
      } finally {
        if (mounted) setLoadingComments(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clubId, task.id]);

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
  const nonTerminateActions = actions.filter(
    (action) => action.nextStatus !== "TERMINE",
  );
  const terminateAction = actions.find(
    (action) => action.nextStatus === "TERMINE",
  );

  const handleStatusChange = async (
    nextStatus: TaskStatusAction["nextStatus"],
  ) => {
    if (nextStatus !== "TERMINE" || canValidate) {
      await onChangeStatus(nextStatus);
      return;
    }

    if (proofFiles.length === 0) {
      setProofError(
        "Ajoutez au moins une preuve avant de marquer la tache comme terminee.",
      );
      return;
    }

    try {
      setProofError(null);
      const uploadModule = await import("../../api/uploads.api");
      const proofs = [] as Array<{
        url: string;
        filename: string;
        type?: string;
      }>;

      for (const item of proofFiles) {
        const uploaded = await uploadModule.uploadTaskProof(item.file);
        proofs.push({
          url: uploaded.url,
          filename: uploaded.filename,
          type: uploaded.type,
        });
      }

      const updated = await onChangeStatus(nextStatus, proofs);
      if (updated) {
        setProofFiles([]);
        setProofError(null);
        try {
          onClose();
        } catch (e) {
          // ignore
        }
      }
    } catch (error: any) {
      setProofError(
        error?.response?.data?.message ||
          "Impossible d'envoyer les preuves. Reessayez.",
      );
    }
  };

  const hasSubmittedProofs =
    Array.isArray((task as any).preuves) && (task as any).preuves.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="w-full rounded-t-[32px] border border-gray-100 bg-white shadow-2xl sm:max-w-3xl sm:rounded-[32px]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-smart-teal/60">
              Détails de la tâche
            </p>
            <h3 className="text-xl font-black text-gray-900 sm:text-2xl">
              {task.titre}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto px-5 py-5 sm:px-6">

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              tone={priorityColors[task.priorite]}
              label={priorityLabel(task.priorite)}
              icon={<Flag size={13} />}
            />
            <Badge
              tone={statusColors[status] || statusColors.A_FAIRE}
              label={statusLabel(status)}
              icon={statusIcon(status)}
            />
            <Badge
              tone="bg-sky-100 text-sky-700 border-sky-200"
              label={task.type_tache}
              icon={<Layers3 size={13} />}
            />
          </div>

          {/* Info grid */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#F7F3E9] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                Échéance
              </p>
              <p className="mt-0.5 text-sm font-bold text-gray-800">
                {formatDateTime(task.date_limite)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F7F3E9] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                Créée le
              </p>
              <p className="mt-0.5 text-sm font-bold text-gray-800">
                {formatDate(task.created_at)}
              </p>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="mt-4 rounded-2xl bg-[#D9E8D1]/40 p-4">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-smart-teal/60">
                Description
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {task.description}
              </p>
            </div>
          )}

          {/* Affectations */}
          <div className="mt-4 rounded-2xl border border-gray-100 p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
              Affectations
            </p>
            <div className="flex flex-wrap gap-2">
              {task.affectations?.map((affectation) => (
                <span
                  key={affectation.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-smart-teal/10 px-3 py-1 text-xs font-bold text-smart-teal"
                >
                  {affectation.utilisateur.prenom} {affectation.utilisateur.nom}
                </span>
              ))}
            </div>
          </div>

          {/* Preuves soumises */}
          {hasSubmittedProofs && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">
                {canValidate ? "Preuves soumises" : "Mes preuves"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(task as any).preuves.map((preuve: ProofItem) => {
                  const isImage = isImageProof(preuve);
                  return (
                    <button
                      key={preuve.id}
                      type="button"
                      onClick={() => setViewerProof(preuve)}
                      className="group flex overflow-hidden rounded-xl border border-emerald-200 bg-white text-left text-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <div className="flex h-full w-full min-h-[80px] items-stretch gap-3 p-2">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                          {isImage ? (
                            <img
                              src={resolveProofUrl(preuve.url)}
                              alt={preuve.filename || "Preuve"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center px-1 text-center text-[10px] text-slate-500">
                              <span className="font-black uppercase tracking-wide text-emerald-700">
                                Doc
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 py-1 pr-1">
                          <p className="line-clamp-2 text-sm font-bold text-gray-800">
                            {preuve.filename || preuve.url}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Cliquez pour ouvrir l’aperçu
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions disponibles — cachées si preuves déjà soumises et pas validateur */}
          {(!hasSubmittedProofs || canValidate) && (
            <div className="mt-4 rounded-2xl bg-[#F7F3E9] p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                Actions disponibles
              </p>

              <div className="flex flex-wrap gap-3">
                {nonTerminateActions.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Aucune action disponible pour ce statut.
                  </p>
                ) : (
                  nonTerminateActions.map((action) => (
                    <button
                      key={action.nextStatus}
                      type="button"
                      disabled={submitting}
                      onClick={(e) => {
                        e.preventDefault();
                        void handleStatusChange(action.nextStatus);
                      }}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${action.tone}`}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))
                )}
              </div>

              {/* Upload preuves — seulement si pas encore de preuves soumises */}
              {!hasSubmittedProofs && (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                    Preuves
                  </p>
                  <div className="flex items-start gap-3">
                    <input
                      ref={proofInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const newOnes = files.map((f) => ({
                          id: createProofId(f),
                          file: f,
                        }));
                        setProofFiles((cur) => [...cur, ...newOnes]);
                        if (proofInputRef.current)
                          proofInputRef.current.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => proofInputRef.current?.click()}
                      className="rounded-xl border border-smart-teal/30 bg-white px-4 py-2 text-sm font-bold text-smart-teal transition hover:bg-smart-teal/5"
                    >
                      Ajouter des preuves
                    </button>
                    <div className="flex-1">
                      {proofError && (
                        <div className="mb-2 text-sm text-rose-600">
                          {proofError}
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        {proofFiles.length === 0 ? (
                          <p className="text-sm text-gray-400">
                            Aucune preuve ajoutée.
                          </p>
                        ) : (
                          proofFiles.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm"
                            >
                              <span className="min-w-0 truncate text-gray-700">
                                {p.file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setProofFiles((cur) =>
                                    cur.filter((x) => x.id !== p.id),
                                  )
                                }
                                className="shrink-0 text-sm font-medium text-rose-500 hover:text-rose-700"
                              >
                                Retirer
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    {terminateAction && (
                      <button
                        type="button"
                        disabled={
                          submitting ||
                          (!canValidate && proofFiles.length === 0)
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          if (!canValidate && proofFiles.length === 0) {
                            setProofError(
                              "Ajoutez au moins une preuve avant de marquer la tâche comme terminée.",
                            );
                            return;
                          }
                          void handleStatusChange(terminateAction.nextStatus);
                        }}
                        title={
                          !canValidate && proofFiles.length === 0
                            ? "Ajoutez au moins une preuve"
                            : undefined
                        }
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${terminateAction.tone}`}
                      >
                        {terminateAction.icon}
                        {terminateAction.label}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Commentaires */}
          <div className="mt-4 rounded-2xl border border-gray-100 p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
              Commentaires
            </p>
            <div className="max-h-48 space-y-3 overflow-y-auto">
              {loadingComments ? (
                <p className="text-sm text-gray-400">Chargement...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun commentaire.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#D9E8D1] text-[11px] font-black uppercase text-smart-teal">
                      {(c.utilisateur?.prenom?.[0] ?? "") +
                        (c.utilisateur?.nom?.[0] ?? "")}
                      {c.utilisateur?.photo_profil_url && (
                        <img
                          src={c.utilisateur.photo_profil_url}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800">
                        {c.utilisateur?.prenom} {c.utilisateur?.nom}
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm text-gray-600">
                        {c.message}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
                placeholder="Écrire un commentaire..."
                rows={2}
              />
              <button
                type="button"
                disabled={sendingComment || !newComment.trim() || !clubId}
                onClick={async () => {
                  if (!clubId) return;
                  try {
                    setSendingComment(true);
                    const created = await import(
                      "../../api/comments.api"
                    ).then((m) =>
                      m.createTaskComment(clubId!, task.id, newComment.trim()),
                    );
                    setComments((cur) => [...cur, created]);
                    setNewComment("");
                  } catch (err) {
                  } finally {
                    setSendingComment(false);
                  }
                }}
                className="self-end rounded-2xl bg-smart-teal px-4 py-2.5 text-sm font-black text-white transition hover:bg-black disabled:opacity-40"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewerProof && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-smart-teal/60">
                  Aperçu de la preuve
                </p>
                <h4 className="truncate text-base font-black text-gray-900">
                  {viewerProof.filename || "Preuve"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setViewerProof(null)}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100"
                aria-label="Fermer l’aperçu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto p-4 sm:p-6">
              {isImageProof(viewerProof) ? (
                <img
                  src={resolveProofUrl(viewerProof.url)}
                  alt={viewerProof.filename || "Preuve"}
                  className="mx-auto max-h-[70vh] w-auto rounded-2xl border border-gray-100 object-contain"
                />
              ) : viewerProof.type?.includes("pdf") ||
                viewerProof.url.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={resolveProofUrl(viewerProof.url)}
                  title={viewerProof.filename || "Preuve PDF"}
                  className="h-[70vh] w-full rounded-2xl border border-gray-100"
                />
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-[#F7F3E9] p-6 text-sm">
                  <p className="font-black text-gray-800">
                    Aperçu non disponible
                  </p>
                  <p className="mt-2 break-words text-gray-600">
                    {viewerProof.filename || viewerProof.url}
                  </p>
                  <p className="mt-2 text-gray-400">
                    Ce type de document ne peut pas être affiché directement
                    dans le navigateur.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isImageProof(proof: ProofItem) {
  const url = (proof.url || "").toLowerCase();
  const type = (proof.type || "").toLowerCase();
  return (
    type.startsWith("image/") ||
    url.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/) !== null
  );
}

function resolveProofUrl(url: string) {
  // Prefer the API base if available so we don't rely on an IP that might be unreachable from the browser
  const apiBase = (
    import.meta.env.VITE_API_URL ||
    api.defaults.baseURL ||
    ""
  ).replace(/\/$/, "");
  if (!url) return url;

  // If url already starts with http(s) and shares the same origin as apiBase, return as-is
  try {
    const parsed = new URL(url);
    if (apiBase && parsed.origin === new URL(apiBase).origin) return url;
    // If url contains a filename at the end, prefer to rebuild using apiBase/uploads path
    const filename = parsed.pathname.split("/").pop();
    if (apiBase && filename)
      return `${apiBase}/uploads/task-proofs/${filename}`;
    return url;
  } catch {
    // relative or bare filename — prefix with apiBase if available
    const filename = url.split("/").pop();
    if (apiBase && filename)
      return `${apiBase}/uploads/task-proofs/${filename}`;
    return url;
  }
}

// Fetch PDF blob when needed and expose as object URL
// PDF blob loader moved inside the modal scope where `viewerProof` is defined

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
