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

function getHeatClass(value: number) {
  if (value >= 8) return "bg-[#436D75] text-white";
  if (value >= 5) return "bg-[#6C9AA3] text-white";
  if (value >= 3) return "bg-[#A5C2C7] text-[#1f2d3a]";
  if (value >= 1) return "bg-[#D9E8D1] text-[#1f2d3a]";
  return "bg-gray-100 text-gray-400";
}

function initials(fullName: string) {
  const parts = fullName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
            Participation par club
          </h3>

          {stats.participationParClub.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-gray-500">
              Aucune donnee club disponible.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.participationParClub.map((club) => (
                <div
                  key={club.clubId}
                  className="rounded-2xl border border-gray-100 bg-[#F7FAFC] p-4"
                >
                  <p className="font-black text-[#203A43] truncate">
                    {club.clubNom}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 font-semibold">
                    {club.evenements} evenement(s)
                  </p>

                  <p className="mt-3 text-2xl font-black text-[#436D75]">
                    {club.participants}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
                    participants
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[11px] font-black">
                    <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Confirmes: {club.confirmed}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                      Attente: {club.waiting}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
            Participation par utilisateur
          </h3>

          {stats.participationParUtilisateur.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-gray-500">
              Aucune donnee utilisateur disponible.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.participationParUtilisateur.map((user) => (
                <div
                  key={user.userId}
                  className="rounded-2xl border border-gray-100 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#D9E8D1] text-[#436D75] flex items-center justify-center font-black text-sm">
                      {initials(user.nom)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#203A43] truncate">
                        {user.nom}
                      </p>
                      <p className="text-xs font-semibold text-gray-500">
                        {user.participations} participation(s)
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-[#436D75]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (user.confirmees /
                              Math.max(user.participations, 1)) *
                              100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-gray-600">
                    <span>Confirmes: {user.confirmees}</span>
                    <span>Attente: {user.enAttente}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
          Frequence des evenements
        </h3>

        {stats.frequenceEvenements.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-gray-500">
            Aucune frequence disponible.
          </p>
        ) : (
          <>
            <p className="mt-3 text-xs text-gray-500 font-semibold">
              Vue en carreaux mensuels (plus la couleur est foncee, plus il y a
              d'evenements).
            </p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {stats.frequenceEvenements.map((item) => (
                <div
                  key={item.periode}
                  className={`rounded-2xl p-3 border border-transparent ${getHeatClass(item.evenements)}`}
                >
                  <p className="text-xs font-black tracking-wide uppercase opacity-90">
                    {item.periode}
                  </p>
                  <p className="mt-2 text-2xl font-black">{item.evenements}</p>
                  <p className="text-[11px] font-bold opacity-90">
                    evenement(s)
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
