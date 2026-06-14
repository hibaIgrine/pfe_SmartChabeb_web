/**
 * EventsCalendar.tsx — Vue calendrier mensuel des événements.
 *
 * RÔLE :
 *   Affiche les événements dans une grille calendrier (mois courant).
 *   Permet de voir la distribution temporelle des événements à un coup d'œil.
 *
 * FONCTIONNALITÉS :
 *   - Navigation mois précédent / suivant
 *   - Points colorés sur les jours avec événements
 *   - Clic sur un jour → sélectionne l'événement (onSelectEvent)
 *   - useMemo pour calculer les jours du mois et l'alignement du premier jour
 */
import { useMemo, useState } from "react";
import type { EventItem } from "../types";

type Props = {
  events: EventItem[];
  onSelectEvent: (id: string) => void;
};

function toDateKey(value: string | Date) {
  if (typeof value === "string") {
    return value.includes("T") ? value.split("T")[0] : value;
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export default function EventsCalendar({ events, onSelectEvent }: Props) {
  const [viewDate, setViewDate] = useState(new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const firstWeekDay = (monthStart.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const event of events) {
      const key = toDateKey(event.date_event);
      const current = map.get(key) ?? [];
      current.push(event);
      map.set(key, current);
    }
    return map;
  }, [events]);

  const cells: Array<{ date: Date | null; key: string }> = [];
  for (let i = 0; i < firstWeekDay; i++) {
    cells.push({ date: null, key: `empty-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
    cells.push({ date, key: toDateKey(date) });
  }

  const monthLabel = viewDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const todayKey = toDateKey(new Date());

  return (
    <div className="bg-white rounded-[30px] border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black italic text-smart-teal">
          Calendrier de planification
        </h3>
        <div className="flex items-center gap-2 text-sm font-bold">
          <button
            onClick={() =>
              setViewDate(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
              )
            }
            className="px-2 py-1 rounded-lg border border-gray-200"
          >
            {"<"}
          </button>
          <span className="min-w-44 text-center capitalize">{monthLabel}</span>
          <button
            onClick={() =>
              setViewDate(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
              )
            }
            className="px-2 py-1 rounded-lg border border-gray-200"
          >
            {">"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-[10px] uppercase font-black text-gray-400 mb-2">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell) => {
          if (!cell.date) {
            return (
              <div key={cell.key} className="h-20 rounded-xl bg-gray-50/60" />
            );
          }

          const key = toDateKey(cell.date);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isToday = key === todayKey;

          return (
            <div
              key={cell.key}
              className={`h-20 rounded-xl border p-2 overflow-hidden ${
                isToday
                  ? "border-[#436D75] bg-[#D9E8D1]/20"
                  : "border-gray-100 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black text-smart-teal">
                  {cell.date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#E98A7D]/20 text-[#B23A2B]">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onSelectEvent(event.id)}
                    className="w-full text-left text-[9px] font-bold truncate px-1 py-0.5 rounded bg-[#436D75]/8 text-[#436D75] hover:bg-[#436D75]/15"
                    title={event.nom}
                  >
                    {event.nom}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <p className="text-[9px] font-bold text-gray-400">
                    +{dayEvents.length - 2} autres
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
