/**
 * messagerie.socket.ts — Gestion du socket Socket.IO pour la messagerie temps réel.
 *
 * RÔLE :
 *   Crée et maintient UNE SEULE connexion WebSocket (singleton module-level `socket`)
 *   partagée par toute l'application. Complète messagerie.api.ts en ajoutant
 *   les événements push (nouvelles réceptions de messages, indicateurs de frappe).
 *
 * CONNEXION :
 *   URL = VITE_API_URL || 'http://localhost:3000'
 *   Transport = WebSocket uniquement (pas de fallback long-polling)
 *   Auth = { token: JWT } transmis dans le handshake Socket.IO
 *   → Le backend MessagerieGateway extrait ce token pour identifier l'utilisateur
 *
 * PATTERN SINGLETON :
 *   `socket` est une variable module-level. getMessagerieSocket() :
 *     - Déconnecte si aucun token en localStorage
 *     - Crée le socket si inexistant
 *     - Reconnecte si déconnecté
 *     - Retourne null si non authentifié
 *
 * FONCTIONS EXPORTÉES :
 *   getMessagerieSocket()          — Retourne le socket connecté (ou null si non auth)
 *   ensureMessagerieSocket()       — Alias de getMessagerieSocket (sémantique impérative)
 *   subscribeTypingUpdates(handler)— Écoute l'événement 'conversation:typing'
 *                                    Retourne une fonction de désinscription (cleanup useEffect)
 *   joinConversationSocketRoom(id) — Émet 'conversation:join' → le serveur ajoute le client
 *                                    à la room Socket.IO "conversation:<id>"
 *   leaveConversationSocketRoom(id)— Émet 'conversation:leave' → quitte la room
 *   emitTypingStatus(id, bool)     — Émet 'conversation:typing' {conversationId, isTyping}
 *
 * ÉVÉNEMENT ÉCOUTÉ :
 *   'conversation:typing' — Reçu quand un autre participant tape dans la même conversation.
 *     Payload : { conversationId, users: MessengerUser[], updatedAt }
 */
import { io, type Socket } from "socket.io-client";
import type { MessengerUser } from "./messagerie.api";

type ConversationTypingEvent = {
  conversationId: string;
  users: MessengerUser[];
  updatedAt: string;
};

let socket: Socket | null = null;

function getSocketBaseUrl() {
  return import.meta.env.VITE_API_URL || "http://localhost:3000";
}

export function getMessagerieSocket() {
  const token = localStorage.getItem("token");

  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    return null;
  }

  if (!socket) {
    socket = io(getSocketBaseUrl(), {
      autoConnect: false,
      transports: ["websocket"],
      auth: {
        token,
      },
    });
  } else {
    socket.auth = {
      token,
    };
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function ensureMessagerieSocket() {
  return getMessagerieSocket();
}

export function subscribeTypingUpdates(
  handler: (payload: ConversationTypingEvent) => void,
) {
  const instance = getMessagerieSocket();
  if (!instance) return () => {};

  instance.on("conversation:typing", handler);

  return () => {
    instance.off("conversation:typing", handler);
  };
}

export function joinConversationSocketRoom(conversationId: string) {
  const instance = getMessagerieSocket();
  instance?.emit("conversation:join", { conversationId });
}

export function leaveConversationSocketRoom(conversationId: string) {
  const instance = getMessagerieSocket();
  instance?.emit("conversation:leave", { conversationId });
}

export function emitTypingStatus(conversationId: string, isTyping: boolean) {
  const instance = getMessagerieSocket();
  instance?.emit("conversation:typing", {
    conversationId,
    isTyping,
  });
}
