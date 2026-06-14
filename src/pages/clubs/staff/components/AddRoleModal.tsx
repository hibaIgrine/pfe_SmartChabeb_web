/**
 * AddRoleModal.tsx — Modale de création / modification d'un rôle de club.
 *
 * RÔLE :
 *   Formulaire pour définir un rôle personnalisé dans le club
 *   (ex: "Secrétaire", "Trésorier", "Coach adjoint").
 *   Utilisé par ClubRolesPanel en mode création (editing=false) et modification (editing=true).
 *
 * CHAMPS :
 *   roleName        — Nom du rôle
 *   roleDescription — Description des responsabilités
 *
 * API : POST /clubs/:id/roles  ou  PATCH /clubs/:id/roles/:roleId
 */
type Props = {
  open: boolean;
  editing: boolean;
  roleName: string;
  roleDescription: string;
  roleLoadError: string;
  isCreatingRole: boolean;
  onClose: () => void;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onSubmit: () => void;
};

export function AddRoleModal({
  open,
  editing,
  roleName,
  roleDescription,
  roleLoadError,
  isCreatingRole,
  onClose,
  onChangeName,
  onChangeDescription,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-role-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="add-role-title" className="text-xl font-black text-smart-teal">
              {editing ? "Modifier le rôle club" : "Ajouter un rôle club"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {editing
                ? "Modifiez le nom et la description du rôle sélectionné."
                : "Créez un rôle indépendant du staff. Il sera ensuite disponible dans toutes les listes déroulantes du club."}
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
              Nom du rôle
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(event) => onChangeName(event.target.value)}
              placeholder="Ex: COORDINATEUR"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={roleDescription}
              onChange={(event) => onChangeDescription(event.target.value)}
              rows={4}
              placeholder="Ex: Responsable des activités terrain"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
            />
          </div>

          {roleLoadError ? <p className="text-xs text-red-600">{roleLoadError}</p> : null}
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
            disabled={isCreatingRole || !roleName.trim()}
            className="inline-flex justify-center rounded-2xl bg-smart-teal px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCreatingRole ? "Enregistrement..." : editing ? "Enregistrer" : "Créer le rôle"}
          </button>
        </div>
      </div>
    </div>
  );
}
