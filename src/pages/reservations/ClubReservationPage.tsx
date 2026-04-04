import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import api from "../../api/axios";
import { CalendarDays, Clock3, PlusCircle, XCircle } from "lucide-react";

type LocalItem = {
  id: string;
  nom: string;
  type?: string;
  prix_heure?: string | number | null;
  centre?: { nom?: string };
};

type ReservationItem = {
  id: string;
  statut: string;
  objet: string;
  prix_total?: string | number | null;
  date_reservation: string;
  heure_debut: string;
  heure_fin: string;
  local?: { nom?: string; centre?: { nom?: string } };
};

type OccupiedSlot = {
  heure_debut: string;
  heure_fin: string;
  objet: string;
};

function toMoney(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "0.00";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "0.00";
  return parsed.toFixed(2);
}

function statusClass(status: string): string {
  if (status === "VALIDEE") return "bg-emerald-100 text-emerald-700";
  if (status === "REFUSEE") return "bg-rose-100 text-rose-700";
  if (status === "ANNULEE") return "bg-slate-100 text-slate-600";
  return "bg-amber-100 text-amber-700";
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

export default function ClubReservationPage() {
  const [locaux, setLocaux] = useState<LocalItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
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
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedLocal = useMemo(
    () => locaux.find((item) => item.id === selectedLocalId),
    [locaux, selectedLocalId],
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [locauxRes, reservationsRes] = await Promise.all([
        api.get("/locaux"),
        api.get("/reservations"),
      ]);

      setLocaux(locauxRes.data || []);
      setReservations(reservationsRes.data || []);

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
      await api.post("/reservations", {
        id_local: selectedLocalId,
        date_reservation: dateReservation,
        heure_debut: `${heureDebut}:00`,
        heure_fin: `${heureFin}:00`,
        objet: objet.trim(),
      });

      setObjet("");
      setFeedback({
        type: "success",
        message: "Reservation envoyee avec succes.",
      });
      await Promise.all([
        loadData(),
        loadOccupiedSlots(selectedLocalId, dateReservation),
      ]);
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
          message: "Ce creneau est deja reserve ou en attente.",
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

  const handleCancel = async (id: string) => {
    try {
      await api.patch(`/reservations/${id}/status`, { statut: "ANNULEE" });
      setFeedback({
        type: "success",
        message: "Reservation annulee.",
      });
      await loadData();
      await loadOccupiedSlots(selectedLocalId, dateReservation);
    } catch {
      setFeedback({ type: "error", message: "Annulation impossible." });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-[#436D75] tracking-tight">
          Reservation Club
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Le responsable de club peut reserver un local et suivre ses demandes.
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

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase mb-2">
                Debut
              </label>
              <div className="relative">
                <Clock3
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="time"
                  value={heureDebut}
                  onChange={(e) => setHeureDebut(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 py-3 text-sm"
                />
              </div>
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
                <input
                  type="time"
                  value={heureFin}
                  onChange={(e) => setHeureFin(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 py-3 text-sm"
                />
              </div>
            </div>
          </div>

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

      <div className="bg-white rounded-[30px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#436D75]">
            Mes reservations
          </h2>
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
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-5 text-sm text-gray-400" colSpan={6}>
                    Chargement...
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td className="px-6 py-5 text-sm text-gray-400" colSpan={6}>
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
                    <td className="px-6 py-4">
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
