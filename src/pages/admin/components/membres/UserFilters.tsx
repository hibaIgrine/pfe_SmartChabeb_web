import { Search, X } from "lucide-react";
import { useMemo } from "react"; // 🏆 Importe useMemo pour la performance

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
  selectedClubId: string;
  setSelectedClubId: (id: string) => void;
  selectedAgeRange: string;
  setSelectedAgeRange: (id: string) => void;
  gouvernorats: string[];
  salles: any[];
  clubs: any[];
  availableRoles: any[];
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
  selectedClubId,
  setSelectedClubId,
  selectedAgeRange,
  setSelectedAgeRange,
  gouvernorats,
  salles,
  clubs,
  availableRoles,
}: UserFiltersProps) => {
  // 1. Filtrage des salles selon le gouvernorat
  const filteredSalles = salles.filter(
    (s: any) => !selectedGouvernorat || s.gouvernorat === selectedGouvernorat,
  );

  // 🏆 2. AMÉLIORATION SMART : Filtrage des clubs selon la salle choisie
  const filteredClubsOptions = useMemo(() => {
    // Si aucune salle n'est sélectionnée, on affiche tous les clubs
    if (!selectedSalleId) return clubs;
    // Sinon, on n'affiche que les clubs rattachés à cette salle précise
    return clubs.filter((c: any) => c.id_salle === selectedSalleId);
  }, [clubs, selectedSalleId]);

  const AGE_RANGES = [
    { id: "CHILD", label: "Enfants (< 12)" },
    { id: "TEEN", label: "Ados (12 - 18)" },
    { id: "YOUNG", label: "Jeunes (18 - 30)" },
    { id: "ADULT", label: "Adultes (30+)" },
  ];

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 space-y-5 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Recherche */}
        <div className="relative group lg:col-span-2 xl:col-span-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
            size={17}
          />
          <input
            type="text"
            placeholder="Nom, email..."
            className="w-full pl-11 py-3.5 bg-[#F7F3E9] rounded-2xl outline-none font-bold text-xs text-smart-teal transition-all focus:ring-2 focus:ring-smart-teal/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Gouvernorat */}
        <select
          className="px-4 py-3 rounded-2xl font-bold text-[11px] text-smart-teal bg-[#F7F3E9] outline-none cursor-pointer border-none"
          value={selectedGouvernorat}
          onChange={(e) => {
            setSelectedGouvernorat(e.target.value);
            setSelectedSalleId(""); // Reset salle si gouv change
            setSelectedClubId(""); // Reset club si gouv change
          }}
        >
          <option value="">🗺️ Gouvernorats</option>
          {gouvernorats.map((gov) => (
            <option key={gov} value={gov}>
              {gov}
            </option>
          ))}
        </select>

        {/* Centre */}
        <select
          className="px-4 py-3 rounded-2xl font-bold text-[11px] text-smart-teal bg-[#F7F3E9] outline-none cursor-pointer border-none"
          value={selectedSalleId}
          onChange={(e) => {
            setSelectedSalleId(e.target.value);
            setSelectedClubId(""); // 🏆 Reset le club quand on change de centre
          }}
        >
          <option value="">🏛️ Tous les centres</option>
          {filteredSalles.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>

        {/* 🎭 FILTRE CLUB (Désormais filtré par la salle choisie) */}
        <select
          className={`px-4 py-3 rounded-2xl font-bold text-[11px] text-smart-teal bg-[#F7F3E9] outline-none transition-all ${filteredClubsOptions.length === 0 ? "opacity-30" : "cursor-pointer"}`}
          value={selectedClubId}
          onChange={(e) => setSelectedClubId(e.target.value)}
        >
          <option value="">
            🎭 {selectedSalleId ? "Clubs de ce centre" : "Tous les clubs"}
          </option>
          {filteredClubsOptions.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>

        {/* 🎂 FILTRE AGE */}
        <select
          className="px-4 py-3 rounded-2xl font-bold text-[11px] text-smart-teal bg-[#F7F3E9] outline-none cursor-pointer border-none"
          value={selectedAgeRange}
          onChange={(e) => setSelectedAgeRange(e.target.value)}
        >
          <option value="">🎂 Tranches d'âge</option>
          {AGE_RANGES.map((range) => (
            <option key={range.id} value={range.id}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      <div className="h-px bg-gray-50 w-full" />

      {/* Rôles et Statuts */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-[#F7F3E9] p-1 rounded-xl">
            <button
              onClick={() => setFilterRole("ALL")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${filterRole === "ALL" ? "bg-smart-teal text-white shadow-sm" : "text-gray-400"}`}
            >
              ALL
            </button>
            {availableRoles.map((role: any) => (
              <button
                key={role.id}
                onClick={() => setFilterRole(role.nom)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black whitespace-nowrap transition-all ${filterRole === role.nom ? "bg-smart-teal text-white shadow-sm" : "text-gray-400"}`}
              >
                {role.nom}
              </button>
            ))}
          </div>
          <div className="flex bg-[#F7F3E9] p-1 rounded-xl">
            {[
              { id: "ALL", l: "Tous" },
              { id: "ACTIF", l: "Actif" },
              { id: "BAN", l: "Suspendu" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(s.id)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${filterStatus === s.id ? "bg-smart-salmon text-white shadow-sm" : "text-gray-400"}`}
              >
                {s.l}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setSearch("");
            setFilterRole("ALL");
            setFilterStatus("ALL");
            setSelectedGouvernorat("");
            setSelectedSalleId("");
            setSelectedClubId("");
            setSelectedAgeRange("");
          }}
          className="text-[10px] font-black text-smart-salmon uppercase tracking-widest px-4 hover:underline flex items-center gap-1 transition-all"
        >
          <X size={12} /> Réinitialiser
        </button>
      </div>
    </div>
  );
};
