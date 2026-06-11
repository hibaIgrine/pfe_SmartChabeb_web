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
  "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche",
];

const START_HOURS = Array.from({ length: 14 }, (_, i) => 8 + i); // 8 → 21
const END_HOURS   = Array.from({ length: 15 }, (_, i) => 8 + i); // 8 → 22

function parseTime(t: any): { h: number; m: number } {
  const str = typeof t === "string" ? t : "08:00";
  const parts = str.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return { h: isNaN(h) ? 8 : h, m: isNaN(m) ? 0 : m };
}

function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface TimePickerProps {
  value: string;
  onChange: (val: string) => void;
  hours: number[];
}

function TimePicker({ value, onChange, hours }: TimePickerProps) {
  const { h, m } = parseTime(value);
  const [minuteInput, setMinuteInput] = useState(String(m).padStart(2, "0"));

  // Sync minuteInput when the value prop changes from outside (e.g. hour change)
  useEffect(() => {
    setMinuteInput(String(m).padStart(2, "0"));
  }, [m]);

  const handleHour = (newH: number) => {
    const clampedM = newH === 22 ? 0 : m;
    onChange(formatTime(newH, clampedM));
  };

  const handleMinuteChange = (raw: string) => {
    // Allow only digits, max 2 chars
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setMinuteInput(digits);
    const num = parseInt(digits, 10);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      onChange(formatTime(h, num));
    }
  };

  const handleMinuteBlur = () => {
    const num = parseInt(minuteInput, 10);
    const safe = isNaN(num) ? 0 : Math.max(0, Math.min(59, num));
    setMinuteInput(String(safe).padStart(2, "0"));
    onChange(formatTime(h, safe));
  };

  return (
    <div className="flex items-center gap-1">
      {/* Heure — liste 8 à 22 */}
      <select
        value={h}
        onChange={(e) => handleHour(Number(e.target.value))}
        className="w-[62px] px-2 py-2 bg-smart-sage/10 border-none rounded-xl text-[11px] font-black text-smart-teal outline-none focus:ring-2 focus:ring-smart-teal/20 cursor-pointer appearance-none text-center"
      >
        {hours.map((hr) => (
          <option key={hr} value={hr}>
            {String(hr).padStart(2, "0")}
          </option>
        ))}
      </select>

      <span className="text-[11px] font-black text-smart-teal/40">:</span>

      {/* Minutes — saisie libre en texte */}
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="00"
        disabled={h === 22}
        value={minuteInput}
        onChange={(e) => handleMinuteChange(e.target.value)}
        onBlur={handleMinuteBlur}
        onFocus={(e) => e.target.select()}
        className="w-[48px] px-2 py-2 bg-smart-sage/10 border-none rounded-xl text-[11px] font-black text-smart-teal outline-none focus:ring-2 focus:ring-smart-teal/20 text-center disabled:opacity-40"
      />
    </div>
  );
}

export const PlanningInput = ({ value, onChange }: PlanningInputProps) => {
  const [slots, setSlots] = useState<PlanningSlot[]>([]);

  const isInvalidSlot = (slot: PlanningSlot) => {
    if (!slot.startTime || !slot.endTime) return false;
    return slot.endTime <= slot.startTime;
  };

  useEffect(() => {
    try {
      if (!value) { setSlots([]); return; }

      let parsed;
      if (typeof value === "string") {
        if (value.startsWith("{") || value.startsWith("[")) {
          parsed = JSON.parse(value);
        } else {
          setSlots([{ day: "Lundi", startTime: "14:00", endTime: "16:00" }]);
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
    } catch {
      setSlots([]);
    }
  }, [value]);

  const updateSlots = (newSlots: PlanningSlot[]) => {
    setSlots(newSlots);
    onChange(JSON.stringify({ slots: newSlots }));
  };

  const addSlot = () =>
    updateSlots([...slots, { day: "Lundi", startTime: "08:00", endTime: "10:00" }]);

  const removeSlot = (index: number) =>
    updateSlots(slots.filter((_, i) => i !== index));

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
              {/* Jour */}
              <div className="flex-1 min-w-[120px] relative">
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

              {/* Heure début + fin */}
              <div className="flex items-center gap-2">
                <div className="relative flex items-center gap-1">
                  <Clock size={13} className="text-smart-teal/40 shrink-0" />
                  <TimePicker
                    value={slot.startTime}
                    hours={START_HOURS}
                    onChange={(val) => handleChange(index, "startTime", val)}
                  />
                </div>

                <span className="text-[10px] font-black text-smart-teal/30">à</span>

                <div className="relative flex items-center gap-1">
                  <Clock size={13} className="text-smart-teal/40 shrink-0" />
                  <TimePicker
                    value={slot.endTime}
                    hours={END_HOURS.filter(
                      (hr) => hr >= parseTime(slot.startTime).h,
                    )}
                    onChange={(val) => handleChange(index, "endTime", val)}
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
