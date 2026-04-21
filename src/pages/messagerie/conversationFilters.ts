import type { MessengerConversationSummary } from "../../api/messagerie.api";

export type ConversationListFilterMode =
  | "ALL"
  | "UNREAD"
  | "GROUP"
  | "ARCHIVED";

export function getConversationSortTime(
  conversation: MessengerConversationSummary,
) {
  return new Date(
    conversation.last_message_at ??
      conversation.updated_at ??
      conversation.created_at,
  ).getTime();
}

export function isConversationUnread(
  conversation: MessengerConversationSummary,
  meId?: string | null,
) {
  const lastMessage = conversation.last_message;
  const lastReadAt = conversation.current_user_last_read_at;

  if (!lastMessage || !lastReadAt) {
    return false;
  }

  if (meId && lastMessage.sender_id === meId) {
    return false;
  }

  return (
    new Date(lastMessage.created_at).getTime() > new Date(lastReadAt).getTime()
  );
}

export function filterConversations(
  conversations: MessengerConversationSummary[],
  mode: ConversationListFilterMode,
  meId?: string | null,
) {
  return conversations
    .filter((conversation) => {
      const isArchived = Boolean(conversation.current_user_archived_at);
      const isGroup = conversation.type === "group";
      const unread = isConversationUnread(conversation, meId);

      if (mode === "ARCHIVED") {
        return isArchived;
      }

      if (mode === "UNREAD") {
        return unread && !isArchived;
      }

      if (mode === "GROUP") {
        return isGroup && !isArchived;
      }

      return !isArchived;
    })
    .sort(
      (left, right) =>
        getConversationSortTime(right) - getConversationSortTime(left),
    );
}
