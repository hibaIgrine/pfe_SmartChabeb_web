import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  Plus,
  Trash2,
  Edit,
  X,
  Loader2,
  AlertCircle,
  MapPin,
  Activity,
} from "lucide-react";

const GOUVERNORATS = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "Kef",
  "Mahdia",
  "Manouba",
  "Médenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
];

export default function CentresPage() {
  const [salles, setSalles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSalleId, setEditingSalleId] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

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
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    let newErrors: any = {};
    if (!formData.nom.trim())
      newErrors.nom = "Le nom du centre est obligatoire";
    if (!formData.gouvernorat)
      newErrors.gouvernorat = "Veuillez choisir un gouvernorat";
    if (!/^\d{4}$/.test(formData.code_postal))
      newErrors.code_postal = "4 chiffres requis";
    if (!/^\d{8}$/.test(formData.telephone_salle))
      newErrors.telephone_salle = "8 chiffres requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddModal = () => {
    setEditingSalleId(null);
    setErrors({});
    setFormData({
      nom: "",
      gouvernorat: "",
      delegation: "",
      code_postal: "",
      adresse: "",
      telephone_salle: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (salle: any) => {
    setEditingSalleId(salle.id);
    setErrors({});
    setFormData(salle);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
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
    } catch (err: any) {
      if (err.response?.status === 409)
        setErrors({ nom: "Ce nom de centre existe déjà." });
      else alert("Erreur de sauvegarde");
    }
  };

  const deleteSalle = async (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce centre ?")) {
      try {
        await api.delete(`/salles/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchSalles();
      } catch (err) {
        alert("Action refusée");
      }
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      {/* 🇹🇳 HEADER OFFICIEL (Creativity Part) */}
      <div className="flex justify-between items-start mb-12">
        <div className="flex items-center space-x-4">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg"
            alt="Tunisie"
            className="h-10 rounded-md shadow-sm"
          />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400">
              République Tunisienne
            </p>
            <p className="text-sm font-black text-[#1A1C1E]">
              Ministère de la Jeunesse et des Sports
            </p>
          </div>
        </div>
      </div>

      {/* TITRE ET GREETING */}
      <div className="mb-10">
        <h1 className="text-5xl font-black text-[#1A1C1E] tracking-tighter">
          Gestion des Centres
        </h1>
        <p className="text-gray-500 mt-2 font-medium text-lg">
          Interface d'administration du réseau national{" "}
          <span className="text-[#1A1C1E] font-bold">SmartChabeb</span>.
        </p>
      </div>

      {/* STATS ET ACTION (Style Image) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-[#D9E8D1] p-8 rounded-[40px] flex justify-between items-center shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-widest opacity-60">
              Total Établissements
            </p>
            <p className="text-5xl font-black mt-2 text-[#1A1C1E]">
              {salles.length}
            </p>
          </div>
          <div className="bg-white/40 p-5 rounded-[25px] relative z-10 shadow-inner">
            <Activity size={32} className="text-[#1A1C1E]" />
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        </div>

        <button
          onClick={openAddModal}
          className="md:col-span-2 bg-white p-2 rounded-[40px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500"
        >
          <div className="flex items-center space-x-6 ml-6">
            <div className="bg-[#1A1C1E] text-white p-5 rounded-[25px] group-hover:rotate-90 transition-transform duration-500 shadow-lg">
              <Plus size={28} />
            </div>
            <div className="text-left">
              <span className="block font-black text-xl text-[#1A1C1E]">
                Inscrire un nouveau centre
              </span>
              <span className="text-gray-400 text-sm font-medium">
                Ajouter une maison de jeunes à la base de données
              </span>
            </div>
          </div>
          <div className="mr-8 opacity-20 group-hover:opacity-100 transition-opacity">
            <MapPin size={40} className="text-[#1A1C1E]" />
          </div>
        </button>
      </div>

      {/* TABLEAU (Style Activity Summary) */}
      <div className="bg-white rounded-[45px] p-10 shadow-sm border border-gray-50 mb-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#1A1C1E]" size={40} />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase tracking-[0.25em] font-black border-b border-gray-50">
                <th className="pb-8 pl-4">Nom de l'institution</th>
                <th className="pb-8 text-center">Région</th>
                <th className="pb-8 text-center">Contact</th>
                <th className="pb-8 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {salles.map((salle: any) => (
                <tr
                  key={salle.id}
                  className="group hover:bg-[#FDFCF9] transition-all duration-300"
                >
                  <td className="py-8 pl-4">
                    <div className="flex items-center space-x-5">
                      <div className="w-14 h-14 bg-[#F7F3E9] rounded-[22px] flex items-center justify-center font-black text-[#1A1C1E] text-xl shadow-sm border border-white">
                        {salle.nom[0]}
                      </div>
                      <div>
                        <span className="block font-black text-[#1A1C1E] text-lg">
                          {salle.nom}
                        </span>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                          {salle.delegation}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-8 text-center">
                    <span className="bg-[#E8DEF8] px-4 py-2 rounded-full text-[#6750A4] font-black text-[10px] uppercase tracking-widest shadow-sm">
                      {salle.gouvernorat}
                    </span>
                  </td>
                  <td className="py-8 text-center font-black text-[#1A1C1E] text-sm tracking-tighter italic">
                    {salle.telephone_salle}
                  </td>
                  <td className="py-8 pr-4">
                    <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                      <button
                        onClick={() => openEditModal(salle)}
                        className="p-3 bg-[#F7F3E9] text-[#1A1C1E] rounded-2xl hover:bg-[#1A1C1E] hover:text-white transition-all shadow-sm"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => deleteSalle(salle.id)}
                        className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 🎨 MODAL STYLISÉE (Creativity Part) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1A1C1E]/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-[#F7F3E9] rounded-[50px] w-full max-w-xl p-12 shadow-2xl relative border border-white/20 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-gray-400 hover:text-[#1A1C1E] transition-colors bg-white p-2 rounded-full shadow-sm"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-black mb-2 text-[#1A1C1E] tracking-tighter">
              {editingSalleId ? "Modifier le centre" : "Nouveau centre"}
            </h2>
            <p className="text-gray-500 font-medium mb-8">
              Informations de l'établissement étatique
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                  Désignation
                </label>
                <input
                  className={`w-full p-5 bg-white border-none rounded-[25px] shadow-sm outline-none focus:ring-4 focus:ring-[#D9E8D1] transition-all font-bold ${errors.nom && "ring-2 ring-red-300"}`}
                  placeholder="Nom officiel..."
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                />
                {errors.nom && (
                  <p className="text-red-500 text-[10px] font-bold ml-4 uppercase tracking-wider italic">
                    {errors.nom}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                    Gouvernorat
                  </label>
                  <select
                    className={`w-full p-5 bg-white border-none rounded-[25px] shadow-sm outline-none focus:ring-4 focus:ring-[#D9E8D1] font-bold ${errors.gouvernorat && "ring-2 ring-red-300"}`}
                    value={formData.gouvernorat}
                    onChange={(e) =>
                      setFormData({ ...formData, gouvernorat: e.target.value })
                    }
                  >
                    <option value="">Choisir...</option>
                    {GOUVERNORATS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                    Délégation
                  </label>
                  <input
                    className="w-full p-5 bg-white border-none rounded-[25px] shadow-sm font-bold outline-none focus:ring-4 focus:ring-[#D9E8D1]"
                    value={formData.delegation}
                    onChange={(e) =>
                      setFormData({ ...formData, delegation: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                    Code Postal
                  </label>
                  <input
                    maxLength={4}
                    className="w-full p-5 bg-white border-none rounded-[25px] shadow-sm font-bold outline-none focus:ring-4 focus:ring-[#D9E8D1]"
                    value={formData.code_postal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code_postal: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                    Téléphone
                  </label>
                  <input
                    maxLength={8}
                    className="w-full p-5 bg-white border-none rounded-[25px] shadow-sm font-bold outline-none focus:ring-4 focus:ring-[#D9E8D1]"
                    value={formData.telephone_salle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telephone_salle: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1A1C1E] text-white py-6 rounded-[30px] font-black text-lg hover:shadow-2xl hover:bg-black transition-all active:scale-95 shadow-xl mt-4"
              >
                {editingSalleId
                  ? "Sauvegarder les changements"
                  : "Confirmer l'ajout"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
