/**
 * UserFilters.tsx — Barre de filtres pour la liste des utilisateurs (admin).
 *
 * FILTRES :
 *   search        — Recherche par nom/email
 *   filterRole    — Filtre par rôle (ADMIN/RESPONSABLE_CENTRE/RESPONSABLE_CLUB/ADHERENT)
 *   filterCentre  — Filtre par centre rattaché
 *   filterGouv    — Filtre par gouvernorat
 *   ageMin/ageMax — Filtres par tranche d'âge
 *   filterBanned  — Filtre les utilisateurs bannis uniquement
 *
 * COMPORTEMENT :
 *   Bouton X remet tous les filtres à zéro (clearAll).
 */
import { Search, X } from "lucide-react";
import { useMemo } from "react";

interface UserFiltersProps {
  search: string;
  setSearch: (s: string) => void;
  filterRole: string;
  setFilterRole: (r: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  selectedGouvernorat: string;
  setSelectedGouvernorat: (g: string) => void;
  selectedCentreId: string;
  setSelectedCentreId: (id: string) => void;
  selectedClubId: string;
  setSelectedClubId: (id: string) => void;
  selectedAgeRange: string;
  setSelectedAgeRange: (id: string) => void;
  gouvernorats: string[];
  centres: any[];
  clubs: any[];
  availableRoles: any[];
  showLocationFilters?: boolean;
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
  selectedCentreId,
  setSelectedCentreId,
  selectedClubId,
  setSelectedClubId,
  selectedAgeRange,
  setSelectedAgeRange,
  gouvernorats,
  centres,
  clubs,
  availableRoles,
  showLocationFilters = true,
}: UserFiltersProps) => {
  // 1. Filtrage en cascade : Centres selon la Région
  const filteredCentres = useMemo(() => {
    return centres.filter(
      (c: any) => !selectedGouvernorat || c.gouvernorat === selectedGouvernorat,
    );
  }, [centres, selectedGouvernorat]);

  // 2. Filtrage en cascade : Clubs selon le Centre choisi
  const filteredClubsOptions = useMemo(() => {
    if (!selectedCentreId) return clubs;
    return clubs.filter((c: any) => c.id_centre === selectedCentreId);
  }, [clubs, selectedCentreId]);

  const AGE_RANGES = [
    { id: "CHILD", label: "Enfants (< 12)" },
    { id: "TEEN", label: "Ados (12 - 18)" },
    { id: "YOUNG", label: "Jeunes (18 - 30)" },
    { id: "ADULT", label: "Adultes (30+)" },
  ];

  const STATUS_OPTIONS = [
    { id: "ALL", label: "TOUS", color: "bg-smart-teal" },
    { id: "ACTIVE", label: "ACTIFS", color: "bg-smart-teal" },
    { id: "INACTIVE", label: "INACTIFS", color: "bg-smart-salmon" },
  ];

  return (
    <div className="bg-white rounded-[35px] border border-gray-100 shadow-sm p-7 space-y-6 animate-in fade-in duration-700">
      {/* --- LIGNE 1 : RECHERCHE ET CASCADES --- */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${showLocationFilters ? "xl:grid-cols-5" : "xl:grid-cols-3"}`}
      >
        {/* Recherche textuelle */}
        <div className="relative group lg:col-span-2 xl:col-span-1">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-smart-teal transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Nom, email..."
            className="w-full pl-12 pr-6 py-4 bg-smart-bg rounded-2xl outline-none font-bold text-xs text-smart-teal transition-all focus:ring-4 focus:ring-smart-teal/5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {showLocationFilters && (
          <>
            {/* Gouvernorats (Arabe RTL) */}
            <select
              dir="rtl"
              className="px-5 py-4 rounded-2xl font-black text-[11px] text-smart-teal bg-smart-bg outline-none cursor-pointer border-none appearance-none hover:bg-gray-100 transition-colors"
              value={selectedGouvernorat}
              onChange={(e) => {
                setSelectedGouvernorat(e.target.value);
                setSelectedCentreId("");
                setSelectedClubId("");
              }}
            >
              <option value="">🗺️ Toutes les régions</option>
              {gouvernorats.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>

            {/* Centres */}
            <select
              className={`px-5 py-4 rounded-2xl font-black text-[11px] text-smart-teal bg-smart-bg outline-none border-none appearance-none transition-all ${!selectedGouvernorat ? "opacity-40 grayscale cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"}`}
              value={selectedCentreId}
              disabled={!selectedGouvernorat}
              onChange={(e) => {
                setSelectedCentreId(e.target.value);
                setSelectedClubId("");
              }}
            >
              <option value="">🏛️ Tous les centres</option>
              {filteredCentres.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </>
        )}

        {/* Clubs */}
        <select
          className={`px-5 py-4 rounded-2xl font-black text-[11px] text-smart-teal bg-smart-bg outline-none border-none appearance-none transition-all ${filteredClubsOptions.length === 0 ? "opacity-30" : "cursor-pointer hover:bg-gray-100"}`}
          value={selectedClubId}
          onChange={(e) => setSelectedClubId(e.target.value)}
        >
          <option value="">
            🎭{" "}
            {selectedCentreId ? "Activités du centre" : "Toutes les activités"}
          </option>
          {filteredClubsOptions.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>

        {/* Age */}
        <select
          className="px-5 py-4 rounded-2xl font-black text-[11px] text-smart-teal bg-smart-bg outline-none cursor-pointer border-none appearance-none hover:bg-gray-100"
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

      {/* --- LIGNE 2 : RÔLES ET STATUTS (Pills) --- */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap gap-4">
          {/* Groupe : Grades Habilitation */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest ml-2">
              Grades
            </span>
            <div className="flex bg-smart-bg p-1 rounded-2xl shadow-inner border border-white">
              <button
                onClick={() => setFilterRole("ALL")}
                className={`px-5 py-2 rounded-xl text-[9px] font-black transition-all ${filterRole === "ALL" ? "bg-smart-teal text-white shadow-md scale-105" : "text-gray-400 hover:text-smart-teal"}`}
              >
                TOUS
              </button>
              {availableRoles.map((role: any) => (
                <button
                  key={role.id}
                  onClick={() => setFilterRole(role.nom)}
                  className={`px-5 py-2 rounded-xl text-[9px] font-black whitespace-nowrap transition-all ${filterRole === role.nom ? "bg-smart-teal text-white shadow-md scale-105" : "text-gray-400 hover:text-smart-teal"}`}
                >
                  {role.nom}
                </button>
              ))}
            </div>
          </div>

          {/* Groupe : État du compte & Affectation */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest ml-2">
              Statut
            </span>
            <div className="flex bg-smart-bg p-1 rounded-2xl shadow-inner border border-white">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setFilterStatus(s.id)}
                  className={`px-5 py-2 rounded-xl text-[9px] font-black transition-all ${filterStatus === s.id ? `${s.color} text-white shadow-md scale-105` : "text-gray-400 hover:text-smart-teal"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Réinitialisation */}
        <button
          onClick={() => {
            setSearch("");
            setFilterRole("ALL");
            setFilterStatus("ALL");
            setSelectedGouvernorat("");
            setSelectedCentreId("");
            setSelectedClubId("");
            setSelectedAgeRange("");
          }}
          className="text-[10px] font-black text-smart-salmon uppercase tracking-[0.2em] px-6 py-2 hover:bg-red-50 rounded-full flex items-center gap-2 transition-all active:scale-90"
        >
          <X size={14} strokeWidth={3} /> Réinitialiser
        </button>
      </div>
    </div>
  );
};
