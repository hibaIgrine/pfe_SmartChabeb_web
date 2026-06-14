/**
 * CentreMetricCard.tsx — Carte KPI générique pour le tableau de bord ResponsableCentre.
 *
 * RÔLE :
 *   Composant réutilisable pour afficher un indicateur avec icône, libellé, valeur et aide.
 *   Utilisé dans ResponsableCentrePage pour les métriques du centre.
 *
 * PROPS :
 *   icon      — Composant icône React (Lucide)
 *   label     — Titre de la métrique
 *   value     — Valeur numérique de la métrique
 *   helpText  — Texte d'aide explicatif (affiché en sous-titre)
 */
import type { ReactNode } from "react";

interface CentreMetricCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  helpText: string;
}

export const CentreMetricCard = ({
  icon,
  label,
  value,
  helpText,
}: CentreMetricCardProps) => {
  return (
    <div className="bg-white border border-gray-100 rounded-[40px] p-6 shadow-[0_25px_80px_-50px_rgba(67,109,117,0.35)]">
      <div className="flex items-center justify-between mb-5">
        <div className="w-12 h-12 rounded-3xl bg-[#EDF7F2] text-[#436D75] flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-[0.35em] font-black text-gray-400">
          {label}
        </span>
      </div>
      <div className="text-4xl font-black text-[#1A1C1E]">{value}</div>
      <p className="text-sm text-gray-400 mt-3 leading-6">{helpText}</p>
    </div>
  );
};
