import { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  Plus,
  Trash2,
  ShieldCheck,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Filter,
  ShieldAlert,
} from "lucide-react";

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

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  // ÉTATS DES MODALES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string | null;
    name: string;
  }>({
    isOpen: false,
    id: null,
    name: "",
  });

  const [newRole, setNewRole] = useState({ nom: "", description: "" });
  const [selectedGouv, setSelectedGouv] = useState("");
  const [selectedSalleId, setSelectedSalleId] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    loadData();
  }, []);

  const showAlert = (msg: string, type: "error" | "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [resRoles, resSalles] = await Promise.all([
        api.get("/roles", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/salles", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setRoles(resRoles.data);
      setSalles(resSalles.data);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: any) => {
    e.preventDefault();
    try {
      await api.post("/roles", newRole, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsModalOpen(false);
      setNewRole({ nom: "", description: "" });
      loadData();
      showAlert("Nouveau grade créé avec succès", "success");
    } catch (err) {
      showAlert("Erreur : Ce rôle existe déjà", "error");
    }
  };

  // --- LOGIQUE DE SUPPRESSION SÉCURISÉE ---
  const executeDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await api.delete(`/roles/${deleteConfirm.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteConfirm({ isOpen: false, id: null, name: "" });
      loadData();
      showAlert("Le grade a été supprimé", "success");
    } catch (err: any) {
      setDeleteConfirm({ isOpen: false, id: null, name: "" });
      // On capture l'erreur si des utilisateurs sont liés au rôle
      showAlert("Impossible : des membres utilisent encore ce rôle", "error");
    }
  };

  const getFilteredCount = (roleUsers: any[]) => {
    if (!roleUsers) return 0;
    return roleUsers.filter((u: any) => {
      const matchGouv = !selectedGouv || u.salles?.gouvernorat === selectedGouv;
      const matchSalle = !selectedSalleId || u.id_salle === selectedSalleId;
      return matchGouv && matchSalle;
    }).length;
  };

  const filteredSalles = salles.filter(
    (s: any) => !selectedGouv || s.gouvernorat === selectedGouv,
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 relative pb-10">
      {/* 🔔 JOLI TOAST NOTIFICATION */}
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[1000] p-6 rounded-[30px] shadow-2xl animate-in slide-in-from-right-10 border border-white/20 backdrop-blur-md ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-smart-sage text-smart-teal"}`}
        >
          <div className="flex items-center space-x-3 font-black italic">
            {notification.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6">
        <div>
          <h1 className="text-6xl font-black text-smart-teal tracking-tighter italic leading-none">
            Grades
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.5em] mt-3 ml-1">
            Gestion des habilitations
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-smart-teal text-white p-5 rounded-[30px] shadow-xl hover:bg-black transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* FILTRES ANALYTIQUES */}
      <div className="bg-white p-4 rounded-[35px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center px-4 text-smart-teal opacity-30">
          <Filter size={18} />
        </div>
        <select
          dir="rtl"
          className="flex-1 p-3 bg-smart-bg rounded-2xl outline-none font-black text-xs text-smart-teal border-none appearance-none cursor-pointer"
          value={selectedGouv}
          onChange={(e) => {
            setSelectedGouv(e.target.value);
            setSelectedSalleId("");
          }}
        >
          <option value="">🗺️ Toutes les régions</option>
          {GOUVERNORATS_AR.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          disabled={!selectedGouv}
          className="flex-1 p-3 bg-smart-bg rounded-2xl outline-none font-black text-xs text-smart-teal border-none disabled:opacity-30"
          value={selectedSalleId}
          onChange={(e) => setSelectedSalleId(e.target.value)}
        >
          <option value="">🏛️ Tous les centres</option>
          {filteredSalles.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>
      </div>

      {/* GRILLE DES RÔLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2
              className="animate-spin inline text-smart-teal"
              size={40}
            />
          </div>
        ) : (
          roles.map((role: any) => {
            const count = getFilteredCount(role.utilisateurs);
            return (
              <div
                key={role.id}
                className="bg-white p-10 rounded-[55px] shadow-sm border border-gray-50 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-8 right-10 text-right">
                  <p className="text-5xl font-black text-smart-teal tracking-tighter italic">
                    {count}
                  </p>
                  <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">
                    Membres
                  </p>
                </div>
                <div>
                  <div className="bg-smart-sage w-14 h-14 rounded-[22px] flex items-center justify-center text-smart-teal mb-8 shadow-inner border border-white">
                    <ShieldCheck size={28} />
                  </div>
                  <h3 className="text-3xl font-black text-smart-teal tracking-tighter italic uppercase">
                    {role.nom}
                  </h3>
                  <p className="text-gray-400 text-xs font-medium mt-4 leading-relaxed line-clamp-2">
                    {role.description || "Droits d'accès standards."}
                  </p>
                </div>
                <div className="mt-10 pt-8 border-t border-gray-50 flex justify-end">
                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        id: role.id,
                        name: role.nom,
                      })
                    }
                    className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-[#E98A7D] hover:text-white transition-all shadow-sm active:scale-90 cursor-pointer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div
                  className={`absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-20 ${count > 0 ? "bg-smart-sage" : "bg-gray-100"}`}
                ></div>
              </div>
            );
          })
        )}
      </div>

      {/* 🎨 MODALE SUPPRESSION (REMPLACE LOCALHOST) */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 bg-[#1A1C1E]/90 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[60px] p-16 max-w-sm w-full text-center shadow-2xl border-8 border-red-50 animate-in zoom-in">
            <div className="w-24 h-24 bg-red-100 text-[#E98A7D] rounded-[40px] flex items-center justify-center mx-auto mb-10 animate-bounce">
              <ShieldAlert size={44} />
            </div>
            <h3 className="text-4xl font-black text-[#1A1C1E] tracking-tighter mb-4 italic leading-none">
              Attention !
            </h3>
            <p className="text-gray-400 font-medium text-sm leading-relaxed mb-10 italic">
              Supprimer définitivement le grade{" "}
              <span className="text-red-500 font-black">
                {deleteConfirm.name}
              </span>{" "}
              ?
            </p>
            <div className="space-y-4">
              <button
                onClick={executeDelete}
                className="w-full bg-[#E98A7D] text-white py-6 rounded-[30px] font-black text-xl hover:bg-red-600 transition-all active:scale-95 shadow-xl shadow-red-100"
              >
                Oui, Supprimer
              </button>
              <button
                onClick={() =>
                  setDeleteConfirm({ isOpen: false, id: null, name: "" })
                }
                className="w-full text-gray-300 font-black text-xs uppercase tracking-widest pt-4"
              >
                Conserver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎨 MODAL AJOUT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#1A1C1E]/60 backdrop-blur-md p-6">
          <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-sm w-full shadow-2xl border-4 border-white animate-in zoom-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-2 rounded-full shadow-sm"
            >
              <X size={20} />
            </button>
            <h2 className="text-4xl font-black text-smart-teal italic mb-8 tracking-tighter">
              Nouveau Grade
            </h2>
            <form onSubmit={handleAdd} className="space-y-6">
              <input
                required
                placeholder="NOM DU RÔLE..."
                className="w-full p-6 bg-white rounded-[32px] font-black text-lg text-smart-teal outline-none shadow-sm uppercase border-none"
                onChange={(e) =>
                  setNewRole({ ...newRole, nom: e.target.value.toUpperCase() })
                }
              />
              <textarea
                placeholder="Description des droits..."
                className="w-full p-6 bg-white rounded-[32px] font-bold text-sm text-smart-teal outline-none shadow-sm h-32 resize-none border-none"
                onChange={(e) =>
                  setNewRole({ ...newRole, description: e.target.value })
                }
              />
              <button
                type="submit"
                className="w-full bg-smart-teal text-white py-6 rounded-[35px] font-black text-xl shadow-xl hover:bg-black transition-all active:scale-95 italic"
              >
                CRÉER LE RÔLE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
