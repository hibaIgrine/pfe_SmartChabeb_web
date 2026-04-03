import { User, ListFilter, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { formatRoleLabel } from "../utils";

type Props = {
  responsable: any;
  responsableRole?: string;
  availableRoles: string[];
  updatingStaffRoleId: string | null;
  staffRoleChanges: Record<string, string>;
  onSetRoleChange: (userId: string, role: string) => void;
  onUpdateStaffRole: (userId: string, role: string) => void;
};

export function ClubResponsableSection({
  responsable,
  responsableRole = "COACH",
  availableRoles,
  updatingStaffRoleId,
  staffRoleChanges,
  onSetRoleChange,
  onUpdateStaffRole,
}: Props) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

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
        <div className="rounded-3xl bg-white border border-gray-100 p-6 text-sm text-gray-500">
          Aucun responsable assigné pour le moment.
        </div>
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
              <div className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-gray-700">
                {formatRoleLabel(responsableRole)}
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-start gap-2 md:justify-end">
            <button
              type="button"
              onClick={() => setRoleMenuOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-smart-teal transition hover:border-smart-teal hover:bg-smart-teal/5"
              title="Choisir un rôle"
              aria-label="Choisir un rôle"
            >
              <ListFilter size={16} />
            </button>

            <button
              type="button"
              onClick={() =>
                onUpdateStaffRole(responsableId, selectedRoleValue)
              }
              disabled={updatingStaffRoleId === responsableId}
              title="Mettre à jour le rôle"
              aria-label="Mettre à jour le rôle"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-smart-teal text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {updatingStaffRoleId === responsableId ? (
                <span className="text-xs font-black">...</span>
              ) : (
                <ShieldCheck size={15} />
              )}
            </button>

            {roleMenuOpen ? (
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
                        onSetRoleChange(responsableId, roleName);
                        setRoleMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                        isSelected
                          ? "bg-smart-teal/10 text-smart-teal font-black"
                          : "text-gray-700 hover:bg-slate-50"
                      }`}
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
        </div>
      </div>
    </section>
  );
}
