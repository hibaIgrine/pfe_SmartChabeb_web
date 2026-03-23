import { useEffect, useState, useMemo } from "react";
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
  Users,
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
  const [centres, setCentres] = useState([]); // 💡 salles -> centres
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

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
  const [selectedCentreId, setSelectedCentreId] = useState("");

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

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
      const [resRoles, resCentres] = await Promise.all([
        api.get("/roles", { headers }),
        api.get("/centres", { headers }), // 💡 mis à jour
      ]);
      setRoles(resRoles.data);
      setCentres(resCentres.data);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: any) => {
    e.preventDefault();
    try {
      await api.post("/roles", newRole, { headers });
      setIsModalOpen(false);
      setNewRole({ nom: "", description: "" });
      loadData();
      showAlert("Grade enregistré au registre", "success");
    } catch (err) {
      showAlert("Erreur : Grade déjà existant", "error");
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await api.delete(`/roles/${deleteConfirm.id}`, { headers });
      setDeleteConfirm({ isOpen: false, id: null, name: "" });
      loadData();
      showAlert("Grade supprimé avec succès", "success");
    } catch (err) {
      setDeleteConfirm({ isOpen: false, id: null, name: "" });
      showAlert("Action impossible : grade utilisé", "error");
    }
  };

  const filteredCentres = centres.filter(
    (c: any) => !selectedGouv || c.gouvernorat === selectedGouv,
  );

  const getFilteredCount = (roleUsers: any[]) => {
    if (!roleUsers) return 0;
    return roleUsers.filter((u: any) => {
      const matchGouv = !selectedGouv || u.centre?.gouvernorat === selectedGouv;
      const matchCentre = !selectedCentreId || u.id_centre === selectedCentreId;
      return matchGouv && matchCentre;
    }).length;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* 🔔 TOAST NOTIFICATION COMPACT */}
      {notification && (
        <div
          className={`fixed top-8 right-8 z-[1000] flex items-center space-x-3 px-5 py-3 rounded-2xl shadow-xl border border-white/20 backdrop-blur-md animate-in slide-in-from-right-5 ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-[#D9E8D1] text-[#436d75]"}`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span className="text-xs font-black uppercase tracking-wider">
            {notification.msg}
          </span>
        </div>
      )}

      {/* HEADER INSTITUTIONNEL RÉDUIT */}
      <div className="flex justify-between items-end border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-4xl font-black text-smart-teal tracking-tighter italic leading-none">
            Grades & Rôles
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.4em] mt-3">
            Référentiel des habilitations ministérielles
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-smart-teal text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg hover:bg-black transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus size={16} /> NOUVEAU GRADE
        </button>
      </div>

      {/* FILTRES ANALYTIQUES PLUS FINS */}
      <div className="bg-white p-3 rounded-[25px] border border-gray-100 flex gap-3 items-center shadow-sm">
        <div className="px-3 text-smart-teal opacity-30">
          <Filter size={16} />
        </div>
        <select
          dir="rtl"
          className="flex-1 p-3 bg-smart-bg rounded-xl outline-none font-bold text-[11px] text-smart-teal border-none cursor-pointer"
          value={selectedGouv}
          onChange={(e) => {
            setSelectedGouv(e.target.value);
            setSelectedCentreId("");
          }}
        >
          <option value="">Toutes les régions...</option>
          {GOUVERNORATS_AR.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          disabled={!selectedGouv}
          className="flex-1 p-3 bg-smart-bg rounded-xl outline-none font-bold text-[11px] text-smart-teal border-none disabled:opacity-30"
          value={selectedCentreId}
          onChange={(e) => setSelectedCentreId(e.target.value)}
        >
          <option value="">Tous les établissements...</option>
          {filteredCentres.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>

      {/* GRILLE DES RÔLES - CARTES RÉDUITES */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2
              className="animate-spin inline text-smart-teal"
              size={30}
            />
          </div>
        ) : (
          roles.map((role: any) => {
            const count = getFilteredCount(role.utilisateurs);
            return (
              <div
                key={role.id}
                className="bg-white p-6 rounded-[30px] border border-gray-100 flex flex-col justify-between group hover:shadow-xl transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-smart-bg p-3 rounded-xl text-smart-teal shadow-inner">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-smart-teal leading-none italic">
                      {count}
                    </p>
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">
                      Membres
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-smart-teal uppercase tracking-tighter leading-tight">
                    {role.nom}
                  </h3>
                  <p className="text-gray-400 text-[11px] font-medium mt-2 leading-relaxed line-clamp-2 italic">
                    {role.description || "Droits d'accès standards."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        id: role.id,
                        name: role.nom,
                      })
                    }
                    className="p-2 text-gray-300 hover:text-smart-salmon hover:bg-red-50 rounded-lg transition-all active:scale-90"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🎨 MODALE SUPPRESSION COMPACTE */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-[#1A1C1E]/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[40px] p-10 max-w-xs w-full text-center shadow-2xl border-4 border-red-50">
            <ShieldAlert
              size={40}
              className="text-smart-salmon mx-auto mb-4 animate-pulse"
            />
            <h3 className="text-xl font-black text-[#1A1C1E] mb-2 italic">
              Confirmation
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-8">
              Supprimer le grade{" "}
              <span className="text-smart-salmon font-bold">
                "{deleteConfirm.name}"
              </span>{" "}
              ?
            </p>
            <div className="space-y-3">
              <button
                onClick={executeDelete}
                className="w-full bg-smart-salmon text-white py-4 rounded-2xl font-black text-sm hover:bg-red-600 transition-all"
              >
                OUI, SUPPRIMER
              </button>
              <button
                onClick={() =>
                  setDeleteConfirm({ isOpen: false, id: null, name: "" })
                }
                className="w-full text-gray-300 font-black text-[10px] uppercase tracking-widest"
              >
                ANNULER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎨 MODAL AJOUT COMPACT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center bg-[#1A1C1E]/60 backdrop-blur-md p-6">
          <div className="bg-[#F7F3E9] rounded-[40px] p-10 max-w-sm w-full shadow-2xl border-4 border-white animate-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-smart-teal italic">
                Nouveau Grade
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <input
                required
                placeholder="NOM DU RÔLE..."
                className="w-full p-4 bg-white rounded-2xl font-black text-xs text-smart-teal outline-none shadow-sm uppercase border-none focus:ring-2 focus:ring-smart-sage"
                onChange={(e) =>
                  setNewRole({ ...newRole, nom: e.target.value.toUpperCase() })
                }
              />
              <textarea
                placeholder="Description des droits..."
                className="w-full p-4 bg-white rounded-2xl font-bold text-[11px] text-smart-teal outline-none shadow-sm h-24 resize-none border-none focus:ring-2 focus:ring-smart-sage"
                onChange={(e) =>
                  setNewRole({ ...newRole, description: e.target.value })
                }
              />
              <button
                type="submit"
                className="w-full bg-smart-teal text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all active:scale-95"
              >
                ENREGISTRER
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
