/**
 * StaffStatsCard.tsx — Carte statistiques détaillées de la page staff.
 *
 * RÔLE :
 *   Affiche des métriques supplémentaires dans ClubStaffPage :
 *   • Nombre de membres du personnel
 *   • Nombre total de membres du club
 *   • Statut actif/inactif du club (clubActive)
 */
import { Calendar } from "lucide-react";

type Props = {
  personnelCount: number;
  totalMembers: number;
  clubActive?: boolean;
};

export function StaffStatsCard({ personnelCount, totalMembers, clubActive }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-[32px] p-6">
      <div className="flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-gray-400 font-black">
        <Calendar size={14} /> Statistiques
      </div>
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between text-sm font-black text-gray-700">
          <span>Nombre total de personnel</span>
          <span>{personnelCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-black text-gray-700">
          <span>Nombre d’inscriptions</span>
          <span>{totalMembers}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-black text-gray-700">
          <span>Statut du club</span>
          <span>{clubActive ? "Actif" : "Désactivé"}</span>
        </div>
      </div>
    </div>
  );
}
