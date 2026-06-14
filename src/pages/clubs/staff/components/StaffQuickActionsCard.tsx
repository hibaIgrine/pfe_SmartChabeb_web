/**
 * StaffQuickActionsCard.tsx — Carte d'actions rapides de la page staff.
 *
 * RÔLE :
 *   Deux boutons d'action principaux dans ClubStaffPage :
 *   • "Ajouter un membre" → ouvre AddStaffModal (désactivé si hasAvailableStaff=false)
 *   • "Créer un rôle" → ouvre AddRoleModal
 */
type Props = {
  onAddStaff: () => void;
  onAddRole: () => void;
  hasAvailableStaff: boolean;
};

export function StaffQuickActionsCard({
  onAddStaff,
  onAddRole,
  hasAvailableStaff,
}: Props) {
  return (
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
            onClick={onAddStaff}
            className="inline-flex items-center justify-center rounded-2xl bg-smart-teal px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-black"
          >
            Ajouter un staff
          </button>
          <button
            type="button"
            onClick={onAddRole}
            className="inline-flex items-center justify-center rounded-2xl border border-smart-teal bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-smart-teal transition hover:bg-smart-teal hover:text-white"
          >
            Ajouter un rôle
          </button>
        </div>
      </div>

      {!hasAvailableStaff && (
        <div className="mt-6 rounded-3xl border border-dashed border-gray-200 bg-slate-50 px-5 py-4 text-sm text-gray-500">
          Aucun adhérent disponible dans ce centre, ou tous les membres valides
          sont déjà assignés au club.
        </div>
      )}
    </div>
  );
}
