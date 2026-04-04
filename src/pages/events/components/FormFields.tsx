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

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
};

export function Select({ label, value, onChange, options }: SelectProps) {
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
        <option value="">Sélectionner...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
