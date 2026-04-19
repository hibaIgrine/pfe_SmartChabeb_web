import { X, Search } from "lucide-react";

export const RoleFilters = ({
  search,
  setSearch,
  selectedGouv,
  setSelectedGouv,
  selectedCentre,
  setSelectedCentre,
  centres,
  gouvernorats,
  onReset,
}: any) => {
  const filteredCentres = centres.filter(
    (c: any) => !selectedGouv || c.gouvernorat === selectedGouv,
  );

  return (
    <div className="bg-white p-3 rounded-[25px] border border-gray-100 flex flex-col md:flex-row gap-3 items-center shadow-sm animate-in fade-in duration-500">
      <div className="relative flex-[1.5] w-full group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-smart-teal"
          size={14}
        />
        <input
          className="w-full pl-10 pr-4 py-3 bg-smart-bg rounded-xl outline-none font-bold text-[11px] text-smart-teal border-none"
          placeholder="Rechercher un grade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <select
        dir="rtl"
        className="flex-1 p-3 bg-smart-bg rounded-xl outline-none font-bold text-[11px] text-smart-teal border-none cursor-pointer"
        value={selectedGouv}
        onChange={(e) => {
          setSelectedGouv(e.target.value);
          setSelectedCentre("");
        }}
      >
        <option value="">🗺️ Toutes les régions...</option>
        {gouvernorats.map((g: any) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <select
        disabled={!selectedGouv}
        className="flex-1 p-3 bg-smart-bg rounded-xl outline-none font-bold text-[11px] text-smart-teal border-none disabled:opacity-30"
        value={selectedCentre}
        onChange={(e) => setSelectedCentre(e.target.value)}
      >
        <option value="">🏛️ Tous les établissements...</option>
        {filteredCentres.map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.nom}
          </option>
        ))}
      </select>
      <button
        onClick={onReset}
        className="p-3 text-smart-salmon hover:bg-red-50 rounded-xl transition-all active:scale-90"
        title="Réinitialiser"
      >
        <X size={18} strokeWidth={3} />
      </button>
    </div>
  );
};
