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
              className="flex items-center justify-between p-3 bg-white rounded-xl border-l-4 border-smart-salmon shadow-sm"
            >
              <span className="text-xs font-black text-smart-teal">
                {new Date(slot.heure_debut).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <div className="h-px flex-1 bg-gray-100 mx-3"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                {slot.objet}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
