import { useState } from "react";
import { ListFilter, Power, Search, Users } from "lucide-react";
import { formatRoleLabel } from "../utils";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  staffCount: number;
  filteredStaff: any[];
  availableRoles: string[];
  staffRoleChanges: Record<string, string>;
  clubResponsableId?: string;
  updatingClubResponsable: boolean;
  updatingStaffRoleId: string | null;
  updatingStaffActiveId: string | null;
  readOnly?: boolean;
  onSetRoleChange: (userId: string, role: string) => void;
  onUpdateStaffRole: (userId: string, role: string) => void;
  onChangeResponsable: (userId: string) => void;
  onToggleStaffActive: (staffId: string, activate: boolean) => void;
};

export function StaffTeamSection({
  search,
  onSearchChange,
  staffCount,
  filteredStaff,
  availableRoles,
  staffRoleChanges,
  clubResponsableId,
  updatingClubResponsable,
  updatingStaffRoleId,
  updatingStaffActiveId,
  readOnly = false,
  onSetRoleChange,
  onUpdateStaffRole,
  onChangeResponsable,
  onToggleStaffActive,
}: Props) {
  const [roleMenuOpenFor, setRoleMenuOpenFor] = useState<string | null>(null);

  return (
    <section className="bg-white border border-gray-100 rounded-[32px] p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-smart-teal">Equipe du club</h2>
          <p className="text-sm text-gray-500">
            Gérer les rôles et l'état actif du personnel du club.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full bg-smart-sage/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] font-black text-smart-teal sm:self-auto">
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
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un membre du staff..."
          className="w-full rounded-[24px] border border-gray-200 bg-white py-4 pl-12 pr-4 text-sm font-bold text-gray-700 outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
        />
      </div>

      {filteredStaff.length > 0 ? (
        <div className="space-y-2">
          <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-4 md:pb-1">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
              Staff
            </div>
            {!readOnly && (
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">
                Actions
              </div>
            )}
          </div>

          {filteredStaff.map((item: any) => {
            const utilisateurId = item.utilisateur?.id;
            const currentRole = item.role_dans_club || "COACH";
            const selectedRoleValue =
              staffRoleChanges[utilisateurId] || currentRole;
            const isResponsable = clubResponsableId === utilisateurId;
            const isInactive = item.is_active === false;

            return (
              <div
                key={item.id}
                className={`rounded-xl border px-4 py-3 ${isInactive ? "border-gray-200 bg-gray-50" : "border-gray-100 bg-white"}`}
              >
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-bold text-smart-teal break-words">
                        {item.utilisateur?.email ?? "—"}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-gray-700">
                        {formatRoleLabel(item.role_dans_club || "Staff")}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="font-black text-gray-900 break-words">
                        {item.utilisateur?.nom} {item.utilisateur?.prenom}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${isInactive ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {isInactive ? "Désactivé" : "Actif"}
                      </span>
                      {isResponsable ? (
                        <span className="rounded-full bg-smart-teal/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-smart-teal">
                          Responsable
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="relative grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-start md:justify-end">
                      <button
                        type="button"
                        disabled={isInactive || !utilisateurId || updatingStaffRoleId === utilisateurId}
                        onClick={() =>
                          setRoleMenuOpenFor((prev) =>
                            prev === item.id ? null : item.id,
                          )
                        }
                        className="inline-flex h-9 w-9 items-center justify-center justify-self-start rounded-lg border border-gray-200 bg-white text-smart-teal transition hover:border-smart-teal hover:bg-smart-teal/5 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                        title="Changer le rôle"
                        aria-label="Changer le rôle"
                      >
                        {updatingStaffRoleId === utilisateurId ? (
                          <span className="text-xs font-black text-smart-teal">...</span>
                        ) : (
                          <ListFilter size={16} />
                        )}
                      </button>


                      {!isResponsable ? (
                        <button
                          type="button"
                          onClick={() => onToggleStaffActive(item.id, isInactive)}
                          disabled={updatingStaffActiveId === item.id}
                          title={
                            isInactive
                              ? "Activer le staff"
                              : "Désactiver le staff"
                          }
                          aria-label={
                            isInactive
                              ? "Activer le staff"
                              : "Désactiver le staff"
                          }
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition disabled:opacity-40 ${isInactive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                        >
                          {updatingStaffActiveId === item.id ? (
                            <span className="text-xs font-black">...</span>
                          ) : (
                            <Power size={15} />
                          )}
                        </button>
                      ) : null}

                      {roleMenuOpenFor === item.id && !isInactive ? (
                        <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[240px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                          {(availableRoles.length > 0
                            ? availableRoles
                            : ["COACH", "ANIMATEUR"]
                          ).map((roleName) => {
                            const isSelected = roleName === selectedRoleValue;
                            return (
                              <button
                                key={roleName}
                                type="button"
                                onClick={() => {
                                  onSetRoleChange(utilisateurId, roleName);
                                  onUpdateStaffRole(utilisateurId, roleName);
                                  setRoleMenuOpenFor(null);
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${isSelected ? "bg-smart-teal/10 text-smart-teal font-black" : "text-gray-700 hover:bg-slate-50"}`}
                              >
                                <span>{formatRoleLabel(roleName)}</span>
                                {isSelected ? (
                                  <span className="text-[10px] uppercase tracking-[0.16em]">
                                    Actuel
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  )}
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
  );
}
