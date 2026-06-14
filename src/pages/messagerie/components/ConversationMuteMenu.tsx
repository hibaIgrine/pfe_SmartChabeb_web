/**
 * ConversationMuteMenu.tsx — Menu de sourdine pour une conversation.
 *
 * RÔLE :
 *   Petit menu déroulant (overlay) permettant de désactiver les notifications
 *   d'une conversation pour une durée choisie.
 *
 * OPTIONS :
 *   • Mettre en sourdine 1 heure  (ConversationMuteMode: '1H')
 *   • Mettre en sourdine jusqu'à réactivation ('UNTIL_REACTIVATED')
 *   • Réactiver les notifications (si déjà en sourdine)
 *
 * ACCÈS :
 *   Ouvert via le bouton 🔔/🔕 dans ConversationView.
 */
import { BellOff, BellRing, Clock3, X } from "lucide-react";

export type ConversationMuteMenuProps = {
  open: boolean;
  isMuted: boolean;
  onMuteForOneHour: () => void;
  onMuteUntilReactivated: () => void;
  onUnmute: () => void;
  onClose: () => void;
};

export function ConversationMuteMenu({
  open,
  isMuted,
  onMuteForOneHour,
  onMuteUntilReactivated,
  onUnmute,
  onClose,
}: ConversationMuteMenuProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
      <div className="mb-2 flex items-center justify-between px-2 py-1">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#436D75]">
          Notifications
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
          title="Fermer"
        >
          <X size={13} />
        </button>
      </div>

      <button
        type="button"
        onClick={onMuteForOneHour}
        className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-700 transition hover:bg-[#F7F3E9]"
      >
        <Clock3 size={13} className="mt-0.5 shrink-0" />
        <span>
          Couper les notifications pendant 1 heure
          <span className="mt-0.5 block font-medium normal-case text-gray-500">
            Reprise automatique après 60 minutes.
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onMuteUntilReactivated}
        className="mt-1 flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-700 transition hover:bg-[#F7F3E9]"
      >
        <BellOff size={13} className="mt-0.5 shrink-0" />
        <span>
          Couper jusqu’à réactivation
          <span className="mt-0.5 block font-medium normal-case text-gray-500">
            Aucun signal ne sera envoyé tant que tu ne réactives pas.
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onUnmute}
        disabled={!isMuted}
        className="mt-1 flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-[#436D75] transition hover:bg-[#F7F3E9] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <BellRing size={13} className="mt-0.5 shrink-0" />
        <span>
          Réactiver les notifications
          <span className="mt-0.5 block font-medium normal-case text-gray-500">
            Remet la conversation en mode normal.
          </span>
        </span>
      </button>
    </div>
  );
}
