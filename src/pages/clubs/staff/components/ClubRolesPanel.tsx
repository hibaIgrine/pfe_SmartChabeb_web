/**
 * ClubRolesPanel.tsx — Panneau de gestion des rôles personnalisés d'un club.
 *
 * RÔLE :
 *   Liste les rôles définis par le responsable (ClubRoleItem[]) et
 *   permet de les créer, modifier, ou désactiver.
 *
 * PROPS :
 *   roles[]          — Rôles actuels du club
 *   blockedStaffRole — Rôle système (RESPONSABLE_CLUB) non modifiable
 *   readOnly         — Désactive les boutons d'action (vue lecture seule)
 *   onCreateRole()   — Ouvre AddRoleModal
 *   onEditRole()     — Ouvre AddRoleModal en mode édition
 *   onDeactivateRole()— Ouvre DeactivateRoleModal
 */
import { PencilLine, Power } from "lucide-react";
import type { ClubRoleItem } from "../types";
import { normalizeRoleKey } from "../utils";

type Props = {
  roles: ClubRoleItem[];
  blockedStaffRole: string;
  readOnly?: boolean;
  onCreateRole: () => void;
  onEditRole: (role: ClubRoleItem) => void;
  onToggleRoleActive: (role: ClubRoleItem) => void;
};

export function ClubRolesPanel({
  roles,
  blockedStaffRole,
  readOnly = false,
  onCreateRole,
  onEditRole,
  onToggleRoleActive,
}: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-[32px] p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <div className="text-sm uppercase tracking-[0.35em] text-gray-400 font-black">
            Rôles du club
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Modifier, désactiver ou réactiver les rôles du club.
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={onCreateRole}
            className="rounded-2xl bg-smart-teal px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black"
          >
            Nouveau
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
        {roles.length > 0 ? (
          roles.map((role) => {
            const isBlocked = normalizeRoleKey(role.nom) === blockedStaffRole;
            const isInactive = role.is_active === false;
            return (
              <div
                key={role.id}
                className={`rounded-3xl border p-4 ${isInactive ? "border-dashed border-gray-200 bg-gray-50" : "border-gray-100 bg-slate-50"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-gray-900">
                        {role.nom.replace(/_/g, " ")}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${isInactive ? "bg-gray-200 text-gray-600" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {isInactive ? "Désactivé" : "Actif"}
                      </span>
                      {isBlocked ? (
                        <span className="rounded-full bg-smart-sage/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-smart-teal">
                          Global
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {role.description || "Aucune description."}
                    </p>
                  </div>

                  {!readOnly && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditRole(role)}
                        className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.15em] text-smart-teal border border-gray-200 transition hover:bg-smart-teal hover:text-white"
                      >
                        <PencilLine size={14} />
                      </button>
                      {!isBlocked && (
                        <button
                          type="button"
                          onClick={() => onToggleRoleActive(role)}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-[0.15em] transition ${isInactive ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                        >
                          <Power size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-slate-50 px-4 py-6 text-sm text-gray-500">
            Aucun rôle club disponible.
          </div>
        )}
      </div>
    </div>
  );
}
