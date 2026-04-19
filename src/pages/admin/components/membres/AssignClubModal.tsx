import { useState, useEffect } from "react";

export const AssignClubModal = ({
  isOpen,
  onConfirm,
  clubs,
  userName,
  userCentreId,
}: any) => {
  const [selectedClubId, setSelectedClubId] = useState("");
  const filteredClubs = Array.isArray(clubs)
    ? clubs.filter((c: any) => c.id_centre === userCentreId)
    : [];

  useEffect(() => {
    if (isOpen) setSelectedClubId("");
  }, [isOpen, userCentreId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-md w-full shadow-2xl border-4 border-white animate-in zoom-in">
        <h3 className="text-2xl font-black text-smart-teal italic mb-2">
          Direction de Club
        </h3>
        <p className="text-gray-400 text-xs font-bold mb-8 uppercase">
          Assigner un club à {userName}
        </p>

        <select
          className="w-full p-5 bg-white rounded-[25px] outline-none shadow-sm font-bold text-smart-teal border-none focus:ring-4 focus:ring-smart-sage/50"
          value={selectedClubId}
          onChange={(e) => setSelectedClubId(e.target.value)}
          disabled={!userCentreId || filteredClubs.length === 0}
        >
          <option value="">
            {userCentreId
              ? filteredClubs.length > 0
                ? "Choisir l'activité à diriger..."
                : "Aucun club disponible dans ce centre"
              : "L'utilisateur n'est pas rattaché à un centre"}
          </option>
          {filteredClubs.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.nom} ({c.centre?.nom})
            </option>
          ))}
        </select>

        <p className="mt-4 text-[11px] text-gray-500 leading-snug">
          {userCentreId
            ? filteredClubs.length === 0
              ? "Aucun club n'est encore disponible pour ce centre."
              : "Seuls les clubs de l’institution rattachée sont affichés."
            : "Veuillez d'abord affecter un centre à ce responsable."}
        </p>

        <button
          onClick={() => onConfirm(selectedClubId)}
          disabled={!selectedClubId}
          className="w-full mt-8 bg-smart-teal text-white py-6 rounded-[30px] font-black disabled:opacity-30 transition-all shadow-xl shadow-smart-teal/20"
        >
          VALIDER L'AFFECTATION
        </button>
      </div>
    </div>
  );
};
