import { useEffect, useMemo, useState, type ReactNode } from "react";
import api from "../../api/axios";
import {
  ArrowUpRight,
  CalendarDays,
  DoorOpen,
  Loader2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ROUTES } from "../../constants/routes";

type LocalRevenueRow = {
  id: string;
  nom: string;
  totalAmount: number;
  paymentCount: number;
  reservationCount: number;
};

type CentreRevenueOverview = {
  scope: "global" | "month";
  month: string | null;
  label: string;
  totalAmount: number;
  totalPayments: number;
  centre: { id: string; nom: string; gouvernorat: string | null } | null;
  locaux: LocalRevenueRow[];
  generatedAt: string;
};

const moneyFormatter = new Intl.NumberFormat("fr-TN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function CentreReservationRevenuePage() {
  const [scope, setScope] = useState<"global" | "month">("global");
  const [month, setMonth] = useState(currentMonthValue());
  const [overview, setOverview] = useState<CentreRevenueOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/payments/centre/revenues", {
          params: {
            scope,
            month: scope === "month" ? month : undefined,
          },
        });
        setOverview(response.data);
      } catch {
        setError("Impossible de charger les revenus. Réessayez plus tard.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [scope, month]);

  const formattedPeriod = useMemo(() => {
    if (scope === "global") return "Vue globale";
    if (!month) return "Vue mensuelle";
    const [year, monthNumber] = month.split("-");
    const label = new Date(
      Number(year),
      Number(monthNumber) - 1,
      1,
    ).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [scope, month]);

  const rankedLocaux = useMemo(() => {
    const locaux = overview?.locaux ?? [];
    const total = overview?.totalAmount ?? 0;
    return [...locaux]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((l) => ({
        ...l,
        share: total > 0 ? (l.totalAmount / total) * 100 : 0,
      }));
  }, [overview]);

  const topLocal = rankedLocaux[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-smart-teal text-white p-2 rounded-2xl shadow-sm">
              <Wallet size={18} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
              Suivi financier — Réservations de mon centre
            </p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-smart-teal leading-none">
            Revenus du centre
          </h1>
          {overview?.centre && (
            <p className="text-gray-500 mt-2 text-sm font-semibold">
              {overview.centre.nom}
              {overview.centre.gouvernorat
                ? ` · ${overview.centre.gouvernorat}`
                : ""}
            </p>
          )}
          <p className="text-gray-400 mt-2 max-w-xl text-sm">
            Montant total payé pour les réservations de vos salles, avec un
            mode global ou mensuel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setScope("global")}
            className={`px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
              scope === "global"
                ? "bg-smart-teal text-white shadow-lg"
                : "bg-white text-gray-500 border border-gray-100 hover:border-smart-teal/30"
            }`}
          >
            Global
          </button>
          <button
            type="button"
            onClick={() => setScope("month")}
            className={`px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
              scope === "month"
                ? "bg-smart-teal text-white shadow-lg"
                : "bg-white text-gray-500 border border-gray-100 hover:border-smart-teal/30"
            }`}
          >
            Par mois
          </button>
          <label className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
            <CalendarDays size={16} className="text-smart-teal" />
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setScope("month");
              }}
              className="bg-transparent text-sm font-semibold text-gray-700 outline-none"
              disabled={scope !== "month"}
            />
          </label>
        </div>
      </div>

      {/* Badges période */}
      <div className="flex flex-wrap gap-3">
        <span className="px-4 py-2 rounded-full bg-smart-bg text-smart-teal text-[10px] font-black uppercase tracking-[0.2em]">
          {formattedPeriod}
        </span>
        {overview?.generatedAt && (
          <span className="px-4 py-2 rounded-full bg-white border border-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
            Mise à jour {new Date(overview.generatedAt).toLocaleString("fr-FR")}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-white border border-red-100 text-red-600 rounded-[28px] p-5 shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-[36px] border border-gray-100 p-10 flex justify-center">
          <Loader2 className="animate-spin text-smart-teal" size={44} />
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <MetricCard
              icon={<Wallet size={22} />}
              label="Montant total payé"
              value={`${moneyFormatter.format(overview?.totalAmount ?? 0)} DT`}
              note={
                scope === "global"
                  ? "Toutes les réservations réglées"
                  : "Réservations réglées sur le mois choisi"
              }
            />
            <MetricCard
              icon={<TrendingUp size={22} />}
              label="Paiements confirmés"
              value={String(overview?.totalPayments ?? 0)}
              note="Uniquement les paiements au statut PAID"
            />
            <MetricCard
              icon={<DoorOpen size={22} />}
              label="Salles actives"
              value={String(rankedLocaux.length)}
              note={
                topLocal
                  ? `Salle leader : ${topLocal.nom}`
                  : "Aucune donnée sur cette période"
              }
            />
          </div>

          {/* Table par salle */}
          <div className="bg-white rounded-[36px] border border-gray-100 shadow-sm p-5 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black italic tracking-tight text-smart-teal">
                  Répartition par salle
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Revenus générés par chaque salle, classés par montant
                  décroissant.
                </p>
              </div>
              {topLocal && (
                <div className="bg-smart-bg text-smart-teal px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2">
                  <ArrowUpRight size={14} />
                  {topLocal.nom} en tête avec{" "}
                  {moneyFormatter.format(topLocal.totalAmount)} DT
                </div>
              )}
            </div>

            <div className="overflow-x-auto pb-1">
              <table className="w-full min-w-[640px] text-left border-collapse">
                <thead>
                  <tr className="text-gray-300 text-[10px] uppercase tracking-[0.28em] font-black border-b border-gray-100">
                    <th className="pb-4 pl-2">Salle</th>
                    <th className="pb-4 text-center">Réservations payées</th>
                    <th className="pb-4 text-center">Paiements</th>
                    <th className="pb-4 text-right">Montant</th>
                    <th className="pb-4 text-right pr-2">Part</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedLocaux.length > 0 ? (
                    rankedLocaux.map((local) => (
                      <tr
                        key={local.id}
                        className="border-b border-gray-50 last:border-none"
                      >
                        <td className="py-5 pl-2 pr-4">
                          <div className="font-bold text-gray-900">
                            {local.nom}
                          </div>
                        </td>
                        <td className="py-5 text-center text-sm text-gray-500">
                          {local.reservationCount}
                        </td>
                        <td className="py-5 text-center font-semibold text-gray-700">
                          {local.paymentCount}
                        </td>
                        <td className="py-5 text-right font-black text-smart-teal">
                          {moneyFormatter.format(local.totalAmount)} DT
                        </td>
                        <td className="py-5 pr-2 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-28 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-smart-salmon"
                                style={{
                                  width: `${Math.max(4, Math.min(100, local.share))}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-black text-gray-500 w-14 text-right">
                              {local.share.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-10 text-center text-gray-400"
                      >
                        Aucune réservation payée pour cette période.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 flex items-start gap-4">
      <div className="bg-smart-bg text-smart-teal p-3 rounded-2xl">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          {label}
        </p>
        <p className="text-3xl font-black italic tracking-tighter text-smart-teal mt-2 break-words">
          {value}
        </p>
        <p className="text-xs text-gray-400 mt-2 leading-5">{note}</p>
      </div>
    </div>
  );
}
