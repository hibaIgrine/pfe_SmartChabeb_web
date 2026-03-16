import { X, ShieldAlert, Calendar } from "lucide-react";
import { useState } from "react";

export const SuspensionModal = ({
  isOpen,
  onClose,
  onConfirm,
  memberName,
}: any) => {
  const [motif, setMotif] = useState("");
  const [dateFin, setDateFin] = useState("");

  // 💡 ÉTAPE 1 : Récupérer la date du jour au format YYYY-MM-DD pour le calendrier
  const today = new Date().toISOString().split("T")[0];

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!motif || !dateFin) return;
    onConfirm({ motif, dateFin });
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[40px] p-10 w-full max-w-md shadow-2xl border-4 border-white animate-in zoom-in duration-300">
        {/* Header de la modale */}
        <div className="flex justify-between items-start mb-6">
          <div className="bg-red-50 p-4 rounded-2xl text-red-500 shadow-inner">
            <ShieldAlert size={32} />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-black shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        <h3 className="text-3xl font-black text-smart-teal italic mb-1 tracking-tighter">
          Suspension
        </h3>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-8 flex items-center gap-2">
          Adhérent : <span className="text-smart-salmon">{memberName}</span>
        </p>

        <div className="space-y-6">
          {/* Champ Motif */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">
              Motif de la sanction
            </label>
            <textarea
              className="w-full p-5 bg-white rounded-[25px] border-none outline-none shadow-sm text-sm font-bold text-smart-teal h-28 resize-none focus:ring-4 focus:ring-red-100 transition-all placeholder:text-gray-200"
              placeholder="Expliquez la raison du blocage..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
            />
          </div>

          {/* Champ Date avec limitation */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">
              Date de fin (Réactivation)
            </label>
            <div className="relative">
              <input
                type="date"
                // 💡 ÉTAPE 2 : On impose la date minimale (Aujourd'hui)
                min={today}
                className="w-full p-5 bg-white rounded-[25px] border-none outline-none shadow-sm text-sm font-bold text-smart-teal focus:ring-4 focus:ring-red-100 transition-all"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
              <Calendar
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-200 pointer-events-none"
                size={18}
              />
            </div>
          </div>
        </div>

        {/* Bouton de validation */}
        <button
          onClick={handleConfirm}
          disabled={!motif || !dateFin}
          className="w-full mt-10 bg-red-500 text-white py-6 rounded-[30px] font-black text-lg shadow-xl shadow-red-200 hover:bg-black active:scale-95 disabled:opacity-20 disabled:grayscale transition-all uppercase tracking-tighter"
        >
          Confirmer le blocage
        </button>

        <p className="text-center mt-6 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
          Action irréversible sans réactivation manuelle
        </p>
      </div>
    </div>
  );
};
