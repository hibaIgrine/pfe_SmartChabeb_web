/**
 * FormFields.tsx — Composants de champs de formulaire réutilisables (module events).
 *
 * RÔLE :
 *   Petits composants de champs standardisés utilisés dans EventFormModal :
 *   InputField, TextareaField, SelectField — avec label, value, onChange, validation.
 *
 * AVANTAGE :
 *   Uniformisation du style des champs de formulaire dans tout le module events.
 */
type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  inputMode?:
    | "text"
    | "numeric"
    | "decimal"
    | "search"
    | "email"
    | "tel"
    | "url"
    | "none";
  pattern?: string;
};

export function Input({
  label,
  value,
  onChange,
  type = "text",
  min,
  inputMode,
  pattern,
}: InputProps) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-widest text-gray-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        min={min}
        inputMode={inputMode}
        pattern={pattern}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/40"
      />
    </div>
  );
}

type TimePickerProps = {
  label: string;
  value: string; // "HH:MM" or ""
  onChange: (value: string) => void;
  minHour?: number;
  maxHour?: number;
};

export function TimePicker({ label, value, onChange, minHour = 8, maxHour = 22 }: TimePickerProps) {
  const [hVal, mVal] = value ? value.split(":") : ["", ""];
  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour);

  const emit = (h: string, m: string) => {
    onChange(h ? `${h}:${m || "00"}` : "");
  };

  const fieldClass =
    "flex-1 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/40";

  return (
    <div>
      <label className="text-xs font-black uppercase tracking-widest text-gray-500">
        {label}
      </label>
      <div className="mt-1.5 flex gap-2">
        <select
          value={hVal}
          onChange={(e) => emit(e.target.value, mVal)}
          className={fieldClass}
        >
          <option value="">Heure</option>
          {hours.map((hr) => {
            const v = String(hr).padStart(2, "0");
            return (
              <option key={v} value={v}>
                {v}h
              </option>
            );
          })}
        </select>
        <input
          type="number"
          min={0}
          max={59}
          placeholder="min"
          value={mVal ? String(parseInt(mVal, 10)) : ""}
          onChange={(e) => {
            const raw = e.target.value;
            const n = parseInt(raw, 10);
            if (raw === "" || (!isNaN(n) && n >= 0 && n <= 59)) {
              emit(hVal, raw === "" ? "00" : String(n).padStart(2, "0"));
            }
          }}
          className={fieldClass}
        />
      </div>
    </div>
  );
}

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
};

export function Select({ label, value, onChange, options, required }: SelectProps) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-widest text-gray-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#436D75]/40"
      >
        {!required && <option value="">Sélectionner...</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
