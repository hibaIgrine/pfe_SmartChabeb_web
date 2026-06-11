import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../api/axios";
import EventsDashboardStats from "./components/EventsDashboardStats";
import { ROUTES } from "../../constants/routes";
import type { ClubLite, EventDashboardStats, EventItem, LocalLite } from "./types";

export default function AdminEventsStatsPage() {
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [clubs, setClubs] = useState<ClubLite[]>([]);
  const [locaux, setLocaux] = useState<LocalLite[]>([]);
  const [centres, setCentres] = useState<{ id: string; nom: string; gouvernorat: string }[]>([]);
  const [dashboardStats, setDashboardStats] = useState<EventDashboardStats | null>(null);

  const [filterGouvernorat, setFilterGouvernorat] = useState("");
  const [filterCentreId, setFilterCentreId] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [eventsRes, clubsRes, locauxRes, centresRes] = await Promise.all([
          api.get("/events?includeInactive=true", { headers }),
          api.get("/clubs", { headers }),
          api.get("/locaux", { headers }),
          api.get("/centres", { headers }),
        ]);
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
        setClubs(Array.isArray(clubsRes.data) ? clubsRes.data : []);
        setLocaux(Array.isArray(locauxRes.data) ? locauxRes.data : []);
        setCentres(
          (Array.isArray(centresRes.data) ? centresRes.data : []).map((c: any) => ({
            id: c.id,
            nom: c.nom,
            gouvernorat: c.gouvernorat ?? "",
          })),
        );
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const fetchFilteredStats = useCallback(
    async (centreId: string, gouvernorat: string) => {
      setIsStatsLoading(true);
      try {
        const params = new URLSearchParams({ includeInactive: "true" });
        if (centreId) params.set("centreId", centreId);
        else if (gouvernorat) params.set("gouvernorat", gouvernorat);
        const res = await api.get(`/events/stats/dashboard?${params.toString()}`, { headers });
        setDashboardStats(res.data ?? null);
      } catch {
        // silent
      } finally {
        setIsStatsLoading(false);
      }
    },
    [headers],
  );

  useEffect(() => {
    void fetchFilteredStats(filterCentreId, filterGouvernorat);
  }, [filterCentreId, filterGouvernorat, fetchFilteredStats]);

  const gouvernorats = useMemo(
    () => Array.from(new Set(centres.map((c) => c.gouvernorat).filter(Boolean))).sort(),
    [centres],
  );

  const filteredCentres = useMemo(
    () => centres.filter((c) => !filterGouvernorat || c.gouvernorat === filterGouvernorat),
    [centres, filterGouvernorat],
  );

  const activeCentreIds = useMemo<Set<string> | null>(() => {
    if (filterCentreId) return new Set([filterCentreId]);
    if (filterGouvernorat) {
      const ids = new Set(
        centres.filter((c) => c.gouvernorat === filterGouvernorat).map((c) => c.id),
      );
      return ids.size > 0 ? ids : null;
    }
    return null;
  }, [filterCentreId, filterGouvernorat, centres]);

  const scopedEvents = useMemo(() => {
    if (!activeCentreIds) return events;
    const localIds = new Set(
      locaux
        .filter((l) => {
          const cid = l.id_centre || l.centre?.id;
          return cid && activeCentreIds.has(cid);
        })
        .map((l) => l.id),
    );
    const clubIds = new Set(
      clubs
        .filter((c) => c.id_centre && activeCentreIds.has(c.id_centre))
        .map((c) => c.id),
    );
    return events.filter((e) => {
      if (e.locaux_id && localIds.has(e.locaux_id)) return true;
      const related = [e.club_id, ...(e.collaborating_club_ids || [])].filter(
        Boolean,
      ) as string[];
      return related.some((id) => clubIds.has(id));
    });
  }, [events, activeCentreIds, locaux, clubs]);

  const activeCentreLabel = filterCentreId
    ? (centres.find((c) => c.id === filterCentreId)?.nom ?? "")
    : filterGouvernorat || "Tous les centres";

  const isFilterActive = Boolean(filterGouvernorat || filterCentreId);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={ROUTES.admin.eventsManagement}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-[#F7F3E9] text-smart-teal hover:bg-smart-teal hover:text-white transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">
              Statistiques
            </p>
            <h1 className="text-3xl font-black text-smart-teal tracking-tight">
              Événements · {activeCentreLabel}
            </h1>
          </div>
        </div>
        {isFilterActive && (
          <button
            type="button"
            onClick={() => { setFilterGouvernorat(""); setFilterCentreId(""); }}
            className="px-4 py-2 rounded-xl bg-gray-100 text-xs font-black text-gray-500 hover:bg-gray-200 transition"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 rounded-[28px] border border-gray-100 bg-white shadow-sm p-4">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 shrink-0">
          Filtrer par
        </span>
        <select
          value={filterGouvernorat}
          onChange={(e) => { setFilterGouvernorat(e.target.value); setFilterCentreId(""); }}
          className="rounded-xl border border-gray-200 bg-[#F7F3E9] px-3 py-2 text-xs font-bold text-smart-teal outline-none focus:ring-2 focus:ring-smart-teal/20 cursor-pointer"
        >
          <option value="">Tous les gouvernorats</option>
          {gouvernorats.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={filterCentreId}
          onChange={(e) => setFilterCentreId(e.target.value)}
          className="rounded-xl border border-gray-200 bg-[#F7F3E9] px-3 py-2 text-xs font-bold text-smart-teal outline-none focus:ring-2 focus:ring-smart-teal/20 cursor-pointer"
        >
          <option value="">Tous les centres</option>
          {filteredCentres.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        {isFilterActive && (
          <span className="ml-auto text-[10px] font-black uppercase tracking-[0.15em] text-smart-teal">
            {scopedEvents.length} événement{scopedEvents.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Stats */}
      <EventsDashboardStats stats={dashboardStats} isLoading={isLoading || isStatsLoading} />
    </div>
  );
}
