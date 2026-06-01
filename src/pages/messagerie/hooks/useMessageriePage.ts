import { useEffect, useMemo, useRef, useState } from "react";
import {
  addGroupConversationMembers,
  createGroupConversation,
  createPrivateConversation,
  deleteConversation,
  deleteConversationMessage,
  fetchConversation,
  fetchConversationMessages,
  fetchConversationTypingStatus,
  fetchCurrentUserProfile,
  fetchMessengerUsers,
  fetchMyConversations,
  markConversationAsRead,
  removeGroupConversationMember,
  renameGroupConversation,
  sendPresenceHeartbeat,
  sendConversationMessage,
  setPresenceOffline,
  updateConversationArchive,
  updateConversationMute,
  updateConversationMessagePin,
  updateConversationMessage,
} from "../../../api/messagerie.api";
import {
  emitTypingStatus,
  ensureMessagerieSocket,
  joinConversationSocketRoom,
  leaveConversationSocketRoom,
  subscribeTypingUpdates,
} from "../../../api/messagerie.socket";
import {
  getConversationSortTime,
  isChatbotConversation,
} from "../conversationFilters";
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

function sortConversationsByRecency(items: MessengerConversationSummary[]) {
  return [...items].sort(
    (left, right) =>
      getConversationSortTime(right) - getConversationSortTime(left),
  );
}

function filterUserConversations(items: MessengerConversationSummary[]) {
  return items.filter((conversation) => !isChatbotConversation(conversation));
}

function isChatbotUser(user: MessengerUser) {
  const fullName = `${user.nom} ${user.prenom}`.trim().toLowerCase();
  const role = user.role?.trim().toLowerCase() ?? "";

  return role.includes("chatbot") || fullName === "chatbot assistant";
}

function filterVisibleUsers(items: MessengerUser[]) {
  return items.filter((user) => !isChatbotUser(user));
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
  const [typingUsers, setTypingUsers] = useState<MessengerUser[]>([]);
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
  const activeConversationIdRef = useRef<string | null>(null);
  const composerTextRef = useRef("");
  const isTypingActiveRef = useRef(false);
  const lastTypingSignalAtRef = useRef(0);
  const typingStopTimeoutRef = useRef<number | null>(null);
  const typingHeartbeatRef = useRef<number | null>(null);

  const clearTypingStopTimeout = () => {
    if (typingStopTimeoutRef.current !== null) {
      window.clearTimeout(typingStopTimeoutRef.current);
      typingStopTimeoutRef.current = null;
    }
  };

  const clearTypingHeartbeat = () => {
    if (typingHeartbeatRef.current !== null) {
      window.clearInterval(typingHeartbeatRef.current);
      typingHeartbeatRef.current = null;
    }
  };

  const stopTypingNow = async (conversationId?: string) => {
    clearTypingStopTimeout();
    clearTypingHeartbeat();

    const targetConversationId =
      conversationId ?? activeConversationIdRef.current;
    if (!targetConversationId || !isTypingActiveRef.current) {
      return;
    }

    isTypingActiveRef.current = false;

    emitTypingStatus(targetConversationId, false);
  };

  const scheduleTypingStop = (conversationId: string) => {
    clearTypingStopTimeout();

    typingStopTimeoutRef.current = window.setTimeout(() => {
      void stopTypingNow(conversationId);
    }, 6000);
  };

  const updateMessageType = (nextType: MessengerMessageType) => {
    setMessageType(nextType);
    if (nextType === "TEXT") {
      setAttachmentPreview(null);
      setAttachmentName("");
      setAttachmentMimeType("");
      return;
    }

    void stopTypingNow();
  };

  const me = currentUser;

  const syncConversationSnapshot = (
    nextConversations: MessengerConversationSummary[],
  ) => {
    const visibleConversations = filterUserConversations(nextConversations);

    if (!hasHydratedConversationsRef.current) {
      hasHydratedConversationsRef.current = true;
      const sorted = sortConversationsByRecency(visibleConversations);
      previousConversationsRef.current = sorted;
      setConversations(sorted);
      return;
    }

    const previousById = new Map(
      previousConversationsRef.current.map((item) => [item.id, item]),
    );

    const nextIncomingMessage = visibleConversations.find((item) => {
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

    const sorted = sortConversationsByRecency(visibleConversations);
    previousConversationsRef.current = sorted;
    setConversations(sorted);
  };

  const filteredUsers = useMemo(() => {
    const query = searchRecipient.trim().toLowerCase();
    return filterVisibleUsers(users)
      .filter((user) => user.id !== currentUser?.id)
      .filter((user) => {
        if (!query) return true;
        const haystack = `${user.nom} ${user.prenom}`.toLowerCase();
        return haystack.includes(query);
      });
  }, [currentUser?.id, searchRecipient, users]);

  const groupCandidateUsers = useMemo(() => {
    return filterVisibleUsers(users).filter(
      (user) => user.id !== currentUser?.id,
    );
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
      const visibleUsers = filterVisibleUsers(Array.isArray(data) ? data : []);
      setUsers(visibleUsers);

      const firstOther = visibleUsers.find(
        (user) => user.id !== currentUser?.id,
      );

      if (!selectedRecipientId && firstOther) {
        setSelectedRecipientId(firstOther.id);
      }

      if (
        selectedRecipientId &&
        !visibleUsers.some((user) => user.id === selectedRecipientId) &&
        firstOther
      ) {
        setSelectedRecipientId(firstOther.id);
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
      const readState = await markConversationAsRead(conversationId);
      const messages = await fetchConversationMessages(conversationId);
      setActiveMessages(messages);
      window.dispatchEvent(new Event("messagerie-updated"));
      setConversations((prev) =>
        sortConversationsByRecency(
          prev.map((item) =>
            item.id === conversationId
              ? {
                  ...item,
                  title: conversation.title,
                  type: conversation.type,
                  participant_count: conversation.participant_count,
                  current_user_role: conversation.current_user_role,
                  current_user_last_read_at: readState.lastReadAt,
                  counterpart: conversation.counterpart,
                  last_message: messages[messages.length - 1] ?? null,
                  last_message_at: conversation.last_message_at,
                }
              : item,
          ),
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
    const previousConversationId = activeConversationIdRef.current;
    const nextConversationId = activeConversation?.id ?? null;

    if (
      previousConversationId &&
      previousConversationId !== nextConversationId
    ) {
      void stopTypingNow(previousConversationId);
      leaveConversationSocketRoom(previousConversationId);
      isTypingActiveRef.current = false;
    }

    activeConversationIdRef.current = nextConversationId;
    setTypingUsers([]);

    if (nextConversationId) {
      joinConversationSocketRoom(nextConversationId);
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    const socket = ensureMessagerieSocket();

    if (!socket) {
      return;
    }

    const rejoinActiveConversation = () => {
      const conversationId = activeConversationIdRef.current;
      if (conversationId) {
        joinConversationSocketRoom(conversationId);
      }
    };

    socket.on("connect", rejoinActiveConversation);

    if (activeConversationIdRef.current) {
      joinConversationSocketRoom(activeConversationIdRef.current);
    }

    return () => {
      socket.off("connect", rejoinActiveConversation);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeTypingUpdates((payload) => {
      if (payload.conversationId !== activeConversationIdRef.current) {
        return;
      }

      void fetchConversationTypingStatus(payload.conversationId)
        .then((data) => {
          setTypingUsers(Array.isArray(data.users) ? data.users : []);
        })
        .catch(() => {
          // Ignore transient websocket sync failures; polling will recover.
        });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const conversationId = activeConversation?.id;
    if (!conversationId) {
      return;
    }

    let cancelled = false;

    const syncTypingState = async () => {
      try {
        const data = await fetchConversationTypingStatus(conversationId);
        if (cancelled) return;

        setTypingUsers(Array.isArray(data.users) ? data.users : []);
      } catch {
        if (cancelled) return;
      }
    };

    void syncTypingState();

    const interval = window.setInterval(() => {
      void syncTypingState();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeConversation?.id]);

  useEffect(() => {
    return () => {
      const activeConversationId = activeConversationIdRef.current;
      if (activeConversationId) {
        leaveConversationSocketRoom(activeConversationId);
      }

      void stopTypingNow(activeConversationId ?? undefined);
    };
  }, []);

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

    await openPrivateConversation(selectedRecipientId);
  };

  const openPrivateConversation = async (recipientId: string) => {
    setSelectedRecipientId(recipientId);

    try {
      setSubmitting(true);
      setError(null);
      const conversation = await createPrivateConversation({
        recipientId,
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

  const attachVoiceMessage = (payload: {
    dataUrl: string;
    mimeType: string;
    fileName: string;
  }) => {
    setMessageType("DOCUMENT");
    setAttachmentPreview(payload.dataUrl);
    setAttachmentName(payload.fileName);
    setAttachmentMimeType(payload.mimeType || "audio/webm");
    void stopTypingNow();
  };

  const handleComposerTextChange = (value: string) => {
    composerTextRef.current = value;
    setComposerText(value);

    if (messageType !== "TEXT") {
      return;
    }

    const conversationId = activeConversationIdRef.current;
    if (!conversationId) {
      return;
    }

    const hasText = value.trim().length > 0;

    if (!hasText) {
      void stopTypingNow(conversationId);
      return;
    }

    const now = Date.now();
    const shouldPing =
      !isTypingActiveRef.current || now - lastTypingSignalAtRef.current > 900;

    if (shouldPing) {
      isTypingActiveRef.current = true;
      lastTypingSignalAtRef.current = now;

      emitTypingStatus(conversationId, true);
    }

    if (typingHeartbeatRef.current === null) {
      typingHeartbeatRef.current = window.setInterval(() => {
        const activeId = activeConversationIdRef.current;
        const currentText = composerTextRef.current.trim();

        if (!activeId || currentText.length === 0) {
          void stopTypingNow(activeId ?? undefined);
          return;
        }

        lastTypingSignalAtRef.current = Date.now();
        isTypingActiveRef.current = true;
        emitTypingStatus(activeId, true);
      }, 1500);
    }

    scheduleTypingStop(conversationId);
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
        sortConversationsByRecency(
          prev.map((item) =>
            item.id === activeConversation.id
              ? {
                  ...item,
                  last_message: created,
                  last_message_at: created.created_at,
                }
              : item,
          ),
        ),
      );
      setComposerText("");
      setAttachmentPreview(null);
      setAttachmentName("");
      void stopTypingNow(activeConversation.id);
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

  const deleteConversationById = async (conversationId: string) => {
    try {
      setSubmitting(true);
      setError(null);

      await deleteConversation(conversationId);

      setConversations((prev) =>
        prev.filter((item) => item.id !== conversationId),
      );

      setActiveMessages((prev) =>
        activeConversation?.id === conversationId ? [] : prev,
      );

      setActiveConversation((prev) =>
        prev?.id === conversationId ? null : prev,
      );

      window.dispatchEvent(new Event("messagerie-updated"));
      await refreshConversations();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de supprimer cette conversation.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const archiveConversationById = async (
    conversationId: string,
    isArchived: boolean,
  ) => {
    try {
      setSubmitting(true);
      setError(null);

      const result = await updateConversationArchive(
        conversationId,
        isArchived,
      );

      setConversations((prev) =>
        sortConversationsByRecency(
          prev.map((item) =>
            item.id === conversationId
              ? {
                  ...item,
                  current_user_archived_at: result.archived_at,
                }
              : item,
          ),
        ),
      );

      setActiveConversation((prev) => {
        if (!prev || prev.id !== conversationId) {
          return prev;
        }

        return {
          ...prev,
          current_user_archived_at: result.archived_at,
        };
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de mettre à jour l'archive de la conversation.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const muteConversationById = async (
    conversationId: string,
    payload: { is_muted: boolean; mode?: "1H" | "UNTIL_REACTIVATED" },
  ) => {
    try {
      setSubmitting(true);
      setError(null);

      const result = await updateConversationMute(conversationId, payload);

      setConversations((prev) =>
        sortConversationsByRecency(
          prev.map((item) =>
            item.id === conversationId
              ? {
                  ...item,
                  current_user_muted_at: result.muted_at,
                  current_user_muted_until: result.muted_until,
                  current_user_is_muted: result.is_muted,
                }
              : item,
          ),
        ),
      );

      setActiveConversation((prev) => {
        if (!prev || prev.id !== conversationId) {
          return prev;
        }

        return {
          ...prev,
          current_user_muted_at: result.muted_at,
          current_user_muted_until: result.muted_until,
          current_user_is_muted: result.is_muted,
        };
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de mettre à jour le mute de la conversation.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (!activeConversation) return;

    try {
      setSubmitting(true);
      const updated = await updateConversationMessage(
        activeConversation.id,
        messageId,
        {
          content,
          type: "TEXT",
        },
      );

      setActiveMessages((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );

      setConversations((prev) =>
        prev.map((item) => {
          if (item.id !== activeConversation.id) return item;

          const isLastMessage = item.last_message?.id === updated.id;
          return {
            ...item,
            last_message: isLastMessage ? updated : item.last_message,
          };
        }),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Impossible de modifier ce message.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMessageForMe = async (messageId: string) => {
    if (!activeConversation) return;

    try {
      setSubmitting(true);
      await deleteConversationMessage(activeConversation.id, messageId, "ME");
      setActiveMessages((prev) => prev.filter((item) => item.id !== messageId));
      await refreshConversations();
      window.dispatchEvent(new Event("messagerie-updated"));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de supprimer ce message pour vous.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMessageForEveryone = async (messageId: string) => {
    if (!activeConversation) return;

    try {
      setSubmitting(true);
      const result = await deleteConversationMessage(
        activeConversation.id,
        messageId,
        "EVERYONE",
      );

      if (typeof result === "object" && "id" in result) {
        const updated = result;
        setActiveMessages((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );

        setConversations((prev) =>
          prev.map((item) => {
            if (item.id !== activeConversation.id) return item;
            const isLastMessage = item.last_message?.id === updated.id;

            return {
              ...item,
              last_message: isLastMessage ? updated : item.last_message,
            };
          }),
        );
      }

      window.dispatchEvent(new Event("messagerie-updated"));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de supprimer ce message pour tout le monde.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMessagePin = async (messageId: string, isPinned: boolean) => {
    if (!activeConversation) return;

    try {
      setSubmitting(true);
      const updated = await updateConversationMessagePin(
        activeConversation.id,
        messageId,
        isPinned,
      );

      setActiveMessages((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Impossible de mettre à jour l'épinglage de ce message.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    me,
    users,
    typingUsers,
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
    setComposerText: handleComposerTextChange,
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
    attachVoiceMessage,
    refreshConversations,
    startPrivateConversation,
    openPrivateConversation,
    startGroupConversation,
    openOrReloadConversation,
    deleteConversationById,
    archiveConversationById,
    muteConversationById,
    sendMessage,
    editMessage,
    deleteMessageForMe,
    deleteMessageForEveryone,
    toggleMessagePin,
    renameActiveGroup,
    addMembersToActiveGroup,
    removeMemberFromActiveGroup,
  };
}
