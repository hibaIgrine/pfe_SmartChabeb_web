import { useEffect, useMemo, useState, type ReactNode } from "react";
import api from "../../../api/axios";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Loader2,
  TrendingUp,
  Wallet,
} from "lucide-react";

type CentreRevenueRow = {
  id: string;
  nom: string;
  gouvernorat?: string | null;
  totalAmount: number;
  paymentCount: number;
  reservationCount: number;
};

type RevenueOverview = {
  scope: "global" | "month";
  month: string | null;
  label: string;
  totalAmount: number;
  totalPayments: number;
  centres: CentreRevenueRow[];
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

export default function ReservationRevenuePage() {
  const [scope, setScope] = useState<"global" | "month">("global");
  const [month, setMonth] = useState(currentMonthValue());
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [overview, setOverview] = useState<RevenueOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/payments/admin/centre-revenues", {
          params: {
            scope,
            month: scope === "month" ? month : undefined,
          },
        });
        setOverview(response.data);
      } catch {
        setError(
          "Impossible de charger les revenus des centres. Réessayez plus tard.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadOverview();
  }, [scope, month]);

  const formattedPeriod = useMemo(() => {
    if (scope === "global") return "Vue globale";
    if (!month) return "Vue mensuelle";

    const [year, monthNumber] = month.split("-");
    const label = new Date(
      Number(year),
      Number(monthNumber) - 1,
      1,
    ).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [scope, month]);

  const rankedCentres = useMemo(() => {
    const centres = overview?.centres ?? [];
    const totalAmount = overview?.totalAmount ?? 0;

    return [...centres]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((centre) => ({
        ...centre,
        share: totalAmount > 0 ? (centre.totalAmount / totalAmount) * 100 : 0,
      }));
  }, [overview]);

  const availableGovernorates = useMemo(() => {
    return Array.from(
      new Set(
        (overview?.centres ?? [])
          .map((centre) => centre.gouvernorat?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => a.localeCompare(b, "fr"));
  }, [overview]);

  const filteredCentres = useMemo(() => {
    if (!selectedGovernorate) {
      return rankedCentres;
    }

    return rankedCentres.filter(
      (centre) => centre.gouvernorat === selectedGovernorate,
    );
  }, [rankedCentres, selectedGovernorate]);

  const topCentre = filteredCentres[0];
  const filteredTotalAmount = filteredCentres.reduce(
    (sum, centre) => sum + centre.totalAmount,
    0,
  );
  const filteredTotalPayments = filteredCentres.reduce(
    (sum, centre) => sum + centre.paymentCount,
    0,
  );
  const activeCentres = filteredCentres.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-smart-teal text-white p-2 rounded-2xl shadow-sm">
              <Wallet size={18} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
              Suivi financier des réservations
            </p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-smart-teal leading-none">
            Revenus des centres
          </h1>
          <p className="text-gray-500 mt-3 max-w-2xl">
            Consultation du montant total payé pour les réservations, centre par
            centre, avec un mode global ou mensuel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setScope("global")}
            className={`px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.18em] transition-all ${scope === "global" ? "bg-smart-teal text-white shadow-lg" : "bg-white text-gray-500 border border-gray-100 hover:border-smart-teal/30"}`}
          >
            Global
          </button>
          <button
            type="button"
            onClick={() => setScope("month")}
            className={`px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.18em] transition-all ${scope === "month" ? "bg-smart-teal text-white shadow-lg" : "bg-white text-gray-500 border border-gray-100 hover:border-smart-teal/30"}`}
          >
            Par mois
          </button>
          <label className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
            <CalendarDays size={16} className="text-smart-teal" />
            <input
              type="month"
              value={month}
              onChange={(event) => {
                setMonth(event.target.value);
                setScope("month");
              }}
              className="bg-transparent text-sm font-semibold text-gray-700 outline-none"
              disabled={scope !== "month"}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className="px-4 py-2 rounded-full bg-smart-bg text-smart-teal text-[10px] font-black uppercase tracking-[0.2em]">
          {formattedPeriod}
        </span>
        {selectedGovernorate ? (
          <span className="px-4 py-2 rounded-full bg-white border border-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]">
            Gouvernorat: {selectedGovernorate}
          </span>
        ) : null}
        {overview?.generatedAt ? (
          <span className="px-4 py-2 rounded-full bg-white border border-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
            Mise à jour {new Date(overview.generatedAt).toLocaleString("fr-FR")}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="bg-white border border-red-100 text-red-600 rounded-[28px] p-5 shadow-sm">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white rounded-[36px] border border-gray-100 p-10 flex justify-center">
          <Loader2 className="animate-spin text-smart-teal" size={44} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <MetricCard
              icon={<Wallet size={22} />}
              label="Montant total payé"
              value={`${moneyFormatter.format(filteredTotalAmount)} DT`}
              note={
                selectedGovernorate
                  ? `Réservations réglées dans ${selectedGovernorate}`
                  : scope === "global"
                    ? "Toutes les réservations réglées"
                    : "Réservations réglées sur le mois choisi"
              }
            />
            <MetricCard
              icon={<TrendingUp size={22} />}
              label="Paiements confirmés"
              value={String(filteredTotalPayments)}
              note={
                selectedGovernorate
                  ? `Paiements des centres de ${selectedGovernorate}`
                  : "Uniquement les paiements au statut PAID"
              }
            />
            <MetricCard
              icon={<Building2 size={22} />}
              label="Centres consultés"
              value={String(activeCentres)}
              note={
                topCentre
                  ? `Centre leader: ${topCentre.nom}`
                  : selectedGovernorate
                    ? "Aucun centre pour ce gouvernorat"
                    : "Aucune donnée"
              }
            />
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-5 md:p-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                Filtrer par gouvernorat
              </p>
              <p className="text-sm text-gray-500 max-w-2xl">
                Choisis un gouvernorat pour afficher uniquement les centres qui
                y appartiennent.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <label className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm min-w-[260px]">
                <Building2 size={16} className="text-smart-teal" />
                <select
                  value={selectedGovernorate}
                  onChange={(event) =>
                    setSelectedGovernorate(event.target.value)
                  }
                  className="w-full bg-transparent text-sm font-semibold text-gray-700 outline-none"
                >
                  <option value="">Tous les gouvernorats</option>
                  {availableGovernorates.map((governorate) => (
                    <option key={governorate} value={governorate}>
                      {governorate}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setSelectedGovernorate("")}
                disabled={!selectedGovernorate}
                className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.18em] transition-all ${selectedGovernorate ? "bg-smart-salmon text-white shadow-lg hover:opacity-90" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[36px] border border-gray-100 shadow-sm p-5 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black italic tracking-tight text-smart-teal">
                  Répartition par centre
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedGovernorate
                    ? `Centres du gouvernorat ${selectedGovernorate}, classés par montant décroissant.`
                    : "Somme des paiements effectués pour chaque centre, classée par montant décroissant."}
                </p>
              </div>
              {topCentre ? (
                <div className="bg-smart-bg text-smart-teal px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2">
                  <ArrowUpRight size={14} />
                  {topCentre.nom} en tête avec{" "}
                  {moneyFormatter.format(topCentre.totalAmount)} DT
                </div>
              ) : null}
            </div>

            <div className="overflow-x-auto pb-1">
              <table className="w-full min-w-[840px] text-left border-collapse">
                <thead>
                  <tr className="text-gray-300 text-[10px] uppercase tracking-[0.28em] font-black border-b border-gray-100">
                    <th className="pb-4 pl-2">Centre</th>
                    <th className="pb-4">Gouvernorat</th>
                    <th className="pb-4 text-center">Paiements</th>
                    <th className="pb-4 text-right">Montant</th>
                    <th className="pb-4 text-right pr-2">Part</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCentres.length > 0 ? (
                    filteredCentres.map((centre) => (
                      <tr
                        key={centre.id}
                        className="border-b border-gray-50 last:border-none"
                      >
                        <td className="py-5 pl-2 pr-4">
                          <div className="font-bold text-gray-900">
                            {centre.nom}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {centre.reservationCount} réservation(s) payée(s)
                          </div>
                        </td>
                        <td className="py-5 text-sm text-gray-500">
                          {centre.gouvernorat || "-"}
                        </td>
                        <td className="py-5 text-center font-semibold text-gray-700">
                          {centre.paymentCount}
                        </td>
                        <td className="py-5 text-right font-black text-smart-teal">
                          {moneyFormatter.format(centre.totalAmount)} DT
                        </td>
                        <td className="py-5 pr-2 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-28 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-smart-salmon"
                                style={{
                                  width: `${Math.max(4, Math.min(100, centre.share))}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-black text-gray-500 w-14 text-right">
                              {centre.share.toFixed(1)}%
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
                        {selectedGovernorate
                          ? "Aucun centre trouvé pour ce gouvernorat."
                          : "Aucune réservation payée pour cette période."}
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
