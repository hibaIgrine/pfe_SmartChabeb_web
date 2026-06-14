/**
 * AssignCentreModal.tsx — Modal d'assignation d'un utilisateur à un centre.
 *
 * RÔLE :
 *   Permet à l'admin d'assigner un RESPONSABLE_CENTRE à un centre spécifique.
 *   Dropdown des centres disponibles avec recherche.
 *
 * COMPORTEMENT :
 *   Si l'utilisateur a déjà un centre, il est affiché en avertissement (AlertTriangle).
 *   L'assignation crée un lien user ↔ centre en base.
 *
 * API : PATCH /users/:id/assign-centre
 */
import { X, Building2, AlertTriangle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

interface AssignCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (centreId: string) => void;
  user: any;
  centres: any[];
  centreResponsableMap?: Record<string, any>;
}

export const AssignCentreModal = ({
  isOpen,
  onClose,
  onAssign,
  user,
  centres,
  centreResponsableMap = {},
}: AssignCentreModalProps) => {
  const [selectedGouv, setSelectedGouv] = useState("");
  const [selectedCentreId, setSelectedCentreId] = useState("");
  const [confirmReplace, setConfirmReplace] = useState(false);

  const gouvernorats = useMemo(
    () =>
      Array.from(new Set(centres.map((c: any) => c.gouvernorat))).filter(
        Boolean,
      ) as string[],
    [centres],
  );

  const filteredCentres = useMemo(
    () => centres.filter((c: any) => c.gouvernorat === selectedGouv),
    [centres, selectedGouv],
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedGouv("");
      setSelectedCentreId("");
      setConfirmReplace(false);
    }
  }, [isOpen]);

  // Reset confirmation quand le centre change
  useEffect(() => {
    setConfirmReplace(false);
  }, [selectedCentreId]);

  if (!isOpen || !user) return null;

  const existingResp = centreResponsableMap[selectedCentreId];
  const hasConflict = !!existingResp && existingResp.id !== user?.id;
  const canConfirm = !!selectedCentreId && (!hasConflict || confirmReplace);

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-md w-full shadow-2xl border-4 border-white animate-in zoom-in relative">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-2 rounded-full shadow-sm transition-all active:scale-90"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white text-smart-teal rounded-[30px] flex items-center justify-center mx-auto mb-4 shadow-sm border-2 border-smart-sage/20">
            <Building2 size={40} />
          </div>
          <h3 className="text-3xl font-black text-smart-teal tracking-tighter italic leading-none">
            Affectation
          </h3>
          <p className="text-gray-400 text-[10px] font-black mt-3 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-smart-salmon animate-pulse" />
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
              dir="rtl"
              className="w-full p-5 bg-white rounded-[25px] font-bold text-sm text-smart-teal outline-none shadow-sm border-none appearance-none cursor-pointer focus:ring-4 focus:ring-smart-sage/30 transition-all"
              value={selectedGouv}
              onChange={(e) => {
                setSelectedGouv(e.target.value);
                setSelectedCentreId("");
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

          {/* Étape 2 : Centre */}
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

          {/* Avertissement de conflit */}
          {hasConflict && selectedCentreId && (
            <div className="bg-[#E98A7D]/10 border-2 border-[#E98A7D]/30 rounded-[24px] p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E98A7D]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={15} className="text-[#E98A7D]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#E98A7D] uppercase tracking-widest mb-1">
                    Centre déjà assigné
                  </p>
                  <p className="text-xs text-gray-500 leading-5">
                    <span className="font-black text-smart-teal">
                      {existingResp.prenom} {existingResp.nom}
                    </span>{" "}
                    est actuellement responsable de ce centre. En confirmant, il
                    sera automatiquement rétrogradé au grade{" "}
                    <span className="font-black text-smart-teal">Adhérent</span>.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group px-1">
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                    confirmReplace
                      ? "bg-smart-teal border-smart-teal"
                      : "border-gray-300 bg-white group-hover:border-smart-teal/50"
                  }`}
                  onClick={() => setConfirmReplace((v) => !v)}
                >
                  {confirmReplace && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-smart-teal transition-colors select-none"
                  onClick={() => setConfirmReplace((v) => !v)}
                >
                  Je confirme le remplacement
                </span>
              </label>
            </div>
          )}

          {/* Bouton d'action */}
          <div className="pt-4">
            <button
              disabled={!canConfirm}
              onClick={() => onAssign(selectedCentreId)}
              className="w-full bg-smart-teal text-white py-6 rounded-[35px] font-black text-xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-smart-teal/20 italic tracking-tighter uppercase"
            >
              {hasConflict && !confirmReplace
                ? "Confirmer le remplacement"
                : "Rattacher au centre"}
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
