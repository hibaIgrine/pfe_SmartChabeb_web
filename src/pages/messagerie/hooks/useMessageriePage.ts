import { useEffect, useMemo, useRef, useState } from "react";
import {
  addGroupConversationMembers,
  createGroupConversation,
  createPrivateConversation,
  fetchConversation,
  fetchConversationMessages,
  fetchCurrentUserProfile,
  fetchMessengerUsers,
  fetchMyConversations,
  markConversationAsRead,
  removeGroupConversationMember,
  renameGroupConversation,
  sendPresenceHeartbeat,
  sendConversationMessage,
  setPresenceOffline,
} from "../../../api/messagerie.api";
import type {
  MessengerConversation,
  MessengerConversationSummary,
  MessengerMessage,
  MessengerMessageType,
  MessengerUser,
} from "../types";

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
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [messageType, setMessageType] = useState<MessengerMessageType>("TEXT");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedGroupRecipientIds, setSelectedGroupRecipientIds] = useState<
    string[]
  >([]);
  const [searchRecipient, setSearchRecipient] = useState("");
  const [conversationMode, setConversationMode] = useState<"private" | "group">(
    "private",
  );
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null,
  );
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentMimeType, setAttachmentMimeType] = useState("");

  const hasHydratedConversationsRef = useRef(false);
  const previousConversationsRef = useRef<MessengerConversationSummary[]>([]);

  const updateMessageType = (nextType: MessengerMessageType) => {
    setMessageType(nextType);
    if (nextType === "TEXT") {
      setAttachmentPreview(null);
      setAttachmentName("");
      setAttachmentMimeType("");
    }
  };

  const me = currentUser;

  const syncConversationSnapshot = (
    nextConversations: MessengerConversationSummary[],
  ) => {
    if (!hasHydratedConversationsRef.current) {
      hasHydratedConversationsRef.current = true;
      previousConversationsRef.current = nextConversations;
      setConversations(nextConversations);
      return;
    }

    const previousById = new Map(
      previousConversationsRef.current.map((item) => [item.id, item]),
    );

    const nextIncomingMessage = nextConversations.find((item) => {
      const previous = previousById.get(item.id);
      if (!previous) return false;

      const previousMessageId = previous.last_message?.id;
      const nextMessage = item.last_message;

      if (!nextMessage || !nextMessage.id) return false;
      if (previousMessageId === nextMessage.id) return false;
      if (nextMessage.sender_id === currentUser?.id) return false;
      if (
        activeConversation?.id === item.id &&
        document.visibilityState === "visible"
      ) {
        return false;
      }

      return true;
    });

    if (nextIncomingMessage) {
      window.dispatchEvent(new Event("messagerie-updated"));
    }

    previousConversationsRef.current = nextConversations;
    setConversations(nextConversations);
  };

  const filteredUsers = useMemo(() => {
    const query = searchRecipient.trim().toLowerCase();
    return users
      .filter((user) => user.id !== currentUser?.id)
      .filter((user) => {
        if (!query) return true;
        const haystack = `${user.nom} ${user.prenom}`.toLowerCase();
        return haystack.includes(query);
      });
  }, [currentUser?.id, searchRecipient, users]);

  const groupCandidateUsers = useMemo(() => {
    return users.filter((user) => user.id !== currentUser?.id);
  }, [currentUser?.id, users]);

  const refreshCurrentUser = async () => {
    try {
      const data = await fetchCurrentUserProfile();
      setCurrentUser(data);
    } catch {
      setCurrentUser(null);
    }
  };

  const refreshConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await fetchMyConversations();
      syncConversationSnapshot(data ?? []);
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
        const firstOther = data.find((user) => user.id !== currentUser?.id);
        if (firstOther) {
          setSelectedRecipientId(firstOther.id);
        }
      }
    } catch {
      setUsers([]);
    }
  };

  const refreshAll = async () => {
    await refreshCurrentUser();
    await Promise.all([refreshConversations(), refreshUsers()]);
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
                title: conversation.title,
                type: conversation.type,
                participant_count: conversation.participant_count,
                current_user_role: conversation.current_user_role,
                counterpart: conversation.counterpart,
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
    void refreshAll();
  }, []);

  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await sendPresenceHeartbeat();
      } catch {
        // Ignore heartbeat errors to avoid disrupting messaging flow.
      }
    };

    const markOffline = async () => {
      try {
        await setPresenceOffline();
      } catch {
        // Ignore offline update errors when tab is closed or hidden.
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
        return;
      }

      void markOffline();
    };

    const onBeforeUnload = () => {
      void markOffline();
    };

    void sendHeartbeat();

    const heartbeatInterval = window.setInterval(() => {
      void sendHeartbeat();
    }, 30000);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      void markOffline();
    };
  }, []);

  useEffect(() => {
    if (conversations.length > 0 && !activeConversation) {
      void openConversation(conversations[0].id);
    }
  }, [activeConversation, conversations]);

  useEffect(() => {
    const pollConversations = async () => {
      try {
        const data = await fetchMyConversations();
        syncConversationSnapshot(data ?? []);
      } catch {
        // Silent polling to avoid noisy UI errors.
      }
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void pollConversations();
      }
    }, 12000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeConversation?.id, currentUser?.id]);

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
      setConversationMode("private");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Impossible de créer la conversation.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startGroupConversation = async () => {
    const title = groupTitle.trim();
    if (!title) {
      setError("Nom de groupe obligatoire.");
      return;
    }

    if (selectedGroupRecipientIds.length === 0) {
      setError("Ajoute au moins un utilisateur au groupe.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const conversation = await createGroupConversation({
        title,
        participantIds: selectedGroupRecipientIds,
      });
      await refreshConversations();
      setActiveConversation(conversation);
      setActiveMessages(conversation.messages ?? []);
      setGroupTitle("");
      setSelectedGroupRecipientIds([]);
      setConversationMode("group");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Impossible de créer le groupe.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleGroupRecipient = (recipientId: string) => {
    setSelectedGroupRecipientIds((prev) =>
      prev.includes(recipientId)
        ? prev.filter((item) => item !== recipientId)
        : [...prev, recipientId],
    );
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

  const renameActiveGroup = async (title: string) => {
    if (!activeConversation) return;

    try {
      setSubmitting(true);
      const updated = await renameGroupConversation(activeConversation.id, {
        title,
      });
      setActiveConversation(updated);
      setActiveMessages(updated.messages ?? []);
      await refreshConversations();
    } finally {
      setSubmitting(false);
    }
  };

  const addMembersToActiveGroup = async (userIds: string[]) => {
    if (!activeConversation) return;

    try {
      setSubmitting(true);
      const updated = await addGroupConversationMembers(activeConversation.id, {
        userIds,
      });
      setActiveConversation(updated);
      setActiveMessages(updated.messages ?? []);
      await refreshConversations();
    } finally {
      setSubmitting(false);
    }
  };

  const removeMemberFromActiveGroup = async (userId: string) => {
    if (!activeConversation) return;

    try {
      setSubmitting(true);
      const updated = await removeGroupConversationMember(
        activeConversation.id,
        userId,
      );
      setActiveConversation(updated);
      setActiveMessages(updated.messages ?? []);
      await refreshConversations();
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
    groupCandidateUsers,
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
    conversationMode,
    setConversationMode,
    groupTitle,
    setGroupTitle,
    selectedGroupRecipientIds,
    toggleGroupRecipient,
    attachmentPreview,
    attachmentName,
    attachmentMimeType,
    handleAttachmentChange,
    clearAttachment,
    refreshConversations,
    startPrivateConversation,
    startGroupConversation,
    openOrReloadConversation,
    sendMessage,
    renameActiveGroup,
    addMembersToActiveGroup,
    removeMemberFromActiveGroup,
  };
}
