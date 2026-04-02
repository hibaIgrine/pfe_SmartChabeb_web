import { User, Users } from "lucide-react";

interface ClubResponsablesListProps {
  responsables?: any[];
  responsable?: any;
  className?: string;
}

export const ClubResponsablesList = ({
  responsables,
  responsable,
  className = "",
}: ClubResponsablesListProps) => {
  const members =
    Array.isArray(responsables) && responsables.length > 0
      ? responsables
      : responsable
        ? [responsable]
        : [];

  if (members.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Users size={14} className="text-smart-teal" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
          Aucun responsable
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Users size={14} className="text-smart-teal" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-smart-teal">
          Responsable{members.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-1">
        {members.map((member, index) => (
          <div
            key={member.id ?? index}
            className="flex items-center gap-2 text-[10px] text-gray-500"
          >
            <User size={12} className="text-smart-teal" />
            <div>
              <div className="font-bold text-smart-teal leading-tight">
                {member.nom ?? "Responsable"} {member.prenom ?? "inconnu"}
              </div>
              {member.role_dans_club || member.role ? (
                <div className="text-[9px] uppercase tracking-[0.25em] text-gray-400">
                  {member.role_dans_club ?? member.role}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
