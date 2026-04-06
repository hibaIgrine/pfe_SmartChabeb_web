import { Activity, Flame, Percent, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { EventDashboardStats } from "../types";

type Props = {
  stats: EventDashboardStats | null;
  isLoading: boolean;
};

type CardProps = {
  label: string;
  value: string;
  icon: ReactNode;
  helper?: string;
};

function StatCard({ label, value, icon, helper }: CardProps) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">
          {label}
        </p>
        <div className="rounded-xl bg-[#D9E8D1] p-2 text-[#436D75]">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-black text-[#1f2d3a]">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs text-gray-500 font-semibold">{helper}</p>
      ) : null}
    </div>
  );
}

export default function EventsDashboardStats({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-3xl border border-gray-100 bg-white animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Nombre participants"
          value={String(stats.nombreParticipants)}
          icon={<Users size={18} />}
          helper="Inscriptions confirmees + en attente"
        />
        <StatCard
          label="Taux participation"
          value={`${stats.tauxParticipation}%`}
          icon={<Activity size={18} />}
          helper="Evenements avec au moins 1 inscription"
        />
        <StatCard
          label="Taux remplissage"
          value={`${stats.tauxRemplissage}%`}
          icon={<Percent size={18} />}
          helper="Places confirmees / capacite totale"
        />
        <StatCard
          label="Evenements"
          value={String(stats.nombreEvenements)}
          icon={<Flame size={18} />}
          helper="Total selon vos droits d'acces"
        />
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
          Evenements les plus populaires
        </h3>

        {stats.evenementsPopulaires.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-gray-500">
            Aucun evenement disponible pour le moment.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {stats.evenementsPopulaires.map((event, index) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-black text-[#203A43]">
                    #{index + 1} {event.nom}
                  </p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">
                    Confirmes: {event.confirmed} • En attente: {event.waiting}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#436D75]">
                    {event.participants} participants
                  </p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">
                    Remplissage: {event.fillRate}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
