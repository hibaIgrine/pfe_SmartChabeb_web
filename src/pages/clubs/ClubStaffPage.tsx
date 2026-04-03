import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Users, User, Search, Calendar } from "lucide-react";
import api from "../../api/axios";
import { ClubPageShell } from "./components/ClubPageShell";
import { getAuthHeaders } from "./clubUtils";

export default function ClubStaffPage() {
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

  useEffect(() => {
    loadClub();
  }, [clubId]);

  const loadAvailableRoles = async () => {
    try {
      const response = await api.get(`/club-roles`, {
        headers: getAuthHeaders(),
      });
      const roleNames = (response.data ?? [])
        .map((role: any) =>
          typeof role.nom === "string" ? role.nom.toUpperCase().trim() : "",
        )
        .filter((role: string) => Boolean(role));

      const uniqueRoleNames: string[] = Array.from(
        new Set<string>(roleNames),
      );
      setAvailableRoles(uniqueRoleNames);
      setRoleLoadError("");

      if (!selectedRole && uniqueRoleNames.length > 0) {
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
    loadAvailableRoles();
  }, []);

  const handleCreateRole = async () => {
    const normalizedRole = newRoleName.trim().toUpperCase();
    const normalizedDescription = newRoleDescription.trim();
    if (!normalizedRole) {
      showNotification("Veuillez saisir un nom de rôle.", "error");
      return;
    }

    if (availableRoles.includes(normalizedRole)) {
      setSelectedRole(normalizedRole);
      setNewRoleName("");
      setNewRoleDescription("");
      showNotification("Ce rôle existe déjà.", "success");
      return;
    }

    try {
      setIsCreatingRole(true);
      await api.post(
        `/club-roles`,
        {
          nom: normalizedRole,
          description:
            normalizedDescription || `Rôle club ${normalizedRole}`,
        },
        { headers: getAuthHeaders() },
      );

      await loadAvailableRoles();
      setSelectedRole(normalizedRole);
      setNewRoleName("");
      setNewRoleDescription("");
      setIsAddRoleModalOpen(false);
      showNotification("Nouveau rôle club ajouté.", "success");
    } catch (err: any) {
      console.error("Erreur création rôle club :", err);
      showNotification(
        err?.response?.data?.message ||
          "Impossible de créer ce rôle club.",
        "error",
      );
    } finally {
      setIsCreatingRole(false);
    }
  };

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

  const handleAddStaff = async () => {
    if (!clubId || !selectedStaffId || !selectedRole) return;

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

  const staffMembers = Array.isArray(club?.staff) ? club.staff : [];
  const responsableCount = club?.responsable ? 1 : 0;
  const personnelCount = staffMembers.length + responsableCount;

  const filteredStaff = staffMembers.filter((item: any) => {
    const query = search.toLowerCase().trim();
    const name =
      `${item.utilisateur?.nom ?? ""} ${item.utilisateur?.prenom ?? ""}`.toLowerCase();
    const role = item.role_dans_club?.toString().toLowerCase() ?? "";
    return name.includes(query) || role.includes(query);
  });

  const inscriptions = Array.isArray(club?.inscriptions)
    ? club.inscriptions
    : [];
  const totalMembers = inscriptions.length;
  const staffCount = staffMembers.length;

  if (!club && !loading && error) {
    return (
      <ClubPageShell
        title="Personnel du club"
        subtitle="Erreur"
        loading={false}
        error={error}
        notification={null}
      >
        <></>
      </ClubPageShell>
    );
  }

  return (
    <>
      <ClubPageShell
        title="Personnel du club"
        subtitle={club?.nom ?? "Chargement..."}
        loading={loading}
        error={error}
        notification={notification}
      >
        <div className="grid grid-cols-2 gap-4 text-center mb-6">
          <div className="rounded-[30px] bg-smart-sage/20 p-6">
            <div className="text-xs uppercase tracking-[0.4em] text-gray-500 font-black">
              Personnel
            </div>
            <div className="text-3xl font-black text-smart-teal">
              {personnelCount}
            </div>
          </div>
          <div className="rounded-[30px] bg-smart-teal/10 p-6">
            <div className="text-xs uppercase tracking-[0.4em] text-gray-500 font-black">
              Membres
            </div>
            <div className="text-3xl font-black text-smart-teal">
              {totalMembers}
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-gray-200 bg-white p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-gray-400 font-black">
                Nouveau staff
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Ajouter un membre du centre comme staff du club.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(true)}
                className="inline-flex items-center justify-center rounded-2xl bg-smart-teal px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-black"
              >
                Ajouter un staff
              </button>
              <button
                type="button"
                onClick={() => setIsAddRoleModalOpen(true)}
                className="inline-flex items-center justify-center rounded-2xl border border-smart-teal bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-smart-teal transition hover:bg-smart-teal hover:text-white"
              >
                Ajouter un rôle
              </button>
            </div>
          </div>

          {!availableStaff.length && (
            <div className="mt-6 rounded-3xl border border-dashed border-gray-200 bg-slate-50 px-5 py-4 text-sm text-gray-500">
              Aucun adhérent disponible dans ce centre, ou tous les membres
              valides sont déjà assignés au club.
            </div>
          )}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[2.1fr_1fr]">
          <div className="space-y-8">
            <section className="bg-[#F7F3E9] border border-gray-100 rounded-[32px] p-6">
              <div className="mb-6">
                <h2 className="text-xl font-black text-smart-teal">
                  Responsable principal
                </h2>
                <p className="text-sm text-gray-500">
                  Le responsable officiel du club.
                </p>
              </div>

              {club?.responsable ? (
                <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[24px] bg-smart-sage/50 flex items-center justify-center text-xl text-smart-teal">
                      <User size={24} />
                    </div>
                    <div>
                      <div className="mt-2 text-lg font-black text-gray-900">
                        {club.responsable?.nom ?? ""}{" "}
                        {club.responsable?.prenom ?? ""}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-white border border-gray-100 p-6 text-sm text-gray-500">
                  Aucun responsable assigné pour le moment.
                </div>
              )}
            </section>

            <section className="bg-white border border-gray-100 rounded-[32px] p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-smart-teal">
                    Equipe du club
                  </h2>
                  <p className="text-sm text-gray-500">
                    Tous les collaborateurs, coachs et animateurs rattachés.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-smart-sage/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] font-black text-smart-teal">
                  <Users size={14} /> {staffCount} membre(s)
                </div>
              </div>

              <div className="relative mb-6">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un membre du staff..."
                  className="w-full rounded-[24px] border border-gray-200 bg-white py-4 pl-12 pr-4 text-sm font-bold text-gray-700 outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
                />
              </div>

              {filteredStaff.length > 0 ? (
                <div className="space-y-4">
                  {filteredStaff.map((item: any) => {
                    const utilisateurId = item.utilisateur?.id;
                    const currentRole = item.role_dans_club || "COACH";
                    const selectedRoleValue =
                      staffRoleChanges[utilisateurId] || currentRole;
                    const isResponsable =
                      club?.responsable?.id === utilisateurId;

                    return (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-gray-100 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-sm text-gray-500 uppercase tracking-[0.35em] font-black">
                              {item.role_dans_club || "Staff"}
                            </div>
                            <div className="mt-2 text-lg font-black text-gray-900">
                              {item.utilisateur?.nom} {item.utilisateur?.prenom}
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-3 sm:items-end">
                            <div className="rounded-full bg-smart-teal/10 px-3 py-2 text-xs uppercase tracking-[0.35em] text-smart-teal font-black">
                              {item.utilisateur?.email ?? "—"}
                            </div>
                            {utilisateurId ? (
                              isResponsable ? (
                                <span className="rounded-full bg-smart-teal/10 px-3 py-2 text-xs uppercase tracking-[0.35em] text-smart-teal font-black">
                                  Responsable principal
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleChangeResponsable(utilisateurId)
                                  }
                                  disabled={updatingClubResponsable}
                                  className="rounded-2xl bg-smart-sage px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-smart-teal transition hover:bg-black/5 disabled:opacity-40"
                                >
                                  Définir responsable
                                </button>
                              )
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-[1.5fr_auto]">
                          <div>
                            <label className="block text-xs uppercase tracking-[0.35em] text-gray-500 font-black mb-2">
                              Rôle du staff
                            </label>
                            <select
                              value={selectedRoleValue}
                              onChange={(e) =>
                                setStaffRoleChanges((prev) => ({
                                  ...prev,
                                  [utilisateurId]: e.target.value,
                                }))
                              }
                              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
                            >
                              {availableRoles.length > 0 ? (
                                availableRoles.map((roleName) => (
                                  <option key={roleName} value={roleName}>
                                    {roleName
                                      .replace(/_/g, " ")
                                      .toLowerCase()
                                      .replace(/(^|\s)\S/g, (l) =>
                                        l.toUpperCase(),
                                      )}
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="COACH">Coach</option>
                                  <option value="ANIMATEUR">Animateur</option>
                                </>
                              )}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStaffRole(
                                utilisateurId,
                                selectedRoleValue,
                              )
                            }
                            disabled={updatingStaffRoleId === utilisateurId}
                            className="rounded-2xl bg-smart-teal px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {updatingStaffRoleId === utilisateurId
                              ? "Mise à jour..."
                              : "Mettre à jour"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                  Aucun membre du staff ne correspond à votre recherche.
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-[32px] p-6">
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-gray-400 font-black">
                <Calendar size={14} /> Statistiques
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm font-black text-gray-700">
                  <span>Nombre total de personnel</span>
                  <span>{personnelCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-black text-gray-700">
                  <span>Nombre d’inscriptions</span>
                  <span>{totalMembers}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-black text-gray-700">
                  <span>Statut du club</span>
                  <span>{club?.est_actif ? "Actif" : "Désactivé"}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </ClubPageShell>

      {isAddStaffModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-staff-title"
          onClick={() => setIsAddStaffModalOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="add-staff-title"
                  className="text-xl font-black text-smart-teal"
                >
                  Ajouter un membre du centre
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Sélectionnez un membre du centre et attribuez-lui un rôle au
                  sein du club.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Membre du centre
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(event) => setSelectedStaffId(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
                >
                  {availableStaff.length > 0 ? (
                    availableStaff.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.nom} {user.prenom} — {user.email}
                      </option>
                    ))
                  ) : (
                    <option value="">Aucun membre disponible</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Rôle dans le club
                </label>
                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
                >
                  {availableRoles.length > 0 ? (
                    availableRoles.map((roleName) => (
                      <option key={roleName} value={roleName}>
                        {roleName
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/(^|\s)\S/g, (l) => l.toUpperCase())}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="COACH">Coach</option>
                      <option value="ANIMATEUR">Animateur</option>
                    </>
                  )}
                </select>
                {roleLoadError ? (
                  <p className="mt-2 text-xs text-red-600">{roleLoadError}</p>
                ) : null}
              </div>

            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="inline-flex justify-center rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAddStaff}
                disabled={!selectedStaffId || !selectedRole}
                className="inline-flex justify-center rounded-2xl bg-smart-teal px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Ajouter au club
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddRoleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-role-title"
          onClick={() => setIsAddRoleModalOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="add-role-title"
                  className="text-xl font-black text-smart-teal"
                >
                  Ajouter un rôle club
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Créez un rôle indépendant du staff. Il sera ensuite disponible
                  dans toutes les listes déroulantes du club.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRoleModalOpen(false)}
                className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Nom du rôle
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(event) => setNewRoleName(event.target.value)}
                  placeholder="Ex: COORDINATEUR"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newRoleDescription}
                  onChange={(event) =>
                    setNewRoleDescription(event.target.value)
                  }
                  rows={4}
                  placeholder="Ex: Responsable des activités terrain"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
                />
              </div>

              {roleLoadError ? (
                <p className="text-xs text-red-600">{roleLoadError}</p>
              ) : null}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsAddRoleModalOpen(false)}
                className="inline-flex justify-center rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateRole}
                disabled={isCreatingRole || !newRoleName.trim()}
                className="inline-flex justify-center rounded-2xl bg-smart-teal px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCreatingRole ? "Ajout..." : "Créer le rôle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
