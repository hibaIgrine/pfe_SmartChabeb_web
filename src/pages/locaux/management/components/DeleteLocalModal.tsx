import { X, AlertTriangle, Trash2 } from "lucide-react";

export const DeleteLocalModal = ({
  isOpen,
  onClose,
  onConfirm,
  localName,
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#1A1C1E]/90 backdrop-blur-sm p-6">
      <div className="bg-white rounded-[60px] p-16 max-w-sm w-full text-center shadow-2xl border-8 border-red-50 animate-in zoom-in relative">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black p-2 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[35px] flex items-center justify-center mx-auto mb-8 animate-bounce shadow-sm">
          <AlertTriangle size={44} />
        </div>

        <h3 className="text-4xl font-black text-[#1A1C1E] tracking-tighter mb-4 italic leading-none">
          Attention
        </h3>
        <p className="text-gray-400 font-medium text-sm leading-relaxed mb-10 italic">
          Voulez-vous vraiment supprimer définitivement l'espace <br />
          <span className="text-red-500 font-black uppercase">
            "{localName}"
          </span>{" "}
          ?
        </p>

        <div className="space-y-4">
          <button
            onClick={onConfirm}
            className="w-full bg-[#E98A7D] text-white py-6 rounded-[30px] font-black text-xl hover:bg-red-600 shadow-xl shadow-red-100 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Trash2 size={20} /> OUI, SUPPRIMER
          </button>
          <button
            onClick={onClose}
            className="w-full text-gray-300 font-black text-xs uppercase tracking-widest pt-4 hover:text-gray-500 transition-colors"
          >
            CONSERVER L'ESPACE
          </button>
        </div>
      </div>
    </div>
  );
};
