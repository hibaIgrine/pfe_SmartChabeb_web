import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../../api/axios";
import { getAuthHeaders } from "../../clubUtils";
import { BLOCKED_STAFF_ROLE, normalizeRoleKey } from "../utils";
import type { ClubRoleItem, ClubStaffPageState } from "../types";

export function useClubStaffPage() {
  const { clubId } = useParams<{ clubId: string }>();

  const [club, setClub] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ClubRoleItem | null>(null);
  const [roleToDeactivate, setRoleToDeactivate] = useState<ClubRoleItem | null>(
    null,
  );

  const [clubRoles, setClubRoles] = useState<ClubRoleItem[]>([]);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [roleLoadError, setRoleLoadError] = useState("");

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [staffRoleChanges, setStaffRoleChanges] = useState<
    Record<string, string>
  >({});

  const [updatingClubResponsable, setUpdatingClubResponsable] = useState(false);
  const [updatingStaffRoleId, setUpdatingStaffRoleId] = useState<string | null>(
    null,
  );
  const [updatingStaffActiveId, setUpdatingStaffActiveId] = useState<
    string | null
  >(null);

  const showNotification = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 3500);
  };

  const loadClub = async () => {
    if (!clubId) {
      setError("Club introuvable");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/clubs/${clubId}`, {
        headers: getAuthHeaders(),
      });
      setClub(response.data);
    } catch (err: any) {
      console.error("Erreur chargement club :", err);
      setError(
        err?.response?.data?.message ||
          "Impossible de charger les informations du club.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableRoles = async () => {
    try {
      const response = await api.get(`/club-roles`, {
        headers: getAuthHeaders(),
      });
      const allRoles: ClubRoleItem[] = (response.data ?? [])
        .map((role: any) => ({
          id: role.id,
          nom:
            typeof role.nom === "string" ? role.nom.toUpperCase().trim() : "",
          description: role.description ?? "",
          is_active: role.is_active !== false,
          staff: Array.isArray(role.staff) ? role.staff : [],
        }))
        .filter((role: ClubRoleItem) => Boolean(role.nom));

      const EXCLUDED_ROLES = new Set(["RESPONSABLE_CENTRE", "RESPONSABLE_CLUB", "ADHERENT", "ADHERANT", "COACH"]);
      const filteredRoles = allRoles.filter(
        (role: ClubRoleItem) => !EXCLUDED_ROLES.has(normalizeRoleKey(role.nom)),
      );
      setClubRoles(filteredRoles);

      const roleNames = filteredRoles
        .map((role: any) => (role.is_active ? role.nom : ""))
        .filter((role: string) => Boolean(role));

      const uniqueRoleNames: string[] = Array.from(new Set<string>(roleNames))
        .filter((roleName) => normalizeRoleKey(roleName) !== BLOCKED_STAFF_ROLE)
        .filter(Boolean);

      setAvailableRoles(uniqueRoleNames);
      setRoleLoadError("");

      if (
        !selectedRole ||
        selectedRole === BLOCKED_STAFF_ROLE ||
        !uniqueRoleNames.includes(selectedRole)
      ) {
        setSelectedRole(uniqueRoleNames[0]);
      }
    } catch (err: any) {
      console.error("Erreur chargement des rôles club :", err);
      setRoleLoadError(
        err?.response?.data?.message ||
          "Impossible de charger la liste des rôles club.",
      );
    }
  };

  useEffect(() => {
    loadClub();
  }, [clubId]);

  useEffect(() => {
    loadAvailableRoles();
  }, []);

  useEffect(() => {
    const loadAvailableStaff = async () => {
      if (!club?.centre?.id) {
        setAvailableStaff([]);
        setSelectedStaffId("");
        return;
      }

      try {
        const response = await api.get(
          `/users/adherents-by-centre/${club.centre.id}`,
          { headers: getAuthHeaders() },
        );
        const existingStaffIds = new Set(
          [
            ...(club?.staff ?? []).map((staff: any) => staff.utilisateur?.id),
            club?.responsable?.id,
          ].filter(Boolean),
        );
        const choices = (response.data ?? []).filter(
          (user: any) => !existingStaffIds.has(user.id),
        );
        setAvailableStaff(choices);
        setSelectedStaffId(choices[0]?.id ?? "");
      } catch (err) {
        console.error("Erreur chargement du personnel du centre :", err);
        setAvailableStaff([]);
        setSelectedStaffId("");
      }
    };

    loadAvailableStaff();
  }, [club]);

  const openRoleModal = (role?: ClubRoleItem | null) => {
    setEditingRole(role ?? null);
    setNewRoleName(role?.nom ?? "");
    setNewRoleDescription(role?.description ?? "");
    setIsAddRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    const normalizedRole = newRoleName.trim().toUpperCase();
    const normalizedDescription = newRoleDescription.trim();

    if (!normalizedRole) {
      showNotification("Veuillez saisir un nom de rôle.", "error");
      return;
    }

    const duplicateRole = clubRoles.find(
      (role) => normalizeRoleKey(role.nom) === normalizeRoleKey(normalizedRole),
    );

    if (
      duplicateRole &&
      (!editingRole || duplicateRole.id !== editingRole.id)
    ) {
      setSelectedRole(normalizedRole);
      setNewRoleName("");
      setNewRoleDescription("");
      showNotification("Ce rôle existe déjà.", "success");
      return;
    }

    try {
      setIsCreatingRole(true);
      if (editingRole) {
        await api.patch(
          `/club-roles/${editingRole.id}`,
          {
            nom: normalizedRole,
            description: normalizedDescription || `Rôle club ${normalizedRole}`,
          },
          { headers: getAuthHeaders() },
        );
      } else {
        await api.post(
          `/club-roles`,
          {
            nom: normalizedRole,
            description: normalizedDescription || `Rôle club ${normalizedRole}`,
          },
          { headers: getAuthHeaders() },
        );
      }

      await loadAvailableRoles();
      setSelectedRole(normalizedRole);
      setNewRoleName("");
      setNewRoleDescription("");
      setIsAddRoleModalOpen(false);
      setEditingRole(null);
      showNotification("Nouveau rôle club ajouté.", "success");
    } catch (err: any) {
      console.error("Erreur création rôle club :", err);
      showNotification(
        err?.response?.data?.message || "Impossible de créer ce rôle club.",
        "error",
      );
    } finally {
      setIsCreatingRole(false);
    }
  };

  const toggleRoleActiveState = async (role: ClubRoleItem) => {
    try {
      if (role.is_active !== false) {
        setRoleToDeactivate(role);
        return;
      }

      await api.patch(
        `/club-roles/${role.id}/reactivate`,
        {},
        { headers: getAuthHeaders() },
      );

      setClubRoles((prev) =>
        prev.map((item) =>
          item.id === role.id ? { ...item, is_active: true } : item,
        ),
      );

      setAvailableRoles((prev) => {
        const nextRoles = prev.includes(role.nom) ? prev : [...prev, role.nom];
        return Array.from(new Set(nextRoles));
      });

      await loadAvailableRoles();
      showNotification("Rôle réactivé avec succès.", "success");
    } catch (err: any) {
      console.error("Erreur changement état rôle :", err);
      showNotification(
        err?.response?.data?.message || "Impossible de modifier ce rôle.",
        "error",
      );
    }
  };

  const confirmDeactivateRole = async () => {
    if (!roleToDeactivate) return;

    try {
      await api.patch(
        `/club-roles/${roleToDeactivate.id}/deactivate`,
        {},
        { headers: getAuthHeaders() },
      );

      setClubRoles((prev) =>
        prev.map((item) =>
          item.id === roleToDeactivate.id ? { ...item, is_active: false } : item,
        ),
      );
      setAvailableRoles((prev) =>
        prev.filter((roleName) => roleName !== roleToDeactivate.nom),
      );

      await loadAvailableRoles();
      showNotification("Rôle désactivé avec succès.", "success");
    } catch (err: any) {
      console.error("Erreur désactivation rôle :", err);
      showNotification(
        err?.response?.data?.message || "Impossible de désactiver ce rôle.",
        "error",
      );
    } finally {
      setRoleToDeactivate(null);
    }
  };

  const handleAddStaff = async () => {
    if (!clubId || !selectedStaffId || !selectedRole) return;

    if (selectedRole === BLOCKED_STAFF_ROLE) {
      showNotification(
        "RESPONSABLE_CLUB ne peut pas être affecté comme rôle staff.",
        "error",
      );
      return;
    }

    try {
      await api.post(
        `/clubs/${clubId}/staff`,
        {
          id_utilisateur: selectedStaffId,
          role_dans_club: selectedRole,
        },
        { headers: getAuthHeaders() },
      );
      showNotification("Staff ajouté avec succès.", "success");
      setIsAddStaffModalOpen(false);
      setSelectedStaffId("");
      await loadClub();
    } catch (err: any) {
      console.error("Erreur ajout staff :", err);
      showNotification(
        err?.response?.data?.message || "Impossible d'ajouter ce staff.",
        "error",
      );
    }
  };

  const handleChangeResponsable = async (userId: string) => {
    if (!clubId || !userId) return;

    try {
      setUpdatingClubResponsable(true);
      await api.patch(
        `/clubs/${clubId}`,
        { id_coach: userId },
        { headers: getAuthHeaders() },
      );
      showNotification("Responsable du club mis à jour.", "success");
      await loadClub();
    } catch (err: any) {
      console.error("Erreur changement responsable :", err);
      showNotification(
        err?.response?.data?.message || "Impossible de changer le responsable.",
        "error",
      );
    } finally {
      setUpdatingClubResponsable(false);
    }
  };

  const handleUpdateStaffRole = async (utilisateurId: string, role: string) => {
    if (!clubId || !utilisateurId || !role) return;

    if (role === BLOCKED_STAFF_ROLE) {
      showNotification(
        "RESPONSABLE_CLUB ne peut pas être utilisé dans le staff.",
        "error",
      );
      return;
    }

    try {
      setUpdatingStaffRoleId(utilisateurId);
      await api.post(
        `/clubs/${clubId}/staff`,
        {
          id_utilisateur: utilisateurId,
          role_dans_club: role,
        },
        { headers: getAuthHeaders() },
      );
      showNotification("Rôle du staff mis à jour.", "success");
      setClub((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          staff: prev.staff.map((item: any) =>
            item.utilisateur?.id === utilisateurId
              ? { ...item, role_dans_club: role }
              : item,
          ),
        };
      });
      setStaffRoleChanges((prev) => {
        const next = { ...prev };
        delete next[utilisateurId];
        return next;
      });
      await loadClub();
    } catch (err: any) {
      console.error("Erreur mise à jour rôle du staff :", err);
      showNotification(
        err?.response?.data?.message || "Impossible de mettre à jour le rôle.",
        "error",
      );
    } finally {
      setUpdatingStaffRoleId(null);
    }
  };

  const handleToggleStaffActive = async (staffId: string, activate: boolean) => {
    if (!clubId || !staffId) return;

    try {
      setUpdatingStaffActiveId(staffId);
      await api.patch(
        `/clubs/${clubId}/staff/${staffId}/${activate ? "reactivate" : "deactivate"}`,
        {},
        { headers: getAuthHeaders() },
      );

      setClub((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          staff: (prev.staff ?? []).map((item: any) =>
            item.id === staffId ? { ...item, is_active: activate } : item,
          ),
        };
      });

      showNotification(
        activate ? "Staff réactivé avec succès." : "Staff désactivé avec succès.",
        "success",
      );

      await loadClub();
    } catch (err: any) {
      console.error("Erreur changement état staff :", err);
      showNotification(
        err?.response?.data?.message || "Impossible de modifier ce staff.",
        "error",
      );
    } finally {
      setUpdatingStaffActiveId(null);
    }
  };

  const staffMembers = Array.isArray(club?.staff) ? club.staff : [];
  const activeStaffMembers = staffMembers.filter(
    (item: any) => item.is_active !== false,
  );
  const responsableCount = club?.responsable ? 1 : 0;
  const personnelCount = activeStaffMembers.length + responsableCount;

  const filteredStaff = staffMembers.filter((item: any) => {
    const query = search.toLowerCase().trim();
    const name =
      `${item.utilisateur?.nom ?? ""} ${item.utilisateur?.prenom ?? ""}`.toLowerCase();
    const role = item.role_dans_club?.toString().toLowerCase() ?? "";
    return name.includes(query) || role.includes(query);
  });

  const inscriptions = Array.isArray(club?.inscriptions) ? club.inscriptions : [];
  const totalMembers = inscriptions.length;
  const staffCount = activeStaffMembers.length;

  const state: ClubStaffPageState = {
    club,
    search,
    loading,
    error,
    notification,
    isAddStaffModalOpen,
    isAddRoleModalOpen,
    editingRole,
    roleToDeactivate,
    clubRoles,
    availableStaff,
    availableRoles,
    roleLoadError,
    newRoleName,
    newRoleDescription,
    isCreatingRole,
    selectedStaffId,
    selectedRole,
    staffRoleChanges,
    updatingClubResponsable,
    updatingStaffRoleId,
    updatingStaffActiveId,
    staffMembers,
    filteredStaff,
    personnelCount,
    totalMembers,
    staffCount,
  };

  return {
    state,
    blockedStaffRole: BLOCKED_STAFF_ROLE,
    loadClub,
    loadAvailableRoles,
    setSearch,
    setIsAddStaffModalOpen,
    setIsAddRoleModalOpen,
    setRoleToDeactivate,
    setNewRoleName,
    setNewRoleDescription,
    setSelectedStaffId,
    setSelectedRole,
    setStaffRoleChanges,
    openRoleModal,
    handleSaveRole,
    toggleRoleActiveState,
    confirmDeactivateRole,
    handleAddStaff,
    handleChangeResponsable,
    handleUpdateStaffRole,
    handleToggleStaffActive,
  };
}
