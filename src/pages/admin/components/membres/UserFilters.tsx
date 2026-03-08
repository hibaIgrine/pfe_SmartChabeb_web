import { Search, X } from "lucide-react";

interface UserFiltersProps {
  search: string;
  setSearch: (s: string) => void;
  filterRole: string;
  setFilterRole: (r: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  selectedGouvernorat: string;
  setSelectedGouvernorat: (g: string) => void;
  selectedSalleId: string;
  setSelectedSalleId: (id: string) => void;
  gouvernorats: string[];
  salles: any[];
  availableRoles: any[]; // 🏆 ÉTAPE 3 : On ajoute cette Prop pour recevoir les rôles de la BDD
}

export const UserFilters = ({
  search,
  setSearch,
  filterRole,
  setFilterRole,
  filterStatus,
  setFilterStatus,
  selectedGouvernorat,
  setSelectedGouvernorat,
  selectedSalleId,
  setSelectedSalleId,
  gouvernorats,
  salles,
  availableRoles, // 🏆 On l'utilise ici
}: UserFiltersProps) => {
  const filteredSalles = salles.filter(
    (s: any) => !selectedGouvernorat || s.gouvernorat === selectedGouvernorat,
  );

  const hasFilter =
    search ||
    filterRole !== "ALL" ||
    filterStatus !== "ALL" ||
    selectedGouvernorat ||
    selectedSalleId;

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Recherche */}
        <div className="relative group lg:col-span-2">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-smart-teal transition-colors pointer-events-none"
            size={17}
          />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email..."
            className="w-full pl-11 pr-10 py-3.5 bg-[#F7F3E9] rounded-2xl outline-none font-bold text-xs text-smart-teal placeholder:text-gray-300 focus:ring-2 focus:ring-smart-teal/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Gouvernorat */}
        <select
          className="w-full px-4 py-3 rounded-2xl font-bold text-[11px] border text-smart-teal bg-[#F7F3E9] border-transparent focus:border-smart-teal outline-none cursor-pointer transition-all"
          value={selectedGouvernorat}
          onChange={(e) => {
            setSelectedGouvernorat(e.target.value);
            setSelectedSalleId("");
          }}
        >
          <option value="">🗺️ Tous les gouvernorats</option>
          {gouvernorats.map((gov) => (
            <option key={gov} value={gov}>
              {gov}
            </option>
          ))}
        </select>

        {/* Centre */}
        <select
          className={`w-full px-4 py-3 rounded-2xl font-bold text-[11px] border outline-none transition-all ${
            !selectedGouvernorat && !selectedSalleId
              ? "bg-[#F7F3E9] text-smart-teal border-transparent focus:border-smart-teal cursor-pointer"
              : selectedGouvernorat
                ? "bg-[#F7F3E9] text-smart-teal border-transparent focus:border-smart-teal cursor-pointer"
                : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
          }`}
          value={selectedSalleId}
          onChange={(e) => setSelectedSalleId(e.target.value)}
        >
          <option value="">🏛️ Tous les centres</option>
          {filteredSalles.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="h-px bg-gray-50 w-full" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {/* 🏆 RÔLES DYNAMIQUES (MODIFIÉ) */}
          <div className="flex bg-[#F7F3E9] p-1 rounded-xl border border-gray-100 overflow-x-auto max-w-full">
            <button
              onClick={() => setFilterRole("ALL")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                filterRole === "ALL"
                  ? "bg-smart-teal text-white shadow-sm"
                  : "text-gray-400 hover:text-smart-teal"
              }`}
            >
              ALL
            </button>

            {/* On boucle sur les rôles de la base de données */}
            {availableRoles.map((role: any) => (
              <button
                key={role.id}
                onClick={() => setFilterRole(role.nom)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all whitespace-nowrap ${
                  filterRole === role.nom
                    ? "bg-smart-teal text-white shadow-sm"
                    : "text-gray-400 hover:text-smart-teal"
                }`}
              >
                {role.nom.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Statut */}
          <div className="flex bg-[#F7F3E9] p-1 rounded-xl border border-gray-100">
            {[
              { id: "ALL", label: "Tous" },
              { id: "ACTIF", label: "Actif" },
              { id: "BAN", label: "Suspendu" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(s.id)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                  filterStatus === s.id
                    ? "bg-smart-salmon text-white shadow-sm"
                    : "text-gray-400 hover:text-smart-salmon"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {hasFilter && (
          <button
            onClick={() => {
              setSearch("");
              setFilterRole("ALL");
              setFilterStatus("ALL");
              setSelectedGouvernorat("");
              setSelectedSalleId("");
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
