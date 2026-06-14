/**
 * LocalFilters.tsx — Filtres de la liste des locaux.
 *
 * FILTRES :
 *   search        — Recherche par nom de local
 *   type          — Filtre par type de local (Salle, Terrain, Gymnase...)
 *   availableTypes— Types disponibles (calculés dynamiquement depuis la liste)
 *
 * COMPORTEMENT :
 *   Bouton X remet tous les filtres à zéro.
 */
import { Search, X, MapPin, LayoutGrid } from "lucide-react";

interface LocalFiltersProps {
  search: string;
  setSearch: (s: string) => void;
  type: string;
  setType: (t: string) => void;
  availableTypes: string[];
  centres: any[];
  selectedCentre: string;
  setCentre: (id: string) => void;
  isAdmin: boolean; // 💡 Reçu de la page parente
}

const TYPE_ICONS: any = {
  CULTURE: "🎭",
  SPORT: "⚽",
  INFORMATIQUE: "💻",
  REUNION: "🤝",
};

export const LocalFilters = ({
  search,
  setSearch,
  type,
  setType,
  availableTypes,
  centres,
  selectedCentre,
  setCentre,
  isAdmin,
}: LocalFiltersProps) => {
  const handleReset = () => {
    setSearch("");
    setType("ALL");
    if (isAdmin) setCentre(""); // Uniquement si admin
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className="bg-white p-4 rounded-[35px] shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 items-center">
        {/* 1. Recherche Textuelle */}
        <div className="relative flex-1 group w-full">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-smart-teal transition-colors"
            size={18}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom d'espace..."
            className="w-full pl-14 pr-6 py-4 bg-smart-bg rounded-[22px] outline-none font-bold text-xs text-smart-teal border-none focus:ring-2 focus:ring-smart-sage"
          />
        </div>

        {/* 2. Liste des centres : MASQUÉE SI NON-ADMIN */}
        {isAdmin && (
          <div className="relative w-full lg:w-72 group">
            <MapPin
              className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
              size={16}
            />
            <select
              value={selectedCentre}
              onChange={(e) => setCentre(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-smart-bg rounded-[22px] outline-none font-bold text-xs text-smart-teal cursor-pointer appearance-none border-none hover:bg-gray-100 transition-colors"
            >
              <option value="">🗺️ Tout le réseau national</option>
              {centres.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 3. Bouton Effacer */}
        {(search || type !== "ALL" || (isAdmin && selectedCentre)) && (
          <button
            onClick={handleReset}
            className="p-4 bg-smart-salmon/10 text-smart-salmon rounded-2xl hover:bg-smart-salmon hover:text-white transition-all active:scale-90 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
          >
            <X size={16} strokeWidth={3} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* 4. Catégories Dynamiques */}
      <div className="flex flex-wrap items-center gap-2 px-2">
        <div className="flex items-center gap-2 mr-4 text-gray-400">
          <LayoutGrid size={14} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            Type d'espace
          </span>
        </div>

        <button
          onClick={() => setType("ALL")}
          className={`px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all border-2 ${
            type === "ALL"
              ? "bg-smart-teal text-white border-smart-teal shadow-lg scale-105"
              : "bg-white text-gray-400 border-gray-100 hover:border-smart-teal/30"
          }`}
        >
          ✨ Tous
        </button>

        {availableTypes.map((t: string) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all border-2 ${
              type === t
                ? "bg-smart-teal text-white border-smart-teal shadow-lg scale-105"
                : "bg-white text-gray-400 border-gray-100 hover:border-smart-teal/30"
            }`}
          >
            {TYPE_ICONS[t] || "🔹"} {t}
          </button>
        ))}
      </div>
    </div>
  );
};
