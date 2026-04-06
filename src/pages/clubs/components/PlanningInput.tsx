import { useState, useEffect } from "react";
import { Plus, Trash2, Clock, Calendar } from "lucide-react";

interface PlanningSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface PlanningInputProps {
  value: string | any;
  onChange: (value: string) => void;
}

const DAYS = [
  "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"
];

export const PlanningInput = ({ value, onChange }: PlanningInputProps) => {
  const [slots, setSlots] = useState<PlanningSlot[]>([]);

  const isInvalidSlot = (slot: PlanningSlot) => {
    if (!slot.startTime || !slot.endTime) return false;
    return slot.endTime <= slot.startTime;
  };

  // Parse initial value (could be JSON or string)
  useEffect(() => {
    try {
      if (!value) {
        setSlots([]);
        return;
      }
      
      let parsed;
      if (typeof value === "string") {
        if (value.startsWith("{") || value.startsWith("[")) {
          parsed = JSON.parse(value);
        } else {
          // Legacy string format or fallback
          const defaultSlot = { day: "Lundi", startTime: "14:00", endTime: "16:00" };
          setSlots([defaultSlot]);
          return;
        }
      } else {
        parsed = value;
      }

      if (parsed.slots && Array.isArray(parsed.slots)) {
        setSlots(parsed.slots);
      } else if (Array.isArray(parsed)) {
        setSlots(parsed);
      }
    } catch (e) {
      console.error("Failed to parse planning", e);
      setSlots([]);
    }
  }, [value]);

  const updateSlots = (newSlots: PlanningSlot[]) => {
    setSlots(newSlots);
    onChange(JSON.stringify({ slots: newSlots }));
  };

  const addSlot = () => {
    updateSlots([...slots, { day: "Lundi", startTime: "09:00", endTime: "11:00" }]);
  };

  const removeSlot = (index: number) => {
    updateSlots(slots.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof PlanningSlot, val: string) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: val };
    updateSlots(newSlots);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest pl-1">
          Emploi du Temps
        </label>
        <button
          type="button"
          onClick={addSlot}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-smart-teal text-white rounded-xl text-[10px] font-black hover:bg-smart-teal/90 transition-all shadow-sm active:scale-95"
        >
          <Plus size={12} strokeWidth={3} />
          Ajouter un créneau
        </button>
      </div>

      {slots.length === 0 ? (
        <div className="p-8 bg-white/50 border-2 border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center gap-2 text-gray-400 group hover:border-smart-teal/30 transition-colors">
          <Calendar size={24} className="opacity-20 group-hover:opacity-40 transition-opacity" />
          <p className="text-[10px] font-bold">Aucun créneau programmé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map((slot, index) => (
            <div
              key={index}
              className={`flex flex-wrap items-center gap-2 p-3 bg-white rounded-[20px] shadow-sm border transition-all animate-in slide-in-from-top-2 ${
                isInvalidSlot(slot)
                  ? "border-red-300"
                  : "border-transparent hover:border-smart-teal/20"
              }`}
            >
              {/* Day selection */}
              <div className="flex-1 min-w-[120px] relative group">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-smart-teal/40 pointer-events-none" />
                <select
                  value={slot.day}
                  onChange={(e) => handleChange(index, "day", e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-smart-sage/10 border-none rounded-xl text-[11px] font-black text-smart-teal outline-none focus:ring-2 focus:ring-smart-teal/20 cursor-pointer appearance-none"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-smart-teal/40 pointer-events-none" />
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleChange(index, "startTime", e.target.value)}
                    className="w-[100px] pl-9 pr-3 py-2 bg-smart-sage/10 border-none rounded-xl text-[11px] font-black text-smart-teal outline-none focus:ring-2 focus:ring-smart-teal/20"
                  />
                </div>
                <span className="text-[10px] font-black text-smart-teal/30">à</span>
                <div className="relative group">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-smart-teal/40 pointer-events-none" />
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleChange(index, "endTime", e.target.value)}
                    min={slot.startTime || undefined}
                    className="w-[100px] pl-9 pr-3 py-2 bg-smart-sage/10 border-none rounded-xl text-[11px] font-black text-smart-teal outline-none focus:ring-2 focus:ring-smart-teal/20"
                  />
                </div>
              </div>

              {isInvalidSlot(slot) && (
                <p className="w-full text-[10px] text-red-500 font-black pl-1 uppercase">
                  L'heure de fin doit être après l'heure de début.
                </p>
              )}

              <button
                type="button"
                onClick={() => removeSlot(index)}
                className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Supprimer le créneau"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
