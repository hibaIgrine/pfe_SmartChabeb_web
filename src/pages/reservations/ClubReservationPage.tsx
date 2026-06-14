import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import api from "../../api/axios";
import { CalendarDays, Clock3, PlusCircle } from "lucide-react";

type LocalItem = {
  id: string;
  nom: string;
  type?: string;
  prix_heure?: string | number | null;
  centre?: { nom?: string };
};

type OccupiedSlot = {
  heure_debut: string;
  heure_fin: string;
  objet: string;
};

type SuggestedSlot = {
  startMinutes: number;
  endMinutes: number;
};

function toMoney(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "0.00";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "0.00";
  return parsed.toFixed(2);
}

function getTodayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((value) => Number(value));
  return h * 60 + m;
}

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default function ClubReservationPage() {
  const [locaux, setLocaux] = useState<LocalItem[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [selectedLocalId, setSelectedLocalId] = useState<string>("");
  const [dateReservation, setDateReservation] = useState<string>(
    getTodayLocalDateString(),
  );
  const [heureDebut, setHeureDebut] = useState<string>("09:00");
  const [heureFin, setHeureFin] = useState<string>("11:00");
  const [objet, setObjet] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentNow, setPaymentNow] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedLocal = useMemo(
    () => locaux.find((item) => item.id === selectedLocalId),
    [locaux, selectedLocalId],
  );

  const suggestedSlots = useMemo<SuggestedSlot[]>(() => {
    if (!selectedLocalId || !dateReservation) return [];

    const today = getTodayLocalDateString();
    if (dateReservation < today) return [];

    const start = parseTimeToMinutes(heureDebut);
    const end = parseTimeToMinutes(heureFin);
    const requestedDuration = end > start ? end - start : 60;

    const dayStart = 8 * 60;
    const dayEnd = 22 * 60;
    let minStart = dayStart;

    if (dateReservation === today) {
      const now = new Date();
      minStart = Math.max(
        minStart,
        now.getHours() * 60 + now.getMinutes() + 15,
      );
    }

    if (minStart + requestedDuration > dayEnd) {
      return [];
    }

    const occupiedIntervals = occupiedSlots
      .map((slot) => {
        const startDate = new Date(slot.heure_debut);
        const endDate = new Date(slot.heure_fin);
        return {
          start: startDate.getHours() * 60 + startDate.getMinutes(),
          end: endDate.getHours() * 60 + endDate.getMinutes(),
        };
      })
      .filter((slot) => slot.end > slot.start)
      .sort((a, b) => a.start - b.start);

    const suggestions: SuggestedSlot[] = [];
    const step = 30;

    // Afficher toutes les créneaux disponibles tout au long de la journée
    for (
      let candidateStart = Math.max(dayStart, minStart);
      candidateStart + requestedDuration <= dayEnd;
      candidateStart += step
    ) {
      const candidateEnd = candidateStart + requestedDuration;
      const overlaps = occupiedIntervals.some(
        (slot) => candidateStart < slot.end && candidateEnd > slot.start,
      );

      if (!overlaps) {
        suggestions.push({
          startMinutes: candidateStart,
          endMinutes: candidateEnd,
        });
      }
    }

    return suggestions;
  }, [selectedLocalId, dateReservation, heureDebut, heureFin, occupiedSlots]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const locauxRes = await api.get("/locaux");

      setLocaux(locauxRes.data || []);

      if (!selectedLocalId && (locauxRes.data || []).length > 0) {
        setSelectedLocalId(locauxRes.data[0].id);
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Impossible de charger les locaux ou les reservations.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOccupiedSlots = async (localId: string, date: string) => {
    if (!localId || !date) {
      setOccupiedSlots([]);
      return;
    }

    try {
      const res = await api.get(
        `/reservations/occupied?id_local=${localId}&date=${date}`,
      );
      setOccupiedSlots(res.data || []);
    } catch {
      setOccupiedSlots([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    void loadOccupiedSlots(selectedLocalId, dateReservation);
  }, [selectedLocalId, dateReservation]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const today = getTodayLocalDateString();

    if (!selectedLocalId || !dateReservation || !objet.trim()) {
      setFeedback({ type: "error", message: "Formulaire incomplet." });
      return;
    }

    if (dateReservation < today) {
      setFeedback({
        type: "error",
        message:
          "Date invalide: vous ne pouvez pas reserver pour une date passee.",
      });
      return;
    }

    if (heureFin <= heureDebut) {
      setFeedback({
        type: "error",
        message: "L heure de fin doit etre superieure a l heure de debut.",
      });
      return;
    }

    if (dateReservation === today) {
      const now = new Date();
      const nowInMinutes = now.getHours() * 60 + now.getMinutes();
      const startInMinutes = parseTimeToMinutes(heureDebut);

      if (startInMinutes <= nowInMinutes) {
        setFeedback({
          type: "error",
          message:
            "Heure invalide: pour aujourd hui, l heure de debut doit etre dans le futur.",
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const reservationData = {
        id_local: selectedLocalId,
        date_reservation: dateReservation,
        heure_debut: `${heureDebut}:00`,
        heure_fin: `${heureFin}:00`,
        objet: objet.trim(),
      };

      if (paymentNow) {
        // Utiliser l'endpoint create-with-payment
        const returnUrl =
          window.location.origin + "/reservations/my-reservations";
        const response = await api.post("/reservations/create-with-payment", {
          ...reservationData,
          returnUrl,
        });

        // Rediriger vers Konnect
        if (response.data?.checkoutUrl) {
          window.location.href = response.data.checkoutUrl;
        } else {
          setFeedback({
            type: "success",
            message:
              "Reservation créée. Paiement non disponible pour le moment.",
          });
          await Promise.all([
            loadData(),
            loadOccupiedSlots(selectedLocalId, dateReservation),
          ]);
          setObjet("");
          setPaymentNow(false);
        }
      } else {
        // Utiliser l'endpoint normal
        await api.post("/reservations", reservationData);

        setObjet("");
        setFeedback({
          type: "success",
          message: "Reservation envoyee avec succes.",
        });
        await Promise.all([
          loadData(),
          loadOccupiedSlots(selectedLocalId, dateReservation),
        ]);
        setPaymentNow(false);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.message;

      if (status === 403) {
        setFeedback({
          type: "error",
          message:
            (Array.isArray(apiMessage) ? apiMessage.join(" - ") : apiMessage) ||
            "Vous ne pouvez reserver que les locaux autorises a votre club.",
        });
      } else if (status === 409) {
        setFeedback({
          type: "error",
          message:
            "Ce creneau est deja reserve ou en attente. Choisissez un horaire propose.",
        });
      } else if (status === 400) {
        setFeedback({
          type: "error",
          message:
            (Array.isArray(apiMessage) ? apiMessage.join(" - ") : apiMessage) ||
            "Verifier les champs du formulaire.",
        });
      } else {
        setFeedback({
          type: "error",
          message: "Echec de creation de la reservation.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const applySuggestedSlot = (slot: SuggestedSlot) => {
    setHeureDebut(formatMinutesToTime(slot.startMinutes));
    setHeureFin(formatMinutesToTime(slot.endMinutes));
    setFeedback(null);
  };

  const calculateTotalCost = (): string => {
    if (!selectedLocal) return "0.00";

    const pricePerHour = parseFloat(
      selectedLocal.prix_heure?.toString() || "0",
    );
    const start = parseTimeToMinutes(heureDebut);
    const end = parseTimeToMinutes(heureFin);
    const durationInHours = (end - start) / 60;

    if (durationInHours <= 0) return "0.00";

    return (durationInHours * pricePerHour).toFixed(2);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-[#436D75] tracking-tight">
          Reservation Local
        </h1>
        
      </div>

      {feedback && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-6 py-4 text-sm font-bold shadow-lg ${
            feedback.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-rose-500 text-white"
          }`}
          style={{
            maxWidth: "90%",
            animation: "slideDown 0.3s ease-out",
          }}
        >
          <div className="flex items-center gap-3">
            {feedback.type === "success" ? (
              <svg
                className="w-6 h-6"
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
                className="w-6 h-6"
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
            {feedback.message}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-2 bg-[#F7F3E9] rounded-[30px] p-6 border border-[#D9E8D1] space-y-4"
        >
          <h2 className="text-lg font-black text-[#436D75]">
            Nouvelle demande
          </h2>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">
              Local
            </label>
            <select
              value={selectedLocalId}
              onChange={(e) => setSelectedLocalId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
            >
              <option value="">Choisir un local</option>
              {locaux.map((local) => (
                <option key={local.id} value={local.id}>
                  {local.nom} - {local.centre?.nom || "Centre"} (
                  {toMoney(local.prix_heure)} DT/h)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  value={dateReservation}
                  onChange={(e) => setDateReservation(e.target.value)}
                  min={getTodayLocalDateString()}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 py-3 text-sm"
                />
              </div>
            </div>

            {/* Heure début — heures 8-21, minutes libres (max 30 si 21h) */}
            {(() => {
              const [dH, dM] = heureDebut ? heureDebut.split(":") : ["", ""];
              const dHNum = dH ? parseInt(dH, 10) : null;
              const debutMaxM = dHNum === 21 ? 30 : 59;
              const fieldCls = "flex-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/40";
              return (
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">
                    Debut
                  </label>
                  <div className="flex gap-2 items-center">
                    <Clock3 className="text-gray-400 shrink-0" size={16} />
                    <select
                      value={dH}
                      onChange={(e) => {
                        const h = e.target.value;
                        const m = dM || "00";
                        setHeureDebut(h ? `${h}:${m}` : "");
                      }}
                      className={fieldCls}
                    >
                      <option value="">Heure</option>
                      {Array.from({ length: 14 }, (_, i) => i + 8).map((h) => {
                        const v = String(h).padStart(2, "0");
                        return <option key={v} value={v}>{v}h</option>;
                      })}
                    </select>
                    <input
                      type="number"
                      min={0}
                      max={debutMaxM}
                      placeholder="min"
                      value={dM ? String(parseInt(dM, 10)) : ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const n = parseInt(raw, 10);
                        if (raw === "" || (!isNaN(n) && n >= 0 && n <= debutMaxM)) {
                          setHeureDebut(dH ? `${dH}:${raw === "" ? "00" : String(n).padStart(2, "0")}` : "");
                        }
                      }}
                      className={fieldCls}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Heure fin — heures debut-22, minutes libres (max 0 si 22h) */}
            {(() => {
              const [fH, fM] = heureFin ? heureFin.split(":") : ["", ""];
              const fHNum = fH ? parseInt(fH, 10) : null;
              const debutH = heureDebut ? parseInt(heureDebut.split(":")[0], 10) : 8;
              const finMaxM = fHNum === 22 ? 0 : 59;
              const fieldCls = "flex-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/40";
              return (
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">
                    Fin
                  </label>
                  <div className="flex gap-2 items-center">
                    <Clock3 className="text-gray-400 shrink-0" size={16} />
                    <select
                      value={fH}
                      onChange={(e) => {
                        const h = e.target.value;
                        const m = fM || "00";
                        setHeureFin(h ? `${h}:${m}` : "");
                      }}
                      className={fieldCls}
                    >
                      <option value="">Heure</option>
                      {Array.from({ length: 22 - debutH + 1 }, (_, i) => i + debutH).map((h) => {
                        const v = String(h).padStart(2, "0");
                        return <option key={v} value={v}>{v}h</option>;
                      })}
                    </select>
                    <input
                      type="number"
                      min={0}
                      max={finMaxM}
                      placeholder="min"
                      value={fM ? String(parseInt(fM, 10)) : ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const n = parseInt(raw, 10);
                        if (raw === "" || (!isNaN(n) && n >= 0 && n <= finMaxM)) {
                          setHeureFin(fH ? `${fH}:${raw === "" ? "00" : String(n).padStart(2, "0")}` : "");
                        }
                      }}
                      className={fieldCls}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {selectedLocal && (
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
                    {calculateTotalCost()} DT
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {selectedLocal.prix_heure} DT/h
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
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              placeholder="Ex: repetition theatre, atelier media..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
            />
          </div>

          
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#436D75] px-5 py-3 text-sm font-black text-white hover:bg-[#355960] disabled:opacity-60"
          >
            <PlusCircle size={16} />
            {isSubmitting ? "Envoi..." : "Reserver"}
          </button>

          <div className="rounded-2xl border border-[#D9E8D1] bg-white px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#436D75]">
              Horaires proposes
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Suggestions calculees selon l occupation du local et la duree
              demandee.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedSlots.length > 0 ? (
                suggestedSlots.map((slot, index) => (
                  <button
                    key={`${slot.startMinutes}-${slot.endMinutes}-${index}`}
                    type="button"
                    onClick={() => applySuggestedSlot(slot)}
                    className="rounded-lg border border-[#436D75]/20 bg-[#F7F3E9] px-3 py-2 text-xs font-black text-[#436D75] hover:bg-[#D9E8D1]"
                  >
                    {formatMinutesToTime(slot.startMinutes)} -{" "}
                    {formatMinutesToTime(slot.endMinutes)}
                  </button>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Aucun horaire disponible pour cette duree sur la journee.
                </p>
              )}
            </div>
          </div>
        </form>

        <div className="bg-white rounded-[30px] p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-[#436D75] mb-4">Occupation</h2>
          <p className="text-xs text-gray-400 mb-4">
            {selectedLocal?.nom || "Aucun local"} - {dateReservation}
          </p>
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {occupiedSlots.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                Aucune occupation sur ce jour.
              </p>
            ) : (
              occupiedSlots.map((slot, index) => (
                <div
                  key={`${slot.heure_debut}-${index}`}
                  className="rounded-xl border border-[#D9E8D1] px-3 py-2"
                >
                  <p className="text-xs font-black text-[#436D75]">
                    {new Date(slot.heure_debut).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" - "}
                    {new Date(slot.heure_fin).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{slot.objet}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
