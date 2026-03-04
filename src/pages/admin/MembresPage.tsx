import { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  UserCog,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Users2,
  UserCheck,
  ShieldCheck,
  Activity,
  Trash2,
  ShieldAlert,
  Briefcase,
  GraduationCap,
  User,
  MapPin,
  Building2,
  Plus,
} from "lucide-react";

const ROLES = [
  {
    id: "ADHERENT",
    label: "Adhérent",
    icon: <User size={18} />,
    color: "bg-smart-sage text-smart-teal",
  },
  {
    id: "COACH",
    label: "Coach",
    icon: <GraduationCap size={18} />,
    color: "bg-smart-salmon text-white",
  },
  {
    id: "ADMIN",
    label: "Admin",
    icon: <ShieldCheck size={18} />,
    color: "bg-smart-teal text-white",
  },
  {
    id: "GESTIONNAIRE",
    label: "Gestionnaire",
    icon: <Briefcase size={18} />,
    color: "bg-[#1A1C1E] text-white",
  },
];

// Liste officielle des 24 gouvernorats pour le filtrage de l'assignation
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

export default function MembresPage() {
  // --- ÉTATS ---
  const [users, setUsers] = useState([]);
  const [salles, setSalles] = useState([]);
  const [filterRole, setFilterRole] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  // ÉTATS DES MODALES
  const [roleModal, setRoleModal] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string;
    currentRole: string;
  } | null>(null);
  const [banModal, setBanModal] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string;
  } | null>(null);
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string;
  } | null>(null);

  // États pour l'assignation filtrée (SMART AFFECTATION)
  const [selectedGouvForAssign, setSelectedGouvForAssign] = useState("");
  const [selectedSalleId, setSelectedSalleId] = useState("");
  const [banData, setBanData] = useState({ days: 7, reason: "" });

  const token = localStorage.getItem("token");

  // --- LOGIQUE ---
  useEffect(() => {
    fetchUsers();
    fetchSalles();
  }, []);

  const showAlert = (msg: string, type: "error" | "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      showAlert("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSalles = async () => {
    try {
      const res = await api.get("/salles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalles(res.data);
    } catch (err) {
      console.error("Erreur salles");
    }
  };

  const handleAction = async (url: string, data: any, msg: string) => {
    try {
      await api.patch(url, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      showAlert(msg, "success");
      setRoleModal(null);
      setAssignModal(null);
      setBanModal(null);
      // Reset des sélections d'assignation
      setSelectedGouvForAssign("");
      setSelectedSalleId("");
    } catch (err) {
      showAlert("Action refusée par le serveur", "error");
    }
  };

  const submitDelete = async () => {
    try {
      await api.delete(`/users/${deleteModal?.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteModal(null);
      fetchUsers();
      showAlert("Compte supprimé", "success");
    } catch (err) {
      showAlert("Impossible : l'utilisateur a des activités", "error");
    }
  };

  const submitBan = async () => {
    if (!banModal?.userId) return;
    if (!banData.reason.trim()) {
      showAlert("Veuillez saisir un motif", "error");
      return;
    }
    try {
      await api.patch(`/users/${banModal.userId}/ban`, banData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBanModal(null);
      fetchUsers();
      showAlert("Utilisateur suspendu", "success");
      setBanData({ days: 7, reason: "" });
    } catch (err) {
      showAlert("Erreur lors de la suspension", "error");
    }
  };

  // Filtrer les salles basées sur le gouvernorat choisi dans la modal d'assignation
  const filteredSallesForAssign = salles.filter(
    (s: any) => s.gouvernorat === selectedGouvForAssign,
  );

  const filtered = users.filter(
    (u: any) =>
      (filterRole === "ALL" || u.role === filterRole) &&
      (u.nom + u.prenom + u.email).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 relative pb-10">
      {/* 🔔 NOTIFICATION */}
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[1000] p-6 rounded-[30px] shadow-2xl animate-in slide-in-from-right-10 border border-white/20 backdrop-blur-md ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-smart-sage text-smart-teal"}`}
        >
          <div className="flex items-center space-x-3 font-black italic uppercase text-xs tracking-widest">
            {notification.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* 1. HEADER & RECHERCHE */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 pt-6">
        <div>
          <h1 className="text-8xl font-black text-smart-teal tracking-tighter italic leading-none">
            Membres
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.6em] mt-4 ml-1">
            Gestion des accès
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"
              size={20}
            />
            <input
              type="text"
              placeholder="Chercher un membre..."
              className="pl-14 pr-8 py-4 bg-white border border-gray-100 rounded-full shadow-sm outline-none w-80 font-bold text-xs focus:ring-4 focus:ring-smart-sage transition-all"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="bg-white p-1.5 rounded-full shadow-sm flex items-center border border-gray-100">
            {["ALL", "ADMIN", "COACH", "ADHERENT"].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-5 py-2 rounded-full text-[9px] font-black transition-all cursor-pointer ${filterRole === r ? "bg-smart-teal text-white shadow-lg" : "text-gray-400 hover:text-smart-teal"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<Users2 />}
          val={users.length}
          label="Inscriptions"
          color="bg-smart-sage"
        />
        <StatCard
          icon={<UserCheck />}
          val={users.filter((u: any) => u.est_verifie).length}
          label="Vérifiés"
          color="bg-white"
        />
        <StatCard
          icon={<MapPin />}
          val={users.filter((u: any) => !u.id_salle).length}
          label="Sans Centre"
          color="bg-white"
        />
        <StatCard
          icon={<ShieldAlert />}
          val={users.filter((u: any) => !u.compte_actif).length}
          label="Suspendus"
          color="bg-white"
        />
      </div>

      {/* 3. LISTE DES CARTES */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-smart-teal" size={50} />
          </div>
        ) : (
          filtered.map((u: any) => (
            <div
              key={u.id}
              className="bg-white p-6 rounded-[45px] shadow-sm border border-gray-50 flex flex-col lg:flex-row items-center justify-between group hover:shadow-xl transition-all duration-500"
            >
              <div className="flex items-center space-x-6">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                  className="w-16 h-16 rounded-[25px] bg-smart-bg border-4 border-white shadow-md"
                />
                <div className="w-48">
                  <h4 className="text-xl font-black text-smart-teal tracking-tighter italic leading-none">
                    {u.nom} {u.prenom}
                  </h4>
                  <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
                    {u.email}
                  </p>
                </div>
              </div>

              {/* Colonne Centre Dynamique */}
              <div className="flex-1 flex justify-center py-4 lg:py-0">
                {u.salles ? (
                  <div className="bg-[#f0f4f4] px-5 py-2 rounded-2xl flex items-center space-x-3 border border-white">
                    <Building2
                      size={14}
                      className="text-smart-teal opacity-40"
                    />
                    <span className="text-[10px] font-black uppercase text-smart-teal tracking-wider">
                      {u.salles.nom}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setAssignModal({
                        isOpen: true,
                        userId: u.id,
                        userName: u.nom,
                      })
                    }
                    className="flex items-center space-x-2 text-smart-salmon font-black text-[10px] uppercase border-b-2 border-smart-salmon/20 hover:border-smart-salmon transition-all cursor-pointer"
                  >
                    <Plus size={14} /> <span>Affecter un établissement</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-6">
                {u.role === "ADHERENT" && (
                  <div className="text-center mr-4">
                    <p className="text-[8px] font-black text-gray-300 uppercase leading-none">
                      Imc
                    </p>
                    <p className="text-sm font-black text-smart-teal italic leading-none mt-1">
                      {u.suivi_biometrique?.[0]?.imc || "--"}
                    </p>
                  </div>
                )}

                <button
                  onClick={() =>
                    setRoleModal({
                      isOpen: true,
                      userId: u.id,
                      userName: u.nom,
                      currentRole: u.role,
                    })
                  }
                  className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm border border-white/50 cursor-pointer ${ROLES.find((r) => r.id === u.role)?.color}`}
                >
                  {u.role}
                </button>

                <button
                  onClick={() =>
                    u.compte_actif
                      ? setBanModal({
                          isOpen: true,
                          userId: u.id,
                          userName: u.nom,
                        })
                      : handleAction(
                          `/users/${u.id}/status`,
                          { compte_actif: true },
                          "Compte Réactivé",
                        )
                  }
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-inner cursor-pointer ${u.compte_actif ? "bg-[#2c4e54]" : "bg-gray-200"}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${u.compte_actif ? "translate-x-7 shadow-lg" : "translate-x-1"}`}
                  />
                </button>

                <button
                  onClick={() =>
                    setDeleteModal({
                      isOpen: true,
                      userId: u.id,
                      userName: u.nom,
                    })
                  }
                  className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- 🎨 MODALES --- */}

      {/* A. MODALE AFFECTATION CENTRE (AMÉLIORÉE - DOUBLE FILTRAGE) */}
      {assignModal?.isOpen && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
          <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-md w-full shadow-2xl border-4 border-white animate-in zoom-in">
            <button
              onClick={() => setAssignModal(null)}
              className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-2 rounded-full"
            >
              <X size={20} />
            </button>
            <h3 className="text-4xl font-black text-smart-teal italic mb-2 tracking-tighter italic">
              Affectation Locale
            </h3>
            <p className="text-gray-400 text-xs font-bold mb-8 italic uppercase tracking-widest">
              Membre : {assignModal.userName}
            </p>

            <div className="space-y-6">
              {/* 1. CHOIX GOUVERNORAT */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">
                  1. Choisir le Gouvernorat
                </label>
                <select
                  dir="rtl"
                  className="w-full p-5 bg-white rounded-[25px] font-black text-lg text-smart-teal outline-none shadow-sm border-none appearance-none cursor-pointer focus:ring-4 focus:ring-smart-sage transition-all"
                  value={selectedGouvForAssign}
                  onChange={(e) => {
                    setSelectedGouvForAssign(e.target.value);
                    setSelectedSalleId(""); // Reset la salle si le gouv change
                  }}
                >
                  <option value="">اختيار الولاية...</option>
                  {GOUVERNORATS_AR.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. CHOIX CENTRE (Dépendant du Gouv) */}
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-500">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">
                  2. Sélectionner l'Établissement
                </label>
                <select
                  disabled={!selectedGouvForAssign}
                  className={`w-full p-5 bg-white rounded-[25px] font-bold text-sm text-smart-teal outline-none shadow-sm border-none appearance-none transition-all ${!selectedGouvForAssign ? "opacity-30" : "cursor-pointer focus:ring-4 focus:ring-smart-sage"}`}
                  value={selectedSalleId}
                  onChange={(e) => setSelectedSalleId(e.target.value)}
                >
                  <option value="">
                    {selectedGouvForAssign
                      ? "Choisir un centre..."
                      : "Sélectionner une région d'abord"}
                  </option>
                  {filteredSallesForAssign.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.nom}
                    </option>
                  ))}
                </select>
              </div>

              <button
                disabled={!selectedSalleId}
                onClick={() =>
                  handleAction(
                    `/users/${assignModal.userId}/assign-salle`,
                    { id_salle: selectedSalleId },
                    "Membre affecté avec succès",
                  )
                }
                className="w-full bg-smart-teal text-white py-6 rounded-[35px] font-black text-xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed mt-4 shadow-smart-teal/20"
              >
                Confirmer le rattachement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. MODALE RÔLE */}
      {roleModal?.isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6 animate-in fade-in">
          <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-sm w-full shadow-2xl border-4 border-white animate-in zoom-in text-center">
            <h3 className="text-3xl font-black text-smart-teal italic mb-2 tracking-tighter">
              Nouveau Grade
            </h3>
            <p className="text-gray-400 text-[10px] font-bold uppercase mb-8 italic">
              {roleModal.userName} • {roleModal.currentRole}
            </p>
            <div className="grid grid-cols-1 gap-3">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() =>
                    handleAction(
                      `/users/${roleModal.userId}/role`,
                      { role: role.id },
                      "Rôle mis à jour",
                    )
                  }
                  className={`flex items-center justify-between p-5 rounded-[25px] font-black text-sm transition-all hover:scale-105 active:scale-95 ${role.color} shadow-sm`}
                >
                  <span>{role.label}</span>
                  {role.icon}
                </button>
              ))}
            </div>
            <button
              onClick={() => setRoleModal(null)}
              className="w-full text-gray-400 font-black text-[10px] uppercase tracking-widest mt-8"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* C. MODALE SUPPRESSION */}
      {deleteModal?.isOpen && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 bg-[#1A1C1E]/90 backdrop-blur-2xl animate-in fade-in">
          <div className="bg-white rounded-[70px] p-16 max-w-sm w-full text-center shadow-2xl border-8 border-red-50 animate-in zoom-in">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[35px] flex items-center justify-center mx-auto mb-8 animate-bounce">
              <ShieldAlert size={44} />
            </div>
            <h3 className="text-4xl font-black text-[#1A1C1E] tracking-tighter mb-4 italic leading-none">
              Attention !
            </h3>
            <p className="text-gray-400 font-medium text-sm leading-relaxed mb-10 italic">
              Supprimer le compte de{" "}
              <span className="text-red-500 font-black">
                {deleteModal.userName}
              </span>{" "}
              ?
            </p>
            <div className="space-y-4">
              <button
                onClick={submitDelete}
                className="w-full bg-[#E98A7D] text-white py-6 rounded-[30px] font-black text-xl hover:bg-red-600 shadow-xl shadow-red-100 active:scale-95"
              >
                Oui, Supprimer
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                className="w-full text-gray-300 font-black text-xs uppercase tracking-widest pt-4"
              >
                Conserver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. MODALE SUSPENSION (BAN) */}
      {banModal?.isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
          <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-md w-full shadow-2xl border-4 border-white animate-in zoom-in">
            <h3 className="text-3xl font-black text-smart-teal italic mb-1 tracking-tighter leading-none italic text-center">
              Sanction Disciplinaire
            </h3>
            <p className="text-gray-400 text-[10px] font-bold uppercase mb-8 italic text-center">
              {banModal.userName}
            </p>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">
                  Durée (jours)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-5 bg-white rounded-[25px] font-black text-2xl text-smart-teal outline-none focus:ring-4 focus:ring-smart-sage transition-all shadow-inner border-none"
                  value={banData.days}
                  onChange={(e) =>
                    setBanData({ ...banData, days: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">
                  Motif de la sanction
                </label>
                <textarea
                  className="w-full p-6 bg-white rounded-[25px] font-bold text-sm text-smart-teal outline-none focus:ring-4 focus:ring-smart-sage transition-all shadow-inner resize-none h-32 border-none"
                  placeholder="Raison officielle..."
                  value={banData.reason}
                  onChange={(e) =>
                    setBanData({ ...banData, reason: e.target.value })
                  }
                />
              </div>
              <button
                onClick={submitBan}
                className="w-full bg-[#E98A7D] text-white py-6 rounded-[35px] font-black text-xl shadow-xl hover:bg-red-600 transition-all active:scale-95 italic tracking-tight"
              >
                Confirmer la Sanction
              </button>
              <button
                onClick={() => setBanModal(null)}
                className="w-full text-gray-400 font-black text-[10px] uppercase tracking-widest pt-4 block text-center"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, val, label, color }: any) {
  return (
    <div
      className={`${color} p-7 rounded-[40px] border border-white/50 flex items-center space-x-5 shadow-sm group hover:shadow-md transition-all`}
    >
      <div className="bg-[#f0f4f4] p-4 rounded-2xl text-smart-teal group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-smart-teal leading-none tracking-tighter italic">
          {val}
        </p>
        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mt-1 leading-none">
          {label}
        </p>
      </div>
    </div>
  );
}
