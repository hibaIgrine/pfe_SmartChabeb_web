import { X, MapPin } from "lucide-react";
import { useState, useMemo } from "react";

interface AssignSalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (salleId: string) => void;
  user: any;
  salles: any[];
}

export const AssignSalleModal = ({ isOpen, onClose, onAssign, user, salles }: AssignSalleModalProps) => {
  const [selectedGouv, setSelectedGouv] = useState("");
  const [selectedSalleId, setSelectedSalleId] = useState("");

  const gouvernorats = useMemo(() => 
    Array.from(new Set(salles.map((s: any) => s.gouvernorat))).filter(Boolean) as string[],
    [salles]
  );

  const filteredSalles = useMemo(() => 
    salles.filter((s: any) => s.gouvernorat === selectedGouv),
    [salles, selectedGouv]
  );

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-md w-full shadow-2xl border-4 border-white animate-in zoom-in relative">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-2 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white text-smart-teal rounded-[25px] flex items-center justify-center mx-auto mb-4 shadow-sm border-2 border-smart-sage/20">
                <MapPin size={30} />
            </div>
            <h3 className="text-3xl font-bold text-smart-teal tracking-tight leading-none">
                Affectation Locale
            </h3>
            <p className="text-gray-400 text-[10px] font-bold mt-2 uppercase tracking-widest">
                {user.nom} {user.prenom}
            </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest block">
              1. Choisir le Gouvernorat
            </label>
            <select
              className="w-full p-5 bg-white rounded-[25px] font-bold text-sm text-smart-teal outline-none shadow-inner border-none appearance-none cursor-pointer focus:ring-4 focus:ring-smart-sage/30 transition-all"
              value={selectedGouv}
              onChange={(e) => {
                setSelectedGouv(e.target.value);
                setSelectedSalleId("");
              }}
            >
              <option value="">Sélectionner une région...</option>
              {gouvernorats.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>

          <div className={`space-y-2 transition-all duration-500 ${!selectedGouv ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
            <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest block">
              2. Sélectionner l'Établissement
            </label>
            <select
              className="w-full p-5 bg-white rounded-[25px] font-bold text-sm text-smart-teal outline-none shadow-inner border-none appearance-none cursor-pointer focus:ring-4 focus:ring-smart-sage/30 transition-all"
              value={selectedSalleId}
              onChange={(e) => setSelectedSalleId(e.target.value)}
            >
              <option value="">
                {selectedGouv ? "Choisir un centre..." : "Sélectionner une région d'abord"}
              </option>
              {filteredSalles.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={!selectedSalleId}
            onClick={() => onAssign(selectedSalleId)}
            className="w-full bg-smart-teal text-white py-6 rounded-[35px] font-black text-xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed mt-4 shadow-smart-teal/20 italic tracking-tight"
          >
            Rattacher au centre
          </button>
        </div>
      </div>
    </div>
  );
};
