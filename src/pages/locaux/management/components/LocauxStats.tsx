import { LayoutGrid, CheckCircle, Ban, TrendingUp } from "lucide-react";

export const LocauxStats = ({ locaux }: any) => {
  const total = locaux.length;
  const actifs = locaux.filter((l: any) => l.est_actif).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatItem
        label="Total Espaces"
        val={total}
        icon={<LayoutGrid />}
        color="bg-smart-teal text-white"
      />
      <StatItem
        label="Salles Actives"
        val={actifs}
        icon={<CheckCircle />}
        color="bg-smart-sage text-smart-teal"
      />
      <StatItem
        label="Taux Occupation"
        val="64%"
        icon={<TrendingUp />}
        color="bg-white text-smart-salmon border border-gray-100"
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
      <p className="text-5xl font-black italic tracking-tighter">{val}</p>
    </div>
    <div className="opacity-20 group-hover:opacity-100 transition-opacity">
      {icon}
    </div>
  </div>
);
