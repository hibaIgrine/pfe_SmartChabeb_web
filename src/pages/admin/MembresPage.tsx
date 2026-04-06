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
import { AssignClubModal } from "./components/membres/AssignClubModal";

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
    assignClub: false, // 💡 Nouveau
  });

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);
  const isResponsableCentre = currentUser?.role === "RESPONSABLE_CENTRE";
  const [resolvedCentreId, setResolvedCentreId] = useState(
    currentUser?.id_centre ?? currentUser?.centre?.id ?? "",
  );

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeArrayResponse = (data: any) =>
    Array.isArray(data) ? data : data?.users || [];

  const showAlert = (msg: string, type: "error" | "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    const headers = getAuthHeaders();

    if (!headers.Authorization) {
      showAlert(
        "Veuillez vous reconnecter pour consulter les membres.",
        "error",
      );
      setLoading(false);
      return;
    }

    try {
      if (isResponsableCentre) {
        try {
          const meRes = await api.get("/users/me/profile", { headers });
          const me = meRes.data;
          const centreId = me?.centre?.id ?? me?.id_centre ?? "";
          setResolvedCentreId(centreId);
          if (centreId) {
            setSelectedCentreId(centreId);
          }
        } catch {
          const fallbackCentreId =
            currentUser?.id_centre ?? currentUser?.centre?.id ?? "";
          setResolvedCentreId(fallbackCentreId);
          if (fallbackCentreId) {
            setSelectedCentreId(fallbackCentreId);
          }
        }
      }

      const resU = await api.get("/users", { headers });
      setUsers(normalizeArrayResponse(resU.data));
    } catch (err: any) {
      console.error(
        "Erreur chargement des utilisateurs :",
        err.response || err.message || err,
      );
      setUsers([]);
      const msg =
        err.response?.data?.message || "Impossible de charger les membres";
      showAlert(msg, "error");
    }

    try {
      const resC = await api.get("/centres", { headers });
      setCentres(normalizeArrayResponse(resC.data));
    } catch (err) {
      console.error("Erreur chargement des centres :", err);
      setCentres([]);
    }

    try {
      const resRoles = await api.get("/roles", { headers });
      setAvailableRoles(normalizeArrayResponse(resRoles.data));
    } catch (err) {
      console.error("Erreur chargement des rôles :", err);
      setAvailableRoles([]);
    }

    try {
      const resClubs = await api.get("/clubs", { headers });
      setClubs(normalizeArrayResponse(resClubs.data));
    } catch (err) {
      console.error("Erreur chargement des clubs :", err);
      setClubs([]);
    }

    setLoading(false);
  };

  const usersInScope = useMemo(() => {
    if (!isResponsableCentre) return users;
    if (!resolvedCentreId) return [];
    return users.filter((u: any) => u.id_centre === resolvedCentreId);
  }, [isResponsableCentre, resolvedCentreId, users]);

  const handleAction = async (url: string, data: any, msg: string) => {
    try {
      const response = await api.patch(url, data, {
        headers: getAuthHeaders(),
      });

      console.log("✅ Réponse serveur (User mis à jour) :", response.data);
      await loadPageData(); // Rechargement complet pour garantir la cohérence
      showAlert(msg, "success");
      closeAllModals();
    } catch (err) {
      console.error("❌ Erreur action :", err);
      showAlert("Action refusée par le serveur", "error");
    }
  };

  const closeAllModals = () => {
    setModals({
      role: false,
      ban: false,
      delete: false,
      assign: false,
      assignClub: false, // 💡 AJOUTE CETTE LIGNE ICI
    });
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
    return usersInScope.filter((u: any) => {
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
        (filterStatus === "ACTIVE" && u.compte_actif) ||
        (filterStatus === "INACTIVE" && !u.compte_actif);

      const matchesGouv =
        isResponsableCentre ||
        !selectedGouvernorat ||
        u.centre?.gouvernorat === selectedGouvernorat;

      const matchesCentre =
        isResponsableCentre || !selectedCentreId || u.id_centre === selectedCentreId;

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
    usersInScope,
    search,
    filterRole,
    filterStatus,
    isResponsableCentre,
    selectedGouvernorat,
    selectedCentreId,
    selectedClubId,
    selectedAgeRange,
  ]);

  const clubsForFilter = useMemo(() => {
    if (!isResponsableCentre) return clubs;
    if (!resolvedCentreId) return [];
    return clubs.filter((club: any) => club.id_centre === resolvedCentreId);
  }, [isResponsableCentre, resolvedCentreId, clubs]);

  const toggleUserStatus = (user: any) => {
    if (user.compte_actif) {
      setActiveUser(user);
      setModals((prev) => ({ ...prev, delete: true }));
    } else {
      handleAction(
        `/users/${user.id}/status`,
        { compte_actif: true },
        "Compte réactivé avec succès",
      );
    }
  };
  // Dans MembresPage.tsx

  const handleRoleChange = async (roleName: string) => {
    try {
      // 1. On met à jour le rôle via l'API
      await api.patch(
        `/users/${activeUser.id}/role`,
        { role: roleName },
        { headers: getAuthHeaders() },
      );

      // 2. On recharge les données pour que la carte affiche le nouveau rôle
      await loadPageData();

      // 3. LOGIQUE SMART : Branchement selon le rôle choisi
      if (roleName === "RESPONSABLE_CLUB") {
        // On ferme la modale des rôles et on ouvre celle des clubs
        setModals((prev) => ({ ...prev, role: false, assignClub: true }));
        showAlert(
          "Grade mis à jour. Veuillez maintenant affecter le club.",
          "success",
        );
      } else if (roleName === "RESPONSABLE_CENTRE") {
        // On ferme la modale des rôles et on ouvre celle des centres
        setModals((prev) => ({ ...prev, role: false, assign: true }));
        showAlert(
          "Grade mis à jour. Veuillez choisir le gouvernorat puis le centre.",
          "success",
        );
      } else {
        // Pour les autres rôles, on ferme tout
        closeAllModals();
        showAlert("Grade mis à jour avec succès !", "success");
      }
    } catch (err) {
      showAlert("Erreur lors du changement de grade", "error");
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
      <div className="bg-white/90 border border-gray-100 shadow-sm rounded-[40px] p-6 flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl sm:text-5xl font-black text-smart-teal uppercase tracking-tight">
            Membres
          </h1>
          <p className="max-w-2xl text-sm text-gray-500">
            Pilotage du registre national SmartChabeb
          </p>
        </div>
      </div>

      {/* STATISTIQUES */}
      <UserStats users={usersInScope} hideOrphanStat={isResponsableCentre} />

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
        clubs={clubsForFilter}
        availableRoles={availableRoles}
        showLocationFilters={!isResponsableCentre}
      />

      {/* LISTE DES CARTES MEMBRES */}
      <div className="grid grid-cols-1 gap-4">
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
              onAssignClub={(user: any) => {
                setActiveUser(user);
                setModals({ ...modals, assignClub: true });
              }}
              onToggleStatus={toggleUserStatus}
              showCentreSection={!isResponsableCentre}
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
        excludedRoles={isResponsableCentre ? ["RESPONSABLE_CENTRE"] : []}
        onSelect={handleRoleChange} // 💡 On appelle notre nouvelle fonction de gestion
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
            `/users/${activeUser?.id}/status`,
            { compte_actif: false },
            "Compte désactivé avec succès",
          )
        }
      />
      {/* ... tes autres modales ... */}

      <AssignClubModal
        isOpen={modals.assignClub}
        onClose={() => setModals((prev) => ({ ...prev, assignClub: false }))}
        userName={`${activeUser?.nom} ${activeUser?.prenom}`}
        userCentreId={activeUser?.id_centre}
        clubs={clubs}
        onConfirm={async (clubId: string) => {
          try {
            await api.patch(
              `/clubs/${clubId}`,
              { id_coach: activeUser.id },
              { headers: getAuthHeaders() },
            );
            setModals((prev) => ({ ...prev, assignClub: false }));
            await loadPageData();
            showAlert("Responsable rattaché au club avec succès !", "success");
          } catch (e) {
            showAlert("Erreur lors de l'affectation du club", "error");
          }
        }}
      />
    </div>
  );
}
