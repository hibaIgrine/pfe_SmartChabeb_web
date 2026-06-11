import { User, ListFilter, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { formatRoleLabel } from "../utils";

type Props = {
  responsable: any;
  responsableRole?: string;
  availableRoles: string[];
  updatingStaffRoleId: string | null;
  staffRoleChanges: Record<string, string>;
  readOnly?: boolean;
  canChangeResponsable?: boolean;
  staffList?: any[];
  availableUsers?: any[];
  onAssignResponsable?: (userId: string) => void;
  onSetRoleChange: (userId: string, role: string) => void;
  onUpdateStaffRole: (userId: string, role: string) => void;
};

export function ClubResponsableSection({
  responsable,
  responsableRole = "COACH",
  availableRoles,
  updatingStaffRoleId,
  staffRoleChanges,
  readOnly = false,
  canChangeResponsable = false,
  staffList = [],
  availableUsers = [],
  onAssignResponsable,
  onSetRoleChange,
  onUpdateStaffRole,
}: Props) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  if (!responsable) {
    return (
      <section className="bg-[#F7F3E9] border border-gray-100 rounded-[32px] p-6">
        <div className="mb-6">
          <h2 className="text-xl font-black text-smart-teal">
            Responsable principal
          </h2>
          <p className="text-sm text-gray-500">
            Le responsable officiel du club.
          </p>
        </div>
        {!canChangeResponsable ? (
          <div className="rounded-3xl bg-white border border-gray-100 p-6 text-sm text-gray-500">
            Aucun responsable assigné pour le moment.
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 rounded-2xl border border-gray-200 bg-[#F7F3E9] px-4 py-3 text-sm font-bold text-smart-teal outline-none focus:ring-2 focus:ring-smart-teal/20 cursor-pointer"
            >
              <option value="">Choisir un responsable…</option>
              {staffList.length > 0
                ? staffList.map((s: any) => (
                    <option key={s.utilisateur?.id} value={s.utilisateur?.id}>
                      {s.utilisateur?.nom} {s.utilisateur?.prenom}
                    </option>
                  ))
                : availableUsers.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.nom} {u.prenom}
                    </option>
                  ))}
            </select>
            <button
              type="button"
              disabled={!selectedUserId}
              onClick={() => {
                if (selectedUserId && onAssignResponsable) {
                  onAssignResponsable(selectedUserId);
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-smart-teal text-white text-sm font-black hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <UserPlus size={16} />
              Assigner
            </button>
          </div>
        )}
      </section>
    );
  }

  const responsableId = responsable?.id;
  const selectedRoleValue = staffRoleChanges[responsableId] || responsableRole;

  return (
    <section className="bg-[#F7F3E9] border border-gray-100 rounded-[32px] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-black text-smart-teal">
          Responsable principal
        </h2>
        <p className="text-sm text-gray-500">
          Le responsable officiel du club.
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[24px] bg-smart-sage/50 flex items-center justify-center text-xl text-smart-teal">
              <User size={24} />
            </div>
            <div>
              <div className="text-lg font-black text-gray-900">
                {responsable?.nom ?? ""} {responsable?.prenom ?? ""}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {responsable?.email ?? "—"}
              </div>
            </div>
          </div>

          {/* ADMIN / RESPONSABLE_CENTRE : changer le responsable */}
          {canChangeResponsable && staffList.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="rounded-xl border border-gray-200 bg-[#F7F3E9] px-3 py-2 text-xs font-bold text-smart-teal outline-none focus:ring-2 focus:ring-smart-teal/20 cursor-pointer"
              >
                <option value="">Changer de responsable…</option>
                {staffList
                  .filter((s: any) => s.utilisateur?.id !== responsableId)
                  .map((s: any) => (
                    <option key={s.utilisateur?.id} value={s.utilisateur?.id}>
                      {s.utilisateur?.nom} {s.utilisateur?.prenom}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                disabled={!selectedUserId}
                onClick={() => {
                  if (selectedUserId && onAssignResponsable) {
                    onAssignResponsable(selectedUserId);
                    setSelectedUserId("");
                  }
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-smart-teal text-white transition hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
                title="Confirmer le changement"
              >
                <UserPlus size={15} />
              </button>
            </div>
          )}

          {/* RESPONSABLE_CLUB : édition du rôle */}
          {!readOnly && (
            <div className="relative flex items-center justify-start gap-2 md:justify-end">
              <button
                type="button"
                onClick={() => setRoleMenuOpen((prev) => !prev)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-smart-teal transition hover:border-smart-teal hover:bg-smart-teal/5"
                title="Choisir un rôle"
              >
                <ListFilter size={16} />
              </button>
              <button
                type="button"
                onClick={() => onUpdateStaffRole(responsableId, selectedRoleValue)}
                disabled={updatingStaffRoleId === responsableId}
                title="Mettre à jour le rôle"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-smart-teal text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {updatingStaffRoleId === responsableId ? (
                  <span className="text-xs font-black">...</span>
                ) : (
                  <ShieldCheck size={15} />
                )}
              </button>
              {roleMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[240px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                  {(availableRoles.length > 0 ? availableRoles : ["COACH", "ANIMATEUR"]).map((roleName) => {
                    const isSelected = roleName === selectedRoleValue;
                    return (
                      <button
                        key={roleName}
                        type="button"
                        onClick={() => {
                          onSetRoleChange(responsableId, roleName);
                          setRoleMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                          isSelected ? "bg-smart-teal/10 text-smart-teal font-black" : "text-gray-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{formatRoleLabel(roleName)}</span>
                        {isSelected && <span className="text-[10px] uppercase tracking-[0.16em]">Actuel</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
