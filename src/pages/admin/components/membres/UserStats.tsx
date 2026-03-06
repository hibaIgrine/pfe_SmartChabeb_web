import { Users2, UserCheck, MapPin, ShieldAlert } from "lucide-react";

interface UserStatsProps {
  users: any[];
}

export const UserStats = ({ users }: UserStatsProps) => {
  const stats = [
    {
      icon: <Users2 />,
      val: users.length,
      label: "Inscriptions",
      color: "bg-smart-sage",
    },
    {
      icon: <UserCheck />,
      val: users.filter((u: any) => u.est_verifie).length,
      label: "Vérifiés",
      color: "bg-white",
    },
    {
      icon: <MapPin />,
      val: users.filter((u: any) => !u.id_salle).length,
      label: "Sans Centre",
      color: "bg-white",
    },
    {
      icon: <ShieldAlert />,
      val: users.filter((u: any) => !u.compte_actif).length,
      label: "Suspendus",
      color: "bg-white",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((s, idx) => (
        <div
          key={idx}
          className={`${s.color} p-7 rounded-[40px] border border-white/50 flex items-center space-x-5 shadow-sm group hover:shadow-md transition-all`}
        >
          <div className="bg-[#f0f4f4] p-4 rounded-2xl text-smart-teal group-hover:scale-110 transition-transform">
            {s.icon}
          </div>
          <div>
            <p className="text-3xl font-bold text-smart-teal leading-none">
              {s.val}
            </p>
            <p className="text-[9px] font-bold uppercase text-gray-400 mt-1 leading-none">
              {s.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
