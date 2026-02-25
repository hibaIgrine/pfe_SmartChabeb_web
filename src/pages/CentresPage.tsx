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
  Eye,
  Users2,
  ShieldAlert,
  Dumbbell,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
} from "lucide-react";

// Bibliothèque de graphiques
import {
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const GOUVERNORATS_AR = [
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

// Données fictives pour l'esthétique du Dashboard
const dataRegion = [
  { name: "Sfax", total: 18 },
  { name: "Tunis", total: 15 },
  { name: "Sousse", total: 12 },
  { name: "Ariana", total: 10 },
  { name: "Gafsa", total: 7 },
];

const dataStatus = [
  { name: "Actifs", value: 80, color: "#436d75" },
  { name: "Maintenance", value: 20, color: "#E98A7D" },
];

export default function CentresPage() {
  // --- ÉTATS ---
  const [salles, setSalles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  // Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewingSalle, setViewingSalle] = useState<any>(null);

  const token = localStorage.getItem("token");

  // --- LOGIQUE API ---
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
    } catch (err) {
      showAlert("Erreur de synchronisation", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // RECHERCHE SMART (Gère les valeurs nulles)
  const filteredSalles = salles.filter((salle: any) => {
    const q = searchQuery.toLowerCase();
    return (
      (salle.nom || "").toLowerCase().includes(q) ||
      (salle.gouvernorat || "").toLowerCase().includes(q) ||
      (salle.delegation || "").toLowerCase().includes(q) ||
      (salle.code_postal || "").includes(q)
    );
  });

  // VALIDATION STRICTE
  const validateForm = () => {
    let newErrors: any = {};
    if (!formData.nom.trim()) newErrors.nom = "Désignation obligatoire";
    if (!formData.gouvernorat) newErrors.gouvernorat = "Choisir un gouvernorat";
    if (!formData.delegation.trim())
      newErrors.delegation = "Délégation obligatoire";
    if (!formData.adresse.trim())
      newErrors.adresse = "Adresse précise obligatoire";
    if (formData.code_postal.length !== 4)
      newErrors.code_postal = "4 chiffres requis";
    if (formData.telephone_salle.length !== 8)
      newErrors.telephone_salle = "8 chiffres requis";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showAlert("Veuillez vérifier les champs en rouge", "error");
      return false;
    }
    return true;
  };

  const openViewDrawer = (salle: any) => {
    setViewingSalle(salle);
    setIsDrawerOpen(true);
  };

  const openEditModal = (salle: any) => {
    setEditingSalleId(salle.id);
    setErrors({});
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
    if (!validateForm()) return;
    try {
      if (editingSalleId) {
        await api.patch(`/salles/${editingSalleId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showAlert("Centre mis à jour avec succès", "success");
      } else {
        await api.post("/salles", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showAlert("Nouveau centre ajouté au réseau", "success");
      }
      setIsModalOpen(false);
      fetchSalles();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrors({ ...errors, nom: "Ce nom existe déjà dans le système" });
        showAlert("Erreur de doublon", "error");
      } else {
        showAlert("Erreur serveur", "error");
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-1000 max-w-7xl mx-auto space-y-10 relative pb-20">
      {/* 🔔 CUSTOM TOAST NOTIFICATION */}
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[300] flex items-center space-x-4 p-5 rounded-[30px] shadow-2xl animate-in slide-in-from-right-10 border border-white/20 backdrop-blur-md ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-[#D9E8D1] text-[#436d75]"}`}
        >
          {notification.type === "error" ? (
            <AlertCircle size={24} />
          ) : (
            <CheckCircle2 size={24} />
          )}
          <div className="font-black italic">{notification.msg}</div>
        </div>
      )}

      {/* 1. HEADER & ACTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6">
        <div>
          <h1 className="text-7xl font-black text-[#1A1C1E] tracking-tighter italic">
            Analytics Salles
          </h1>
          <div className="flex items-center space-x-3 mt-2">
            <div className="bg-smart-salmon h-2 w-10 rounded-full"></div>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em]">
              Administration SmartChabeb
            </p>
          </div>
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
          className="bg-[#436d75] text-white px-10 py-5 rounded-[35px] font-black shadow-xl hover:bg-black transition-all flex items-center space-x-3 active:scale-95 cursor-pointer"
        >
          <Plus size={24} /> <span>Ajouter une institution</span>
        </button>
      </div>

      {/* 2. BENTO STATS & CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CARTE CHIFFRE CLÉ */}
        <div className="bg-[#D9E8D1] p-10 rounded-[55px] flex flex-col justify-between relative overflow-hidden shadow-sm border border-white/50 group">
          <div className="z-10">
            <div className="bg-white/40 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <TrendingUp size={24} className="text-[#436d75]" />
            </div>
            <p className="text-xs font-black uppercase text-[#436d75] opacity-60 tracking-widest">
              Couverture Nationale
            </p>
            <h3 className="text-8xl font-black text-[#436d75] tracking-tighter mt-2">
              {salles.length}
            </h3>
          </div>
          <p className="z-10 text-[#436d75] font-bold text-sm italic mt-8">
            Centres de jeunesse connectés
          </p>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
        </div>

        {/* CHART RÉGIONS */}
        <div className="bg-white p-8 rounded-[55px] shadow-sm border border-gray-50 flex flex-col justify-between">
          <div className="flex items-center space-x-3 opacity-40">
            <BarChart3 size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Répartition / Région
            </span>
          </div>
          <div className="h-44 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataRegion}>
                <Bar
                  dataKey="total"
                  fill="#436d75"
                  radius={[10, 10, 10, 10]}
                  barSize={18}
                />
                <Tooltip
                  cursor={{ fill: "#F7F3E9" }}
                  contentStyle={{
                    borderRadius: "20px",
                    border: "none",
                    boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART MAINTENANCE */}
        <div className="bg-white p-8 rounded-[55px] shadow-sm border border-gray-50 flex flex-col items-center justify-center relative">
          <div className="absolute top-8 left-8 flex items-center space-x-3 opacity-40 w-full">
            <PieIcon size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Status du Matériel
            </span>
          </div>
          <div className="h-44 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataStatus}
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {dataStatus.map((entry, index) => (
                    <Cell key={`c-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-[#436d75]"></div>
              <span className="text-[9px] font-black text-gray-400 uppercase">
                Actif
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-[#E98A7D]"></div>
              <span className="text-[9px] font-black text-gray-400 uppercase">
                En Panne
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABLEAU ET RECHERCHE */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-3xl font-black text-[#1A1C1E] tracking-tighter italic">
            Liste des établissements
          </h3>
          <div className="relative group">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#436d75]"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-full shadow-sm outline-none w-72 font-bold text-xs focus:ring-4 focus:ring-[#D9E8D1] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-[60px] p-10 shadow-sm border border-gray-50 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-[#436d75]" size={50} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-300 text-[10px] uppercase tracking-[0.3em] font-black border-b border-gray-50">
                    <th className="pb-8 pl-4">Nom du centre</th>
                    <th className="pb-8">Gouvernorat</th>
                    <th className="pb-8 text-center">CP / Tel</th>
                    <th className="pb-8">Adresse</th>
                    <th className="pb-8 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {filteredSalles.length > 0 ? (
                    filteredSalles.map((salle: any) => (
                      <tr
                        key={salle.id}
                        className="group hover:bg-[#FDFCF9] transition-all duration-300"
                      >
                        <td className="py-8 pl-4">
                          <div className="flex items-center space-x-5">
                            <div className="w-14 h-14 bg-[#F7F3E9] rounded-[24px] flex items-center justify-center font-black text-[#436d75] shadow-inner text-xl italic">
                              {salle.nom ? salle.nom[0].toUpperCase() : "?"}
                            </div>
                            <div>
                              <span className="font-black text-[#1A1C1E] text-lg block leading-none mb-1">
                                {salle.nom}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
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
                          className="py-8 text-gray-400 text-[11px] font-medium max-w-[180px] truncate italic"
                          title={salle.adresse}
                        >
                          {salle.adresse}
                        </td>
                        <td className="py-8 pr-4">
                          <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                            <button
                              onClick={() => openViewDrawer(salle)}
                              title="Statistiques"
                              className="p-3 bg-smart-sage text-[#436d75] rounded-2xl hover:bg-[#436d75] hover:text-white shadow-sm transition-all"
                            >
                              <Eye size={20} />
                            </button>
                            <button
                              onClick={() => openEditModal(salle)}
                              title="Modifier"
                              className="p-3 bg-[#F7F3E9] text-[#436d75] rounded-2xl hover:bg-[#436d75] hover:text-white shadow-sm transition-all"
                            >
                              <Edit size={20} />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm("Supprimer ce centre ?")) {
                                  await api.delete(`/salles/${salle.id}`, {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  });
                                  fetchSalles();
                                  showAlert("Centre supprimé", "success");
                                }
                              }}
                              title="Supprimer"
                              className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white shadow-sm transition-all"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-20 text-center font-black text-gray-300 italic text-2xl"
                      >
                        Aucun centre trouvé...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 📊 DRAWER : QUICK-VIEW DASHBOARD PAR CENTRE */}
      {isDrawerOpen && viewingSalle && (
        <>
          <div
            className="fixed inset-0 bg-[#1A1C1E]/50 backdrop-blur-sm z-[250] animate-in fade-in duration-300"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <div className="fixed top-4 right-4 bottom-4 w-full max-w-md bg-[#F7F3E9] rounded-[60px] shadow-2xl z-[260] p-10 flex flex-col border border-white animate-in slide-in-from-right duration-500">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="absolute top-8 left-8 text-gray-400 hover:text-black bg-white p-3 rounded-full shadow-sm active:scale-90 transition-transform"
            >
              <X size={22} />
            </button>
            <div className="mt-14 mb-10 text-center">
              <div className="w-28 h-28 bg-white rounded-[40px] mx-auto flex items-center justify-center shadow-xl mb-6 text-5xl font-black text-smart-teal border-4 border-white ring-8 ring-white/20 italic">
                {viewingSalle.nom ? viewingSalle.nom[0].toUpperCase() : "?"}
              </div>
              <h2 className="text-4xl font-black text-smart-teal tracking-tighter italic leading-tight">
                {viewingSalle.nom}
              </h2>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
                Gouvernorat de {viewingSalle.gouvernorat}
              </p>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="bg-white p-7 rounded-[40px] flex items-center space-x-6 shadow-sm border border-white/50">
                <div className="bg-[#D9E8D1] p-5 rounded-[22px] text-smart-teal shadow-inner">
                  <Users2 size={26} />
                </div>
                <div>
                  <p className="text-3xl font-black text-smart-teal tracking-tighter">
                    {viewingSalle._count?.utilisateurs || 0}
                  </p>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Adhérents Inscrits
                  </p>
                </div>
              </div>
              <div className="bg-white p-7 rounded-[40px] flex items-center space-x-6 shadow-sm border border-white/50">
                <div className="bg-white/50 p-5 rounded-[22px] text-[#436d75] border border-gray-100">
                  <Dumbbell size={26} />
                </div>
                <div>
                  <p className="text-3xl font-black text-[#436d75] tracking-tighter">
                    {viewingSalle._count?.equipements || 0}
                  </p>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Inventaire Machines
                  </p>
                </div>
              </div>
              <div className="bg-[#E98A7D]/10 p-7 rounded-[40px] flex items-center space-x-6 border border-[#E98A7D]/20 animate-pulse">
                <div className="bg-[#E98A7D] p-5 rounded-[22px] text-white shadow-lg">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <p className="text-sm font-black text-[#E98A7D] leading-tight">
                    Maintenance Requise
                  </p>
                  <p className="text-[9px] font-black uppercase text-[#E98A7D] opacity-60 tracking-widest mt-1 italic">
                    Vérifier les signalements
                  </p>
                </div>
              </div>
              <div className="p-8 bg-white rounded-[40px] border border-gray-50 italic text-[11px] leading-relaxed text-gray-400 font-medium">
                📍 {viewingSalle.adresse}
              </div>
            </div>
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                openEditModal(viewingSalle);
              }}
              className="mt-8 w-full bg-[#436d75] text-white py-6 rounded-[35px] font-black text-xl hover:shadow-2xl active:scale-95 transition-all shadow-[#436d75]/30 shadow-xl"
            >
              Éditer l'institution
            </button>
          </div>
        </>
      )}

      {/* 🎨 MODAL AJOUT/MODIF (STRICTE) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1A1C1E]/70 backdrop-blur-md flex items-center justify-center z-[200] p-6">
          <div className="bg-[#F7F3E9] rounded-[60px] w-full max-w-xl p-12 shadow-2xl relative border border-white animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-3 rounded-full shadow-sm active:scale-90 transition-transform"
            >
              <X size={24} />
            </button>
            <div className="mb-10 text-left">
              <h2 className="text-5xl font-black text-[#436d75] tracking-tighter italic">
                {editingSalleId ? "Modifier" : "Inscrire"}
              </h2>
              <p className="text-gray-400 text-[10px] font-black uppercase mt-1 tracking-widest italic opacity-60">
                Base de données étatique SmartChabeb
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-[0.2em]">
                  Désignation du Centre
                </label>
                <input
                  className={`w-full p-5 bg-white border-none rounded-[30px] shadow-sm font-bold text-[#1A1C1E] text-lg outline-none focus:ring-4 focus:ring-[#D9E8D1] transition-all ${errors.nom && "ring-2 ring-[#E98A7D]"}`}
                  placeholder="Maison de jeunes..."
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                />
                {errors.nom && (
                  <p className="text-[#E98A7D] text-[10px] font-bold ml-6 uppercase italic flex items-center mt-1 animate-in fade-in">
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
                    className={`w-full p-5 bg-white border-none rounded-[30px] shadow-sm font-bold text-[#436d75] text-lg outline-none cursor-pointer appearance-none ${errors.gouvernorat && "ring-2 ring-[#E98A7D]"}`}
                    value={formData.gouvernorat}
                    onChange={(e) =>
                      setFormData({ ...formData, gouvernorat: e.target.value })
                    }
                  >
                    <option value="">اختيار...</option>
                    {GOUVERNORATS_AR.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4">
                    Délégation
                  </label>
                  <input
                    className={`w-full p-5 bg-white border-none rounded-[30px] shadow-sm font-bold text-lg outline-none ${errors.delegation && "ring-2 ring-[#E98A7D]"}`}
                    placeholder="Délégation..."
                    value={formData.delegation}
                    onChange={(e) =>
                      setFormData({ ...formData, delegation: e.target.value })
                    }
                  />
                  {errors.delegation && (
                    <p className="text-[#E98A7D] text-[9px] font-bold ml-6 italic">
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
                    className={`w-full p-5 bg-white border-none rounded-[30px] shadow-sm font-bold text-lg outline-none ${errors.code_postal && "ring-2 ring-[#E98A7D]"}`}
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
                    <p className="text-[#E98A7D] text-[9px] font-bold ml-6">
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
                    className={`w-full p-5 bg-white border-none rounded-[30px] shadow-sm font-bold text-lg outline-none ${errors.telephone_salle && "ring-2 ring-[#E98A7D]"}`}
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
                    <p className="text-[#E98A7D] text-[9px] font-bold ml-6">
                      {errors.telephone_salle}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4">
                  Adresse Géographique
                </label>
                <textarea
                  rows={2}
                  className={`w-full p-5 bg-white border-none rounded-[30px] shadow-sm font-bold text-lg outline-none resize-none transition-all ${errors.adresse && "ring-2 ring-[#E98A7D]"}`}
                  placeholder="Rue, Quartier, Numéro..."
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                />
                {errors.adresse && (
                  <p className="text-[#E98A7D] text-[10px] font-bold ml-6 italic">
                    {errors.adresse}
                  </p>
                )}
              </div>

              <div className="pt-4 pb-4">
                <button
                  type="submit"
                  className="w-full bg-[#1A1C1E] text-white py-6 rounded-[40px] font-black text-2xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95 cursor-pointer shadow-[#1A1C1E]/40 shadow-2xl"
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
