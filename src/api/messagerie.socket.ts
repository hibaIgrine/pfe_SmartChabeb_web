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
