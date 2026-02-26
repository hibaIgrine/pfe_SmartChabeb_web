import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  Users,
  MapPin,
  Zap,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Activity,
  ShieldAlert,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// Données fictives pour les graphiques (à lier à l'API plus tard)
const dataGrowth = [
  { name: "Lun", users: 400 },
  { name: "Mar", users: 700 },
  { name: "Mer", users: 500 },
  { name: "Jeu", users: 900 },
  { name: "Ven", users: 800 },
  { name: "Sam", users: 1100 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, salles: 0, verified: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const userMe = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [resUsers, resSalles] = await Promise.all([
        api.get("/users", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/salles", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setStats({
        users: resUsers.data.length,
        salles: resSalles.data.length,
        verified: resUsers.data.filter((u: any) => u.est_verifie).length,
      });
      setRecentUsers(resUsers.data.slice(0, 5)); // Les 5 derniers
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-smart-teal" size={50} />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-10">
      {/* 1. GREETING SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-6xl font-black text-smart-teal tracking-tighter italic leading-none">
            Hey, {userMe.prenom || "Michelle"} 👋
          </h2>
          <p className="text-gray-400 font-bold mt-3 italic text-lg uppercase tracking-widest opacity-70">
            Bienvenue sur votre tour de contrôle SmartChabeb.
          </p>
        </div>
        <div className="bg-white p-2 rounded-full shadow-sm flex items-center space-x-4 border border-gray-100 pr-6">
          <div className="bg-smart-sage p-3 rounded-full text-smart-teal animate-pulse">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="text-xs font-black uppercase tracking-tighter text-smart-teal">
            Système IA en ligne
          </span>
        </div>
      </div>

      {/* 2. KPI GRID (Les 4 indicateurs clés) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          icon={<Users />}
          value={stats.users}
          label="Membres"
          color="bg-smart-sage"
        />
        <KpiCard
          icon={<MapPin />}
          value={stats.salles}
          label="Institutions"
          color="bg-white"
        />
        <KpiCard
          icon={<ShieldCheck />}
          value={stats.verified}
          label="Vérifiés"
          color="bg-white"
        />
        <KpiCard
          icon={<Wallet />}
          value="12.4k"
          label="Budgets (DT)"
          color="bg-white"
        />
      </div>

      {/* 3. MIDDLE SECTION : ANALYTICS & SMART STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Graphique de croissance (Bento large) */}
        <div className="lg:col-span-2 bg-white rounded-[60px] p-10 shadow-sm border border-gray-50 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-smart-teal italic tracking-tight">
              Activité Hebdomadaire
            </h3>
            <span className="text-[10px] font-black bg-smart-bg px-3 py-1 rounded-full text-gray-400 uppercase tracking-widest">
              Inscriptions
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataGrowth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#436d75" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#436d75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    borderRadius: "20px",
                    border: "none",
                    boxShadow: "0 10px 15px rgba(0,0,0,0.05)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#436d75"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Smart AI Card (Le côté futuriste) */}
        <div className="bg-[#1A1C1E] rounded-[60px] p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl">
          <div className="relative z-10">
            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
              <Activity className="text-smart-salmon" />
            </div>
            <h3 className="text-3xl font-black italic tracking-tighter leading-tight mb-4">
              Moteur IA <br /> de Santé
            </h3>
            <p className="text-white/40 text-sm font-medium leading-relaxed italic">
              Analyse en temps réel des IMC et des habitudes nutritionnelles du
              réseau national.
            </p>
          </div>
          <div className="relative z-10 mt-8 pt-8 border-t border-white/5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                Performance
              </span>
              <span className="text-[9px] font-black text-smart-sage uppercase">
                98% Précision
              </span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-smart-sage w-[85%] h-full rounded-full"></div>
            </div>
          </div>
          {/* Décoration de fond */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-smart-teal/20 rounded-full blur-[100px]"></div>
        </div>
      </div>

      {/* 4. BOTTOM SECTION : RÉCENT & ALERTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dernières Inscriptions */}
        <div className="bg-white rounded-[60px] p-10 shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-smart-teal italic tracking-tight">
              Derniers Adhérents
            </h3>
            <Clock size={20} className="text-gray-300" />
          </div>
          <div className="space-y-6">
            {recentUsers.map((u: any) => (
              <div
                key={u.id}
                className="flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                    className="w-12 h-12 rounded-2xl bg-smart-bg border-2 border-white shadow-sm transition-transform group-hover:scale-110"
                  />
                  <div>
                    <p className="font-black text-sm text-smart-teal italic">
                      {u.nom} {u.prenom}
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      {u.role}
                    </p>
                  </div>
                </div>
                <ArrowUpRight
                  size={18}
                  className="text-gray-200 group-hover:text-smart-salmon transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance / Quick Info */}
        <div className="bg-smart-salmon rounded-[60px] p-10 text-white shadow-xl shadow-smart-salmon/20 flex items-center justify-between">
          <div className="space-y-4">
            <h3 className="text-4xl font-black italic tracking-tighter leading-none">
              Maintenance <br /> Alert
            </h3>
            <p className="text-white/70 text-sm font-bold max-w-[200px]">
              3 équipements nécessitent une intervention immédiate à Sousse.
            </p>
            <button className="bg-white text-smart-salmon px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              Gérer maintenant
            </button>
          </div>
          <ShieldAlert size={120} className="opacity-20 -mr-10 rotate-12" />
        </div>
      </div>
    </div>
  );
}

// Composant Interne pour les Cartes KPI
function KpiCard({ icon, value, label, color }: any) {
  return (
    <div
      className={`${color} p-8 rounded-[45px] shadow-sm border border-white/50 flex items-center justify-between group hover:shadow-xl transition-all duration-500`}
    >
      <div className="space-y-1">
        <p className="text-4xl font-black text-smart-teal tracking-tighter">
          {value}
        </p>
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
          {label}
        </p>
      </div>
      <div className="bg-white p-4 rounded-2xl text-smart-teal shadow-inner group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
    </div>
  );
}

// Composant Loader
function Loader2({ className, size }: any) {
  return <Activity className={`${className}`} size={size} />;
}
