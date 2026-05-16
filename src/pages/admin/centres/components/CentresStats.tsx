import { Building2, Users2, CircleSlash2, Activity } from "lucide-react";

type CentreStatsProps = {
  stats: {
    totalCentres: number;
    activeCentres: number;
    inactiveCentres: number;
    adherents: number;
  };
};

export const CentreStats = ({ stats }: CentreStatsProps) => {
  const cards = [
    {
      label: "Couverture Nationale",
      value: stats.totalCentres,
      caption: "Centres enregistrés",
      icon: <Building2 size={20} className="text-[#436d75]" />,
      tone: "bg-[#D9E8D1] text-[#436d75]",
      iconBg: "bg-white/40",
    },
    {
      label: "Centres actifs",
      value: stats.activeCentres,
      caption: "En service actuellement",
      icon: <Activity size={20} className="text-emerald-700" />,
      tone: "bg-emerald-50 text-emerald-700",
      iconBg: "bg-white/60",
    },
    {
      label: "Centres désactivés",
      value: stats.inactiveCentres,
      caption: "En attente de réactivation",
      icon: <CircleSlash2 size={20} className="text-[#D97706]" />,
      tone: "bg-[#FFF4EB] text-[#D97706]",
      iconBg: "bg-white/70",
    },
    {
      label: "Adhérents rattachés",
      value: stats.adherents,
      caption: "Total des utilisateurs liés",
      icon: <Users2 size={20} className="text-[#436d75]" />,
      tone: "bg-[#EEF6FA] text-[#436d75]",
      iconBg: "bg-white/60",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.tone} p-5 sm:p-6 lg:p-8 rounded-[32px] md:rounded-[45px] flex flex-col justify-between relative overflow-hidden shadow-sm border border-white/50 group min-h-[150px]`}
          >
            <div className="z-10">
              <div
                className={`${card.iconBg} w-10 h-10 rounded-2xl flex items-center justify-center mb-4 shadow-inner`}
              >
                {card.icon}
              </div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">
                {card.label}
              </p>
              <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1 italic">
                {card.value}
              </h3>
            </div>
            <p className="z-10 font-bold text-[11px] italic mt-4 opacity-90">
              {card.caption}
            </p>
          </div>
        ))}
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </div>
  );
};
