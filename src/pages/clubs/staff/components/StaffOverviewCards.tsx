/**
 * StaffOverviewCards.tsx — Cartes KPI de la page gestion du staff.
 *
 * RÔLE :
 *   2 cartes métriques en haut de ClubStaffPage :
 *   • Nombre de membres du personnel (personnelCount)
 *   • Nombre total de membres du club (totalMembers)
 */
type Props = {
  personnelCount: number;
  totalMembers: number;
};

export function StaffOverviewCards({ personnelCount, totalMembers }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 text-center mb-6">
      <div className="rounded-[30px] bg-smart-sage/20 p-6">
        <div className="text-xs uppercase tracking-[0.4em] text-gray-500 font-black">
          Personnel
        </div>
        <div className="text-3xl font-black text-smart-teal">{personnelCount}</div>
      </div>
      <div className="rounded-[30px] bg-smart-teal/10 p-6">
        <div className="text-xs uppercase tracking-[0.4em] text-gray-500 font-black">
          Membres
        </div>
        <div className="text-3xl font-black text-smart-teal">{totalMembers}</div>
      </div>
    </div>
  );
}
