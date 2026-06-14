/**
 * CentreEventsStatsPage.tsx — Statistiques des événements (vue responsable de centre).
 *
 * RÔLE :
 *   Version centre des statistiques d'événements, filtrée sur le périmètre du centre.
 *   Accessible via /centre/events-stats.
 *
 * Identique à AdminEventsStatsPage mais avec les données du centre courant uniquement.
 * Utilise EventsDashboardStats en passant centreId en filtre.
 *
 * ACCÈS : RESPONSABLE_CENTRE uniquement
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../api/axios";
import EventsDashboardStats from "./components/EventsDashboardStats";
import { ROUTES } from "../../constants/routes";
import type { EventDashboardStats } from "./types";

export default function CentreEventsStatsPage() {
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [centreId, setCentreId] = useState<string>("");
  const [centreNom, setCentreNom] = useState<string>("");
  const [dashboardStats, setDashboardStats] = useState<EventDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(
    async (cid: string) => {
      if (!cid) return;
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ includeInactive: "true", centreId: cid });
        const res = await api.get(`/events/stats/dashboard?${params.toString()}`, { headers });
        setDashboardStats(res.data ?? null);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    },
    [headers],
  );

  useEffect(() => {
    const loadCentre = async () => {
      try {
        const res = await api.get("/users/me/profile", { headers });
        const id = res.data?.centre?.id ?? res.data?.id_centre ?? "";
        const nom = res.data?.centre?.nom ?? "Mon centre";
        setCentreId(id);
        setCentreNom(nom);
        await fetchStats(id);
      } catch {
        setIsLoading(false);
      }
    };
    void loadCentre();
  }, []);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={ROUTES.centre.eventsManagement}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-[#F7F3E9] text-smart-teal hover:bg-smart-teal hover:text-white transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">
            Statistiques événements
          </p>
          <h1 className="text-3xl font-black text-smart-teal tracking-tight">
            {centreNom || "Mon centre"}
          </h1>
        </div>
      </div>

      {/* Stats */}
      <EventsDashboardStats stats={dashboardStats} isLoading={isLoading} />
    </div>
  );
}
