import { useEffect, useState } from "react";
import { XCircle, CreditCard } from "lucide-react";
import api from "../../api/axios";

type ReservationItem = {
  id: string;
  statut: string;
  objet: string;
  date_reservation: string;
  heure_debut: string;
  heure_fin: string;
  prix_total?: number;
  local?: { nom?: string; centre?: { nom?: string } };
};

function statusClass(status: string): string {
  if (status === "VALIDEE") return "bg-emerald-100 text-emerald-700";
  if (status === "REFUSEE") return "bg-rose-100 text-rose-700";
  if (status === "ANNULEE") return "bg-slate-100 text-slate-600";
  return "bg-amber-100 text-amber-700";
}

export default function ClubMyReservationsPage() {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadReservations = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/reservations");
      setReservations(res.data || []);
    } catch {
      setFeedback({
        type: "error",
        message: "Impossible de charger vos reservations.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await api.patch(`/reservations/${id}/status`, { statut: "ANNULEE" });
      setFeedback({ type: "success", message: "Reservation annulee." });
      await loadReservations();
    } catch {
      setFeedback({ type: "error", message: "Annulation impossible." });
    }
  };

  const handlePay = async (reservationId: string) => {
    try {
      const res = await api.post('/payments/pay-reservation', { 
        reservationId,
        returnUrl: window.location.origin + '/reservations/my-reservations'
      });
      
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch {
      setFeedback({ type: "error", message: "Impossible de procéder au paiement." });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-[#436D75] tracking-tight">
          Mes Reservations
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Suivez le statut de vos demandes et annulez si necessaire.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl px-5 py-4 text-sm font-bold ${
            feedback.type === "success"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="bg-white rounded-[30px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#436D75]">Liste</h2>
          <span className="text-xs text-gray-400 font-bold">
            {reservations.length} elements
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/70">
              <tr className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                <th className="px-6 py-3">Local</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Horaire</th>
                <th className="px-6 py-3">Objet</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Montant</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-5 text-sm text-gray-400" colSpan={7}>
                    Chargement...
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td className="px-6 py-5 text-sm text-gray-400" colSpan={7}>
                    Aucune reservation pour le moment.
                  </td>
                </tr>
              ) : (
                reservations.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F7F3E9]/40 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-[#436D75]">
                      {item.local?.nom || "Local"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(item.date_reservation).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(item.heure_debut).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" - "}
                      {new Date(item.heure_fin).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.objet}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${statusClass(item.statut)}`}
                      >
                        {item.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[#436D75]">
                      {item.prix_total ? `${item.prix_total} TND` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {item.statut === "VALIDEE" && (
                        <button
                          onClick={() => handlePay(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-xs font-black text-green-600 hover:bg-green-100 mr-2"
                        >
                          <CreditCard size={14} /> Payer
                        </button>
                      )}
                      {(item.statut === "EN_ATTENTE" ||
                        item.statut === "VALIDEE") && (
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-100"
                        >
                          <XCircle size={14} /> Annuler
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
