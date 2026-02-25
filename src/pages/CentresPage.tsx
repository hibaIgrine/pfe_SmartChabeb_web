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
  Search,
  CheckCircle2,
} from "lucide-react";

const GOUVERNORATS = [
  "أريانة",
  "باجة",
  "بن عروس",
  "بنزرت",
  "تطاوين",
  "توزر",
  "تونس",
  "جندوبة",
  "زغوان",
  "سليانة",
  "سوسة",
  "سيدي بوزيد",
  "قبلي",
  "صفاقس",
  "قابس",
  "القصرين",
  "قفصة",
  "القيروان",
  "الكاف",
  "مدنين",
  "المنستير",
  "منوبة",
  "المهدية",
  "نابل",
];

export default function CentresPage() {
  const [salles, setSalles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSalleId, setEditingSalleId] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

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

  const showAlert = (msg: string, type: "error" | "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

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

  const filteredSalles = salles.filter((salle: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      salle.nom?.toLowerCase().includes(searchLower) ||
      salle.gouvernorat?.toLowerCase().includes(searchLower) ||
      salle.delegation?.toLowerCase().includes(searchLower) ||
      salle.code_postal?.includes(searchLower) ||
      salle.adresse?.toLowerCase().includes(searchLower)
    );
  });

  const validateForm = () => {
    let newErrors: any = {};
    if (!formData.nom.trim())
      newErrors.nom = "Le nom du centre est obligatoire";
    if (!formData.gouvernorat)
      newErrors.gouvernorat = "Veuillez choisir un gouvernorat";
    if (!formData.delegation.trim())
      newErrors.delegation = "La délégation est obligatoire";
    if (!formData.adresse.trim())
      newErrors.adresse = "L'adresse précise est obligatoire";
    if (formData.code_postal.length !== 4)
      newErrors.code_postal = "4 chiffres exactement requis";
    if (formData.telephone_salle.length !== 8)
      newErrors.telephone_salle = "8 chiffres exactement requis";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showAlert("Veuillez corriger les erreurs", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (editingSalleId) {
        await api.patch(`/salles/${editingSalleId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showAlert("Mise à jour réussie !", "success");
      } else {
        await api.post("/salles", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showAlert("Centre ajouté avec succès !", "success");
      }
      setIsModalOpen(false);
      fetchSalles();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrors({ nom: "Ce centre existe déjà dans la base" });
        showAlert("Ce nom est déjà utilisé", "error");
      } else {
        showAlert("Erreur serveur", "error");
      }
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto space-y-10 relative pb-10">
      {/* 🔔 NOTIFICATION TOAST */}
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[150] flex items-center space-x-4 p-5 rounded-[25px] shadow-2xl animate-in slide-in-from-right-10 duration-500 border border-white/20 backdrop-blur-md ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-[#D9E8D1] text-[#436d75]"}`}
        >
          {notification.type === "error" ? (
            <AlertCircle size={24} />
          ) : (
            <CheckCircle2 size={24} />
          )}
          <div className="font-black tracking-tight">{notification.msg}</div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-6">
        <div>
          <h1 className="text-6xl font-black text-[#1A1C1E] tracking-tighter italic">
            Gestion des Centres
          </h1>
          <p className="text-gray-400 font-bold mt-2 uppercase text-[10px] tracking-[0.3em]">
            Réseau National SmartChabeb
          </p>
        </div>

        <div className="relative group">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#436d75] transition-colors"
            size={22}
          />
          <input
            type="text"
            placeholder="Rechercher partout..."
            className="pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[30px] shadow-sm outline-none w-full md:w-[400px] font-bold text-sm focus:ring-4 focus:ring-[#D9E8D1] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* STATS ET BOUTON ACTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#D9E8D1] p-8 rounded-[45px] flex justify-between items-center relative overflow-hidden shadow-sm border border-white/50">
          <div className="relative z-10">
            <p className="text-xs font-black uppercase opacity-40 text-[#436d75]">
              Établissements
            </p>
            <p className="text-6xl font-black mt-2 text-[#436d75] tracking-tighter">
              {salles.length}
            </p>
          </div>
          <Activity size={50} className="text-[#436d75] opacity-10" />
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
        </div>

        <button
          onClick={() => {
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
          }}
          className="md:col-span-2 bg-[#436d75] p-8 rounded-[45px] shadow-xl shadow-[#436d75]/20 flex items-center justify-between group hover:bg-[#1A1C1E] transition-all duration-500 cursor-pointer text-white"
        >
          <div className="flex items-center space-x-8">
            <div className="bg-white/10 p-6 rounded-[25px] group-hover:rotate-90 transition-transform duration-500 border border-white/10">
              <Plus size={32} />
            </div>
            <div className="text-left">
              <span className="block font-black text-2xl tracking-tight">
                Nouveau Centre
              </span>
              <span className="text-white/50 text-xs font-bold uppercase tracking-widest">
                Inscrire une institution
              </span>
            </div>
          </div>
          <MapPin size={40} className="opacity-20 mr-4" />
        </button>
      </div>

      {/* TABLEAU "MICHELLE STYLE" */}
      <div className="bg-white rounded-[55px] p-10 shadow-sm border border-gray-50 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-[#436d75]" size={50} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-[10px] uppercase tracking-[0.3em] font-black border-b border-gray-50">
                  <th className="pb-8 pl-4">Institution</th>
                  <th className="pb-8">Gouvernorat</th>
                  <th className="pb-8 text-center">CP / Tel</th>
                  <th className="pb-8">Adresse</th>
                  <th className="pb-8 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {filteredSalles.map((salle: any) => (
                  <tr
                    key={salle.id}
                    className="group hover:bg-[#FDFCF9] transition-all duration-300"
                  >
                    <td className="py-8 pl-4">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-[#F7F3E9] rounded-[22px] flex items-center justify-center font-black text-[#436d75] shadow-inner text-xl italic">
                          {salle.nom[0]}
                        </div>
                        <div>
                          <span className="font-black text-[#1A1C1E] text-lg block leading-none mb-1">
                            {salle.nom}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">
                            {salle.delegation}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-8 font-black text-[#436d75] text-lg">
                      {salle.gouvernorat}
                    </td>
                    <td className="py-8 text-center">
                      <p className="font-black text-[#1A1C1E] text-xs">
                        {salle.code_postal}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold italic mt-1">
                        {salle.telephone_salle}
                      </p>
                    </td>
                    <td
                      className="py-8 text-gray-400 text-[11px] font-medium max-w-[200px] truncate italic"
                      title={salle.adresse}
                    >
                      {salle.adresse}
                    </td>
                    <td className="py-8 pr-4 text-right">
                      <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={() => {
                            setEditingSalleId(salle.id);
                            setErrors({});
                            setFormData(salle);
                            setIsModalOpen(true);
                          }}
                          className="p-3 bg-[#F7F3E9] text-[#436d75] rounded-2xl hover:bg-[#436d75] hover:text-white transition-all shadow-sm"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm("Supprimer ce centre ?")) {
                              await api.delete(`/salles/${salle.id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              fetchSalles();
                              showAlert("Centre supprimé", "success");
                            }
                          }}
                          className="p-3 bg-[#E98A7D]/10 text-[#E98A7D] rounded-2xl hover:bg-[#E98A7D] hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL AJOUT/MODIF (LARGE & NO SCROLL) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1A1C1E]/60 backdrop-blur-md flex items-center justify-center z-[200] p-6">
          <div className="bg-[#F7F3E9] rounded-[60px] w-full max-w-xl p-12 shadow-2xl relative border border-white animate-in zoom-in-95 duration-300 max-h-[92vh] overflow-hidden flex flex-col">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-3 rounded-full shadow-sm transition-transform active:scale-90"
            >
              <X size={24} />
            </button>

            <div className="mb-10 text-left">
              <h2 className="text-4xl font-black text-[#436d75] tracking-tighter italic">
                {editingSalleId ? "Modifier le centre" : "Inscrire un centre"}
              </h2>
              <p className="text-gray-400 text-[10px] font-black uppercase mt-1 tracking-widest italic">
                Système d'administration SmartChabeb
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-[0.1em]">
                  Nom de l'établissement
                </label>
                <input
                  className={`w-full p-5 bg-white border-none rounded-[28px] shadow-sm font-bold text-[#1A1C1E] text-lg outline-none focus:ring-4 focus:ring-[#D9E8D1] transition-all ${errors.nom && "ring-2 ring-[#E98A7D]"}`}
                  placeholder="Maison de jeunes..."
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                />
                {errors.nom && (
                  <p className="text-[#E98A7D] text-[10px] font-bold ml-6 uppercase italic flex items-center">
                    <AlertCircle size={12} className="mr-1" /> {errors.nom}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4">
                    Gouvernorat
                  </label>
                  <select
                    dir="rtl"
                    className={`w-full p-5 bg-white border-none rounded-[28px] shadow-sm font-bold text-[#436d75] text-lg outline-none appearance-none cursor-pointer ${errors.gouvernorat && "ring-2 ring-[#E98A7D]"}`}
                    value={formData.gouvernorat}
                    onChange={(e) =>
                      setFormData({ ...formData, gouvernorat: e.target.value })
                    }
                  >
                    <option value="">اختيار...</option>
                    {GOUVERNORATS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  {errors.gouvernorat && (
                    <p className="text-[#E98A7D] text-[10px] font-bold ml-6 uppercase italic mt-1">
                      {errors.gouvernorat}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4">
                    Délégation
                  </label>
                  <input
                    className={`w-full p-5 bg-white border-none rounded-[28px] shadow-sm font-bold text-lg outline-none ${errors.delegation && "ring-2 ring-[#E98A7D]"}`}
                    placeholder="Délégation..."
                    value={formData.delegation}
                    onChange={(e) =>
                      setFormData({ ...formData, delegation: e.target.value })
                    }
                  />
                  {errors.delegation && (
                    <p className="text-[#E98A7D] text-[10px] font-bold ml-6 uppercase italic mt-1">
                      {errors.delegation}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4">
                    Code Postal (4)
                  </label>
                  <input
                    maxLength={4}
                    className={`w-full p-5 bg-white border-none rounded-[28px] shadow-sm font-bold text-lg outline-none ${errors.code_postal && "ring-2 ring-[#E98A7D]"}`}
                    placeholder="0000"
                    value={formData.code_postal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code_postal: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                  {errors.code_postal && (
                    <p className="text-[#E98A7D] text-[10px] font-bold ml-6 uppercase mt-1">
                      {errors.code_postal}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4">
                    Téléphone (8)
                  </label>
                  <input
                    maxLength={8}
                    className={`w-full p-5 bg-white border-none rounded-[28px] shadow-sm font-bold text-lg outline-none ${errors.telephone_salle && "ring-2 ring-[#E98A7D]"}`}
                    placeholder="00 000 000"
                    value={formData.telephone_salle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telephone_salle: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                  {errors.telephone_salle && (
                    <p className="text-[#E98A7D] text-[10px] font-bold ml-6 uppercase mt-1">
                      {errors.telephone_salle}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4">
                  Adresse précise
                </label>
                <textarea
                  rows={2}
                  className={`w-full p-5 bg-white border-none rounded-[28px] shadow-sm font-bold text-lg outline-none resize-none transition-all ${errors.adresse && "ring-2 ring-[#E98A7D]"}`}
                  placeholder="Rue, Quartier, Bâtiment..."
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                />
                {errors.adresse && (
                  <p className="text-[#E98A7D] text-[10px] font-bold ml-6 uppercase italic mt-1">
                    {errors.adresse}
                  </p>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-[#1A1C1E] text-white py-6 rounded-[35px] font-black text-2xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95 cursor-pointer shadow-[#1A1C1E]/30 shadow-xl"
                >
                  {editingSalleId ? "Valider" : "Confirmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
