/**
 * EventsList.tsx — Liste des événements avec actions de gestion.
 *
 * RÔLE :
 *   Tableau/liste des événements dans EventManagementDetailPage.
 *
 * COLONNES :
 *   Nom, date, heure, lieu, nombre de participants, statut
 *
 * ACTIONS PAR LIGNE :
 *   Eye           → Voir détails (EventDetailsModal)
 *   Pencil        → Modifier (EventFormModal)
 *   ClipboardCheck→ Gérer présences (EventPresenceModal)
 *   Ban           → Annuler l'événement
 *   CalendarDays  → Vue calendrier
 */
import {
  Ban,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  Eye,
  Loader2,
  Pencil,
  Power,
  PowerOff,
  Users,
} from "lucide-react";
import type { EventItem } from "../types";
import { formatDateOnly, toTimeHHMM } from "../utils";

type Props = {
  isLoading: boolean;
  events: EventItem[];
  selectedEventId: string | null;
  onView: (id: string) => void;
  onPresence: (event: EventItem) => void;
  onEdit: (event: EventItem) => void;
  onToggleActive: (event: EventItem) => void;
  onCancel: (event: EventItem) => void;
};

export default function EventsList({
  isLoading,
  events,
  selectedEventId,
  onView,
  onPresence,
  onEdit,
  onToggleActive,
  onCancel,
}: Props) {
  return (
    <div className="xl:col-span-2 bg-white rounded-[30px] border border-gray-100 shadow-sm overflow-hidden">
      {isLoading ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-smart-teal" size={42} />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            Chargement des événements...
          </p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center text-gray-400 font-bold">
          Aucun événement disponible.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {events.map((event) => {
            const isSelected = selectedEventId === event.id;
            return (
              <div
                key={event.id}
                className={`p-5 transition ${isSelected ? "bg-[#D9E8D1]/25" : "hover:bg-gray-50"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black italic text-smart-teal">
                      {event.nom}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-semibold">
                      {event.club?.nom ?? "Club"} •{" "}
                      {event.local?.nom ?? "Local"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 font-bold">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={14} />
                        {formatDateOnly(event.date_event)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={14} />
                        {toTimeHHMM(event.start_time)} -{" "}
                        {toTimeHHMM(event.end_time)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={14} />
                        {event._count?.participants ?? 0} participants
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView(event.id)}
                      className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-[#436D75] hover:text-white transition"
                      title="Détails"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onPresence(event)}
                      className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white transition"
                      title="Présence"
                    >
                      <ClipboardCheck size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(event)}
                      className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition"
                      title="Modifier"
                    >
                      <Pencil size={16} />
                    </button>
                    {event.is_active && (
                      <button
                        onClick={() => onCancel(event)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition"
                        title="Annuler l'événement"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onToggleActive(event)}
                      className={`p-2 rounded-xl transition ${
                        event.is_active
                          ? "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
                          : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"
                      }`}
                      title={event.is_active ? "Désactiver" : "Activer"}
                    >
                      {event.is_active ? (
                        <PowerOff size={16} />
                      ) : (
                        <Power size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      event.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {event.is_active ? "ACTIF" : "INACTIF"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
