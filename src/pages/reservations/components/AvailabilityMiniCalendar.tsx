/**
 * AvailabilityMiniCalendar.tsx — Mini-calendrier d'occupation journalière d'une salle.
 *
 * RÔLE :
 *   Affiche visuellement les créneaux occupés dans la journée pour une salle donnée.
 *   Utilisé dans la page de réservation pour montrer les plages horaires déjà prises.
 *
 * PROPS :
 *   occupiedSlots — Liste de créneaux { heure_debut, heure_fin, objet }
 *
 * AFFICHAGE :
 *   Chaque créneau occupé est affiché comme une bande colorée avec l'heure et l'objet.
 *   Message "Aucune occupation" si la liste est vide.
 */
export const AvailabilityMiniCalendar = ({ occupiedSlots }: any) => {
  return (
    <div className="bg-smart-bg p-6 rounded-[30px] border border-smart-sage/30">
      <h4 className="text-[10px] font-black text-smart-teal uppercase mb-4 tracking-widest text-center">
        Occupation du jour
      </h4>
      <div className="space-y-2">
        {occupiedSlots.length === 0 ? (
          <p className="text-center text-xs text-gray-400 italic">
            Aucune occupation
          </p>
        ) : (
          occupiedSlots.map((slot: any, i: number) => (
            <div
              key={i}
              className="flex items-center p-3 bg-white rounded-xl border-l-4 border-smart-salmon shadow-sm"
            >
              <span className="text-xs font-black text-smart-teal whitespace-nowrap">
                {(() => {
                  const timeStr = slot.heure_debut;
                  if (!timeStr) return 'N/A';
                  // Si c'est un format datetime complet, extraire l'heure
                  if (timeStr.includes('T') || timeStr.includes('-')) {
                    const date = new Date(timeStr);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                  // Si c'est déjà un format d'heure
                  return timeStr.substring(0, 5);
                })()}
              </span>
              <span className="text-gray-300 mx-1 whitespace-nowrap">—</span>
              <span className="text-xs font-black text-smart-teal whitespace-nowrap">
                {(() => {
                  const timeStr = slot.heure_fin;
                  if (!timeStr) return 'N/A';
                  // Si c'est un format datetime complet, extraire l'heure
                  if (timeStr.includes('T') || timeStr.includes('-')) {
                    const date = new Date(timeStr);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                  // Si c'est déjà un format d'heure
                  return timeStr.substring(0, 5);
                })()}
              </span>
              <span className="text-gray-300 mx-1 whitespace-nowrap">—</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[100px] whitespace-nowrap">
                {slot.objet || 'N/A'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
