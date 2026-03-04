import { useEffect, useState } from "react";
import api from "../../api/axios";
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
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";

const dataGrowth = [
  { name: "Lun", val: 400 },
  { name: "Mar", val: 700 },
  { name: "Mer", val: 500 },
  { name: "Jeu", val: 900 },
  { name: "Ven", val: 800 },
  { name: "Sam", val: 1100 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, salles: 0, verified: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const userMe = JSON.parse(localStorage.getItem("user") || "{}");
  const role = userMe?.role;

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
      setRecentUsers(resUsers.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-smart-teal" size={60} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
          Initialisation du système...
        </p>
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-10 font-['Inter',sans-serif]">
      {/* 1. HEADER OFFICIEL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg"
              className="h-4 rounded-sm"
              alt="TN"
            />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Espace {role} • République Tunisienne
            </span>
          </div>
          <h2 className="text-6xl font-black text-smart-teal tracking-tighter italic leading-none">
            Bonjour, {userMe.nom}
          </h2>
          <p className="text-gray-400 font-medium mt-3 text-lg">
            {role === "ADMIN"
              ? "Pilotage du réseau national jeunesse."
              : "Suivi de la performance de vos élèves."}
          </p>
        </div>

        <div className="bg-white p-2 rounded-full shadow-sm flex items-center space-x-4 border border-gray-100 pr-8">
          <div className="bg-smart-sage p-3 rounded-full text-smart-teal animate-pulse">
            <Zap size={20} fill="currentColor" />
          </div>
          <div className="leading-none">
            <p className="text-[9px] font-black uppercase tracking-widest text-smart-teal">
              Serveur IA
            </p>
            <p className="text-[10px] font-bold text-gray-400">
              Connecté & Sécurisé
            </p>
          </div>
        </div>
      </div>

      {/* 2. KPI GRID ADAPTATIF */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {role === "ADMIN" ? (
          <>
            <KpiCard
              icon={<Users />}
              value={stats.users}
              label="Total Adhérents"
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
              label="Comptes Vérifiés"
              color="bg-white"
            />
            <KpiCard
              icon={<Wallet />}
              value="142"
              label="Abonnements Actifs"
              color="bg-white"
            />
          </>
        ) : (
          <>
            <KpiCard
              icon={<Users />}
              value={stats.users}
              label="Mes Élèves"
              color="bg-smart-sage"
            />
            <KpiCard
              icon={<Activity />}
              value="12"
              label="Programmes en cours"
              color="bg-white"
            />
            <KpiCard
              icon={<ShieldAlert />}
              value="4"
              label="Alertes Santé"
              color="bg-white"
            />
            <KpiCard
              icon={<CheckCircle2 />}
              value="94%"
              label="Taux Assiduité"
              color="bg-white"
            />
          </>
        )}
      </div>

      {/* 3. MIDDLE SECTION (BENTO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[60px] p-12 shadow-sm border border-gray-50 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-smart-teal italic tracking-tight">
                Activité Hebdomadaire
              </h3>
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">
                Analyse des flux d'inscriptions
              </p>
            </div>
            <div className="bg-smart-bg px-4 py-2 rounded-full flex items-center space-x-2">
              <TrendingUp size={14} className="text-green-500" />
              <span className="text-[10px] font-black text-smart-teal">
                +12%
              </span>
            </div>
          </div>
          <div className="h-64 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataGrowth}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#436d75" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#436d75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    borderRadius: "25px",
                    border: "none",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                    fontWeight: "900",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="#436d75"
                  strokeWidth={5}
                  fillOpacity={1}
                  fill="url(#colorVal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute top-[-20px] left-[-20px] w-64 h-64 bg-smart-bg rounded-full blur-[100px] opacity-50"></div>
        </div>

        <div className="bg-[#1A1C1E] rounded-[60px] p-12 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl">
          <div className="relative z-10">
            <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border border-white/10 shadow-lg">
              <Activity className="text-smart-salmon" size={28} />
            </div>
            <h3 className="text-4xl font-black italic tracking-tighter leading-none mb-6 text-smart-sage">
              Moteur IA <br /> Prédictif
            </h3>
            <p className="text-white/40 text-sm font-medium leading-relaxed italic">
              L'algorithme analyse les données biométriques nationales pour
              optimiser les ressources sportives.
            </p>
          </div>
          <div className="relative z-10 mt-8 pt-8 border-t border-white/5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                Statut du moteur
              </span>
              <span className="text-[10px] font-black text-smart-sage uppercase bg-smart-sage/10 px-3 py-1 rounded-full">
                Optimal
              </span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-smart-sage w-[88%] h-full rounded-full animate-pulse shadow-[0_0_15px_rgba(217,232,209,0.5)]"></div>
            </div>
          </div>
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-smart-teal/20 rounded-full blur-[120px]"></div>
        </div>
      </div>

      {/* 4. BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[60px] p-12 shadow-sm border border-gray-50 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-black text-smart-teal italic tracking-tight">
              Derniers Adhérents
            </h3>
            <Clock size={20} className="text-gray-200" />
          </div>
          <div className="space-y-6 flex-1">
            {recentUsers.length > 0 ? (
              recentUsers.map((u: any) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between group cursor-pointer hover:bg-smart-bg p-3 -mx-3 rounded-3xl transition-all"
                >
                  <div className="flex items-center space-x-5">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                      className="w-14 h-14 rounded-2xl bg-smart-bg border-4 border-white shadow-sm group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <p className="font-black text-md text-smart-teal italic tracking-tight">
                        {u.nom} {u.prenom}
                      </p>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">
                        {u.role} • {u.salles?.nom || "Indépendant"}
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-smart-teal group-hover:text-white transition-all">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-300 italic text-sm py-10">
                Aucune donnée récente...
              </p>
            )}
          </div>
        </div>

        <div className="bg-smart-salmon rounded-[60px] p-12 text-white shadow-xl shadow-smart-salmon/20 flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10 space-y-6">
            <h3 className="text-5xl font-black italic tracking-tighter leading-[0.9]">
              Système de <br /> Vigilance
            </h3>
            <p className="text-white/70 text-sm font-bold max-w-[250px] leading-relaxed italic">
              {role === "ADMIN"
                ? "3 centres signalent une rupture de stock d'équipements à Sousse et Béja."
                : "Attention : 5 de vos élèves présentent un IMC supérieur à 27."}
            </p>
            <button className="bg-white text-smart-salmon px-10 py-5 rounded-[25px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all active:scale-95 shadow-black/10">
              Ouvrir le protocole
            </button>
          </div>
          <ShieldAlert
            size={180}
            className="absolute bottom-[-40px] right-[-40px] opacity-10 group-hover:rotate-12 transition-transform duration-700"
          />
          <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, value, label, color }: any) {
  return (
    <div
      className={`${color} p-8 rounded-[45px] shadow-sm border border-white/50 flex items-center justify-between group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500`}
    >
      <div className="space-y-1">
        <p className="text-5xl font-black text-smart-teal tracking-tighter leading-none italic">
          {value}
        </p>
        <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mt-2">
          {label}
        </p>
      </div>
      <div className="bg-white p-5 rounded-2xl text-smart-teal shadow-inner group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
    </div>
  );
}
