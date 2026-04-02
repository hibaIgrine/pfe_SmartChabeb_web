import { X, LayoutGrid } from "lucide-react";
import { useState } from "react";

export const AssignClubModal = ({
  isOpen,
  onClose,
  onConfirm,
  clubs,
  userName,
}: any) => {
  const [selectedClubId, setSelectedClubId] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-md w-full shadow-2xl border-4 border-white animate-in zoom-in">
        <h3 className="text-2xl font-black text-smart-teal italic mb-2">
          Direction de Club
        </h3>
        <p className="text-gray-400 text-xs font-bold mb-8 uppercase">
          Assigner un club à {userName}
        </p>

        <select
          className="w-full p-5 bg-white rounded-[25px] outline-none shadow-sm font-bold text-smart-teal border-none focus:ring-4 focus:ring-smart-sage/50"
          value={selectedClubId}
          onChange={(e) => setSelectedClubId(e.target.value)}
        >
          <option value="">Choisir l'activité à diriger...</option>
          {clubs.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.nom} ({c.centre?.nom})
            </option>
          ))}
        </select>

        <button
          onClick={() => onConfirm(selectedClubId)}
          disabled={!selectedClubId}
          className="w-full mt-8 bg-smart-teal text-white py-6 rounded-[30px] font-black disabled:opacity-30 transition-all shadow-xl shadow-smart-teal/20"
        >
          VALIDER L'AFFECTATION
        </button>
      </div>
    </div>
  );
};
