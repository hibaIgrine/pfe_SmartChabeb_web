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
      >
        <StaffOverviewCards
          personnelCount={state.personnelCount}
          totalMembers={state.totalMembers}
        />
        <StaffQuickActionsCard
          onAddStaff={() => setIsAddStaffModalOpen(true)}
          onAddRole={() => openRoleModal(null)}
          hasAvailableStaff={state.availableStaff.length > 0}
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[2.1fr_1fr]">
          <div className="space-y-8">
            <ClubResponsableSection responsable={state.club?.responsable} />
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
