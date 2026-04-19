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
