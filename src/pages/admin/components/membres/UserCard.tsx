import { 
  Building2, 
  Trash2, 
  Plus, 
  UserIcon,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  User as UserLucide,
  LayoutGrid,
  UserCog
} from "lucide-react";
import api from "../../../../api/axios";

// Helper for images (Unified Logic)
const getUserImageUrl = (user: any) => {
  if (!user || !user.photo_profil_url || user.photo_profil_url === "")
    return null; // 🏆 Retourne null si vide
  const url = user.photo_profil_url;
  if (url.startsWith("http")) return url;
  if (url.startsWith("assets/")) return null;
  const baseURL = api.defaults.baseURL || "http://10.176.158.215:3000";
  return `${baseURL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const ROLES_INFO: any = {
  ADMIN: {
    label: "Admin",
    icon: <ShieldCheck size={14} />,
    color: "bg-smart-teal text-white",
  },
  RESPONSABLE_MAISON_JEUNE: {
    label: "Directeur Maison Jeune",
    icon: <Building2 size={14} />,
    color: "bg-[#2c4e54] text-white",
  },
  RESPONSABLE_CLUB: {
    label: "Responsable Club",
    icon: <LayoutGrid size={14} />,
    color: "bg-smart-teal text-white/80",
  },
  COACH: {
    label: "Coach",
    icon: <GraduationCap size={14} />,
    color: "bg-smart-salmon text-white",
  },
  ENCADRANT: {
    label: "Encadrant",
    icon: <UserCog size={14} />,
    color: "bg-orange-400 text-white",
  },
  ADHERENT: {
    label: "Adhérent",
    icon: <UserLucide size={14} />,
    color: "bg-smart-sage text-smart-teal",
  },
};

interface UserCardProps {
  user: any;
  onRoleClick: (user: any) => void;
  onBanClick: (user: any) => void;
  onDeleteClick: (user: any) => void;
  onAssignClick: (user: any) => void;
  onToggleStatus: (user: any) => void;
}

export const UserCard = ({
  user,
  onRoleClick,
  onBanClick,
  onDeleteClick,
  onAssignClick,
  onToggleStatus,
}: UserCardProps) => {
  const role = user.role as keyof typeof ROLES_INFO;
  const info = ROLES_INFO[role] || ROLES_INFO.ADHERENT;

  return (
    <div className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center space-x-5 w-full md:w-auto">
        {/* Avatar avec pattern robuste */}
        <div className="w-16 h-16 rounded-[22px] bg-smart-bg border-4 border-white shadow-sm overflow-hidden relative flex items-center justify-center shrink-0">
          <UserIcon size={24} className="text-smart-teal/40" />
          <img
            src={getUserImageUrl(user) || ""}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-black text-smart-teal tracking-tight leading-none">
            {user.nom} {user.prenom}
          </h4>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider truncate max-w-[180px]">
            {user.email}
          </p>
          <div className="mt-2 flex items-center gap-2">
             <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 ${info.color}`}>
              {info.icon} {info.label}
             </span>
             {!user.compte_actif && (
                <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase bg-red-100 text-red-500">
                  Suspendu
                </span>
             )}
          </div>
        </div>
      </div>

      {/* Colonne Centre */}
      <div className="flex items-center gap-3 md:flex-1 md:justify-center w-full md:w-auto">
        {user.salles ? (
          <div className="flex flex-col items-center gap-1">
            <div className="bg-[#f0f4f4] px-4 py-2 rounded-2xl flex items-center gap-2 border border-white shadow-sm">
              <Building2 size={12} className="text-smart-teal opacity-40" />
              <span className="text-[9px] font-black uppercase text-smart-teal tracking-wider truncate max-w-[150px]">
                {user.salles.nom}
              </span>
            </div>
            <button
              onClick={() => onAssignClick(user)}
              className="text-[8px] font-bold text-smart-salmon uppercase tracking-widest hover:underline"
            >
              Modifier
            </button>
          </div>
        ) : (
          <button
            onClick={() => onAssignClick(user)}
            className="flex items-center gap-1.5 text-smart-salmon font-black text-[9px] uppercase border-b border-smart-salmon/20 hover:border-smart-salmon transition-all"
          >
            <Plus size={12} /> Affecter centre
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 w-full md:w-auto justify-end">
        {/* Toggle Status */}
        <button
          onClick={() => onToggleStatus(user)}
          title={user.compte_actif ? "Suspendre" : "Réactiver"}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all shadow-inner ${user.compte_actif ? "bg-smart-teal" : "bg-gray-200"}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${user.compte_actif ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>

        {/* Change Role */}
        <button
          onClick={() => onRoleClick(user)}
          className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-smart-teal hover:text-white transition-all shadow-sm"
          title="Modifier le rôle"
        >
          {info.icon}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDeleteClick(user)}
          className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
          title="Supprimer"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
