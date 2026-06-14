/**
 * DeactivateRoleModal.tsx — Modal de confirmation de désactivation d'un rôle.
 *
 * RÔLE :
 *   Popup de confirmation avant de désactiver un rôle personnalisé du club.
 *   Affiche le nom du rôle et avertit des conséquences (membres concernés).
 *
 * PROPS :
 *   roleName   — Nom du rôle à désactiver (affiché dans le message)
 *   onCancel() — Ferme la modal sans action
 *   onConfirm()— Confirme la désactivation (PATCH /clubs/:id/roles/:roleId)
 */
type Props = {
  roleName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeactivateRoleModal({ roleName, onCancel, onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-role-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="deactivate-role-title" className="text-xl font-black text-gray-900">
          Désactiver le rôle
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          Voulez-vous vraiment désactiver le rôle{" "}
          <span className="font-black text-smart-teal">{roleName.replace(/_/g, " ")}</span>{" "}
          ? Il restera disponible dans la table des rôles mais n’apparaîtra plus
          dans la liste d’ajout du staff.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-red-700"
          >
            Désactiver
          </button>
        </div>
      </div>
    </div>
  );
}
