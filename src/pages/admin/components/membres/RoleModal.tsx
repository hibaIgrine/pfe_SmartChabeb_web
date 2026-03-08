import {
  X,
  User as UserLucide,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  UserCog,
  Building2,
  HelpCircle,
  LayoutGrid,
  User,
} from "lucide-react";

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (roleName: string) => void;
  user: any;
  availableRoles: any[]; // 🏆 On ajoute la liste dynamique ici
}

export const RoleModal = ({
  isOpen,
  onClose,
  onSelect,
  user,
  availableRoles,
}: RoleModalProps) => {
  if (!isOpen || !user) return null;

  // 🎨 Fonction "Smart" pour donner du style aux rôles de la base
  const getRoleStyle = (roleName: string) => {
    switch (roleName.toUpperCase()) {
      case "ADMIN":
        return {
          label: "Administrateur",
          icon: <ShieldCheck size={18} />,
          color: "bg-smart-teal text-white",
        };
      case "RESPONSABLE_MAISON_JEUNE":
        return {
          label: "Responsable Maison Jeune",
          icon: <Building2 size={18} />,
          color: "bg-[#2c4e54] text-white",
        };
      case "RESPONSABLE_CLUB":
        return {
          label: "Responsable Club",
          icon: <LayoutGrid size={18} />,
          color: "bg-smart-teal text-white/80",
        };
      case "COACH":
        return {
          label: "Coach Sportif",
          icon: <GraduationCap size={18} />,
          color: "bg-smart-salmon text-white",
        };
      case "ENCADRANT":
        return {
          label: "Encadrant",
          icon: <UserCog size={18} />,
          color: "bg-orange-400 text-white",
        };
      case "ADHERENT":
        return {
          label: "Adhérent",
          icon: <User size={18} />,
          color: "bg-smart-sage text-smart-teal",
        };
      default:
        return {
          label: roleName,
          icon: <HelpCircle size={18} />,
          color: "bg-gray-100 text-gray-400",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6 animate-in fade-in">
      <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-sm w-full shadow-2xl border-4 border-white animate-in zoom-in text-center relative">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-2 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-3xl font-black text-smart-teal italic mb-2 tracking-tighter">
          Nouveau Grade
        </h3>
        <p className="text-gray-400 text-[10px] font-bold uppercase mb-8 italic tracking-widest leading-none">
          {user.nom} {user.prenom} <br />
          <span className="text-smart-salmon mt-1 inline-block italic lowercase">
            Actuellement : {user.role}
          </span>
        </p>

        <div className="grid grid-cols-1 gap-3">
          {/* 🏆 ON BOUCLE SUR LES VRAIS RÔLES DE LA BDD */}
          {availableRoles.map((role) => {
            const style = getRoleStyle(role.nom);
            return (
              <button
                key={role.id}
                onClick={() => onSelect(role.nom)}
                className={`flex items-center justify-between p-5 rounded-[25px] font-black text-sm transition-all hover:scale-105 active:scale-95 border-2 border-transparent hover:border-white shadow-sm ${style.color}`}
              >
                <span className="uppercase tracking-tight">{style.label}</span>
                {style.icon}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full text-gray-400 font-black text-[10px] uppercase tracking-widest mt-8 hover:text-smart-teal transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};
