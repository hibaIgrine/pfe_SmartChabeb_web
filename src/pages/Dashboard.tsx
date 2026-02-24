import { Users, Building, Activity, Wallet } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* BANNIÈRE DE BIENVENUE */}
      <div className="bg-[#436d75] rounded-[30px] p-10 text-white flex justify-between items-center shadow-xl relative overflow-hidden">
        <div className="z-10">
          <h2 className="text-3xl font-bold mb-4 italic">
            Optimisez la gestion de vos centres
          </h2>
          <p className="text-white/70 max-w-md mb-6">
            SmartChabeb vous permet de suivre en temps réel l'activité de vos
            établissements et de vos adhérents.
          </p>
          <button className="bg-white/10 border border-white/20 px-8 py-3 rounded-2xl font-bold hover:bg-white/20 transition">
            Consulter les statistiques
          </button>
        </div>
        {/* Déco abstraite */}
        <div className="absolute right-[-40px] top-[-40px] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* CARTES DE STATISTIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard
          icon={<Users className="text-blue-500" />}
          title="2450"
          subtitle="Adhérents"
        />
        <StatCard
          icon={<Building className="text-orange-500" />}
          title="182"
          subtitle="Centres"
        />
        <StatCard
          icon={<Activity className="text-green-500" />}
          title="35"
          subtitle="Activités"
        />
        <StatCard
          icon={<Wallet className="text-purple-500" />}
          title="12.4k"
          subtitle="Revenus"
        />
      </div>
    </div>
  );
}

function StatCard({ icon, title, subtitle }: any) {
  return (
    <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 hover:shadow-lg transition group">
      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-3xl font-black text-[#2c4e54]">{title}</h3>
      <p className="text-gray-400 font-bold text-[11px] uppercase tracking-widest">
        {subtitle}
      </p>
    </div>
  );
}
