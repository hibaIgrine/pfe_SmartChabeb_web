import { formatRoleLabel } from "../utils";

type Props = {
  open: boolean;
  selectedStaffId: string;
  selectedRole: string;
  availableStaff: any[];
  availableRoles: string[];
  roleLoadError: string;
  onClose: () => void;
  onChangeStaff: (value: string) => void;
  onChangeRole: (value: string) => void;
  onSubmit: () => void;
};

export function AddStaffModal({
  open,
  selectedStaffId,
  selectedRole,
  availableStaff,
  availableRoles,
  roleLoadError,
  onClose,
  onChangeStaff,
  onChangeRole,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-staff-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="add-staff-title" className="text-xl font-black text-smart-teal">
              Ajouter un membre du centre
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Sélectionnez un membre du centre et attribuez-lui un rôle au sein du
              club.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              onChange={(event) => onChangeStaff(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
            >
              {availableStaff.length > 0 ? (
                availableStaff.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.nom} {user.prenom} - {user.email}
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
              onChange={(event) => onChangeRole(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
            >
              {availableRoles.length > 0 ? (
                availableRoles.map((roleName) => (
                  <option key={roleName} value={roleName}>
                    {formatRoleLabel(roleName)}
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
            onClick={onClose}
            className="inline-flex justify-center rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!selectedStaffId || !selectedRole}
            className="inline-flex justify-center rounded-2xl bg-smart-teal px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ajouter au club
          </button>
        </div>
      </div>
    </div>
  );
}
