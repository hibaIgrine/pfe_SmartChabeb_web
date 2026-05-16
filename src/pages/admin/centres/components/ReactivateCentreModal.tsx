import { X, RefreshCw, ShieldCheck } from "lucide-react";

export const ReactivateCentreModal = ({
  isOpen,
  onClose,
  onConfirm,
  centreName,
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-[#1A1C1E]/90 backdrop-blur-md p-6">
      <div className="bg-white rounded-[60px] p-12 md:p-16 max-w-sm w-full text-center shadow-2xl border-8 border-emerald-50 animate-in zoom-in relative">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black p-2 rounded-full transition-all active:scale-90"
        >
          <X size={20} />
        </button>

        <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[35px] flex items-center justify-center mx-auto mb-8 shadow-sm border border-emerald-100">
          <ShieldCheck size={44} />
        </div>

        <h3 className="text-4xl font-black text-[#1A1C1E] tracking-tighter mb-4 italic leading-none">
          Réactiver ?
        </h3>
        <p className="text-gray-400 font-medium text-sm leading-relaxed mb-10 italic">
          Voulez-vous réactiver ce centre ? <br />
          <span className="text-emerald-700 font-black uppercase break-words">
            "{centreName}"
          </span>
        </p>

        <div className="space-y-4">
          <button
            onClick={onConfirm}
            className="w-full bg-emerald-600 text-white py-6 rounded-[30px] font-black text-xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 active:scale-95 transition-all uppercase tracking-tighter flex items-center justify-center gap-3"
          >
            <RefreshCw size={20} /> Oui, Réactiver
          </button>
          <button
            onClick={onClose}
            className="w-full text-gray-300 font-black text-[10px] uppercase tracking-[0.3em] pt-4 hover:text-gray-500 transition-colors"
          >
            Conserver le centre désactivé
          </button>
        </div>
      </div>
    </div>
  );
};
