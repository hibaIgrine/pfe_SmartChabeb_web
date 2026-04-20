import { useEffect, useMemo, useState } from "react";
import {
  createPrivateConversation,
  fetchConversation,
  fetchConversationMessages,
  fetchMessengerUsers,
  fetchMyConversations,
  markConversationAsRead,
  sendConversationMessage,
} from "../../../api/messagerie.api";
import type {
  MessengerConversation,
  MessengerConversationSummary,
  MessengerMessage,
  MessengerMessageType,
  MessengerUser,
} from "../types";

function readStoredUserId() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as { id?: string };
    return typeof user.id === "string" ? user.id : null;
  } catch {
    return null;
  }
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });
}

export function useMessageriePage() {
  const [conversations, setConversations] = useState<
    MessengerConversationSummary[]
  >([]);
  const [activeConversation, setActiveConversation] =
    useState<MessengerConversation | null>(null);
  const [activeMessages, setActiveMessages] = useState<MessengerMessage[]>([]);
  const [users, setUsers] = useState<MessengerUser[]>([]);
  const [currentUserId] = useState<string | null>(() => readStoredUserId());
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [messageType, setMessageType] = useState<MessengerMessageType>("TEXT");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [searchRecipient, setSearchRecipient] = useState("");
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null,
  );
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentMimeType, setAttachmentMimeType] = useState("");

  const updateMessageType = (nextType: MessengerMessageType) => {
    setMessageType(nextType);
    if (nextType === "TEXT") {
      setAttachmentPreview(null);
      setAttachmentName("");
      setAttachmentMimeType("");
    }
  };

  const me = useMemo(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;

    try {
      return JSON.parse(raw) as MessengerUser;
    } catch {
      return null;
    }
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchRecipient.trim().toLowerCase();
    return users
      .filter((user) => user.id !== currentUserId)
      .filter((user) => {
        if (!query) return true;
        const haystack = `${user.nom} ${user.prenom}`.toLowerCase();
        return haystack.includes(query);
      });
  }, [currentUserId, searchRecipient, users]);

  const refreshConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await fetchMyConversations();
      setConversations(data ?? []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de charger les conversations.",
      );
    } finally {
      setLoadingConversations(false);
    }
  };

  const refreshUsers = async () => {
    try {
      const data = await fetchMessengerUsers();
      setUsers(Array.isArray(data) ? data : []);
      if (!selectedRecipientId && data.length > 0) {
        const firstOther = data.find((user) => user.id !== currentUserId);
        if (firstOther) {
          setSelectedRecipientId(firstOther.id);
        }
      }
    } catch {
      setUsers([]);
    }
  };

  const openConversation = async (conversationId: string) => {
    try {
      setLoadingConversation(true);
      setError(null);
      const conversation = await fetchConversation(conversationId);
      setActiveConversation(conversation);
      await markConversationAsRead(conversationId);
      const messages = await fetchConversationMessages(conversationId);
      setActiveMessages(messages);
      window.dispatchEvent(new Event("messagerie-updated"));
      setConversations((prev) =>
        prev.map((item) =>
          item.id === conversationId
            ? {
                ...item,
                last_message: messages[messages.length - 1] ?? null,
                last_message_at: conversation.last_message_at,
              }
            : item,
        ),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Impossible d'ouvrir la conversation.",
      );
    } finally {
      setLoadingConversation(false);
    }
  };

  useEffect(() => {
    void refreshConversations();
    void refreshUsers();
  }, []);

  useEffect(() => {
    if (conversations.length > 0 && !activeConversation) {
      void openConversation(conversations[0].id);
    }
  }, [activeConversation, conversations]);

  const startPrivateConversation = async () => {
    if (!selectedRecipientId) {
      setError("Sélectionne un destinataire.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const conversation = await createPrivateConversation({
        recipientId: selectedRecipientId,
      });
      await refreshConversations();
      setActiveConversation(conversation);
      setActiveMessages(conversation.messages ?? []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Impossible de créer la conversation.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachmentChange = async (file: File | null) => {
    if (!file) {
      setAttachmentPreview(null);
      setAttachmentName("");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setAttachmentPreview(dataUrl);
      setAttachmentName(file.name);
      setAttachmentMimeType(file.type || "");
    } catch {
      setError("Impossible de charger le fichier.");
    }
  };

  const clearAttachment = () => {
    setAttachmentPreview(null);
    setAttachmentName("");
    setAttachmentMimeType("");
  };

  const sendMessage = async () => {
    if (!activeConversation) {
      setError("Ouvre d'abord une conversation.");
      return;
    }

    const normalizedText = composerText.trim();
    const payload = {
      type: messageType,
      content: messageType === "TEXT" ? normalizedText : undefined,
      media: attachmentPreview ? [attachmentPreview] : undefined,
    };

    if (messageType === "TEXT" && !normalizedText) {
      setError("Le message texte est vide.");
      return;
    }

    if (messageType !== "TEXT" && !attachmentPreview) {
      setError("Ajoute un fichier pour ce type de message.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const created = await sendConversationMessage(
        activeConversation.id,
        payload,
      );
      setActiveMessages((prev) => [...prev, created]);
      setConversations((prev) =>
        prev.map((item) =>
          item.id === activeConversation.id
            ? {
                ...item,
                last_message: created,
                last_message_at: created.created_at,
              }
            : item,
        ),
      );
      setComposerText("");
      setAttachmentPreview(null);
      setAttachmentName("");
      await markConversationAsRead(activeConversation.id);
      window.dispatchEvent(new Event("messagerie-updated"));
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Impossible d'envoyer le message.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openOrReloadConversation = async (conversationId: string) => {
    await openConversation(conversationId);
  };

  return {
    me,
    users,
    filteredUsers,
    conversations,
    activeConversation,
    activeMessages,
    loadingConversations,
    loadingConversation,
    submitting,
    error,
    composerText,
    setComposerText,
    messageType,
    setMessageType: updateMessageType,
    selectedRecipientId,
    setSelectedRecipientId,
    searchRecipient,
    setSearchRecipient,
    attachmentPreview,
    attachmentName,
    attachmentMimeType,
    handleAttachmentChange,
    clearAttachment,
    refreshConversations,
    startPrivateConversation,
    openOrReloadConversation,
    sendMessage,
  };
}
