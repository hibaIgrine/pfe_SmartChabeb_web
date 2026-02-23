import { useEffect, useState } from "react";
import api from "../api/axios";
import { Plus, Trash2, Edit, X, Loader2 } from "lucide-react";

export default function CentresPage() {
  const [salles, setSalles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSalleId, setEditingSalleId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nom: "",
    gouvernorat: "",
    delegation: "",
    code_postal: "",
    adresse: "",
    telephone_salle: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSalles();
  }, []);

  const fetchSalles = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/salles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalles(res.data);
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (salle: any) => {
    setEditingSalleId(salle.id);
    setFormData({
      nom: salle.nom || "",
      gouvernorat: salle.gouvernorat || "",
      delegation: salle.delegation || "",
      code_postal: salle.code_postal || "",
      adresse: salle.adresse || "",
      telephone_salle: salle.telephone_salle || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSalleId) {
        await api.patch(`/salles/${editingSalleId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post("/salles", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setIsModalOpen(false);
      fetchSalles();
      alert("Opération réussie !");
    } catch (err: any) {
      alert(
        "Erreur de sauvegarde : " +
          (err.response?.data?.message || "Erreur serveur"),
      );
    }
  };

  // --- LA FONCTION DE SUPPRESSION CORRIGÉE ---
  const deleteSalle = async (id: string) => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce centre ?",
    );
    if (!confirmed) return;

    try {
      await api.delete(`/salles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSalles(); // On rafraîchit la liste
      alert("Centre supprimé !");
    } catch (err: any) {
      console.error("Erreur suppression:", err);
      // Si l'erreur est 403, c'est que tu n'es pas ADMIN en base
      alert(
        "Erreur : " +
          (err.response?.data?.message ||
            "Impossible de supprimer. Vérifiez vos droits ADMIN."),
      );
    }
  };

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Gestion des Centres
        </h1>
        <button
          onClick={() => {
            setEditingSalleId(null);
            setFormData({
              nom: "",
              gouvernorat: "",
              delegation: "",
              code_postal: "",
              adresse: "",
              telephone_salle: "",
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-900 text-white px-5 py-2.5 rounded-xl flex items-center hover:bg-blue-800 transition-all shadow-md"
        >
          <Plus size={20} className="mr-2" /> Nouveau centre
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-blue-900" size={40} />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Centre</th>
                <th className="p-4">Emplacement (Gouv / Délég)</th>
                <th className="p-4">Code Postal</th>
                <th className="p-4">Téléphone</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {salles.map((salle: any) => (
                <tr
                  key={salle.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="p-4 font-medium text-gray-800">{salle.nom}</td>
                  <td className="p-4 text-gray-600">
                    <span className="font-bold text-blue-900">
                      {salle.gouvernorat}
                    </span>
                    {salle.delegation && ` > ${salle.delegation}`}
                  </td>
                  <td className="p-4 text-gray-500">
                    {salle.code_postal || "---"}
                  </td>
                  <td className="p-4 text-gray-600">
                    {salle.telephone_salle || "---"}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => openEditModal(salle)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        // --- BRANCHEMENT DE LA FONCTION ICI ---
                        onClick={() => deleteSalle(salle.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-blue-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editingSalleId ? "Modifier" : "Ajouter"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                placeholder="Nom du centre"
                className="w-full p-3 border rounded-xl"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Gouvernorat"
                  className="p-3 border rounded-xl"
                  value={formData.gouvernorat}
                  onChange={(e) =>
                    setFormData({ ...formData, gouvernorat: e.target.value })
                  }
                />
                <input
                  placeholder="Délégation"
                  className="p-3 border rounded-xl"
                  value={formData.delegation}
                  onChange={(e) =>
                    setFormData({ ...formData, delegation: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Code Postal"
                  className="p-3 border rounded-xl"
                  value={formData.code_postal}
                  onChange={(e) =>
                    setFormData({ ...formData, code_postal: e.target.value })
                  }
                />
                <input
                  placeholder="Téléphone"
                  className="p-3 border rounded-xl"
                  value={formData.telephone_salle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telephone_salle: e.target.value,
                    })
                  }
                />
              </div>
              <textarea
                placeholder="Adresse complète"
                className="w-full p-3 border rounded-xl"
                value={formData.adresse}
                onChange={(e) =>
                  setFormData({ ...formData, adresse: e.target.value })
                }
              />
              <button
                type="submit"
                className="w-full bg-blue-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg active:scale-95"
              >
                Enregistrer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
