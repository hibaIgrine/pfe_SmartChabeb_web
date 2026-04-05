import type {
  EventDetail,
  EventParticipant,
  ParticipantStatus,
} from "../types";
import { toTimeHHMM } from "../utils";

type Props = {
  selectedDetail: EventDetail | null;
  canManageParticipants: boolean;
  onUpdateParticipantStatus: (
    eventId: string,
    participantId: string,
    status: ParticipantStatus,
  ) => void;
  onToggleCheckin: (
    eventId: string,
    participantId: string,
    checkin: boolean,
  ) => void;
};

const statusBadge: Record<string, string> = {
  CONFIRME: "bg-green-100 text-green-700",
  EN_ATTENTE: "bg-amber-100 text-amber-700",
  REFUSE: "bg-red-100 text-red-700",
  ANNULE: "bg-gray-100 text-gray-700",
};

export default function EventDetailsPanel({
  selectedDetail,
  canManageParticipants,
  onUpdateParticipantStatus,
  onToggleCheckin,
}: Props) {
  const participants = selectedDetail?.participants ?? [];
  const confirmed = participants.filter((p) => p.status === "CONFIRME");
  const waiting = participants.filter((p) => p.status === "EN_ATTENTE");

  const renderParticipantRow = (participant: EventParticipant) => (
    <div
      key={participant.id}
      className="p-3 rounded-xl border border-gray-100 bg-white/70 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-gray-700 text-xs">
          {participant.user.nom} {participant.user.prenom}
        </p>
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
            statusBadge[participant.status] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {participant.status}
        </span>
      </div>

      {canManageParticipants && (
        <div className="flex flex-wrap gap-1">
          {(
            [
              "EN_ATTENTE",
              "CONFIRME",
              "REFUSE",
              "ANNULE",
            ] as ParticipantStatus[]
          ).map((status) => (
            <button
              key={status}
              onClick={() =>
                selectedDetail &&
                onUpdateParticipantStatus(
                  selectedDetail.id,
                  participant.id,
                  status,
                )
              }
              className="px-2 py-1 text-[9px] font-black rounded-lg border border-gray-200 hover:bg-gray-100"
            >
              {status}
            </button>
          ))}
          <button
            onClick={() =>
              selectedDetail &&
              onToggleCheckin(
                selectedDetail.id,
                participant.id,
                !participant.checkin,
              )
            }
            className={`px-2 py-1 text-[9px] font-black rounded-lg border ${
              participant.checkin
                ? "border-green-300 text-green-700 bg-green-50"
                : "border-gray-200 text-gray-700"
            }`}
          >
            {participant.checkin ? "Check-in OK" : "Check-in"}
          </button>
        </div>
      )}
    </div>
  );

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

          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 mb-3">
              Validation des participants depuis le web.
            </p>

            <div className="space-y-2">
              <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                Confirmés ({confirmed.length})
              </p>
              {confirmed.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Aucun participant confirmé.
                </p>
              ) : (
                confirmed.map(renderParticipantRow)
              )}
            </div>

            <div className="space-y-2 mt-3">
              <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                Liste d'attente ({waiting.length})
              </p>
              {waiting.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Aucun participant en attente.
                </p>
              ) : (
                waiting.map(renderParticipantRow)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
