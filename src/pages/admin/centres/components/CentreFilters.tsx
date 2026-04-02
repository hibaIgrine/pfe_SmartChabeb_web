import { Search, Map, X } from "lucide-react";

export const CentreFilters = ({
  search,
  setSearch,
  selectedGouv,
  setSelectedGouv,
  statusFilter,
  setStatusFilter,
  gouvernorats,
}: any) => {
  return (
    <div className="bg-white p-4 rounded-[30px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
      {/* Recherche */}
      <div className="relative flex-1 group w-full">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-smart-teal transition-colors"
          size={18}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un établissement..."
          className="w-full pl-14 pr-6 py-4 bg-smart-bg rounded-2xl outline-none font-bold text-xs text-smart-teal border-none focus:ring-2 focus:ring-smart-sage"
        />
      </div>

      {/* Région */}
      <div className="relative w-full md:w-64 group">
        <Map
          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
          size={18}
        />
        <select
          dir="rtl"
          value={selectedGouv}
          onChange={(e) => setSelectedGouv(e.target.value)}
          className="w-full pl-6 pr-12 py-4 bg-smart-bg rounded-2xl outline-none font-bold text-xs text-smart-teal border-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <option value="">كل الولايات (Tout)...</option>
          {gouvernorats.map((g: string) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Statut */}
      <div className="relative w-full md:w-56 group">
        <select
          dir="rtl"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full pl-6 pr-12 py-4 bg-smart-bg rounded-2xl outline-none font-bold text-xs text-smart-teal border-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <option value="">Status : Tous</option>
          <option value="ACTIVE">Actifs</option>
          <option value="INACTIVE">Désactivés</option>
        </select>
      </div>

      {/* Reset Rapide */}
      {(search || selectedGouv || statusFilter) && (
        <button
          onClick={() => {
            setSearch("");
            setSelectedGouv("");
            setStatusFilter("");
          }}
          className="p-4 text-smart-salmon hover:bg-red-50 rounded-2xl transition-all active:scale-90"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};
