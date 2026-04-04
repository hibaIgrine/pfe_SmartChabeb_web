import type { EventDetail } from "../types";
import { toTimeHHMM } from "../utils";

type Props = {
  selectedDetail: EventDetail | null;
};

export default function EventDetailsPanel({ selectedDetail }: Props) {
  return (
    <div className="bg-white rounded-[30px] border border-gray-100 shadow-sm p-5">
      <h3 className="text-xl font-black italic text-smart-teal mb-4">
        Détails Événement
      </h3>

      {!selectedDetail ? (
        <p className="text-sm text-gray-400">
          Sélectionnez un événement pour voir le détail.
        </p>
      ) : (
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
              Nom
            </p>
            <p className="font-bold text-smart-teal">{selectedDetail.nom}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
              Description
            </p>
            <p className="text-gray-700">
              {selectedDetail.description || "Aucune description"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                Date
              </p>
              <p className="font-bold">
                {new Date(selectedDetail.date_event).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                Heure
              </p>
              <p className="font-bold">
                {toTimeHHMM(selectedDetail.start_time)} -{" "}
                {toTimeHHMM(selectedDetail.end_time)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
              Club / Local
            </p>
            <p className="font-semibold text-gray-700">
              {selectedDetail.club?.nom ?? "-"} •{" "}
              {selectedDetail.local?.nom ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
              Capacité
            </p>
            <p className="font-semibold text-gray-700">
              {selectedDetail.capacity ?? "Non définie"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
              Participants
            </p>
            <p className="font-semibold text-gray-700">
              {selectedDetail.participants?.length ?? 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
