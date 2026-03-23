import { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// Components
import { UserStats } from "./components/membres/UserStats";
import { UserFilters } from "./components/membres/UserFilters";
import { UserCard } from "./components/membres/UserCard";
import { BanModal } from "./components/membres/BanModal";
import { RoleModal } from "./components/membres/RoleModal";
import { AssignCentreModal } from "./components/membres/AssignCentreModal"; // 💡 Renommé
import { DeleteUserModal } from "./components/membres/DeleteUserModal";

const AGE_RANGES = [
  { id: "CHILD", label: "Enfants (< 12)", min: 0, max: 12 },
  { id: "TEEN", label: "Ados (12 - 18)", min: 12, max: 18 },
  { id: "YOUNG", label: "Jeunes (18 - 30)", min: 18, max: 30 },
  { id: "ADULT", label: "Adultes (30+)", min: 30, max: 100 },
];

export default function MembresPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]); // 💡 salles -> centres
  const [clubs, setClubs] = useState<any[]>([]);
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
  const [selectedCentreId, setSelectedCentreId] = useState(""); // 💡 Renommé
  const [selectedClubId, setSelectedClubId] = useState("");
  const [selectedAgeRange, setSelectedAgeRange] = useState("");

  const [activeUser, setActiveUser] = useState<any>(null);
  const [modals, setModals] = useState({
    role: false,
    ban: false,
    delete: false,
    assign: false,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resU, resC, resRoles, resClubs] = await Promise.all([
        api.get("/users", { headers }),
        api.get("/centres", { headers }), // 💡 route /centres
        api.get("/roles", { headers }),
        api.get("/clubs", { headers }),
      ]);
      setUsers(resU.data);
      setCentres(resC.data);
      setAvailableRoles(resRoles.data);
      setClubs(resClubs.data);
    } catch (err) {
      showAlert("Erreur de synchronisation des données", "error");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (msg: string, type: "error" | "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAction = async (url: string, data: any, msg: string) => {
    try {
      await api.patch(url, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadPageData(); // Rechargement complet pour garantir la cohérence
      showAlert(msg, "success");
      closeAllModals();
    } catch (err) {
      showAlert("Action refusée par le serveur", "error");
    }
  };

  const closeAllModals = () => {
    setModals({ role: false, ban: false, delete: false, assign: false });
    setActiveUser(null);
  };

  const gouvernorats = useMemo(
    () =>
      Array.from(new Set(centres.map((s: any) => s.gouvernorat))).filter(
        Boolean,
      ) as string[],
    [centres],
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

      // 💡 LOGIQUE DU FILTRE STATUT (Incluant ORPHAN)
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ACTIF" && u.compte_actif) ||
        (filterStatus === "BAN" && !u.compte_actif) ||
        (filterStatus === "ORPHAN" && !u.id_centre);

      const matchesGouv =
        !selectedGouvernorat || u.centre?.gouvernorat === selectedGouvernorat;

      const matchesCentre =
        !selectedCentreId || u.id_centre === selectedCentreId;

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
        matchesCentre &&
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
    selectedCentreId,
    selectedClubId,
    selectedAgeRange,
  ]);

  const toggleUserStatus = (user: any) => {
    if (user.compte_actif) {
      setActiveUser(user);
      setModals((prev) => ({ ...prev, ban: true }));
    } else {
      handleAction(
        `/users/${user.id}/status`,
        { compte_actif: true },
        "Compte Réactivé avec succès",
      );
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* 🔔 TOAST NOTIFICATION */}
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[1000] p-6 rounded-[30px] shadow-2xl animate-in slide-in-from-right-10 border border-white/20 backdrop-blur-md ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-[#D9E8D1] text-[#436d75]"}`}
        >
          <div className="flex items-center space-x-3 font-black uppercase text-xs tracking-widest">
            {notification.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* TITRE DE LA PAGE */}
      <div className="pt-6">
        <h1 className="text-6xl font-black text-smart-teal tracking-tighter leading-none uppercase italic">
          Membres
        </h1>
        <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.5em] mt-4 ml-1">
          Pilotage du registre national SmartChabeb
        </p>
      </div>

      {/* STATISTIQUES */}
      <UserStats users={users} />

      {/* BARRE DE FILTRES */}
      <UserFilters
        search={search}
        setSearch={setSearch}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        selectedGouvernorat={selectedGouvernorat}
        setSelectedGouvernorat={setSelectedGouvernorat}
        selectedCentreId={selectedCentreId} // 💡 Changé
        setSelectedCentreId={setSelectedCentreId} // 💡 Changé
        selectedClubId={selectedClubId}
        setSelectedClubId={setSelectedClubId}
        selectedAgeRange={selectedAgeRange}
        setSelectedAgeRange={setSelectedAgeRange}
        gouvernorats={gouvernorats}
        centres={centres} // 💡 Changé
        clubs={clubs}
        availableRoles={availableRoles}
      />

      {/* LISTE DES CARTES MEMBRES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-smart-teal/20" size={60} />
            <p className="text-gray-300 font-bold text-[10px] uppercase tracking-[0.4em] italic">
              Synchronisation du registre...
            </p>
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((u: any) => (
            <UserCard
              key={u.id}
              user={u}
              onRoleClick={(user: any) => {
                setActiveUser(user);
                setModals({ ...modals, role: true });
              }}
              onBanClick={(user: any) => {
                setActiveUser(user);
                setModals({ ...modals, ban: true });
              }}
              onDeleteClick={(user: any) => {
                setActiveUser(user);
                setModals({ ...modals, delete: true });
              }}
              onAssignClick={(user: any) => {
                setActiveUser(user);
                setModals({ ...modals, assign: true });
              }}
              onToggleStatus={toggleUserStatus}
            />
          ))
        ) : (
          <div className="col-span-full bg-white/50 rounded-[50px] border-4 border-dashed border-gray-100 py-32 text-center">
            <p className="text-gray-300 font-black italic text-2xl">
              Aucun membre ne correspond à ces critères.
            </p>
          </div>
        )}
      </div>

      {/* --- MODALES DE GESTION --- */}

      <RoleModal
        isOpen={modals.role}
        onClose={closeAllModals}
        user={activeUser}
        availableRoles={availableRoles}
        onSelect={(roleName) =>
          handleAction(
            `/users/${activeUser.id}/role`,
            { role: roleName },
            "Le grade a été mis à jour !",
          )
        }
      />

      <BanModal
        isOpen={modals.ban}
        onClose={closeAllModals}
        user={activeUser}
        onSubmit={(data) =>
          handleAction(
            `/users/${activeUser?.id}/ban`,
            data,
            "L'accès de l'utilisateur a été suspendu",
          )
        }
      />

      <AssignCentreModal // 💡 Nom mis à jour
        isOpen={modals.assign}
        onClose={closeAllModals}
        user={activeUser}
        centres={centres} // 💡 centres au lieu de salles
        onAssign={(centreId) =>
          handleAction(
            `/users/${activeUser.id}/assign-centre`, // 💡 URL mise à jour
            { id_centre: centreId }, // 💡 champ id_centre
            "Adhérent rattaché avec succès à l'institution",
          )
        }
      />

      <DeleteUserModal
        isOpen={modals.delete}
        onClose={closeAllModals}
        userName={`${activeUser?.nom} ${activeUser?.prenom}`}
        onConfirm={() =>
          handleAction(
            `/users/${activeUser.id}`,
            {},
            "Compte supprimé du système",
          )
        }
      />
    </div>
  );
}
