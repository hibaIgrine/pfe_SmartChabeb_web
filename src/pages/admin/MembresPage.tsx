import { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// Components
import { UserStats } from "./components/membres/UserStats";
import { UserFilters } from "./components/membres/UserFilters";
import { UserCard } from "./components/membres/UserCard";
import { BanModal } from "./components/membres/BanModal";
import { RoleModal } from "./components/membres/RoleModal";
import { AssignSalleModal } from "./components/membres/AssignSalleModal";
import { DeleteUserModal } from "./components/membres/DeleteUserModal";

export default function MembresPage() {
  // --- ÉTATS ---
  const [users, setUsers] = useState<any[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  // FILTRES
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, ACTIF, BAN
  const [selectedGouvernorat, setSelectedGouvernorat] = useState("");
  const [selectedSalleId, setSelectedSalleId] = useState("");

  // ÉTATS DES MODALES
  const [activeUser, setActiveUser] = useState<any>(null);
  const [modals, setModals] = useState({
    role: false,
    ban: false,
    delete: false,
    assign: false,
  });

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
      closeAllModals();
    } catch (err) {
      showAlert("Action refusée par le serveur", "error");
    }
  };

  const confirmDelete = async () => {
    if (!activeUser) return;
    try {
      await api.delete(`/users/${activeUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      closeAllModals();
      fetchUsers();
      showAlert("Compte supprimé", "success");
    } catch (err) {
      showAlert("Impossible : l'utilisateur a des activités", "error");
    }
  };

  const toggleUserStatus = (user: any) => {
    if (user.compte_actif) {
      setActiveUser(user);
      setModals({ ...modals, ban: true });
    } else {
      handleAction(
        `/users/${user.id}/status`,
        { compte_actif: true },
        "Compte Réactivé"
      );
    }
  };

  const closeAllModals = () => {
    setModals({ role: false, ban: false, delete: false, assign: false });
    setActiveUser(null);
  };

  // --- DERIVED DATA ---
  const gouvernorats = useMemo(() => 
    Array.from(new Set(salles.map((s: any) => s.gouvernorat))).filter(Boolean) as string[],
    [salles]
  );

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch = (u.nom + u.prenom + u.email).toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    const matchesStatus = 
        filterStatus === "ALL" || 
        (filterStatus === "ACTIF" && u.compte_actif) || 
        (filterStatus === "BAN" && !u.compte_actif);
    const matchesGouv = !selectedGouvernorat || u.id_salle && salles.find(s => s.id === u.id_salle)?.gouvernorat === selectedGouvernorat;
    const matchesSalle = !selectedSalleId || u.id_salle === selectedSalleId;
    
    return matchesSearch && matchesRole && matchesStatus && matchesGouv && matchesSalle;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* 🔔 NOTIFICATION */}
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[1000] p-6 rounded-[30px] shadow-2xl animate-in slide-in-from-right-10 border border-white/20 backdrop-blur-md ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-smart-sage text-smart-teal"}`}
        >
          <div className="flex items-center space-x-3 font-bold uppercase text-xs tracking-wider text-shadow-sm">
            {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* 1. HEADER */}
      <div className="pt-6">
        <h1 className="text-7xl font-bold text-smart-teal tracking-tight leading-none uppercase">
          Membres
        </h1>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.6em] mt-4 ml-1">
          Portail d'Administration du Personnel
        </p>
      </div>

      {/* 2. STATS */}
      <UserStats users={users} />

      {/* 3. FILTRES */}
      <UserFilters 
        search={search}
        setSearch={setSearch}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        selectedGouvernorat={selectedGouvernorat}
        setSelectedGouvernorat={setSelectedGouvernorat}
        selectedSalleId={selectedSalleId}
        setSelectedSalleId={setSelectedSalleId}
        gouvernorats={gouvernorats}
        salles={salles}
      />

      {/* 4. LISTE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-smart-teal/20" size={60} />
            <p className="text-gray-300 font-bold text-xs uppercase tracking-widest animate-pulse">Syncing subscribers...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((u: any) => (
            <UserCard 
              key={u.id}
              user={u}
              onRoleClick={(user) => { setActiveUser(user); setModals({ ...modals, role: true }); }}
              onBanClick={(user) => { setActiveUser(user); setModals({ ...modals, ban: true }); }}
              onDeleteClick={(user) => { setActiveUser(user); setModals({ ...modals, delete: true }); }}
              onAssignClick={(user) => { setActiveUser(user); setModals({ ...modals, assign: true }); }}
              onToggleStatus={toggleUserStatus}
            />
          ))
        ) : (
          <div className="col-span-full bg-white/50 rounded-[40px] border-4 border-dashed border-gray-100 py-24 text-center">
             <p className="text-gray-300 font-black text-lg italic italic">Aucun membre ne correspond à vos critères.</p>
          </div>
        )}
      </div>

      {/* 5. MODALES */}
      <RoleModal 
        isOpen={modals.role} 
        onClose={closeAllModals}
        user={activeUser}
        onSelect={(roleId) => handleAction(`/users/${activeUser.id}/role`, { role: roleId }, "Rôle mis à jour")}
      />

      <BanModal 
        isOpen={modals.ban}
        onClose={closeAllModals}
        user={activeUser}
        onSubmit={(data) => handleAction(`/users/${activeUser.id}/ban`, data, "Utilisateur suspendu")}
      />

      <AssignSalleModal 
        isOpen={modals.assign}
        onClose={closeAllModals}
        user={activeUser}
        salles={salles}
        onAssign={(salleId) => handleAction(`/users/${activeUser.id}/assign-salle`, { id_salle: salleId }, "Membre affecté")}
      />

      <DeleteUserModal 
        isOpen={modals.delete}
        onClose={closeAllModals}
        userName={activeUser?.nom + " " + activeUser?.prenom}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
