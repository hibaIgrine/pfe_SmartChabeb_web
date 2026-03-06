import { X, User as UserLucide, ShieldCheck, GraduationCap, Briefcase } from "lucide-react";

const ROLES = [
  { id: "ADHERENT", label: "Adhérent", icon: <UserLucide size={18} />, color: "bg-smart-sage text-smart-teal" },
  { id: "COACH", label: "Coach", icon: <GraduationCap size={18} />, color: "bg-smart-salmon text-white" },
  { id: "ADMIN", label: "Admin", icon: <ShieldCheck size={18} />, color: "bg-smart-teal text-white" },
  { id: "GESTIONNAIRE", label: "Gestionnaire", icon: <Briefcase size={18} />, color: "bg-[#1A1C1E] text-white" },
];

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (roleId: string) => void;
  user: any;
}

export const RoleModal = ({ isOpen, onClose, onSelect, user }: RoleModalProps) => {
  if (!isOpen || !user) return null;

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
        <p className="text-gray-400 text-[10px] font-bold uppercase mb-8 italic tracking-widest">
          {user.nom} {user.prenom} • <span className="text-smart-teal">{user.role}</span>
        </p>
        
        <div className="grid grid-cols-1 gap-3">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => onSelect(role.id)}
              className={`flex items-center justify-between p-5 rounded-[25px] font-black text-sm transition-all hover:scale-105 active:scale-95 border-2 border-transparent hover:border-white shadow-sm ${role.color}`}
            >
              <span>{role.label}</span>
              {role.icon}
            </button>
          ))}
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
