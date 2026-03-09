import { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  User,
  UserCog,
} from "lucide-react";

// Components
import { UserStats } from "./components/membres/UserStats";
import { UserFilters } from "./components/membres/UserFilters";
import { UserCard } from "./components/membres/UserCard";
import { BanModal } from "./components/membres/BanModal";
import { RoleModal } from "./components/membres/RoleModal";
import { AssignSalleModal } from "./components/membres/AssignSalleModal";
import { DeleteUserModal } from "./components/membres/DeleteUserModal";

const AGE_RANGES = [
  { id: "CHILD", label: "Enfants (< 12)", min: 0, max: 12 },
  { id: "TEEN", label: "Ados (12 - 18)", min: 12, max: 18 },
  { id: "YOUNG", label: "Jeunes (18 - 30)", min: 18, max: 30 },
  { id: "ADULT", label: "Adultes (30+)", min: 30, max: 100 },
];

export default function MembresPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]); // 🏆 AJOUTÉ
  const [loading, setLoading] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  // ÉTATS DES FILTRES
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedGouvernorat, setSelectedGouvernorat] = useState("");
  const [selectedSalleId, setSelectedSalleId] = useState("");
  const [selectedClubId, setSelectedClubId] = useState(""); // 🏆 AJOUTÉ
  const [selectedAgeRange, setSelectedAgeRange] = useState(""); // 🏆 AJOUTÉ

  const [activeUser, setActiveUser] = useState<any>(null);
  const [modals, setModals] = useState({
    role: false,
    ban: false,
    delete: false,
    assign: false,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
    fetchSalles();
    fetchRoles();
    fetchClubs(); // 🏆 APPEL DE LA NOUVELLE FONCTION
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

  const fetchClubs = async () => {
    try {
      const res = await api.get("/clubs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClubs(res.data);
    } catch (err) {
      console.error("Erreur clubs");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableRoles(res.data);
    } catch (err) {
      console.error("Erreur rôles");
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
      showAlert("Action refusée", "error");
    }
  };

  const closeAllModals = () => {
    setModals({ role: false, ban: false, delete: false, assign: false });
    setActiveUser(null);
  };

  const gouvernorats = useMemo(
    () =>
      Array.from(new Set(salles.map((s: any) => s.gouvernorat))).filter(
        Boolean,
      ) as string[],
    [salles],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      // 1. CALCUL ÂGE
      let age = -1;
      if (u.date_naissance) {
        age =
          new Date().getFullYear() - new Date(u.date_naissance).getFullYear();
      }

      const matchesSearch = (u.nom + u.prenom + u.email)
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesRole = filterRole === "ALL" || u.role === filterRole;
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ACTIF" && u.compte_actif) ||
        (filterStatus === "BAN" && !u.compte_actif);
      const matchesGouv =
        !selectedGouvernorat || u.salles?.gouvernorat === selectedGouvernorat;
      const matchesSalle = !selectedSalleId || u.id_salle === selectedSalleId;

      // 🏆 FILTRES SMART
      const matchesClub =
        !selectedClubId ||
        u.inscriptions_clubs?.some((i: any) => i.id_club === selectedClubId);
      const activeRange = AGE_RANGES.find((r) => r.id === selectedAgeRange);
      const matchesAge =
        !selectedAgeRange ||
        (activeRange && age >= activeRange.min && age < activeRange.max);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesGouv &&
        matchesSalle &&
        matchesClub &&
        matchesAge
      );
    });
  }, [
    users,
    search,
    filterRole,
    filterStatus,
    selectedGouvernorat,
    selectedSalleId,
    selectedClubId,
    selectedAgeRange,
  ]);

  const toggleUserStatus = (user: any) => {
    // Si l'utilisateur est ACTIF, on veut le suspendre -> On ouvre la MODALE
    if (user.compte_actif) {
      setActiveUser(user); // 1. On mémorise l'utilisateur à bannir
      setModals((prev) => ({ ...prev, ban: true })); // 2. On ouvre la modale de ban
    } else {
      // Si l'utilisateur est déjà BANNI, on le réactive direct (sans modale)
      handleAction(
        `/users/${user.id}/status`,
        { compte_actif: true },
        "Compte Réactivé",
      );
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[1000] p-6 rounded-[30px] shadow-2xl animate-in slide-in-from-right-10 border border-white/20 backdrop-blur-md ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-[#D9E8D1] text-[#436d75]"}`}
        >
          <div className="flex items-center space-x-3 font-bold uppercase text-xs tracking-wider">
            {notification.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      <div className="pt-6">
        <h1 className="text-7xl font-bold text-smart-teal tracking-tight leading-none uppercase italic">
          Membres
        </h1>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.6em] mt-4 ml-1 italic">
          Administration SmartChabeb
        </p>
      </div>

      <UserStats users={users} />

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
        selectedClubId={selectedClubId}
        setSelectedClubId={setSelectedClubId} // 🏆 AJOUTÉ
        selectedAgeRange={selectedAgeRange}
        setSelectedAgeRange={setSelectedAgeRange} // 🏆 AJOUTÉ
        gouvernorats={gouvernorats}
        salles={salles}
        clubs={clubs} // 🏆 AJOUTÉ
        availableRoles={availableRoles}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-smart-teal/20" size={60} />
            <p className="text-gray-300 font-bold text-xs uppercase tracking-widest italic">
              Synchronisation des membres...
            </p>
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((u: any) => (
            <UserCard
              key={u.id}
              user={u}
              onRoleClick={(user) => {
                setActiveUser(user);
                setModals({ ...modals, role: true });
              }}
              onBanClick={(user) => {
                setActiveUser(user);
                setModals({ ...modals, ban: true });
              }}
              onDeleteClick={(user) => {
                setActiveUser(user);
                setModals({ ...modals, delete: true });
              }}
              onAssignClick={(user) => {
                setActiveUser(user);
                setModals({ ...modals, assign: true });
              }}
              onToggleStatus={toggleUserStatus}
            />
          ))
        ) : (
          <div className="col-span-full bg-white/50 rounded-[40px] border-4 border-dashed border-gray-100 py-24 text-center italic text-gray-300 font-bold">
            Aucun membre trouvé.
          </div>
        )}
      </div>

      {/* MODALES */}
      <RoleModal
        isOpen={modals.role}
        onClose={closeAllModals}
        user={activeUser}
        availableRoles={availableRoles}
        onSelect={(roleName) =>
          handleAction(
            `/users/${activeUser.id}/role`,
            { role: roleName },
            "Grade mis à jour !",
          )
        }
      />

      <BanModal
        isOpen={modals.ban}
        onClose={closeAllModals}
        user={activeUser}
        onSubmit={(data) =>
          handleAction(
            `/users/${activeUser?.id}/ban`, // On utilise l'ID de l'user actif
            data,
            "Utilisateur suspendu avec succès",
          )
        }
      />

      <AssignSalleModal
        isOpen={modals.assign}
        onClose={closeAllModals}
        user={activeUser}
        salles={salles}
        onAssign={(salleId) =>
          handleAction(
            `/users/${activeUser.id}/assign-salle`,
            { id_salle: salleId },
            "Membre affecté",
          )
        }
      />

      <DeleteUserModal
        isOpen={modals.delete}
        onClose={closeAllModals}
        userName={activeUser?.nom}
        onConfirm={() => {
          /* delete logic */
        }}
      />
    </div>
  );
}
