import { Search, X } from "lucide-react";

interface ClubFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedGouvernorat: string;
  setSelectedGouvernorat: (g: string) => void;
  selectedCentre: string;
  setSelectedCentre: (c: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  categories: any[];
  gouvernorats: string[];
  centres: any[];
}

export const ClubFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedGouvernorat,
  setSelectedGouvernorat,
  selectedCentre,
  setSelectedCentre,
  categories,
  gouvernorats,
  centres,
  selectedStatus,
  setSelectedStatus,
}: ClubFiltersProps) => {
  const hasFilter =
    searchQuery ||
    selectedCategory !== "ALL" ||
    selectedGouvernorat ||
    selectedCentre ||
    selectedStatus !== "ALL";

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 space-y-5 mb-6">
      {/* Ligne 1 : Recherche + Selects (Gouvernorat & Centre) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Barre de recherche */}
        <div className="relative group md:col-span-2">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-smart-teal transition-colors pointer-events-none"
            size={17}
          />
          <input
            type="text"
            placeholder="Rechercher un club par nom..."
            className="w-full pl-11 pr-10 py-3.5 bg-[#F7F3E9] rounded-2xl outline-none font-bold text-xs text-smart-teal placeholder:text-gray-300 focus:ring-2 focus:ring-smart-teal/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtre Gouvernorat */}
        <select
          className="w-full px-4 py-3 rounded-2xl font-bold text-[11px] border text-smart-teal bg-[#F7F3E9] border-transparent focus:border-smart-teal outline-none cursor-pointer transition-all"
          value={selectedGouvernorat}
          onChange={(e) => {
            setSelectedGouvernorat(e.target.value);
            setSelectedCentre(""); // Reset centre if gouvernorat changes
          }}
        >
          <option value="">🗺️ Tous les gouvernorats</option>
          {gouvernorats.map((gov) => (
            <option key={gov} value={gov}>
              {gov}
            </option>
          ))}
        </select>

        {/* Filtre Centre (Salle) */}
        <select
          className={`w-full px-4 py-3 rounded-2xl font-bold text-[11px] border outline-none transition-all ${
            !selectedGouvernorat
              ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
              : "bg-[#F7F3E9] text-smart-teal border-transparent focus:border-smart-teal cursor-pointer"
          }`}
          value={selectedCentre}
          onChange={(e) => setSelectedCentre(e.target.value)}
          disabled={!selectedGouvernorat}
        >
          <option value="">🏛️ Tous les centres</option>
          {centres.map((centre) => (
            <option key={centre.id} value={centre.id}>
              {centre.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="h-px bg-gray-50 w-full" />

      {/* Ligne 2 : Catégories et Reset */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Filtre Catégorie (pills horizontaux avec scroll sur mobile) */}
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`shrink-0 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border ${
              selectedCategory === "ALL"
                ? "bg-smart-teal text-white border-smart-teal shadow-md"
                : "bg-white text-gray-400 border-gray-100 hover:border-smart-teal hover:text-smart-teal"
            }`}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-smart-teal text-white border-smart-teal shadow-md"
                  : "bg-white text-gray-400 border-gray-100 hover:border-smart-teal hover:text-smart-teal"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label.split(" & ")[0]}{" "}
              {/* Raccourcir le label pour les filtres */}
            </button>
          ))}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="shrink-0 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider border bg-white text-smart-teal transition-all border-gray-100 hover:border-smart-teal hover:text-smart-teal"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actifs</option>
            <option value="INACTIVE">Désactivés</option>
          </select>
        </div>

        {/* Réinitialiser */}
        {hasFilter && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
              setSelectedGouvernorat("");
              setSelectedCentre("");
            }}
            className="shrink-0 text-[10px] font-bold text-smart-salmon hover:underline flex items-center gap-1 px-2"
          >
            <X size={12} /> Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
};
