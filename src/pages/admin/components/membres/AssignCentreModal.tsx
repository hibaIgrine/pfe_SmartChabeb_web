import { X, Building2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

interface AssignCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (centreId: string) => void; // 💡 Renommé pour la clarté
  user: any;
  centres: any[]; // 💡 Utilise maintenant la liste des centres
}

export const AssignCentreModal = ({
  isOpen,
  onClose,
  onAssign,
  user,
  centres,
}: AssignCentreModalProps) => {
  const [selectedGouv, setSelectedGouv] = useState("");
  const [selectedCentreId, setSelectedCentreId] = useState("");

  // 1. Extraire la liste unique des gouvernorats depuis les centres
  const gouvernorats = useMemo(
    () =>
      Array.from(new Set(centres.map((c: any) => c.gouvernorat))).filter(
        Boolean,
      ) as string[],
    [centres],
  );

  // 2. Filtrer les centres selon le gouvernorat choisi
  const filteredCentres = useMemo(
    () => centres.filter((c: any) => c.gouvernorat === selectedGouv),
    [centres, selectedGouv],
  );

  // 🔄 Reset des sélections à la fermeture ou au changement d'utilisateur
  useEffect(() => {
    if (!isOpen) {
      setSelectedGouv("");
      setSelectedCentreId("");
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-md w-full shadow-2xl border-4 border-white animate-in zoom-in relative">
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-2 rounded-full shadow-sm transition-all active:scale-90"
        >
          <X size={20} />
        </button>

        {/* Header Institutionnel */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white text-smart-teal rounded-[30px] flex items-center justify-center mx-auto mb-4 shadow-sm border-2 border-smart-sage/20">
            <Building2 size={40} />
          </div>
          <h3 className="text-3xl font-black text-smart-teal tracking-tighter italic leading-none">
            Affectation
          </h3>
          <p className="text-gray-400 text-[10px] font-black mt-3 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-smart-salmon animate-pulse"></span>
            {user.nom} {user.prenom}
          </p>
        </div>

        <div className="space-y-6">
          {/* Étape 1 : Gouvernorat */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest block">
              1. Choisir la Région
            </label>
            <select
              dir="rtl" // 💡 Garde l'arabe à droite pour l'UX
              className="w-full p-5 bg-white rounded-[25px] font-bold text-sm text-smart-teal outline-none shadow-sm border-none appearance-none cursor-pointer focus:ring-4 focus:ring-smart-sage/30 transition-all"
              value={selectedGouv}
              onChange={(e) => {
                setSelectedGouv(e.target.value);
                setSelectedCentreId(""); // Reset le centre si on change de région
              }}
            >
              <option value="">Sélectionner un gouvernorat...</option>
              {gouvernorats.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>

          {/* Étape 2 : Centre (Etablissement) */}
          <div
            className={`space-y-2 transition-all duration-500 ${!selectedGouv ? "opacity-30 pointer-events-none translate-y-2" : "opacity-100 translate-y-0"}`}
          >
            <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest block">
              2. Sélectionner l'Institution
            </label>
            <select
              className="w-full p-5 bg-white rounded-[25px] font-bold text-sm text-smart-teal outline-none shadow-sm border-none appearance-none cursor-pointer focus:ring-4 focus:ring-smart-sage/30 transition-all"
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
            >
              <option value="">
                {selectedGouv
                  ? "Choisir une Maison de Jeunesse..."
                  : "En attente de la région"}
              </option>
              {filteredCentres.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton d'action final */}
          <div className="pt-4">
            <button
              disabled={!selectedCentreId}
              onClick={() => onAssign(selectedCentreId)}
              className="w-full bg-smart-teal text-white py-6 rounded-[35px] font-black text-xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-smart-teal/20 italic tracking-tighter uppercase"
            >
              Rattacher au centre
            </button>
            <p className="text-center mt-6 text-[8px] font-bold text-gray-300 uppercase tracking-widest italic">
              Action enregistrée dans le registre national SmartChabeb
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
