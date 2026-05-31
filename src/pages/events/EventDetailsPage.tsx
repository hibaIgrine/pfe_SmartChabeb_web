import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "../../api/axios";
import type { EventDetail } from "./types";
import { formatDateOnly, toTimeHHMM } from "./utils";

export default function EventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const resp = await api.get(`/events/${id}`);
        setEvent(resp.data);
      } catch {
        setEvent(null);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-smart-teal" size={48} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center text-gray-500">Détail introuvable.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white rounded-[20px] border border-gray-100 p-6 shadow-sm">
        <h1 className="text-2xl font-black italic text-smart-teal">
          {event.nom}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {event.club?.nom ?? "Club"} • {event.local?.nom ?? "Local"}
        </p>

        <div className="mt-6 space-y-4 text-sm">
          <div>
            <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
              Description
            </p>
            <p className="text-gray-700">
              {event.description || "Aucune description"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                Date
              </p>
              <p className="font-bold">{formatDateOnly(event.date_event)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                Heure
              </p>
              <p className="font-bold">
                {toTimeHHMM(event.start_time)} - {toTimeHHMM(event.end_time)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
              Lieu
            </p>
            <p className="font-semibold text-gray-700">
              {event.local?.nom ?? "-"}
            </p>
          </div>

          {Array.isArray(event.timeline) && event.timeline.length > 0 && (
            <div>
              <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider mb-3">
                Programme
              </p>
              <div className="rounded-2xl border border-[#D6E5E8] bg-[#F8FCFD] p-4 space-y-4">
                {event.timeline.map((step: any, index: number) => (
                  <div key={index} className="relative pl-7">
                    <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-[#436D75]" />
                    {index < event.timeline.length - 1 ? (
                      <span className="absolute left-[14px] top-5 h-[calc(100%-8px)] w-[2px] bg-[#C7DCE1]" />
                    ) : null}

                    <div className="rounded-xl border border-[#E0ECEF] bg-white px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-[#203A43] text-xs">
                          {step.title}
                        </p>
                        <span className="text-[11px] font-black text-[#436D75]">
                          {step.start_time} - {step.end_time}
                        </span>
                      </div>
                      {step.details ? (
                        <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                          {step.details}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
