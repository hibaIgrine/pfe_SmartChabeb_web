/**
 * AdherentMyReservationsPage.tsx — Mes réservations de locaux (vue adhérent).
 *
 * RÔLE :
 *   Historique des demandes de réservation soumises par l'adhérent connecté.
 *   Accessible via /adherent-my-reservations.
 *
 * CONTENU :
 *   - Liste des réservations avec statut : EN_ATTENTE / APPROUVEE / REFUSEE / PAYEE
 *   - Local réservé, date, objet, prix
 *   - Bouton de paiement Stripe si statut APPROUVEE (lien de paiement disponible)
 *   - Option d'annulation si EN_ATTENTE
 *
 * ACCÈS : ADMIN + ADHERENT
 */
import { useEffect, useState } from "react";
import {
  XCircle,
  Calendar,
  Clock,
  MapPin,
  Pencil,
  CalendarDays,
  Clock3,
  CreditCard,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";

type ReservationItem = {
  id: string;
  statut: string;
  objet: string;
  date_reservation: string;
  heure_debut: string;
  heure_fin: string;
  prix_total?: number;
  local?: { nom?: string; centre?: { nom?: string }; prix_heure?: number };
  payments?: Array<{
    id: string;
    status: string;
    amount: number;
    created_at: string;
  }>;
};

function statusClass(status: string): string {
  if (status === "VALIDEE") return "bg-emerald-100 text-emerald-700";
  if (status === "REFUSEE") return "bg-rose-100 text-rose-700";
  if (status === "ANNULEE") return "bg-slate-100 text-slate-600";
  return "bg-amber-100 text-amber-700";
}

function statusLabel(status: string): string {
  if (status === "VALIDEE") return "Validée";
  if (status === "REFUSEE") return "Refusée";
  if (status === "ANNULEE") return "Annulée";
  return "En attente";
}

export default function AdherentMyReservationsPage() {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const [editingReservation, setEditingReservation] =
    useState<ReservationItem | null>(null);
  const [editForm, setEditForm] = useState({
    id_local: "",
    objet: "",
    date_reservation: "",
    heure_debut: "",
    heure_fin: "",
  });
  const [locaux, setLocaux] = useState<any[]>([]);
  const [fieldErrors, setFieldErrors] = useState({
    local: "",
    date_reservation: "",
    heure_debut: "",
    heure_fin: "",
    objet: "",
  });

  const loadReservations = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/reservations");
      setReservations(res.data || []);
    } catch {
      setFeedback({
        type: "error",
        message: "Impossible de charger vos réservations.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocaux = async () => {
    try {
      const res = await api.get("/locaux");
      setLocaux(res.data || []);
    } catch {
      setFeedback({
        type: "error",
        message: "Impossible de charger les locaux.",
      });
    }
  };

  useEffect(() => {
    loadReservations();

    // Vérifier si on revient d'un paiement réussi
    const pendingReservationId = sessionStorage.getItem(
      "pendingPaymentReservation",
    );
    if (pendingReservationId) {
      sessionStorage.removeItem("pendingPaymentReservation");
      setFeedback({
        type: "success",
        message:
          "Paiement effectué avec succès ! Mise à jour des informations...",
      });

      let retryCount = 0;
      const maxRetries = 5;
      const retryDelay = 3000;

      const checkPaymentStatus = async () => {
        try {
          const fresh = await api.get("/reservations");
          const freshData = fresh.data || [];
          setReservations(freshData);
          retryCount++;

          const updated = freshData.find(
            (r: any) => r.id === pendingReservationId,
          );
          const hasPaidPayment = updated?.payments?.some(
            (p: any) => p.status === "PAID",
          );
          const isConfirmed = updated?.statut === "CONFIRME";

          if (hasPaidPayment || isConfirmed || retryCount >= maxRetries) {
            if (hasPaidPayment || isConfirmed) {
              setFeedback({
                type: "success",
                message:
                  "Paiement effectué avec succès ! Votre réservation est maintenant confirmée.",
              });
            } else {
              setFeedback({
                type: "warning",
                message:
                  "Paiement en cours de validation. Cliquez sur 'Actualiser' pour mettre à jour.",
              });
            }
          } else {
            setTimeout(checkPaymentStatus, retryDelay);
          }
        } catch (error) {
          console.error("Erreur lors de la vérification du paiement:", error);
          if (retryCount < maxRetries)
            setTimeout(checkPaymentStatus, retryDelay);
        }
      };

      setTimeout(checkPaymentStatus, 3000);
    }
  }, []);

  const handlePay = async (reservationId: string) => {
    try {
      const res = await api.post("/payments/pay-reservation", {
        reservationId,
        returnUrl: window.location.origin + "/payment-success",
      });

      if (res.data.checkoutUrl) {
        sessionStorage.setItem("pendingPaymentReservation", reservationId);
        window.location.href = res.data.checkoutUrl;
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Impossible de procéder au paiement.",
      });
    }
  };

  const handleRefresh = async () => {
    setFeedback({ type: "success", message: "Actualisation des données..." });
    await loadReservations();
  };

  const handleCancel = async (id: string) => {
    try {
      await api.patch(`/reservations/${id}/status`, { statut: "ANNULEE" });
      setFeedback({ type: "success", message: "Réservation annulée." });
      await loadReservations();
    } catch {
      setFeedback({ type: "error", message: "Annulation impossible." });
    }
  };

  const handleEdit = async (reservation: ReservationItem) => {
    await loadLocaux();
    setEditingReservation(reservation);
    setEditForm({
      id_local: reservation.local?.id || "",
      objet: reservation.objet,
      date_reservation: reservation.date_reservation.split("T")[0],
      heure_debut: reservation.heure_debut.split("T")[1].substring(0, 5),
      heure_fin: reservation.heure_fin.split("T")[1].substring(0, 5),
    });
    setFieldErrors({
      local: "",
      date_reservation: "",
      heure_debut: "",
      heure_fin: "",
      objet: "",
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReservation) return;

    // Réinitialiser les erreurs
    const newErrors = {
      local: "",
      date_reservation: "",
      heure_debut: "",
      heure_fin: "",
      objet: "",
    };
    let hasError = false;

    // Validation du local
    if (!editForm.id_local) {
      newErrors.local = "Veuillez sélectionner un local.";
      hasError = true;
    }

    // Validation de la date
    if (!editForm.date_reservation) {
      newErrors.date_reservation = "Veuillez sélectionner une date.";
      hasError = true;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(editForm.date_reservation);
      if (selectedDate < today) {
        newErrors.date_reservation =
          "La date ne peut pas être antérieure à aujourd'hui.";
        hasError = true;
      }
    }

    // Validation des heures
    if (!editForm.heure_debut) {
      newErrors.heure_debut = "Veuillez sélectionner une heure de début.";
      hasError = true;
    }
    if (!editForm.heure_fin) {
      newErrors.heure_fin = "Veuillez sélectionner une heure de fin.";
      hasError = true;
    }
    if (
      editForm.heure_debut &&
      editForm.heure_fin &&
      editForm.heure_fin <= editForm.heure_debut
    ) {
      newErrors.heure_fin =
        "L'heure de fin doit être supérieure à l'heure de début.";
      hasError = true;
    }
    // Validation des horaires d'ouverture
    if (editForm.heure_debut) {
      const [startHours] = editForm.heure_debut.split(":").map(Number);
      if (startHours < 8) {
        newErrors.heure_debut = "L'heure de début doit être à partir de 8h00.";
        hasError = true;
      }
    }
    if (editForm.heure_fin) {
      const [endHours, endMinutes] = editForm.heure_fin.split(":").map(Number);
      if (endHours > 23 || (endHours === 23 && endMinutes > 0)) {
        newErrors.heure_fin = "L'heure de fin ne peut pas dépasser 00h00.";
        hasError = true;
      }
    }

    // Validation pour les réservations du jour même
    if (editForm.date_reservation && editForm.heure_debut) {
      const today = new Date();
      const selectedDate = new Date(editForm.date_reservation);
      const isToday = selectedDate.toDateString() === today.toDateString();

      if (isToday) {
        const nowMinutes = today.getHours() * 60 + today.getMinutes();
        const [startHours, startMinutes] = editForm.heure_debut
          .split(":")
          .map(Number);
        const startTotalMinutes = startHours * 60 + startMinutes;

        if (startTotalMinutes <= nowMinutes) {
          newErrors.heure_debut =
            "Pour aujourd'hui, l'heure de début doit être dans le futur.";
          hasError = true;
        }
      }
    }

    // Validation de l'objet
    if (!editForm.objet.trim()) {
      newErrors.objet = "Veuillez saisir un objet pour la réservation.";
      hasError = true;
    }

    setFieldErrors(newErrors);

    if (hasError) {
      setFeedback({
        type: "error",
        message: "Veuillez corriger les erreurs dans le formulaire.",
      });
      return;
    }

    try {
      await api.put(`/reservations/${editingReservation.id}`, {
        id_local: editForm.id_local,
        objet: editForm.objet,
        date_reservation: editForm.date_reservation,
        heure_debut: `${editForm.date_reservation}T${editForm.heure_debut}:00`,
        heure_fin: `${editForm.date_reservation}T${editForm.heure_fin}:00`,
      });
      setFeedback({
        type: "success",
        message: "Réservation modifiée avec succès.",
      });
      setEditingReservation(null);
      await loadReservations();
    } catch {
      setFeedback({ type: "error", message: "Modification impossible." });
    }
  };

  const calculateCost = (item: ReservationItem): string => {
    if (!item.local?.prix_heure) return "0.00";

    const start = new Date(item.heure_debut);
    const end = new Date(item.heure_fin);
    const durationInHours =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    return (durationInHours * item.local.prix_heure).toFixed(2);
  };

  const calculateDynamicCost = (): string => {
    const selectedLocal = locaux.find(
      (local) => local.id === editForm.id_local,
    );
    if (!selectedLocal?.prix_heure) return "0.00";

    if (!editForm.heure_debut || !editForm.heure_fin) return "0.00";

    const [startHours, startMinutes] = editForm.heure_debut
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = editForm.heure_fin.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    const durationInHours = (endTotalMinutes - startTotalMinutes) / 60;

    if (durationInHours <= 0) return "0.00";

    return (durationInHours * selectedLocal.prix_heure).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-[#436D75] tracking-tight">
            Mes Réservations
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Suivez le statut de vos demandes et annulez si nécessaire.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-[#436D75] text-white rounded-xl hover:bg-[#355960] transition-colors"
          title="Actualiser les données"
        >
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-2xl px-6 py-4 text-sm font-bold shadow-lg max-w-md ${
            feedback.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-rose-500 text-white"
          }`}
          style={{
            animation: "slideInRight 0.3s ease-out",
          }}
        >
          <div className="flex items-start gap-3">
            {feedback.type === "success" ? (
              <svg
                className="w-6 h-6 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <div className="flex-1">
              <p className="font-bold mb-1">
                {feedback.type === "success" ? "Succès" : "Erreur"}
              </p>
              <p className="text-sm opacity-90">{feedback.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[30px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#436D75]">Liste</h2>
          <span className="text-xs text-gray-400 font-bold">
            {reservations.length} réservations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/70">
              <tr className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                <th className="px-6 py-3">Local</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Horaire</th>
                <th className="px-6 py-3">Coût</th>
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
                    Aucune réservation pour le moment.
                  </td>
                </tr>
              ) : (
                reservations.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F7F3E9]/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-[#436D75] mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-[#436D75]">
                            {item.local?.nom || "Local"}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {item.local?.centre?.nom || "Centre"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(item.date_reservation).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        {new Date(item.heure_debut).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" - "}
                        {new Date(item.heure_fin).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 text-sm font-bold text-[#436D75] bg-[#F7F3E9] rounded-full">
                        {calculateCost(item)} DT
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.objet}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${statusClass(item.statut)}`}
                      >
                        {statusLabel(item.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[#436D75]">
                      {item.prix_total ? `${item.prix_total} TND` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const hasPaidPayment = item.payments?.some(
                          (p) => p.status === "PAID",
                        );
                        const isConfirmed = item.statut === "CONFIRME";

                        if (hasPaidPayment || isConfirmed) {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-600">
                              <CheckCircle size={14} /> Paiement effectué
                            </span>
                          );
                        }

                        return (
                          <>
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
                          </>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de modification */}
      {editingReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#F7F3E9] rounded-[30px] p-6 max-w-2xl w-full mx-4 shadow-2xl border border-[#D9E8D1]">
            <h2 className="text-2xl font-black text-[#436D75] mb-6">
              Modifier la réservation
            </h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">
                  Local
                </label>
                <select
                  value={editForm.id_local}
                  onChange={(e) =>
                    setEditForm({ ...editForm, id_local: e.target.value })
                  }
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm ${
                    fieldErrors.local ? "border-rose-500" : "border-gray-200"
                  }`}
                >
                  <option value="">Choisir un local</option>
                  {locaux.map((local) => (
                    <option key={local.id} value={local.id}>
                      {local.nom} - {local.centre?.nom || "Centre"} (
                      {local.prix_heure || 0} DT/h)
                    </option>
                  ))}
                </select>
                {fieldErrors.local && (
                  <p className="mt-1 text-xs text-rose-600 font-bold">
                    {fieldErrors.local}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">
                  Date
                </label>
                <div className="relative">
                  <CalendarDays
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="date"
                    value={editForm.date_reservation}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        date_reservation: e.target.value,
                      })
                    }
                    className={`w-full rounded-xl border bg-white pl-10 pr-3 py-3 text-sm ${
                      fieldErrors.date_reservation
                        ? "border-rose-500"
                        : "border-gray-200"
                    }`}
                  />
                </div>
                {fieldErrors.date_reservation && (
                  <p className="mt-1 text-xs text-rose-600 font-bold">
                    {fieldErrors.date_reservation}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">
                    Debut
                  </label>
                  <div className="relative">
                    <Clock3
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <select
                      value={editForm.heure_debut}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          heure_debut: e.target.value,
                        })
                      }
                      className={`w-full rounded-xl border bg-white pl-10 pr-3 py-3 text-sm appearance-none ${
                        fieldErrors.heure_debut
                          ? "border-rose-500"
                          : "border-gray-200"
                      }`}
                    >
                      <option value="">--:--</option>
                      {Array.from({ length: 16 }, (_, i) => {
                        const hour = 8 + i;
                        return Array.from({ length: 2 }, (_, j) => {
                          const minutes = j * 30;
                          const timeStr = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                          return (
                            <option key={timeStr} value={timeStr}>
                              {timeStr}
                            </option>
                          );
                        });
                      })}
                    </select>
                  </div>
                  {fieldErrors.heure_debut && (
                    <p className="mt-1 text-xs text-rose-600 font-bold">
                      {fieldErrors.heure_debut}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">
                    Fin
                  </label>
                  <div className="relative">
                    <Clock3
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <select
                      value={editForm.heure_fin}
                      onChange={(e) =>
                        setEditForm({ ...editForm, heure_fin: e.target.value })
                      }
                      className={`w-full rounded-xl border bg-white pl-10 pr-3 py-3 text-sm appearance-none ${
                        fieldErrors.heure_fin
                          ? "border-rose-500"
                          : "border-gray-200"
                      }`}
                    >
                      <option value="">--:--</option>
                      {Array.from({ length: 16 }, (_, i) => {
                        const hour = 8 + i;
                        return Array.from({ length: 2 }, (_, j) => {
                          const minutes = j * 30;
                          const timeStr = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                          return (
                            <option key={timeStr} value={timeStr}>
                              {timeStr}
                            </option>
                          );
                        });
                      })}
                      <option value="23:59">23:59</option>
                    </select>
                  </div>
                  {fieldErrors.heure_fin && (
                    <p className="mt-1 text-xs text-rose-600 font-bold">
                      {fieldErrors.heure_fin}
                    </p>
                  )}
                </div>
              </div>

              {editForm.id_local && (
                <div className="rounded-2xl border border-[#436D75]/20 bg-[#436D75] px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-[#D9E8D1]">
                        Coût estimé
                      </p>
                      <p className="text-xs text-white/80 mt-1">
                        Paiement au centre
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-[#D9E8D1]">
                        {calculateDynamicCost()} DT
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        {locaux.find((local) => local.id === editForm.id_local)
                          ?.prix_heure || 0}{" "}
                        DT/h
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">
                  Objet
                </label>
                <input
                  type="text"
                  value={editForm.objet}
                  onChange={(e) =>
                    setEditForm({ ...editForm, objet: e.target.value })
                  }
                  placeholder="Ex: repetition theatre, atelier media..."
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm ${
                    fieldErrors.objet ? "border-rose-500" : "border-gray-200"
                  }`}
                />
                {fieldErrors.objet && (
                  <p className="mt-1 text-xs text-rose-600 font-bold">
                    {fieldErrors.objet}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingReservation(null)}
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-black hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-[#436D75] text-white font-black hover:bg-[#355960] transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
