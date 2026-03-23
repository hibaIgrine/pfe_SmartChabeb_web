import { Users2, UserCheck, MapPinOff, ShieldAlert } from "lucide-react"; // 💡 Changé MapPin par MapPinOff pour le sens
import { useMemo } from "react";

interface UserStatsProps {
  users: any[];
}

export const UserStats = ({ users }: UserStatsProps) => {
  // 💡 Optimisation : On calcule les stats une seule fois sauf si 'users' change
  const statsData = useMemo(() => {
    return [
      {
        icon: <Users2 size={24} />,
        val: users.length,
        label: "Total Adhérents", // Plus précis que "Inscriptions"
        color: "bg-smart-sage",
        textColor: "text-smart-teal",
      },
      {
        icon: <UserCheck size={24} />,
        val: users.filter((u) => u.est_verifie).length,
        label: "Comptes Vérifiés",
        color: "bg-white",
        textColor: "text-smart-teal",
      },
      {
        icon: <MapPinOff size={24} />, // 💡 Icône plus parlante pour "sans centre"
        val: users.filter((u) => !u.id_centre).length, // 💡 id_salle -> id_centre
        label: "Sans Institution",
        color: "bg-white",
        textColor: "text-orange-500", // 💡 Couleur d'avertissement
      },
      {
        icon: <ShieldAlert size={24} />,
        val: users.filter((u) => !u.compte_actif).length,
        label: "Membres Suspendus",
        color: "bg-white",
        textColor: "text-smart-salmon", // 💡 Utilisation de ta couleur Alerte
      },
    ];
  }, [users]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-700">
      {statsData.map((s, idx) => (
        <div
          key={idx}
          className={`${s.color} p-8 rounded-[45px] border border-white shadow-sm flex items-center space-x-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
        >
          {/* Container Icône */}
          <div className="bg-smart-bg p-4 rounded-2xl text-smart-teal group-hover:scale-110 group-hover:bg-white transition-all duration-500 shadow-inner">
            {s.icon}
          </div>

          {/* Textes */}
          <div className="flex flex-col">
            <p
              className={`text-4xl font-black italic tracking-tighter ${s.textColor} leading-none`}
            >
              {s.val}
            </p>
            <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest leading-none">
              {s.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
