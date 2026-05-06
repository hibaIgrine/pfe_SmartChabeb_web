import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
  Plus,
  Calendar,
  Flag,
  AlertCircle,
  Edit,
  Trash2,
  User,
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

const priorityColors = {
  HAUTE: "bg-red-100 text-red-700 border-red-200",
  MOYENNE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  FAIBLE: "bg-green-100 text-green-700 border-green-200",
};

const priorityIcons = {
  HAUTE: <Flag size={14} className="text-red-600" />,
  MOYENNE: <Flag size={14} className="text-yellow-600" />,
  FAIBLE: <Flag size={14} className="text-green-600" />,
};

export default function ClubTasksPage() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ClubTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [staff, setStaff] = useState<ClubStaff[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (clubId) {
      loadTasks();
      loadStaff();
    }
  }, [clubId]);

  const loadStaff = async () => {
    try {
      setStaffLoading(true);
      const response = await api.get(`/clubs/${clubId}/tasks/staff`, { headers });
      setStaff(response.data || []);
    } catch (err: any) {
      console.error("Error loading staff:", err);
    } finally {
      setStaffLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      console.log("Loading tasks for club:", clubId);
      const response = await api.get(`/clubs/${clubId}/tasks`, { headers });
      console.log("Tasks response:", response.data);
      setTasks(response.data || []);
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      setError(err.response?.data?.message || "Erreur lors du chargement des tâches");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      await api.post(`/clubs/${clubId}/tasks`, taskData, { headers });
      await loadTasks();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la création de la tâche");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isOverdue = (dateLimite: string) => {
    return new Date(dateLimite) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#436D75] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#436D75]">Gestion des Tâches</h1>
              <p className="text-gray-600 mt-2">Organisez et suivez les tâches de votre club</p>
              <p className="text-sm text-gray-500 mt-1">Club ID: {clubId}</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-[#436D75] text-white px-6 py-3 rounded-xl hover:bg-[#33545B] transition"
            >
              <Plus size={20} />
              Nouvelle Tâche
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Tasks List */}
        <div className="grid gap-4">
          {tasks.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Flag size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune tâche</h3>
              <p className="text-gray-500 mb-6">Commencez par créer votre première tâche</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#436D75] text-white px-6 py-3 rounded-xl hover:bg-[#33545B] transition"
              >
                Créer une tâche
              </button>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-800">{task.titre}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priorite]}`}
                      >
                        {priorityIcons[task.priorite]}
                        {task.priorite}
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium">
                        {task.type_tache}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-gray-600 mb-4 leading-relaxed">{task.description}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span className={isOverdue(task.date_limite) ? "text-red-600 font-medium" : ""}>
                          Échéance: {formatDate(task.date_limite)}
                        </span>
                        {isOverdue(task.date_limite) && (
                          <AlertCircle size={16} className="text-red-600" />
                        )}
                      </div>
                      
                      {task.createur && (
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          <span>
                            {task.createur.prenom} {task.createur.nom}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Affichage des affectations */}
                    {task.affectations && task.affectations.length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-700">Assigné à:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {task.affectations.map((affectation) => (
                            <div
                              key={affectation.id}
                              className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 text-sm"
                            >
                              {affectation.utilisateur.photo_profil_url ? (
                                <img
                                  src={affectation.utilisateur.photo_profil_url}
                                  alt={affectation.utilisateur.prenom}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {affectation.utilisateur.prenom[0]}
                                  </span>
                                </div>
                              )}
                              <span className="text-gray-700">
                                {affectation.utilisateur.prenom} {affectation.utilisateur.nom}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => console.log("Edit task:", task.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      title="Modifier"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => console.log("Delete task:", task.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => console.log("Manage assignments:", task.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Gérer les affectations"
                    >
                      <User size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Task Modal */}
        {isCreateModalOpen && (
          <CreateTaskModal
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateTask}
            staff={staff}
          />
        )}
      </div>
    </div>
  );
}

// Create Task Modal Component
interface CreateTaskModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  staff: ClubStaff[];
}

function CreateTaskModal({ onClose, onSubmit, staff }: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    priorite: "MOYENNE" as "HAUTE" | "MOYENNE" | "FAIBLE",
    date_limite: "",
    type_tache: "",
    utilisateurs: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const taskTypes = [
    "Organisation",
    "Logistique", 
    "Communication",
    "Administratif",
    "Événementiel",
    "Financement",
    "Formation",
    "Autre"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#436D75]">Créer une nouvelle tâche</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de la tâche *
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#436D75] focus:border-transparent"
              placeholder="Ex: Préparer la réunion mensuelle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              maxLength={1000}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#436D75] focus:border-transparent"
              placeholder="Décrivez les détails de la tâche..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorité *
              </label>
              <select
                required
                value={formData.priorite}
                onChange={(e) => setFormData({ ...formData, priorite: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#436D75] focus:border-transparent"
              >
                <option value="HAUTE">🔴 Haute</option>
                <option value="MOYENNE">🟡 Moyenne</option>
                <option value="FAIBLE">🟢 Faible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date limite *
              </label>
              <input
                type="date"
                required
                value={formData.date_limite}
                onChange={(e) => setFormData({ ...formData, date_limite: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#436D75] focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de tâche *
            </label>
            <select
              required
              value={formData.type_tache}
              onChange={(e) => setFormData({ ...formData, type_tache: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#436D75] focus:border-transparent"
            >
              <option value="">Sélectionner un type</option>
              {taskTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Affecter à des membres du staff
            </label>
            <select
              multiple
              value={formData.utilisateurs}
              onChange={(e) => setFormData({ ...formData, utilisateurs: Array.from(e.target.selectedOptions, option => option.value) as string[] })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#436D75] focus:border-transparent"
              size={4}
            >
              <option value="" disabled>Sélectionner des membres...</option>
              {staff.map((member: ClubStaff) => (
                <option key={member.id} value={member.id}>
                  {member.prenom} {member.nom} - {member.role_dans_club}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Maintenez Ctrl/Cmd pour sélectionner plusieurs membres
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#436D75] text-white rounded-xl hover:bg-[#33545B] transition disabled:opacity-50"
            >
              {loading ? "Création..." : "Créer la tâche"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
