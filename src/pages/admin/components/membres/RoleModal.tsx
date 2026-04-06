import {
  X,
  ShieldCheck,
  GraduationCap,
  UserCog,
  Building2,
  HelpCircle,
  LayoutGrid,
  User, // Nettoyé : une seule version suffit
} from "lucide-react";

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (roleName: string) => void;
  user: any;
  availableRoles: any[];
  excludedRoles?: string[];
}

export const RoleModal = ({
  isOpen,
  onClose,
  onSelect,
  user,
  availableRoles,
  excludedRoles = [],
}: RoleModalProps) => {
  if (!isOpen || !user) return null;

  const normalizedExcludedRoles = excludedRoles.map((role) =>
    role.toUpperCase(),
  );
  const visibleRoles = availableRoles.filter(
    (role) => !normalizedExcludedRoles.includes((role?.nom || "").toUpperCase()),
  );

  // 🎨 Style des grades (Design Michelle)
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
          label: "Directeur Maison",
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
      <div className="bg-[#F7F3E9] rounded-[60px] p-10 md:p-12 max-w-sm w-full shadow-2xl border-4 border-white animate-in zoom-in text-center relative">
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-2 rounded-full shadow-sm transition-all hover:rotate-90"
        >
          <X size={20} />
        </button>

        <h3 className="text-3xl font-black text-smart-teal italic mb-2 tracking-tighter">
          Nouveau Grade
        </h3>

        <div className="mb-8">
          <p className="text-gray-400 text-[10px] font-bold uppercase italic tracking-widest leading-none">
            {user.nom} {user.prenom}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-smart-sage/30 shadow-sm">
            <span className="text-[9px] font-black text-gray-300 uppercase">
              Actuel :
            </span>
            <span className="text-[10px] font-black text-smart-salmon uppercase italic">
              {user.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {visibleRoles.map((role) => {
            const style = getRoleStyle(role.nom);
            const isCurrentRole = user.role === role.nom;

            return (
              <button
                key={role.id}
                disabled={isCurrentRole} // 💡 On empêche de re-cliquer sur le même rôle
                onClick={() => onSelect(role.nom)}
                className={`flex items-center justify-between p-5 rounded-[25px] font-black text-sm transition-all border-2 shadow-sm
                  ${
                    isCurrentRole
                      ? "opacity-40 grayscale border-dashed border-gray-300 cursor-not-allowed"
                      : `hover:scale-[1.03] active:scale-95 border-transparent hover:border-white ${style.color}`
                  }`}
              >
                <span className="uppercase tracking-tighter">
                  {style.label}
                </span>
                {style.icon}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full text-gray-300 font-black text-[10px] uppercase tracking-[0.3em] mt-8 hover:text-smart-teal transition-colors"
        >
          Abandonner
        </button>
      </div>
    </div>
  );
};
