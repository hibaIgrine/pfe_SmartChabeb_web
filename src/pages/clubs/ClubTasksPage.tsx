import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Flag,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  Users,
  XCircle,
  X,
} from "lucide-react";

interface ClubTask {
  id: string;
  titre: string;
  description?: string;
  priorite: "HAUTE" | "MOYENNE" | "FAIBLE";
  date_limite: string;
  type_tache: string;
  statut: string;
  created_at: string;
  createur?: {
    id: string;
    nom: string;
    prenom: string;
    photo_profil_url?: string;
  };
  affectations?: Array<{
    id: string;
    statut: string;
    date_affectation: string;
    utilisateur: {
      id: string;
      nom: string;
      prenom: string;
      photo_profil_url?: string;
    };
  }>;
}

interface ClubStaff {
  id: string;
  nom: string;
  prenom: string;
  photo_profil_url?: string;
  role_dans_club: string;
}

interface ClubStaffApiItem {
  role_dans_club: string;
  utilisateur: {
    id: string;
    nom: string;
    prenom: string;
    photo_profil_url?: string;
  };
}

interface TaskFormData {
  titre: string;
  description: string;
  priorite: "HAUTE" | "MOYENNE" | "FAIBLE";
  date_limite: string;
  date_limite_time: string;
  type_tache: string;
  utilisateurs: string[];
}

const priorityColors = {
  HAUTE: "bg-red-100 text-red-700 border-red-200",
  MOYENNE: "bg-amber-100 text-amber-700 border-amber-200",
  FAIBLE: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const priorityIcons = {
  HAUTE: <Flag size={14} className="text-red-600" />,
  MOYENNE: <Flag size={14} className="text-amber-600" />,
  FAIBLE: <Flag size={14} className="text-emerald-600" />,
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

const taskTypes = [
  "Organisation",
  "Logistique",
  "Communication",
  "Administratif",
  "Evenementiel",
  "Financement",
  "Formation",
  "Autre",
];

const defaultTaskForm: TaskFormData = {
  titre: "",
  description: "",
  priorite: "MOYENNE",
  date_limite: "",
  date_limite_time: "",
  type_tache: "",
  utilisateurs: [],
};

export default function ClubTasksPage() {
  const { clubId } = useParams();

  const [tasks, setTasks] = useState<ClubTask[]>([]);
  const [staff, setStaff] = useState<ClubStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ClubTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<ClubTask | null>(null);

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
  const canManageTasks = [
    "RESPONSABLE_CLUB",
    "RESPONSABLE_CENTRE",
    "ADMIN",
  ].includes(userRole);
  const canCancelTask = ["RESPONSABLE_CENTRE", "ADMIN"].includes(userRole);

  useEffect(() => {
    if (!clubId) {
      return;
    }

    void loadTasks();
    void loadStaff();
  }, [clubId]);

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
      const response = await api.get(`/clubs/${clubId}/tasks`, { headers });
      setTasks(response.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors du chargement des taches",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    if (!clubId) {
      return;
    }

    try {
      setStaffLoading(true);
      const response = await api.get(`/clubs/${clubId}/tasks/staff`, {
        headers,
      });
      const mappedStaff = (response.data || []).map(
        (item: ClubStaffApiItem) => ({
          id: item.utilisateur.id,
          nom: item.utilisateur.nom,
          prenom: item.utilisateur.prenom,
          photo_profil_url: item.utilisateur.photo_profil_url,
          role_dans_club: item.role_dans_club,
        }),
      );
      setStaff(mappedStaff);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors du chargement du staff",
      );
    } finally {
      setStaffLoading(false);
    }
  };

  const createTask = async (taskData: TaskFormData) => {
    if (!clubId) {
      return;
    }

    try {
      setError(null);

      const { utilisateurs, date_limite, date_limite_time, ...payload } =
        taskData;
      const createResponse = await api.post(
        `/clubs/${clubId}/tasks`,
        {
          ...payload,
          date_limite: buildLocalDateTime(
            date_limite,
            date_limite_time,
          ).toISOString(),
        },
        {
          headers,
        },
      );
      const createdTaskId = createResponse.data?.id;

      if (createdTaskId && utilisateurs.length > 0) {
        await api.patch(
          `/clubs/${clubId}/tasks/${createdTaskId}`,
          { utilisateurs },
          { headers },
        );
      }

      await loadTasks();
      setIsCreateModalOpen(false);
      setSuccess("Tache creee avec succes");
    } catch (err: any) {
      throw err;
    }
  };

  const updateTask = async (taskId: string, taskData: TaskFormData) => {
    if (!clubId) {
      return;
    }

    try {
      setError(null);
      const { utilisateurs, date_limite, date_limite_time, ...payload } =
        taskData;
      await api.patch(
        `/clubs/${clubId}/tasks/${taskId}`,
        {
          ...payload,
          date_limite: buildLocalDateTime(
            date_limite,
            date_limite_time,
          ).toISOString(),
        },
        {
          headers,
        },
      );
      await loadTasks();
      setEditingTask(null);
      setSuccess("Tache modifiee avec succes");
    } catch (err: any) {
      throw err;
    }
  };

  const deleteTask = async () => {
    if (!clubId || !deletingTask) {
      return;
    }

    try {
      setError(null);
      await api.delete(`/clubs/${clubId}/tasks/${deletingTask.id}`, {
        headers,
      });
      await loadTasks();
      setSuccess("Tache supprimee avec succes");
      setDeletingTask(null);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la suppression de la tache",
      );
    }
  };

  const changeTaskStatus = async (taskId: string, statut: string) => {
    if (!clubId) {
      return;
    }

    try {
      setError(null);
      await api.patch(
        `/clubs/${clubId}/tasks/${taskId}/status`,
        { statut },
        { headers },
      );
      await loadTasks();
      setSuccess("Statut de la tache mis a jour");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la mise a jour du statut",
      );
    }
  };

  const totalAssignments = useMemo(
    () =>
      tasks.reduce((acc, task) => acc + (task.affectations?.length || 0), 0),
    [tasks],
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${dateStr} à ${timeStr}`;
  };

  const isOverdue = (dateLimite: string) => new Date(dateLimite) < new Date();

  const normalizeStatus = (status: string) => {
    if (!status) {
      return "EN_ATTENTE";
    }

    const normalized = status.toUpperCase();
    if (normalized === "A_FAIRE") {
      return "EN_ATTENTE";
    }

    return normalized;
  };

  const statusLabel = (status: string) => {
    const normalized = normalizeStatus(status);

    if (normalized === "EN_ATTENTE") return "En attente";
    if (normalized === "EN_COURS") return "En cours";
    if (normalized === "TERMINE") return "Terminee";
    if (normalized === "VALIDEE") return "Validee";
    if (normalized === "REFUSE") return "Refusee";
    if (normalized === "ANNULE") return "Annulee";

    return "En attente";
  };

  const statusIcon = (status: string) => {
    const normalized = normalizeStatus(status);

    if (normalized === "EN_ATTENTE") return <AlertCircle size={14} />;
    if (normalized === "EN_COURS") return <Users size={14} />;
    if (normalized === "TERMINE") return <CheckCircle2 size={14} />;
    if (normalized === "VALIDEE") return <ShieldCheck size={14} />;
    if (normalized === "REFUSE") return <XCircle size={14} />;

    return <AlertCircle size={14} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E5A66] mx-auto" />
          <p className="mt-4 text-slate-600">Chargement des taches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#2E5A66] sm:text-3xl">
                Tableau des taches du club
              </h1>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Creez, modifiez, supprimez et affectez des taches a un ou
                plusieurs membres du staff.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E5A66] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#244751] sm:w-auto"
            >
              <Plus size={18} />
              Nouvelle tache
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiCard title="Total taches" value={tasks.length.toString()} />
            <KpiCard
              title="Membres affectes"
              value={totalAssignments.toString()}
              icon={<Users size={16} className="text-emerald-700" />}
            />
            <KpiCard
              title="Echeances depassees"
              value={tasks
                .filter((task) => isOverdue(task.date_limite))
                .length.toString()}
              icon={<AlertCircle size={16} className="text-red-600" />}
            />
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <section className="mt-6 space-y-4">
          {tasks.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Flag size={42} className="mx-auto text-slate-300" />
              <h3 className="mt-4 text-xl font-semibold text-slate-700">
                Aucune tache pour le moment
              </h3>
              <p className="mt-2 text-slate-500">
                Ajoutez une tache pour demarrer la planification.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 rounded-xl bg-[#2E5A66] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244751]"
              >
                Creer une tache
              </button>
            </div>
          ) : (
            tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-800 sm:text-xl">
                        {task.titre}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${priorityColors[task.priorite]}`}
                      >
                        {priorityIcons[task.priorite]}
                        {task.priorite}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                        {task.type_tache}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${statusColors[normalizeStatus(task.statut)]}`}
                      >
                        {statusIcon(normalizeStatus(task.statut))}
                        {statusLabel(normalizeStatus(task.statut))}
                      </span>
                    </div>

                    {task.description && (
                      <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 sm:text-base">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <Calendar size={15} />
                        <span
                          className={
                            isOverdue(task.date_limite)
                              ? "font-medium text-red-600"
                              : ""
                          }
                        >
                          Echeance: {formatDateTime(task.date_limite)}
                        </span>
                      </div>

                      {task.createur && (
                        <div className="inline-flex items-center gap-2">
                          <User size={15} />
                          <span>
                            Cree par {task.createur.prenom} {task.createur.nom}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Affectation staff
                      </p>
                      {task.affectations && task.affectations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {task.affectations.map((affectation) => (
                            <span
                              key={affectation.id}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                            >
                              {affectation.utilisateur.prenom}{" "}
                              {affectation.utilisateur.nom}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Aucun membre affecte.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:ml-4">
                    {normalizeStatus(task.statut) === "TERMINE" && (
                      <>
                        <button
                          onClick={() =>
                            void changeTaskStatus(task.id, "VALIDEE")
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                          title="Valider"
                        >
                          <CheckCircle2 size={15} />
                          Valider
                        </button>
                        <button
                          onClick={() =>
                            void changeTaskStatus(task.id, "REFUSE")
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                          title="Refuser"
                        >
                          <XCircle size={15} />
                          Refuser
                        </button>
                      </>
                    )}
                    {(normalizeStatus(task.statut) === "EN_ATTENTE" ||
                      normalizeStatus(task.statut) === "EN_COURS") &&
                      canCancelTask && (
                        <button
                          onClick={() =>
                            void changeTaskStatus(task.id, "ANNULE")
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-orange-200 px-3 py-2 text-sm font-medium text-orange-700 transition hover:bg-orange-50"
                          title="Annuler"
                        >
                          <XCircle size={15} />
                          Annuler
                        </button>
                      )}
                    {canManageTasks && (
                      <button
                        onClick={() => setEditingTask(task)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        title="Modifier"
                      >
                        <Pencil size={15} />
                        Modifier
                      </button>
                    )}
                    <button
                      onClick={() => setDeletingTask(task)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      {isCreateModalOpen && (
        <TaskModal
          mode="create"
          title="Creer une nouvelle tache"
          submitLabel="Creer la tache"
          staff={staff}
          staffLoading={staffLoading}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={createTask}
        />
      )}

      {editingTask && (
        <TaskModal
          mode="edit"
          title="Modifier la tache"
          submitLabel="Enregistrer"
          staff={staff}
          staffLoading={staffLoading}
          initialData={{
            titre: editingTask.titre,
            description: editingTask.description || "",
            priorite: editingTask.priorite,
            date_limite: toInputDate(editingTask.date_limite),
            date_limite_time: toInputTime(editingTask.date_limite),
            type_tache: editingTask.type_tache,
            utilisateurs: (editingTask.affectations || []).map(
              (item) => item.utilisateur.id,
            ),
          }}
          onClose={() => setEditingTask(null)}
          onSubmit={(data) => updateTask(editingTask.id, data)}
        />
      )}

      {deletingTask && (
        <ConfirmDeleteModal
          taskTitle={deletingTask.titre}
          onCancel={() => setDeletingTask(null)}
          onConfirm={deleteTask}
        />
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {title}
        </p>
        {icon || <Flag size={16} className="text-slate-400" />}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

interface TaskModalProps {
  mode: "create" | "edit";
  title: string;
  submitLabel: string;
  staff: ClubStaff[];
  staffLoading: boolean;
  initialData?: TaskFormData;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
}

type TaskFieldErrors = Partial<{
  titre: string;
  date_limite: string;
  date_limite_time: string;
  type_tache: string;
  utilisateurs: string;
}>;

function TaskModal({
  mode,
  title,
  submitLabel,
  staff,
  staffLoading,
  initialData,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>(
    initialData || defaultTaskForm,
  );
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<TaskFieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(initialData || defaultTaskForm);
    setFieldErrors({});
    setGeneralError(null);
  }, [initialData]);

  const leadTimeWarning = getLeadTimeWarning(
    formData.date_limite,
    formData.date_limite_time,
  );
  const timeMin = getTimeMinForDate(formData.date_limite);

  const toggleMember = (memberId: string) => {
    const isSelected = formData.utilisateurs.includes(memberId);
    setFormData((prev) => ({
      ...prev,
      utilisateurs: isSelected
        ? prev.utilisateurs.filter((id) => id !== memberId)
        : [...prev.utilisateurs, memberId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateTaskForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    const validationError = getLeadTimeWarning(
      formData.date_limite,
      formData.date_limite_time,
    );

    if (validationError) {
      setFieldErrors((current) => ({
        ...current,
        date_limite_time: validationError,
      }));
      return;
    }

    setLoading(true);
    try {
      setFieldErrors({});
      setGeneralError(null);
      await onSubmit(formData);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      if (apiMessage) {
        const mapped = mapApiErrorToFieldErrors(apiMessage);
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
          setGeneralError(null);
        } else {
          setFieldErrors({});
          setGeneralError(apiMessage);
        }
      } else {
        setFieldErrors({});
        setGeneralError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="w-full rounded-t-3xl border border-slate-200 bg-white shadow-xl sm:max-h-[92vh] sm:max-w-3xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-[#2E5A66] sm:text-2xl">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[80vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6"
        >
          {generalError && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {generalError}
            </div>
          )}
          {Object.keys(fieldErrors).length > 0 && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Corrigez les champs signalés ci-dessous.
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Titre de la tache *
              </label>
              <input
                required
                maxLength={120}
                value={formData.titre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, titre: e.target.value }))
                }
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#2E5A66]/20 ${fieldErrors.titre ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200" : "border-slate-300 focus:border-[#2E5A66]"}`}
                placeholder="Ex: Preparation de la reunion"
              />
              {fieldErrors.titre && (
                <p className="mt-2 text-xs text-rose-600">
                  {fieldErrors.titre}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                rows={4}
                maxLength={1000}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2E5A66] focus:ring-2 focus:ring-[#2E5A66]/20"
                placeholder="Detaillez les objectifs et attentes de la tache"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Priorite *
                </label>
                <select
                  required
                  value={formData.priorite}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priorite: e.target.value as TaskFormData["priorite"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#2E5A66] focus:ring-2 focus:ring-[#2E5A66]/20"
                >
                  <option value="HAUTE">Haute</option>
                  <option value="MOYENNE">Moyenne</option>
                  <option value="FAIBLE">Faible</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date limite *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date_limite}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      date_limite: e.target.value,
                    }))
                  }
                  min={
                    mode === "create"
                      ? new Date().toISOString().split("T")[0]
                      : undefined
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#2E5A66]/20 ${fieldErrors.date_limite ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200" : "border-slate-300 focus:border-[#2E5A66]"}`}
                />
                {fieldErrors.date_limite && (
                  <p className="mt-2 text-xs text-rose-600">
                    {fieldErrors.date_limite}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Heure limite *
                </label>
                <input
                  type="time"
                  required
                  value={formData.date_limite_time}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      date_limite_time: e.target.value,
                    }))
                  }
                  min={timeMin}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#2E5A66]/20 ${fieldErrors.date_limite_time ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200" : "border-slate-300 focus:border-[#2E5A66]"}`}
                />
                {timeMin ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Heure minimum autorisée pour aujourd'hui: {timeMin}
                  </p>
                ) : null}
                {fieldErrors.date_limite_time && (
                  <p className="mt-2 text-xs text-rose-600">
                    {fieldErrors.date_limite_time}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Type de tache *
              </label>
              <select
                required
                value={formData.type_tache}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type_tache: e.target.value,
                  }))
                }
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#2E5A66]/20 ${fieldErrors.type_tache ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200" : "border-slate-300 focus:border-[#2E5A66]"}`}
              >
                <option value="">Selectionner un type</option>
                {taskTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {fieldErrors.type_tache && (
                <p className="mt-2 text-xs text-rose-600">
                  {fieldErrors.type_tache}
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Affecter a un ou plusieurs membres
                </label>
                <span className="text-xs text-slate-500">
                  {formData.utilisateurs.length} selection
                  {formData.utilisateurs.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-300 p-3">
                {staffLoading ? (
                  <p className="text-sm text-slate-500">
                    Chargement du staff...
                  </p>
                ) : staff.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucun membre staff disponible.
                  </p>
                ) : (
                  staff.map((member) => {
                    const selected = formData.utilisateurs.includes(member.id);
                    return (
                      <label
                        key={member.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                          selected
                            ? "border-[#2E5A66] bg-[#2E5A66]/5"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-slate-700">
                            {member.prenom} {member.nom}
                          </p>
                          <p className="text-xs text-slate-500">
                            {member.role_dans_club}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleMember(member.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#2E5A66] focus:ring-[#2E5A66]"
                        />
                      </label>
                    );
                  })
                )}
              </div>
              {fieldErrors.utilisateurs && (
                <p className="mt-2 text-xs text-rose-600">
                  {fieldErrors.utilisateurs}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#2E5A66] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244751] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Traitement..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  taskTitle,
  onCancel,
  onConfirm,
}: {
  taskTitle: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-slate-800">Supprimer la tache</h3>
        <p className="mt-2 text-sm text-slate-600">
          Voulez-vous vraiment supprimer la tache "{taskTitle}" ? Cette action
          est irreversible.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function toInputDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().split("T")[0];
}

function toInputTime(dateString: string) {
  if (!dateString) {
    return "";
  }
  // Extract HH:mm directly from ISO string (e.g., "2026-05-17T14:30:00Z")
  const match = dateString.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function buildLocalDateTime(date: string, time: string) {
  if (!date || !time) {
    return new Date(NaN);
  }

  return new Date(`${date}T${time}:00`);
}

function getLeadTimeWarning(date: string, time: string) {
  if (!date || !time) {
    return "";
  }

  const selected = buildLocalDateTime(date, time);
  if (Number.isNaN(selected.getTime())) {
    return "";
  }

  const today = new Date().toISOString().split("T")[0];
  if (date !== today) {
    return "";
  }

  const minimumDateTime = new Date(Date.now() + 60 * 60 * 1000);
  if (selected.getTime() < minimumDateTime.getTime()) {
    return "On laisse le temps au staff faire cette tache minimum une heure.";
  }

  return "";
}

function getTimeMinForDate(date: string) {
  if (!date) {
    return undefined;
  }

  const today = new Date().toISOString().split("T")[0];
  if (date !== today) {
    return undefined;
  }

  const minimum = new Date(Date.now() + 60 * 60 * 1000);
  const hours = String(minimum.getHours()).padStart(2, "0");
  const minutes = String(minimum.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function validateTaskForm(formData: TaskFormData): TaskFieldErrors {
  const errors: TaskFieldErrors = {};

  if (!formData.titre.trim()) {
    errors.titre = "Le titre est obligatoire.";
  }

  if (!formData.date_limite) {
    errors.date_limite = "La date limite est obligatoire.";
  }

  if (!formData.date_limite_time) {
    errors.date_limite_time = "L'heure limite est obligatoire.";
  }

  if (!formData.type_tache) {
    errors.type_tache = "Le type de tache est obligatoire.";
  }

  return errors;
}

function mapApiErrorToFieldErrors(message: string): TaskFieldErrors {
  const lower = (message || "").toLowerCase();

  if (lower.includes("titre")) {
    return { titre: message };
  }

  if (lower.includes("heure") || lower.includes("time")) {
    return { date_limite_time: message };
  }

  if (lower.includes("date")) {
    return { date_limite: message };
  }

  if (lower.includes("type")) {
    return { type_tache: message };
  }

  if (lower.includes("staff") || lower.includes("affect")) {
    return { utilisateurs: message };
  }
  // If message seems generic, return empty so it becomes a general error
  if (
    lower.includes("erreur") ||
    lower.includes("creation") ||
    lower.includes("tache") ||
    lower.trim().length < 10
  ) {
    return {};
  }

  return { date_limite_time: message };
}
