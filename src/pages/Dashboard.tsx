import { Users, LayoutGrid, Zap, Wallet, Activity } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* 1. SECTION GREETING */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black text-smart-teal tracking-tighter">
            Hey, Michelle 👋
          </h2>
          <p className="text-gray-400 font-bold mt-2 italic">
            Welcome back to SmartChabeb administration.
          </p>
        </div>
        <div className="bg-smart-sage px-6 py-3 rounded-full flex items-center space-x-2 text-smart-teal font-black shadow-sm">
          <Zap size={18} fill="currentColor" />
          <span>124 Institutions</span>
        </div>
      </div>

      {/* 2. ACTIVITY SUMMARY BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* GRANDE CARTE SAGE */}
        <div className="md:col-span-2 bg-smart-sage rounded-[50px] p-10 relative overflow-hidden group shadow-sm border border-white">
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-smart-teal/40 mb-2">
              Aperçu Hebdomadaire
            </p>
            <h3 className="text-4xl font-black text-smart-teal tracking-tighter">
              Activity Summary
            </h3>
            <div className="mt-10 h-40 flex items-end space-x-4">
              {[40, 70, 45, 90, 60, 30].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-t-2xl transition-all duration-500 hover:scale-105 ${i === 3 ? "bg-smart-salmon" : "bg-white/60"}`}
                ></div>
              ))}
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* PETITE CARTE SALMON */}
        <div className="bg-smart-salmon rounded-[50px] p-10 text-white shadow-xl shadow-smart-salmon/20 flex flex-col justify-between">
          <Activity size={40} />
          <div>
            <h4 className="text-4xl font-black">72 %</h4>
            <p className="text-white/70 font-bold uppercase text-[10px] tracking-widest mt-2">
              Croissance Adhérents
            </p>
          </div>
        </div>
      </div>

      {/* 3. QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatItem icon={<Users size={20} />} value="2400" label="Étudiants" />
        <StatItem icon={<LayoutGrid size={20} />} value="12" label="Modules" />
        <StatItem icon={<Wallet size={20} />} value="45k" label="Budgets" />
        <StatItem icon={<Zap size={20} />} value="18" label="Alertes" />
      </div>
    </div>
  );
}

function StatItem({ icon, value, label }: any) {
  return (
    <div className="bg-smart-bg p-6 rounded-[35px] border border-white flex items-center space-x-6 hover:shadow-lg transition-all cursor-default">
      <div className="bg-white p-4 rounded-2xl text-smart-teal shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-smart-teal">{value}</p>
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
          {label}
        </p>
      </div>
    </div>
  );
}
