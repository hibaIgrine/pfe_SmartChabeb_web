/**
 * messagerie.api.ts — Appels API REST pour le module de messagerie instantanée.
 *
 * RÔLE :
 *   Toutes les opérations HTTP (CRUD) sur les conversations et messages.
 *   Le temps réel (événements Socket.IO) est géré séparément dans messagerie.socket.ts.
 *
 * TYPES PRINCIPAUX :
 *   MessengerUser          — Profil réduit d'un participant (id, nom, prenom, photo, online)
 *   MessengerMessage       — Message avec statut SENT/DELIVERED/READ, media[], sender
 *   MessengerParticipant   — Participant avec ses métadonnées (rôle, mute, archive, read)
 *   MessengerConversationSummary — Aperçu de conversation pour la liste gauche
 *   MessengerConversation  — Conversation complète avec participants[] + messages[]
 *
 * FONCTIONS PAR CATÉGORIE :
 *
 *   CONVERSATIONS :
 *     fetchMyConversations()           — Liste toutes mes conversations (triées par last_message_at)
 *     createPrivateConversation()      — Crée ou retourne une conv privée avec un user
 *     createGroupConversation()        — Crée un groupe (titre + participants)
 *     fetchConversation(id)            — Détail complet d'une conversation
 *     deleteConversation(id)           — Supprime une conversation
 *     renameGroupConversation()        — Change le titre du groupe
 *     addGroupConversationMembers()    — Ajoute des membres au groupe
 *     removeGroupConversationMember()  — Retire un membre du groupe
 *     updateConversationMute()         — Active/désactive le mute (1H ou INDEFINI)
 *     updateConversationArchive()      — Archive/désarchive la conversation
 *     markConversationAsRead()         — Marque tous les messages comme lus
 *
 *   MESSAGES :
 *     fetchConversationMessages(id)    — Charge tous les messages d'une conversation
 *     sendConversationMessage()        — Envoie un message (TEXT/IMAGE/VIDEO/DOCUMENT)
 *     updateConversationMessage()      — Édite un message existant
 *     updateConversationMessagePin()   — Épingle/désépingle un message
 *     deleteConversationMessage()      — Supprime pour soi (ME) ou pour tous (EVERYONE)
 *
 *   TYPAGE EN TEMPS RÉEL :
 *     fetchConversationTypingStatus()  — Récupère qui est en train de taper (polling)
 *     sendTypingStatus()               — Notifie que l'utilisateur tape ou s'arrête
 *
 *   PRÉSENCE :
 *     sendPresenceHeartbeat()          — Maintient le statut "en ligne" (appelé toutes les 30s)
 *     setPresenceOffline()             — Force le statut "hors ligne" (beforeunload)
 *     fetchUnreadMessagesCount()       — Badge non-lu dans le Layout
 */
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
  archived_at?: string | null;
  muted_at?: string | null;
  muted_until?: string | null;
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
  pinned_at?: string | null;
  pinned_by?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  deleted_for_everyone_at?: string | null;
  deleted_for_everyone_by?: string | null;
  sender: MessengerUser;
  pinned_by_user?: MessengerUser | null;
};

export type DeleteMessageScope = "ME" | "EVERYONE";

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
  current_user_last_read_at?: string | null;
  current_user_archived_at?: string | null;
  current_user_muted_at?: string | null;
  current_user_muted_until?: string | null;
  current_user_is_muted?: boolean;
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

export type UpdateConversationMutePayload = {
  is_muted: boolean;
  mode?: "1H" | "UNTIL_REACTIVATED";
};

export type CreateMessengerMessagePayload = {
  type: MessengerMessageType;
  content?: string;
  media?: string[];
};

export type UpdateMessengerMessagePayload = {
  type?: MessengerMessageType;
  content?: string;
  media?: string[];
};

export type MessengerUnreadCountResponse = {
  count: number;
};

export type MessengerTypingStatusResponse = {
  conversationId: string;
  users: MessengerUser[];
  updatedAt: string;
};

export async function fetchMessengerUsers() {
  const response = await api.get<MessengerUser[]>("/messagerie/users");
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

export async function fetchConversationTypingStatus(conversationId: string) {
  const response = await api.get<MessengerTypingStatusResponse>(
    `/messagerie/conversations/${conversationId}/typing`,
  );
  return response.data;
}

export async function sendTypingStatus(
  conversationId: string,
  isTyping: boolean,
) {
  const response = await api.patch<{
    conversationId: string;
    is_typing: boolean;
    last_typing_at: string | null;
  }>(`/messagerie/conversations/${conversationId}/typing`, {
    is_typing: isTyping,
  });

  return response.data;
}

export async function deleteConversation(conversationId: string) {
  const response = await api.delete<{
    deleted: boolean;
    scope: "ME" | "EVERYONE";
    conversationId: string;
  }>(`/messagerie/conversations/${conversationId}`);

  return response.data;
}

export async function updateConversationMute(
  conversationId: string,
  payload: UpdateConversationMutePayload,
) {
  const response = await api.patch<{
    conversationId: string;
    is_muted: boolean;
    muted_at: string | null;
    muted_until: string | null;
    mode: "1H" | "UNTIL_REACTIVATED" | null;
  }>(`/messagerie/conversations/${conversationId}/mute`, payload);

  return response.data;
}

export async function updateConversationArchive(
  conversationId: string,
  isArchived: boolean,
) {
  const response = await api.patch<{
    conversationId: string;
    is_archived: boolean;
    archived_at: string | null;
  }>(`/messagerie/conversations/${conversationId}/archive`, {
    is_archived: isArchived,
  });

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

export async function updateConversationMessage(
  conversationId: string,
  messageId: string,
  payload: UpdateMessengerMessagePayload,
) {
  const response = await api.patch<MessengerMessage>(
    `/messagerie/conversations/${conversationId}/messages/${messageId}`,
    payload,
  );
  return response.data;
}

export async function updateConversationMessagePin(
  conversationId: string,
  messageId: string,
  isPinned: boolean,
) {
  const response = await api.patch<MessengerMessage>(
    `/messagerie/conversations/${conversationId}/messages/${messageId}/pin`,
    {
      is_pinned: isPinned,
    },
  );

  return response.data;
}

export async function deleteConversationMessage(
  conversationId: string,
  messageId: string,
  scope: DeleteMessageScope,
) {
  const response = await api.delete<
    | MessengerMessage
    | {
        success: boolean;
        scope: DeleteMessageScope;
        messageId: string;
      }
  >(`/messagerie/conversations/${conversationId}/messages/${messageId}`, {
    data: { scope },
  });

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
