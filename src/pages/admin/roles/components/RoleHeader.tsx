import { Plus } from "lucide-react";

export const RoleHeader = ({ onAdd }: { onAdd: () => void }) => (
  <div className="flex justify-between items-end border-b border-gray-100 pb-6">
    <div>
      <h1 className="text-3xl font-black text-smart-teal tracking-tighter italic leading-none">
        Grades & Habilitations
      </h1>
      <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.4em] mt-3 ml-1">
        Référentiel des accès ministériels
      </p>
    </div>
    <button
      onClick={onAdd}
      className="bg-smart-teal text-white px-6 py-3 rounded-2xl font-black text-[10px] shadow-lg hover:bg-black transition-all flex items-center gap-2 active:scale-95"
    >
      <Plus size={14} /> NOUVEAU GRADE
    </button>
  </div>
);
