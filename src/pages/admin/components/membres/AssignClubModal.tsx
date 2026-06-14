/**
 * AssignClubModal.tsx — Modal d'assignation d'un utilisateur à un club comme responsable.
 *
 * RÔLE :
 *   Permet à l'admin d'assigner un RESPONSABLE_CLUB à un club spécifique.
 *   Liste des clubs disponibles avec checkmark sur le club actuellement sélectionné.
 *
 * API : PATCH /users/:id/assign-club
 */
import { useState, useEffect } from "react";
import { X, LayoutGrid, Check } from "lucide-react";

export const AssignClubModal = ({
  isOpen,
  onClose,
  clubs,
  userName,
  userCentreId,
  currentClubIds = [],
  onConfirm,
}: any) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredClubs: any[] = Array.isArray(clubs)
    ? clubs.filter((c: any) => c.id_centre === userCentreId)
    : [];

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(Array.isArray(currentClubIds) ? currentClubIds : []));
    }
  }, [isOpen, userCentreId]);

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const prev = new Set(Array.isArray(currentClubIds) ? currentClubIds : []);
    const toAdd = [...selected].filter((id) => !prev.has(id));
    const toRemove = [...prev].filter((id) => !selected.has(id));
    onConfirm({ toAdd, toRemove });
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[60px] p-10 max-w-md w-full shadow-2xl border-4 border-white animate-in zoom-in">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-black text-smart-teal italic tracking-tighter">
            Clubs dirigés
          </h3>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-black bg-white p-2 rounded-full shadow-sm transition-all hover:rotate-90"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-gray-400 text-[10px] font-bold mb-6 uppercase tracking-widest">
          {userName} · sélectionnez un ou plusieurs clubs
        </p>

        {!userCentreId ? (
          <p className="text-sm text-amber-600 font-bold bg-amber-50 rounded-2xl px-4 py-3">
            L'utilisateur n'est pas rattaché à un centre.
          </p>
        ) : filteredClubs.length === 0 ? (
          <p className="text-sm text-gray-400 font-bold bg-white rounded-2xl px-4 py-3">
            Aucun club disponible dans ce centre.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {filteredClubs.map((c: any) => {
              const isChecked = selected.has(c.id);
              const currentCoachId = c.id_coach;
              const alreadyMine = Array.isArray(currentClubIds) && currentClubIds.includes(c.id);
              const takenByOther = currentCoachId && !alreadyMine;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-[20px] border-2 font-bold text-sm transition-all
                    ${isChecked
                      ? "bg-smart-teal text-white border-smart-teal shadow-lg"
                      : "bg-white text-gray-700 border-gray-100 hover:border-smart-teal/30"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <LayoutGrid size={16} className={isChecked ? "text-white" : "text-smart-teal"} />
                    <span className="truncate">{c.nom}</span>
                    {takenByOther && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 shrink-0">
                        déjà assigné
                      </span>
                    )}
                  </div>
                  {isChecked && <Check size={16} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-[10px] text-gray-400 leading-snug">
          Cocher un club "déjà assigné" le transfère à {userName} et détache l'ancien responsable.
        </p>

        <button
          onClick={handleConfirm}
          disabled={!userCentreId || filteredClubs.length === 0}
          className="w-full mt-6 bg-smart-teal text-white py-5 rounded-[28px] font-black disabled:opacity-30 transition-all shadow-xl shadow-smart-teal/20 uppercase tracking-widest text-xs"
        >
          Valider ({selected.size} club{selected.size !== 1 ? "s" : ""})
        </button>
      </div>
    </div>
  );
};
