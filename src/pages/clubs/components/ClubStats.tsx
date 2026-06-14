/**
 * ClubStats.tsx — Cartes KPI résumant les statistiques des clubs.
 *
 * RÔLE :
 *   Bande de 3 indicateurs affichée en haut de la page des clubs (admin/centre).
 *
 * MÉTRIQUES :
 *   Total clubs    — Nombre total de clubs (LayoutGrid)
 *   Total membres  — Somme des membres actifs de tous les clubs (Users2)
 *   Couverture     — Nombre de salles / espaces couverts (Building2)
 *                    Masquable via hideCoverageStat prop
 */
import { LayoutGrid, Users2, Building2 } from "lucide-react";

interface ClubStatsProps {
  clubs: any[];
  salles: any[];
  hideCoverageStat?: boolean;
}

export const ClubStats = ({
  clubs,
  salles,
  hideCoverageStat = false,
}: ClubStatsProps) => {
  const totalMembers = clubs.reduce(
    (acc: number, c: any) =>
      acc + (c._count?.inscriptions ?? c.inscriptions?.length ?? 0),
    0,
  );
  const uniqueGouvernorats = new Set(salles.map((s: any) => s.gouvernorat))
    .size;

  const stats = [
    {
      label: "Total Clubs",
      value: clubs.length,
      icon: <LayoutGrid size={40} />,
      bg: "bg-smart-sage",
      text: "text-smart-teal",
    },
    {
      label: "Membres Inscrits",
      value: totalMembers,
      icon: <Users2 size={40} />,
      bg: "bg-smart-teal",
      text: "text-white",
      iconColor: "text-white/20",
    },
    ...(hideCoverageStat
      ? []
      : [
          {
            label: "Gouvernorats couverts",
            value: uniqueGouvernorats,
            icon: <Building2 size={40} />,
            bg: "bg-[#F7F3E9]",
            text: "text-smart-teal",
          },
        ]),
  ];

  return (
    <div
      className={`grid grid-cols-1 ${stats.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-5 mb-8`}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className={`${s.bg} rounded-[32px] px-8 py-7 flex justify-between items-center shadow-sm border border-white/80 transition-all hover:scale-[1.02] duration-200`}
        >
          <div>
            <p
              className={`text-[10px] font-black uppercase tracking-widest opacity-50 ${s.text}`}
            >
              {s.label}
            </p>
            <p
              className={`text-5xl font-black tracking-tighter italic mt-1 ${s.text}`}
            >
              {s.value}
            </p>
          </div>
          <span className={s.iconColor ?? `${s.text} opacity-20`}>
            {s.icon}
          </span>
        </div>
      ))}
    </div>
  );
};
