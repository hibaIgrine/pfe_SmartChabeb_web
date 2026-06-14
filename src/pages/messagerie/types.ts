/**
 * types.ts — Types TypeScript locaux du module messagerie (frontend uniquement).
 *
 * TYPES RE-EXPORTÉS depuis messagerie.api :
 *   MessengerConversation, MessengerConversationSummary, MessengerMessage,
 *   MessengerMessageType, MessengerUser
 *
 * TYPES LOCAUX (état UI) :
 *   ConversationViewMode  — 'empty' | 'loading' | 'ready'
 *                           Contrôle l'affichage de ConversationView
 *   MessageDraftAttachment— Pièce jointe en cours de composition
 *                           { type: MessengerMessageType, url: string, name: string }
 *   TypingStatus          — { conversationId, users: MessengerUser[], updatedAt }
 *                           Reçu du Socket.IO pour afficher "X est en train d'écrire..."
 */
import type {
  MessengerConversation,
  MessengerConversationSummary,
  MessengerMessage,
  MessengerMessageType,
  MessengerUser,
} from "../../api/messagerie.api";

export type {
  MessengerConversation,
  MessengerConversationSummary,
  MessengerMessage,
  MessengerMessageType,
  MessengerUser,
};

export type ConversationViewMode = "empty" | "loading" | "ready";

export type MessageDraftAttachment = {
  type: MessengerMessageType;
  mediaUrl: string;
  fileName: string;
};

export type ConversationMuteMode = "1H" | "UNTIL_REACTIVATED";
