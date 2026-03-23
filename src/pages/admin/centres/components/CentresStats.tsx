import { TrendingUp, Building2, Map } from "lucide-react";

export const CentreStats = ({ count }: { count: number }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-[#D9E8D1] p-8 rounded-[45px] flex flex-col justify-between relative overflow-hidden shadow-sm border border-white/50 group">
        <div className="z-10">
          <div className="bg-white/40 w-10 h-10 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <TrendingUp size={20} className="text-[#436d75]" />
          </div>
          <p className="text-[10px] font-black uppercase text-[#436d75] opacity-60 tracking-widest">
            Couverture Nationale
          </p>
          <h3 className="text-4xl font-bold text-[#436d75] tracking-tight mt-1 italic">
            {count}
          </h3>
        </div>
        <p className="z-10 text-[#436d75] font-bold text-[11px] italic mt-4">
          Institutions connectées
        </p>
      </div>
      {/* Tu peux ajouter d'autres cartes ici sur le même modèle */}
    </div>
  );
};
