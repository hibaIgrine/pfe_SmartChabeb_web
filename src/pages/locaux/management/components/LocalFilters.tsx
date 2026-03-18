import { Search, Filter } from "lucide-react";

export const LocalFilters = ({
  search,
  setSearch,
  type,
  setType,
  centres,
  selectedCentre,
  setCentre,
}: any) => {
  return (
    <div className="bg-white p-4 rounded-[35px] shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 items-center">
      <div className="relative flex-1 group w-full">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-smart-teal"
          size={18}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une salle..."
          className="w-full pl-14 pr-6 py-4 bg-smart-bg rounded-[22px] outline-none font-bold text-xs text-smart-teal border-none"
        />
      </div>

      <select
        value={selectedCentre}
        onChange={(e) => setCentre(e.target.value)}
        className="w-full lg:w-64 p-4 bg-smart-bg rounded-[22px] outline-none font-bold text-xs text-smart-teal cursor-pointer appearance-none border-none"
      >
        <option value="">🗺️ Tous les centres</option>
        {centres.map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.nom}
          </option>
        ))}
      </select>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full lg:w-48 p-4 bg-smart-bg rounded-[22px] outline-none font-bold text-xs text-smart-teal cursor-pointer appearance-none border-none"
      >
        <option value="ALL">✨ Tous types</option>
        <option value="CULTURE">🎭 Culture</option>
        <option value="SPORT">⚽ Sport</option>
        <option value="INFORMATIQUE">💻 Informatique</option>
        <option value="REUNION">🤝 Réunion</option>
      </select>
    </div>
  );
};
