/**
 * ClubStaffPage.tsx — Gestion du staff et des rôles d'un club.
 *
 * RÔLE :
 *   Page de gestion des membres du staff (encadrants, assistants, bénévoles) d'un club.
 *   Accessible via /clubs/:clubId/staff.
 *
 * COMPOSITION :
 *   ClubPageShell         — Wrapper avec en-tête du club (nom, catégorie, breadcrumb)
 *   useClubStaffPage      — Hook custom gérant toute la logique (chargement, actions)
 *   StaffOverviewCards    — KPIs : total staff, par rôle, taux d'activité
 *   StaffQuickActionsCard — Boutons rapides (ajouter membre, créer rôle)
 *   ClubResponsableSection— Section dédiée au responsable principal du club
 *   StaffTeamSection      — Liste des membres du staff avec leurs rôles
 *   StaffStatsCard        — Statistiques de performance du staff
 *   ClubRolesPanel        — Liste des rôles disponibles (créer/désactiver un rôle)
 *   AddStaffModal         — Formulaire ajout d'un membre au staff
 *   AddRoleModal          — Formulaire création d'un rôle personnalisé
 *   DeactivateRoleModal   — Confirmation désactivation d'un rôle
 *
 * ACCÈS : ADMIN + RESPONSABLE_CLUB + RESPONSABLE_CENTRE
 */
import { ClubPageShell } from "./components/ClubPageShell";
import { useClubStaffPage } from "./staff/hooks/useClubStaffPage";
import { StaffOverviewCards } from "./staff/components/StaffOverviewCards";
import { StaffQuickActionsCard } from "./staff/components/StaffQuickActionsCard";
import { ClubResponsableSection } from "./staff/components/ClubResponsableSection";
import { StaffTeamSection } from "./staff/components/StaffTeamSection";
import { StaffStatsCard } from "./staff/components/StaffStatsCard";
import { ClubRolesPanel } from "./staff/components/ClubRolesPanel";
import { AddStaffModal } from "./staff/components/AddStaffModal";
import { AddRoleModal } from "./staff/components/AddRoleModal";
import { DeactivateRoleModal } from "./staff/components/DeactivateRoleModal";

export default function ClubStaffPage() {
  const currentRole = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").role ?? ""; }
    catch { return ""; }
  })();
  const isViewer = currentRole === "ADMIN" || currentRole === "RESPONSABLE_CENTRE";
  const isAdmin = currentRole === "ADMIN";

  const {
    state,
    blockedStaffRole,
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
  } = useClubStaffPage();

  if (!state.club && !state.loading && state.error) {
    return (
      <ClubPageShell
        title="Personnel du club"
        subtitle="Erreur"
        loading={false}
        error={state.error}
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
        subtitle={state.club?.nom ?? "Chargement..."}
        loading={state.loading}
        error={state.error}
        notification={state.notification}
        hideLabel={true}
      >
        <StaffOverviewCards
          personnelCount={state.personnelCount}
          totalMembers={state.totalMembers}
        />
        {!isViewer && (
          <StaffQuickActionsCard
            onAddStaff={() => setIsAddStaffModalOpen(true)}
            onAddRole={() => openRoleModal(null)}
            hasAvailableStaff={state.availableStaff.length > 0}
          />
        )}

        <div className="mt-12 grid gap-8 lg:grid-cols-[2.1fr_1fr]">
          <div className="space-y-8">
            <ClubResponsableSection
              responsable={state.club?.responsable}
              responsableRole={
                state.club?.responsable?.role_dans_club || "COACH"
              }
              availableRoles={state.availableRoles}
              updatingStaffRoleId={state.updatingStaffRoleId}
              staffRoleChanges={state.staffRoleChanges}
              readOnly={isViewer}
              canChangeResponsable={isAdmin}
              staffList={state.filteredStaff}
              availableUsers={state.availableStaff}
              onAssignResponsable={handleChangeResponsable}
              onSetRoleChange={(userId, role) =>
                setStaffRoleChanges((prev) => ({ ...prev, [userId]: role }))
              }
              onUpdateStaffRole={handleUpdateStaffRole}
            />
            <StaffTeamSection
              search={state.search}
              onSearchChange={setSearch}
              staffCount={state.staffCount}
              filteredStaff={state.filteredStaff}
              availableRoles={state.availableRoles}
              staffRoleChanges={state.staffRoleChanges}
              clubResponsableId={state.club?.responsable?.id}
              updatingClubResponsable={state.updatingClubResponsable}
              updatingStaffRoleId={state.updatingStaffRoleId}
              updatingStaffActiveId={state.updatingStaffActiveId}
              readOnly={isViewer}
              onSetRoleChange={(userId, role) =>
                setStaffRoleChanges((prev) => ({ ...prev, [userId]: role }))
              }
              onUpdateStaffRole={handleUpdateStaffRole}
              onChangeResponsable={handleChangeResponsable}
              onToggleStaffActive={handleToggleStaffActive}
            />
          </div>

          <aside className="space-y-6">
            <StaffStatsCard
              personnelCount={state.personnelCount}
              totalMembers={state.totalMembers}
              clubActive={state.club?.est_actif}
            />
            <ClubRolesPanel
              roles={state.clubRoles}
              blockedStaffRole={blockedStaffRole}
              readOnly={isViewer}
              onCreateRole={() => openRoleModal(null)}
              onEditRole={(role) => openRoleModal(role)}
              onToggleRoleActive={toggleRoleActiveState}
            />
          </aside>
        </div>
      </ClubPageShell>

      <AddStaffModal
        open={state.isAddStaffModalOpen}
        selectedStaffId={state.selectedStaffId}
        selectedRole={state.selectedRole}
        availableStaff={state.availableStaff}
        availableRoles={state.availableRoles}
        roleLoadError={state.roleLoadError}
        onClose={() => setIsAddStaffModalOpen(false)}
        onChangeStaff={setSelectedStaffId}
        onChangeRole={setSelectedRole}
        onSubmit={handleAddStaff}
      />

      <AddRoleModal
        open={state.isAddRoleModalOpen}
        editing={Boolean(state.editingRole)}
        roleName={state.newRoleName}
        roleDescription={state.newRoleDescription}
        roleLoadError={state.roleLoadError}
        isCreatingRole={state.isCreatingRole}
        onClose={() => setIsAddRoleModalOpen(false)}
        onChangeName={setNewRoleName}
        onChangeDescription={setNewRoleDescription}
        onSubmit={handleSaveRole}
      />

      {state.roleToDeactivate ? (
        <DeactivateRoleModal
          roleName={state.roleToDeactivate.nom}
          onCancel={() => setRoleToDeactivate(null)}
          onConfirm={confirmDeactivateRole}
        />
      ) : null}
    </>
  );
}
