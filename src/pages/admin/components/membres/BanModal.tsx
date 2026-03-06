import { X, ShieldAlert, Calendar, Info } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface BanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { days: number, reason: string }) => void;
  user: any;
}

type Unit = "days" | "months" | "years";

export const BanModal = ({ isOpen, onClose, onSubmit, user }: BanModalProps) => {
  const [duration, setDuration] = useState(7);
  const [unit, setUnit] = useState<Unit>("days");
  const [reason, setReason] = useState("");
  const [endDate, setEndDate] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Calculer la date de fin à partir de la durée
  useEffect(() => {
    if (!duration) return;
    const today = new Date();
    let totalDays = duration;
    
    if (unit === "months") totalDays = Math.min(duration, 12) * 30;
    else if (unit === "years") totalDays = duration * 365;
    else totalDays = Math.min(duration, 31);

    const calculatedDate = new Date(today);
    calculatedDate.setDate(today.getDate() + totalDays);
    setEndDate(calculatedDate.toISOString().split('T')[0]);
  }, [duration, unit]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !endDate) return;

    const selected = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(selected.getTime() - today.getTime());
    const totalDaysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    onSubmit({ days: totalDaysCount, reason });
  };

  const formattedEndDate = endDate && !isNaN(new Date(endDate).getTime())
    ? new Date(endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : "Sélectionnez une date";


  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-[#F7F3E9] rounded-[40px] p-6 md:p-8 max-w-md w-full shadow-2xl border-4 border-white animate-in zoom-in relative my-auto">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-6 right-6 text-gray-400 hover:text-black bg-white p-1.5 rounded-full transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-5">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-[22px] flex items-center justify-center mx-auto mb-3 shadow-sm">
                <ShieldAlert size={28} />
            </div>
            <h3 className="text-2xl font-bold text-smart-teal tracking-tight leading-none uppercase">
                Suspension
            </h3>
            <p className="text-gray-400 text-[9px] font-bold uppercase mt-1.5 tracking-widest">
                {user.nom} {user.prenom}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
             <div className="col-span-2">
                <label className="text-[9px] font-bold uppercase text-gray-400 ml-3 tracking-widest block mb-1">
                    Quantité
                </label>
                <input
                    type="number"
                    min="1"
                    max={unit === "days" ? 31 : unit === "months" ? 12 : 5}
                    className="w-full p-3 bg-white rounded-2xl font-bold text-lg text-smart-teal outline-none border-none shadow-inner"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                />
             </div>
             <div className="col-span-3">
                <label className="text-[9px] font-bold uppercase text-gray-400 ml-3 tracking-widest block mb-1">
                    Unité
                </label>
                <div className="flex bg-white p-1 rounded-2xl shadow-inner">
                    {(["days", "months", "years"] as Unit[]).map((u) => (
                        <button
                            key={u}
                            type="button"
                            onClick={() => {
                                setUnit(u);
                                if (u === "days" && duration > 31) setDuration(31);
                                if (u === "months" && duration > 12) setDuration(12);
                            }}
                            className={`flex-1 py-2.5 rounded-xl text-[8px] font-bold transition-all leading-none ${
                                unit === u ? "bg-smart-teal text-white shadow-md" : "text-gray-400 hover:text-smart-teal"
                            }`}
                        >
                            {u === "days" ? "JOURS" : u === "months" ? "MOIS" : "ANS"}
                        </button>
                    ))}
                </div>
             </div>
          </div>

          <div className="relative">
            <label className="text-[9px] font-bold uppercase text-gray-400 ml-3 tracking-widest block mb-1">
              Date de fin
            </label>
            <div 
              className="relative group overflow-hidden cursor-pointer"
              onClick={() => {
                try { dateInputRef.current?.showPicker(); } catch (err) {}
              }}
            >
               {/* Styled Display Overlay */}
               <div className="w-full p-4 pr-14 bg-white rounded-2xl font-bold text-xs text-smart-teal shadow-inner border-none relative flex items-center gap-3 transition-all group-hover:ring-2 group-hover:ring-smart-teal/10 pointer-events-none">
                 <Calendar size={16} className="text-smart-teal opacity-50" />
                 {formattedEndDate}
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-smart-teal text-white rounded-lg flex items-center justify-center shadow-sm">
                    <Calendar size={14} />
                 </div>
               </div>
               
               {/* Hidden Native Input */}
               <input
                 ref={dateInputRef}
                 type="date"
                 min={new Date().toISOString().split('T')[0]}
                 className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
                 value={endDate}
                 onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    setEndDate(val);
                    
                    const selected = new Date(val);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const diffTime = Math.abs(selected.getTime() - today.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays <= 31) {
                      setUnit("days");
                      setDuration(diffDays);
                    } else if (diffDays <= 365) {
                      setUnit("months");
                      setDuration(Math.round(diffDays / 30));
                    } else {
                      setUnit("years");
                      setDuration(Math.round(diffDays / 365));
                    }
                 }}
               />
            </div>
          </div>

          <div className="bg-smart-sage/30 p-3 rounded-2xl border border-white flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-smart-teal shadow-sm shrink-0">
                <Info size={20} />
             </div>
             <div>
                <p className="text-[8px] font-bold uppercase text-gray-400 tracking-wider">Fin prévue</p>
                <p className="text-base font-bold text-smart-teal leading-none mt-0.5">
                   {formattedEndDate}
                </p>
             </div>
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase text-gray-400 ml-3 tracking-widest block mb-1">
              Motif
            </label>
            <textarea
              className="w-full p-4 bg-white rounded-2xl font-bold text-xs text-smart-teal outline-none focus:ring-4 focus:ring-smart-sage/30 transition-all shadow-inner resize-none h-20 border-none"
              placeholder="Raison..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={!endDate || !reason.trim()}
              className="w-full bg-smart-teal text-white py-4 rounded-2xl font-bold text-base shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldAlert size={18} />
              Confirmer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-smart-teal bg-white border-2 border-smart-teal/5 hover:border-smart-teal/20 transition-all text-center flex items-center justify-center gap-2"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
