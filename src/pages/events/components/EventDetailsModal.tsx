import { createPortal } from "react-dom";
import { useEffect } from "react";
import EventDetailsPanel from "./EventDetailsPanel";
import type { EventDetail } from "../types";

type Props = {
  isOpen: boolean;
  selectedDetail: EventDetail | null;
  onClose: () => void;
  onRequestParticipation: (eventId: string) => void;
  onCancelParticipation: (eventId: string) => void;
  isActionLoading: boolean;
  onSubmitFeedback: (
    eventId: string,
    note: number,
    commentaire: string,
  ) => void;
  isSubmittingFeedback: boolean;
  onSelfCheckin?: (eventId: string) => Promise<void>;
};

export default function EventDetailsModal({
  isOpen,
  selectedDetail,
  onClose,
  onRequestParticipation,
  onCancelParticipation,
  isActionLoading,
  onSubmitFeedback,
  isSubmittingFeedback,
  onSelfCheckin,
}: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const myParticipation = selectedDetail?.participants?.find(
    (p: any) => p.user?.id === user.id,
  );

  const handlePrimaryAction = () => {
    if (!selectedDetail) return;
    if (myParticipation) {
      onCancelParticipation(selectedDetail.id);
    } else {
      onRequestParticipation(selectedDetail.id);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[2500] bg-black/45 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
          >
            ← Retour
          </button>

          <div className="flex-1 text-center">
            <h3 className="text-lg font-black text-smart-teal">
              Détails Événement
            </h3>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={handlePrimaryAction}
              disabled={isActionLoading}
              className="px-4 py-2 rounded-xl bg-[#E98A7D] text-white font-black disabled:opacity-60"
            >
              {isActionLoading
                ? "Traitement..."
                : myParticipation
                  ? myParticipation.status === "EN_ATTENTE"
                    ? "Annuler ma demande"
                    : "Annuler ma participation"
                  : "Demander à participer"}
            </button>
          </div>
        </div>

        <div
          className="p-4 md:p-6 overflow-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <EventDetailsPanel
            selectedDetail={selectedDetail}
            canManageParticipants={false}
            onUpdateParticipantStatus={() => undefined}
            onToggleCheckin={() => undefined}
            onSelfCheckin={onSelfCheckin ?? (async () => {})}
            onSubmitFeedback={onSubmitFeedback}
            isSubmittingFeedback={isSubmittingFeedback}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

// prevent body scroll when modal open is handled inside the component's useEffect
