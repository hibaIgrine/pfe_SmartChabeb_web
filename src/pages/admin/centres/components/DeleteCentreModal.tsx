/**
 * DeleteCentreModal.tsx — Modal de désactivation d'un centre.
 *
 * RÔLE :
 *   Popup de confirmation avant de désactiver un centre (Power icon).
 *   La désactivation ne supprime pas les données : elle passe le statut à INACTIF.
 *
 * API : PATCH /centres/:id/deactivate
 */
import { X, AlertTriangle, Power } from "lucide-react";

export const DeleteCentreModal = ({
  isOpen,
  onClose,
  onConfirm,
  centreName,
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-[#1A1C1E]/90 backdrop-blur-md p-6">
      <div className="bg-white rounded-[60px] p-12 md:p-16 max-w-sm w-full text-center shadow-2xl border-8 border-red-50 animate-in zoom-in relative">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black p-2 rounded-full transition-all active:scale-90"
        >
          <X size={20} />
        </button>

        <div className="w-24 h-24 bg-red-50 text-[#E98A7D] rounded-[35px] flex items-center justify-center mx-auto mb-8 animate-bounce shadow-sm border border-red-100">
          <AlertTriangle size={44} />
        </div>

        <h3 className="text-4xl font-black text-[#1A1C1E] tracking-tighter mb-4 italic leading-none">
          Attention
        </h3>
        <p className="text-gray-400 font-medium text-sm leading-relaxed mb-10 italic">
          Voulez-vous vraiment désactiver l'institution suivante ? <br />
          <span className="text-[#D97706] font-black uppercase break-words">
            "{centreName}"
          </span>
        </p>

        <div className="space-y-4">
          <button
            onClick={onConfirm}
            className="w-full bg-[#D97706] text-white py-6 rounded-[30px] font-black text-xl hover:bg-orange-700 shadow-xl shadow-orange-100 active:scale-95 transition-all uppercase tracking-tighter flex items-center justify-center gap-3"
          >
            <Power size={20} /> OUI, DÉSACTIVER
          </button>
          <button
            onClick={onClose}
            className="w-full text-gray-300 font-black text-[10px] uppercase tracking-[0.3em] pt-4 hover:text-gray-500 transition-colors"
          >
            CONSERVER L'ÉTABLISSEMENT
          </button>
        </div>
      </div>
    </div>
  );
};
