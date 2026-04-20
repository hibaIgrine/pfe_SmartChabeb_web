import api from "./axios";

export type MessengerUser = {
  id: string;
  nom: string;
  prenom: string;
  photo_profil_url?: string | null;
  role?: string;
  is_online?: boolean;
  last_seen_at?: string | null;
};

export type MessengerMessageType = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
export type MessengerMessageStatus = "SENT" | "DELIVERED" | "READ";

export type MessengerParticipant = {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  last_read_at?: string | null;
  user: MessengerUser;
};

export type MessengerMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessengerMessageType;
  status: MessengerMessageStatus;
  content?: string | null;
  media?: string[] | null;
  created_at: string;
  updated_at: string;
  edited_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  sender: MessengerUser;
};

export type MessengerConversationSummary = {
  id: string;
  type: string;
  title?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  last_message_at?: string | null;
  participant_count?: number;
  current_user_role?: string | null;
  counterpart?: MessengerUser | null;
  last_message?: MessengerMessage | null;
};

export type MessengerConversation = MessengerConversationSummary & {
  participants: MessengerParticipant[];
  messages: MessengerMessage[];
};

export type CreatePrivateConversationPayload = {
  recipientId: string;
};

export type CreateGroupConversationPayload = {
  title: string;
  participantIds: string[];
};

export type UpdateConversationTitlePayload = {
  title: string;
};

export type UpdateConversationMembersPayload = {
  userIds: string[];
};

export type CreateMessengerMessagePayload = {
  type: MessengerMessageType;
  content?: string;
  media?: string[];
};

export type MessengerUnreadCountResponse = {
  count: number;
};

export async function fetchMessengerUsers() {
  const response = await api.get<MessengerUser[]>("/users");
  return response.data;
}

export async function fetchCurrentUserProfile() {
  const response = await api.get<MessengerUser & { role?: string }>(
    "/users/me/profile",
  );
  return response.data;
}

export async function fetchMyConversations() {
  const response = await api.get<MessengerConversationSummary[]>(
    "/messagerie/conversations/me",
  );
  return response.data;
}

export async function createPrivateConversation(
  payload: CreatePrivateConversationPayload,
) {
  const response = await api.post<MessengerConversation>(
    "/messagerie/conversations/private",
    payload,
  );
  return response.data;
}

export async function createGroupConversation(
  payload: CreateGroupConversationPayload,
) {
  const response = await api.post<MessengerConversation>(
    "/messagerie/conversations/group",
    payload,
  );
  return response.data;
}

export async function fetchConversation(conversationId: string) {
  const response = await api.get<MessengerConversation>(
    `/messagerie/conversations/${conversationId}`,
  );
  return response.data;
}

export async function fetchConversationMessages(conversationId: string) {
  const response = await api.get<MessengerMessage[]>(
    `/messagerie/conversations/${conversationId}/messages`,
  );
  return response.data;
}

export async function sendConversationMessage(
  conversationId: string,
  payload: CreateMessengerMessagePayload,
) {
  const response = await api.post<MessengerMessage>(
    `/messagerie/conversations/${conversationId}/messages`,
    payload,
  );
  return response.data;
}

export async function renameGroupConversation(
  conversationId: string,
  payload: UpdateConversationTitlePayload,
) {
  const response = await api.patch<MessengerConversation>(
    `/messagerie/conversations/${conversationId}/title`,
    payload,
  );
  return response.data;
}

export async function addGroupConversationMembers(
  conversationId: string,
  payload: UpdateConversationMembersPayload,
) {
  const response = await api.post<MessengerConversation>(
    `/messagerie/conversations/${conversationId}/members`,
    payload,
  );
  return response.data;
}

export async function removeGroupConversationMember(
  conversationId: string,
  memberUserId: string,
) {
  const response = await api.delete<MessengerConversation>(
    `/messagerie/conversations/${conversationId}/members/${memberUserId}`,
  );
  return response.data;
}

export async function markConversationAsRead(conversationId: string) {
  const response = await api.patch<{
    conversationId: string;
    lastReadAt: string;
  }>(`/messagerie/conversations/${conversationId}/read`);
  return response.data;
}

export async function fetchUnreadMessagesCount() {
  const response = await api.get<MessengerUnreadCountResponse>(
    "/messagerie/unread-count",
  );
  return response.data;
}

export async function sendPresenceHeartbeat() {
  const response = await api.patch<{
    is_online: boolean;
    last_seen_at: string;
  }>("/messagerie/presence/heartbeat");
  return response.data;
}

export async function setPresenceOffline() {
  const response = await api.patch<{
    is_online: boolean;
    last_seen_at: string;
  }>("/messagerie/presence/offline");
  return response.data;
}
