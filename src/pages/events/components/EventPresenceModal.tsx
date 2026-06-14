/**
 * EventPresenceModal.tsx — Modale de validation de présence à un événement.
 *
 * RÔLE :
 *   Affiche la liste des participants confirmés et permet au responsable
 *   de marquer individuellement les présences après l'événement.
 *
 * COMPORTEMENT :
 *   • Disponible uniquement si l'événement est terminé (eventEndTime passée)
 *   • Coche/décoche chaque participant (PRESENT / ABSENT)
 *   • Sauvegarde en batch via API
 *
 * API : PATCH /events/:id/presences
 */
import { Loader2, X } from "lucide-react";
import type { EventParticipant } from "../types";

type Props = {
  isOpen: boolean;
  eventName: string;
  eventStartTime: string;
  eventEndTime: string;
  isLoading: boolean;
  isUpdating: boolean;
  participants: EventParticipant[];
  onClose: () => void;
  onToggleCheckin: (participantId: string, checkin: boolean) => void;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

export default function EventPresenceModal({
  isOpen,
  eventName,
  eventStartTime,
  eventEndTime,
  isLoading,
  isUpdating,
  participants,
  onClose,
  onToggleCheckin,
}: Props) {
  if (!isOpen) return null;

  const now = new Date();
  const start = eventStartTime ? new Date(eventStartTime) : null;
  const end = eventEndTime ? new Date(eventEndTime) : null;
  const isEventOngoing = start && end && now >= start && now <= end;
  const isEventOver = end ? now > end : false;

  const confirmed = participants.filter((p) => p.status === "CONFIRME");
  const present = confirmed.filter((p) => p.checkin);
  const absent = confirmed.filter((p) => !p.checkin);
  const history = [...participants].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });

  const renderPresenceRow = (
    participant: EventParticipant,
    isPresentList: boolean,
  ) => (
    <div
      key={participant.id}
      className="p-3 rounded-xl border border-gray-100 bg-white/80 flex items-center justify-between gap-3"
    >
      <div>
        <p className="text-sm font-black text-[#244047]">
          {participant.user.nom} {participant.user.prenom}
        </p>
        <p className="text-xs text-gray-500">{participant.user.email}</p>
      </div>
      <button
        disabled={isUpdating || !isEventOngoing}
        onClick={() => isEventOngoing && onToggleCheckin(participant.id, !isPresentList)}
        title={!isEventOngoing ? (isEventOver ? "L'événement est terminé" : "L'événement n'a pas encore commencé") : undefined}
        className={`px-3 py-2 rounded-xl text-[11px] font-black transition ${
          !isEventOngoing
            ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
            : isPresentList
              ? "bg-[#FDE5E1] text-[#B23A2B] border border-[#E98A7D]/40 disabled:opacity-60"
              : "bg-[#D9E8D1] text-[#436D75] border border-[#436D75]/25 disabled:opacity-60"
        }`}
      >
        {isPresentList ? "Marquer absent" : "Marquer présent"}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-[30px] border border-gray-100 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Gestion Présence
            </p>
            <h3 className="text-xl font-black italic text-smart-teal">
              {eventName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {!isEventOngoing && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 text-center">
              {isEventOver
                ? "Événement terminé — enregistrement des présences désactivé"
                : "Événement pas encore commencé — enregistrement des présences désactivé"}
            </p>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-smart-teal" size={38} />
              <p className="text-xs uppercase font-black tracking-widest text-gray-400">
                Chargement des présences...
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider font-black text-gray-400">
                    Présents ({present.length})
                  </p>
                  {present.length === 0 ? (
                    <p className="text-sm text-gray-400">Aucun présent.</p>
                  ) : (
                    <div className="space-y-2">
                      {present.map((p) => renderPresenceRow(p, true))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider font-black text-gray-400">
                    Absents ({absent.length})
                  </p>
                  {absent.length === 0 ? (
                    <p className="text-sm text-gray-400">Aucun absent.</p>
                  ) : (
                    <div className="space-y-2">
                      {absent.map((p) => renderPresenceRow(p, false))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs uppercase tracking-wider font-black text-gray-400 mb-3">
                  Historique de participation
                </p>
                {history.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Aucun historique disponible.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {history.map((participant) => (
                      <div
                        key={`history-${participant.id}`}
                        className="p-3 rounded-xl border border-gray-100 bg-[#F9FAFB]"
                      >
                        <p className="text-sm font-black text-[#244047]">
                          {participant.user.nom} {participant.user.prenom}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Statut: <strong>{participant.status}</strong> |
                          Présence:{" "}
                          <strong>
                            {participant.checkin ? "PRESENT" : "ABSENT"}
                          </strong>
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Dernière mise à jour:{" "}
                          {formatDateTime(
                            participant.updated_at || participant.created_at,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
