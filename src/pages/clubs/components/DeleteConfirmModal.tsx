import { Power, X, AlertTriangle } from "lucide-react";

interface DeleteConfirmModalProps {
  club: any;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal = ({
  club,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) => {
  if (!club) return null;

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center bg-[#1A1C1E]/70 backdrop-blur-md p-6">
      <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in border-4 border-red-50">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <AlertTriangle className="text-red-400" size={34} />
          </div>
          <h3 className="text-2xl font-black text-smart-teal mb-2">
            Désactiver ce club ?
          </h3>
          <p className="text-gray-400 text-sm font-medium mb-2">
            Le club restera dans l’historique pour garantir la traçabilité :
          </p>
          <p className="text-smart-teal font-black text-lg mb-6 italic">
            "{club.nom}"
          </p>
          <p className="text-red-400 text-xs font-bold mb-8">
            ⚠️ Le club sera désactivé mais conservé dans le registre.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-50 text-gray-500 py-4 rounded-[20px] font-black text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              <X size={16} /> Annuler
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-500 text-white py-4 rounded-[20px] font-black text-sm hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
            >
              <Power size={16} /> Désactiver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
