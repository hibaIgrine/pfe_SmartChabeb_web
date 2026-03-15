import { User, Trash2 } from "lucide-react";

export const MemberList = ({ members, onRemove }: any) => {
  if (members.length === 0) {
    return (
      <div className="p-6 border-2 border-dashed border-gray-200 rounded-[20px] text-center text-gray-400 font-bold text-xs italic">
        Aucun membre dans ce club.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((mem: any) => (
        <div
          key={mem.id}
          className="flex justify-between items-center p-4 bg-white rounded-[20px] shadow-sm border border-gray-50 hover:border-smart-sage transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-smart-sage/30 rounded-xl flex items-center justify-center text-smart-teal">
              <User size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-smart-teal leading-none">
                {mem.utilisateur.nom} {mem.utilisateur.prenom}
              </p>
              <p className="text-[9px] font-bold text-smart-salmon uppercase tracking-widest mt-1">
                A rejoint le{" "}
                {new Date(
                  mem.date_validation || mem.date_adhesion,
                ).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => onRemove(mem.id)}
            className="p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
