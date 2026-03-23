import {
  Building2,
  Trash2,
  Plus,
  User as UserIcon,
  ShieldCheck,
  GraduationCap,
  LayoutGrid,
  UserCog,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import api from "../../../../api/axios";

// 💡 LOGIQUE D'IMAGE SÉCURISÉE (Plus d'erreur src="")
const getUserImageUrl = (user: any) => {
  if (
    !user ||
    !user.photo_profil_url ||
    user.photo_profil_url.trim() === "" ||
    user.photo_profil_url === "null"
  ) {
    return null;
  }
  const url = user.photo_profil_url;
  if (url.startsWith("http")) return url;
  if (url.startsWith("assets/")) return null; // Les assets mobiles ne sont pas lisibles par le Web
  const baseURL = api.defaults.baseURL || "http://192.168.1.17:3000";
  return `${baseURL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const ROLES_INFO: any = {
  ADMIN: {
    label: "Admin National",
    icon: <ShieldCheck size={14} />,
    color: "bg-smart-teal text-white",
  },
  RESPONSABLE_MAISON_JEUNE: {
    label: "Directeur Centre",
    icon: <Building2 size={14} />,
    color: "bg-[#2c4e54] text-white",
  },
  RESPONSABLE_CLUB: {
    label: "Responsable Club",
    icon: <LayoutGrid size={14} />,
    color: "bg-smart-teal text-white/80",
  },
  COACH: {
    label: "Coach Sportif",
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
    icon: <UserIcon size={14} />,
    color: "bg-smart-sage text-smart-teal",
  },
};

export const UserCard = ({
  user,
  onRoleClick,
  onBanClick,
  onDeleteClick,
  onAssignClick,
  onToggleStatus,
}: any) => {
  const role = user.role as keyof typeof ROLES_INFO;
  const info = ROLES_INFO[role] || ROLES_INFO.ADHERENT;
  const imageUrl = getUserImageUrl(user);

  return (
    <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
      {/* 1. SECTION IDENTITÉ */}
      <div className="flex items-center space-x-5 w-full md:w-auto">
        <div className="w-16 h-16 rounded-[24px] bg-smart-bg border-4 border-white shadow-inner overflow-hidden relative flex items-center justify-center shrink-0">
          <UserIcon size={24} className="text-smart-teal/20" />
          {imageUrl && (
            <img
              src={imageUrl}
              className="absolute inset-0 w-full h-full object-cover z-10"
              onError={(e: any) => (e.target.style.display = "none")}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-black text-smart-teal tracking-tighter leading-none truncate">
              {user.nom} {user.prenom}
            </h4>
            {user.est_verifie && (
              <CheckCircle2 size={14} className="text-green-500 shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest truncate max-w-[200px]">
            {user.email}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${info.color}`}
            >
              {info.icon} {info.label}
            </span>
            {!user.compte_actif && (
              <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase bg-red-50 text-[#E98A7D] border border-red-100 flex items-center gap-1">
                <ShieldAlert size={10} /> Accès Suspendu
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. SECTION ÉTABLISSEMENT (id_salle -> id_centre) */}
      <div className="flex flex-col items-center gap-2 md:flex-1">
        {user.centre ? ( // 💡 salles -> centre
          <div className="flex flex-col items-center gap-1">
            <div className="bg-smart-bg/50 px-5 py-2.5 rounded-[20px] flex items-center gap-2 border border-white shadow-sm">
              <Building2 size={12} className="text-smart-teal opacity-40" />
              <span className="text-[10px] font-black uppercase text-smart-teal tracking-widest">
                {user.centre.nom}
              </span>
            </div>
            <button
              onClick={() => onAssignClick(user)}
              className="text-[9px] font-black text-smart-salmon uppercase tracking-tighter hover:underline px-2"
            >
              Changer de centre
            </button>
          </div>
        ) : (
          <button
            onClick={() => onAssignClick(user)}
            className="flex items-center gap-2 px-5 py-3 bg-smart-salmon/10 text-smart-salmon rounded-2xl font-black text-[10px] uppercase border border-smart-salmon/5 hover:bg-smart-salmon hover:text-white transition-all active:scale-95"
          >
            <Plus size={14} /> Affecter une institution
          </button>
        )}
      </div>

      {/* 3. SECTION ACTIONS DÉCISIVES */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {/* Toggle Status (Switch Moderne) */}
        <button
          onClick={() => onToggleStatus(user)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-inner border-2 ${user.compte_actif ? "bg-smart-teal border-smart-teal" : "bg-gray-100 border-gray-200"}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all ${user.compte_actif ? "translate-x-7" : "translate-x-1"}`}
          />
        </button>

        {/* Change Role Button */}
        <button
          onClick={() => onRoleClick(user)}
          className="p-3 bg-white text-gray-400 border border-gray-100 rounded-2xl hover:bg-smart-teal hover:text-white transition-all shadow-sm group/btn"
          title="Gérer les droits"
        >
          <div className="group-hover/btn:scale-110 transition-transform">
            {info.icon}
          </div>
        </button>

        {/* Delete Button */}
        <button
          onClick={() => onDeleteClick(user)}
          className="p-3 bg-red-50 text-[#E98A7D] border border-red-50 rounded-2xl hover:bg-[#E98A7D] hover:text-white transition-all shadow-sm"
          title="Supprimer définitivement"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
