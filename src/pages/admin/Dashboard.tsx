import { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  Users,
  MapPin,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Activity,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  User as UserIcon,
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

const getUserImageUrl = (user: any) => {
  const photo = user?.photo_profil_url;
  const seed = user?.email || user?.id || "default";
  
  const baseURL = api.defaults.baseURL || "http://192.168.1.17:3000";

  if (photo && photo.trim() !== "" && photo !== "null") {
    // Si c'est un path d'asset mobile, on bascule sur les initiales pour le web
    if (photo.startsWith("assets/")) {
      return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=436d75&fontFamily=Inter&fontWeight=900`;
    }

    if (photo.startsWith("http")) return photo;
    const cleanPath = photo.startsWith("/") ? photo : `/${photo}`;
    return `${baseURL}${cleanPath}`;
  }
  
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=436d75&fontFamily=Inter&fontWeight=900`;
};

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, salles: 0, verified: 0, clubMembers: 0 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [allClubs, setAllClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const userMe = JSON.parse(localStorage.getItem("user") || "{}");
  const role = userMe?.role;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [resUsers, resSalles, resClubs] = await Promise.all([
        api.get("/users", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/salles", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/clubs", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const clubsArray = Array.isArray(resClubs.data) ? resClubs.data : [];
      const usersArray = Array.isArray(resUsers.data) ? resUsers.data : [];
      const sallesArray = Array.isArray(resSalles.data) ? resSalles.data : [];

      console.log(`� [Dashboard] Found ${usersArray.length} users, ${sallesArray.length} salles, ${clubsArray.length} clubs.`);

      setStats({
        users: usersArray.length,
        salles: sallesArray.length,
        verified: usersArray.filter((u: any) => u.est_verifie).length,
        clubMembers: clubsArray.reduce((acc: number, c: any) => acc + (c._count?.inscriptions || 0), 0),
      });

      // Notifications d'adhésion réelles
      const allInscriptions = clubsArray.flatMap((c: any) => {
        const ins = Array.isArray(c.inscriptions) ? c.inscriptions : [];
        return ins.map((i: any) => ({ ...i, clubName: c.nom }));
      }).sort((a: any, b: any) => {
        const timeA = a.date_adhesion ? new Date(a.date_adhesion).getTime() : 0;
        const timeB = b.date_adhesion ? new Date(b.date_adhesion).getTime() : 0;
        return timeB - timeA;
      });
      
      console.log(`📊 [Dashboard] Total inscriptions found: ${allInscriptions.length}`);
      
      setRecentUsers(usersArray.slice(0, 5));
      setRecentActivity(allInscriptions.slice(0, 10));
      setAllClubs(clubsArray);
    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err);
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
              icon={<Zap />}
              value={stats.clubMembers}
              label="Membres de Clubs"
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
        {/* Adhésions aux Clubs */}
        <div className="bg-white rounded-[60px] p-12 shadow-sm border border-gray-50 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-black text-smart-teal italic tracking-tight">
              Nouvelles Adhésions
            </h3>
            <Activity size={20} className="text-smart-salmon" />
          </div>
          <div className="space-y-6 flex-1">
            {recentActivity.length > 0 ? (
              recentActivity.map((act: any, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-smart-bg/50 rounded-3xl border border-transparent hover:border-smart-teal/10 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden relative flex items-center justify-center shrink-0">
                      <UserIcon size={20} className="text-smart-teal/40" />
                      <img
                        src={getUserImageUrl(act.utilisateur)}
                        alt="avatar"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-black text-smart-teal italic tracking-tight">
                        {act.utilisateur?.nom} {act.utilisateur?.prenom}
                      </p>
                      <p className="text-[9px] text-smart-salmon font-black uppercase tracking-widest mt-1">
                        Club: {act.clubName}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-gray-300">
                    Nouveau
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-300 italic text-sm py-10">Aucune activité récente...</p>
            )}
          </div>
        </div>

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
                    <div className="w-14 h-14 rounded-2xl bg-smart-bg border-4 border-white shadow-sm overflow-hidden relative flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <UserIcon size={24} className="text-smart-teal/40" />
                      <img
                        src={getUserImageUrl(u)}
                        alt={`${u.nom}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
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
      </div>

      {/* 5. CLUBS OVERVIEW TABLE */}
      <div className="bg-white rounded-[60px] p-12 shadow-sm border border-gray-50 flex flex-col">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-black text-smart-teal italic tracking-tight">
              Répartition des Clubs
            </h3>
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">
              Vue d'ensemble par catégorie et membres
            </p>
          </div>
          <Zap size={20} className="text-smart-sage" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Club</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Catégorie</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Membres</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Animateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allClubs.length > 0 ? (
                allClubs.map((club: any) => (
                  <tr key={club.id} className="group hover:bg-smart-bg/30 transition-colors">
                    <td className="py-6 text-sm italic font-black text-smart-teal">{club.nom}</td>
                    <td className="py-6 text-[10px] font-black uppercase text-gray-400">{club.categorie}</td>
                    <td className="py-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-black text-smart-salmon">{club._count?.inscriptions || 0}</span>
                        <Users size={12} className="text-gray-300" />
                      </div>
                    </td>
                    <td className="py-6 text-sm font-medium text-gray-500">
                      {club.coach?.nom} {club.coach?.prenom}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-gray-300 italic text-sm">
                    Aucun club configuré ou aucune inscription active.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
