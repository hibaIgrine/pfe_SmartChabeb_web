import { useEffect, useState } from "react";
import api from "../api/axios";
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

export default function MembresPage() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  // ÉTATS DES MODALES PERSONNALISÉES
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

  const [banData, setBanData] = useState({ days: 7, reason: "" });
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
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

  const handleUpdateAction = async (id: string, data: any, msg: string) => {
    try {
      await api.patch(`/users/${id}/status`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      showAlert(msg, "success");
    } catch (err) {
      showAlert("Action non autorisée", "error");
    }
  };

  const submitBan = async () => {
    try {
      await api.patch(`/users/${banModal?.userId}/ban`, banData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBanModal(null);
      fetchUsers();
      showAlert("Utilisateur suspendu", "success");
    } catch (err) {
      showAlert("Erreur", "error");
    }
  };

  const submitDelete = async () => {
    try {
      await api.delete(`/users/${deleteModal?.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteModal(null);
      fetchUsers();
      showAlert("Compte supprimé définitivement", "success");
    } catch (err) {
      showAlert("Impossible (Données liées)", "error");
    }
  };

  const filtered = users.filter(
    (u: any) =>
      (filterRole === "ALL" || u.role === filterRole) &&
      (u.nom + u.prenom + u.email).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 relative pb-10">
      {/* 🔔 JOLI TOAST */}
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
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 pt-6">
        <div>
          <h1 className="text-7xl font-black text-smart-teal tracking-tighter italic leading-none">
            Communauté
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">
            Gestion de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-full border border-gray-100 shadow-sm">
          {["ALL", "ADMIN", "COACH", "ADHERENT"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-5 py-2 rounded-full text-[9px] font-black transition-all ${filterRole === r ? "bg-smart-teal text-white shadow-lg" : "text-gray-400 hover:text-smart-teal"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* LISTE DES CARTES */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-smart-teal" size={50} />
          </div>
        ) : (
          filtered.map((u: any) => (
            <div
              key={u.id}
              className="bg-white p-6 rounded-[45px] shadow-sm border border-gray-50 flex flex-col md:flex-row items-center justify-between group hover:shadow-xl transition-all duration-500"
            >
              <div className="flex items-center space-x-6">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                  className="w-16 h-16 rounded-[25px] bg-smart-bg border-4 border-white shadow-sm"
                />
                <div>
                  <h4 className="text-2xl font-black text-smart-teal tracking-tighter italic leading-none">
                    {u.nom} {u.prenom}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
                    {u.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6 mt-6 md:mt-0">
                {/* 1. BOUTON CHANGEMENT RÔLE (Jolie Liste) */}
                <button
                  onClick={() =>
                    setRoleModal({
                      isOpen: true,
                      userId: u.id,
                      userName: u.nom,
                      currentRole: u.role,
                    })
                  }
                  className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all active:scale-95 border border-white/50 cursor-pointer ${ROLES.find((r) => r.id === u.role)?.color}`}
                >
                  {u.role}
                </button>

                {/* 2. BOUTON SWITCH ON/OFF (Foncé) */}
                <button
                  onClick={() =>
                    u.compte_actif
                      ? setBanModal({
                          isOpen: true,
                          userId: u.id,
                          userName: u.nom,
                        })
                      : handleUpdateAction(
                          u.id,
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

                {/* 3. BOUTON SUPPRIMER (Jolie Alerte) */}
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

      {/* --- 🎨 LES MODALES JOLIES --- */}

      {/* A. MODALE RÔLE (Jolie Liste) */}
      {roleModal?.isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6 animate-in fade-in">
          <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-sm w-full shadow-2xl border-4 border-white animate-in zoom-in">
            <h3 className="text-3xl font-black text-smart-teal italic mb-6 tracking-tighter">
              Attribuer un rôle
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    handleUpdateAction(
                      roleModal.userId!,
                      { role: role.id },
                      "Rôle mis à jour",
                    );
                    setRoleModal(null);
                  }}
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

      {/* B. MODALE CONFIRMATION SUPPRESSION */}
      {deleteModal?.isOpen && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-[#1A1C1E]/90 backdrop-blur-2xl p-6 animate-in fade-in">
          <div className="bg-white rounded-[60px] p-16 max-w-sm w-full text-center shadow-2xl border-8 border-red-50 animate-in zoom-in">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[35px] flex items-center justify-center mx-auto mb-8 animate-pulse">
              <ShieldAlert size={44} />
            </div>
            <h3 className="text-4xl font-black text-[#1A1C1E] tracking-tighter mb-4 italic leading-none">
              Attention !
            </h3>
            <p className="text-gray-400 font-medium text-sm leading-relaxed mb-10 italic">
              Supprimer définitivement le compte de{" "}
              <span className="text-red-500 font-black">
                {deleteModal.userName}
              </span>{" "}
              ?
            </p>
            <div className="space-y-4">
              <button
                onClick={submitDelete}
                className="w-full bg-[#E98A7D] text-white py-6 rounded-[30px] font-black text-xl hover:bg-red-600 transition-all shadow-xl shadow-red-100 active:scale-95"
              >
                Oui, Supprimer
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                className="w-full text-gray-300 font-black text-xs uppercase tracking-widest pt-4"
              >
                Conserver le membre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. MODALE SUSPENSION (BAN) */}
      {banModal?.isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
          <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-md w-full shadow-2xl border-4 border-white animate-in zoom-in">
            <h3 className="text-3xl font-black text-smart-teal italic mb-1 tracking-tighter leading-none">
              Suspendre le compte
            </h3>
            <p className="text-gray-400 text-[10px] font-bold uppercase mb-8 italic">
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
                  className="w-full p-5 bg-white rounded-[25px] font-black text-2xl text-smart-teal outline-none focus:ring-4 focus:ring-smart-sage transition-all"
                  value={banData.days}
                  onChange={(e) =>
                    setBanData({ ...banData, days: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">
                  Motif Officiel
                </label>
                <textarea
                  className="w-full p-6 bg-white rounded-[25px] font-bold text-sm text-smart-teal outline-none focus:ring-4 focus:ring-smart-sage transition-all resize-none h-32"
                  placeholder="Raison de la sanction..."
                  value={banData.reason}
                  onChange={(e) =>
                    setBanData({ ...banData, reason: e.target.value })
                  }
                />
              </div>
              <button
                onClick={submitBan}
                className="w-full bg-[#E98A7D] text-white py-6 rounded-[35px] font-black text-xl shadow-xl hover:bg-red-600 transition-all active:scale-95"
              >
                Appliquer la Sanction
              </button>
              <button
                onClick={() => setBanModal(null)}
                className="w-full text-gray-400 font-black text-[10px] uppercase tracking-widest pt-2"
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
