/**
 * LocauxStats.tsx — Cartes KPI du tableau de bord des locaux.
 *
 * MÉTRIQUES :
 *   Salle la plus utilisée (Building2) — Nom + nombre de réservations
 *   Total réservations (CalendarCheck2) — Nombre de réservations du mois
 *   Taux d'occupation (Percent)         — % de créneaux occupés
 *   Revenus (Wallet)                    — Total facturé (admin uniquement)
 */
import { Building2, CalendarCheck2, Percent, Wallet } from "lucide-react";

export const LocauxStats = ({ reservationStats, isAdmin = false }: any) => {
  const mostUsedRoom =
    reservationStats?.mostUsedRoom?.roomName || "Aucune salle";
  const mostUsedCount = reservationStats?.mostUsedRoom?.count || 0;
  const reservationCount = reservationStats?.reservationCount ?? 0;
  const occupancyRate = reservationStats?.occupancyRate ?? 0;
  const revenueTotal = reservationStats?.revenueTotal ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <StatItem
        label={`Salle la plus utilisée (${mostUsedCount})`}
        val={mostUsedRoom}
        icon={<Building2 />}
        color="bg-white text-smart-teal border border-gray-100"
      />
      <StatItem
        label="Nombre réservations"
        val={reservationCount}
        icon={<CalendarCheck2 />}
        color="bg-smart-sage text-smart-teal"
      />
      <StatItem
        label="Taux occupation"
        val={`${occupancyRate}%`}
        icon={<Percent />}
        color="bg-white text-smart-salmon border border-gray-100"
      />
      <StatItem
        label={isAdmin ? "Revenus général" : "Revenus du centre"}
        val={`${Number(revenueTotal).toFixed(2)} DT`}
        icon={<Wallet />}
        color="bg-white text-smart-teal border border-gray-100"
      />
    </div>
  );
};

const StatItem = ({ label, val, icon, color }: any) => (
  <div
    className={`${color} p-8 rounded-[40px] shadow-sm flex items-center justify-between group hover:scale-[1.02] transition-transform`}
  >
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">
        {label}
      </p>
      <p
        className={`${typeof val === "string" && val.length > 16 ? "text-2xl" : "text-5xl"} font-black italic tracking-tighter`}
      >
        {val}
      </p>
    </div>
    <div className="opacity-20 group-hover:opacity-100 transition-opacity">
      {icon}
    </div>
  </div>
);
