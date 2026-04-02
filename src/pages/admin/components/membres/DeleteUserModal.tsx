import { X, Power, ShieldAlert } from "lucide-react";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}

export const DeleteUserModal = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: DeleteUserModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 bg-[#1A1C1E]/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[60px] p-12 md:p-16 max-w-sm w-full text-center shadow-2xl border-8 border-red-50 animate-in zoom-in relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black hover:bg-gray-50 p-2 rounded-full transition-all active:scale-90"
        >
          <X size={20} />
        </button>

        {/* Warning Icon */}
        <div className="w-24 h-24 bg-red-50 text-[#E98A7D] rounded-[35px] flex items-center justify-center mx-auto mb-8 animate-bounce shadow-sm border border-red-100">
          <ShieldAlert size={44} />
        </div>

        <h3 className="text-4xl font-black text-[#1A1C1E] tracking-tighter mb-4 italic leading-none">
          Attention
        </h3>

        <p className="text-gray-400 font-medium text-sm leading-relaxed mb-10 italic">
          Voulez-vous vraiment désactiver le compte de
          <span className="text-[#E98A7D] font-black break-words">
            {" "}
            {userName}
          </span>
          ?
        </p>

        <div className="space-y-4">
          <button
            onClick={onConfirm}
            className="w-full bg-[#E98A7D] text-white py-6 rounded-[30px] font-black text-xl hover:bg-red-600 shadow-xl shadow-red-100 active:scale-95 transition-all uppercase tracking-tighter"
          >
            <Power size={20} className="inline-block mr-2" /> Oui, Désactiver
          </button>

          <button
            onClick={onClose}
            className="w-full text-gray-300 font-black text-[10px] uppercase tracking-[0.3em] pt-4 hover:text-gray-500 transition-colors"
          >
            Conserver le membre
          </button>
        </div>
      </div>
    </div>
  );
};
