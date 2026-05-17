import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCircle2, Clock3, Pencil, Send } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  fetchMyNotifications,
  fetchUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type InAppNotification,
} from "../../api/notifications.api";
import {
  fetchCurrentUserProfile,
  fetchMyConversations,
  fetchUnreadMessagesCount,
  type MessengerConversationSummary,
} from "../../api/messagerie.api";

type MessageNotificationItem = {
  conversationId: string;
  title: string;
  subtitle: string;
  createdAt?: string | null;
};

type TaskNotificationData = {
  taskId?: string;
  taskTitle?: string;
  clubId?: string;
  clubNom?: string;
  assignedById?: string;
  assignedByNomComplet?: string;
  updatedById?: string;
  updatedByNomComplet?: string;
  completedById?: string;
  completedByNomComplet?: string;
  dateLimite?: string;
  reminderWindow?: string;
  changes?: string[];
};

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "A l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

function getCurrentUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return typeof user?.role === "string" ? user.role.toUpperCase() : "";
  } catch {
    return "";
  }
}

function isManagerRole(role: string) {
  return ["RESPONSABLE_CLUB", "RESPONSABLE_CENTRE", "ADMIN"].includes(role);
}

function getTaskNotificationData(
  notification: InAppNotification,
): TaskNotificationData | null {
  if (!notification.data || typeof notification.data !== "object") {
    return null;
  }

  const data = notification.data as Record<string, unknown>;
  const taskId = data.taskId;

  if (typeof taskId !== "string" || !taskId.trim()) {
    return null;
  }

  return {
    taskId,
    taskTitle: typeof data.taskTitle === "string" ? data.taskTitle : undefined,
    clubId: typeof data.clubId === "string" ? data.clubId : undefined,
    clubNom: typeof data.clubNom === "string" ? data.clubNom : undefined,
    assignedById:
      typeof data.assignedById === "string" ? data.assignedById : undefined,
    assignedByNomComplet:
      typeof data.assignedByNomComplet === "string"
        ? data.assignedByNomComplet
        : undefined,
    updatedById:
      typeof data.updatedById === "string" ? data.updatedById : undefined,
    updatedByNomComplet:
      typeof data.updatedByNomComplet === "string"
        ? data.updatedByNomComplet
        : undefined,
    completedById:
      typeof data.completedById === "string" ? data.completedById : undefined,
    completedByNomComplet:
      typeof data.completedByNomComplet === "string"
        ? data.completedByNomComplet
        : undefined,
    dateLimite:
      typeof data.dateLimite === "string" ? data.dateLimite : undefined,
    reminderWindow:
      typeof data.reminderWindow === "string" ? data.reminderWindow : undefined,
    changes: Array.isArray(data.changes)
      ? data.changes.filter(
          (change): change is string => typeof change === "string",
        )
      : undefined,
  };
}

function isTaskNotification(notification: InAppNotification) {
  return [
    "TASK_ASSIGNED",
    "TASK_UPDATED",
    "TASK_COMPLETED",
    "TASK_REMINDER",
  ].includes(notification.type);
}

function getTaskNotificationIcon(type: string) {
  if (type === "TASK_UPDATED") {
    return <Pencil size={12} />;
  }

  if (type === "TASK_COMPLETED") {
    return <CheckCircle2 size={12} />;
  }

  if (type === "TASK_REMINDER") {
    return <Clock3 size={12} />;
  }

  return <Send size={12} />;
}

function getTaskNotificationTone(type: string) {
  if (type === "TASK_UPDATED") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }

  if (type === "TASK_COMPLETED") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (type === "TASK_REMINDER") {
    return "bg-sky-100 text-sky-700 border-sky-200";
  }

  return "bg-violet-100 text-violet-700 border-violet-200";
}

function getTaskNotificationTitle(type: string) {
  if (type === "TASK_UPDATED") return "Tache modifiee";
  if (type === "TASK_COMPLETED") return "Tache terminee";
  if (type === "TASK_REMINDER") return "Echeance proche";
  return "Nouvelle tache";
}

function getTaskNotificationSubtitle(notification: InAppNotification) {
  const data = getTaskNotificationData(notification);
  if (!data) {
    return notification.message;
  }

  const base = data.taskTitle
    ? `Tache: ${data.taskTitle}`
    : notification.message;
  const club = data.clubNom ? `Club: ${data.clubNom}` : null;
  const details =
    notification.type === "TASK_UPDATED" && data.changes?.length
      ? `Modifications: ${data.changes.join(", ")}`
      : notification.type === "TASK_REMINDER" && data.dateLimite
        ? `Echeance: ${new Date(data.dateLimite).toLocaleString("fr-FR", {
            dateStyle: "short",
            timeStyle: "short",
          })}`
        : null;

  return [base, club, details].filter(Boolean).join(" • ");
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [messageNotifications, setMessageNotifications] = useState<
    MessageNotificationItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 80, right: 16 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const currentRole = getCurrentUserRole();

  const totalUnreadCount = unreadCount + unreadMessagesCount;
  const hasUnread = totalUnreadCount > 0;

  const displayNotifications = useMemo(
    () => notifications.slice(0, 12),
    [notifications],
  );

  const refreshUnreadCount = async () => {
    try {
      const [notificationsData, messagesData] = await Promise.all([
        fetchUnreadNotificationsCount(),
        fetchUnreadMessagesCount(),
      ]);

      setUnreadCount(notificationsData.count ?? 0);
      setUnreadMessagesCount(messagesData.count ?? 0);
    } catch (err) {
      console.error("Erreur chargement compteur notifications:", err);
    }
  };

  const mapMessageNotifications = (
    conversations: MessengerConversationSummary[],
    myUserId: string,
  ) => {
    return conversations
      .filter((conversation) => {
        const lastMessage = conversation.last_message;
        if (!lastMessage) return false;
        return lastMessage.sender_id !== myUserId;
      })
      .sort((a, b) => {
        const aDate = new Date(a.last_message_at ?? 0).getTime();
        const bDate = new Date(b.last_message_at ?? 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 8)
      .map((conversation) => {
        const isGroupConversation = conversation.type === "group";
        const sender = conversation.last_message?.sender;
        const senderName = sender
          ? `${sender.nom} ${sender.prenom}`
          : "Utilisateur";
        const targetName = isGroupConversation
          ? conversation.title || "Groupe sans nom"
          : conversation.counterpart
            ? `${conversation.counterpart.nom} ${conversation.counterpart.prenom}`
            : "Conversation privée";

        return {
          conversationId: conversation.id,
          title: isGroupConversation
            ? `Groupe: ${targetName}`
            : `Privé: ${targetName}`,
          subtitle: `Nouveau message de ${senderName}`,
          createdAt:
            conversation.last_message?.created_at ??
            conversation.last_message_at,
        };
      });
  };

  const refreshMessageNotifications = async () => {
    try {
      setIsMessageLoading(true);

      const profile = await fetchCurrentUserProfile();
      const conversations = await fetchMyConversations();
      const mapped = mapMessageNotifications(conversations ?? [], profile.id);
      setMessageNotifications(mapped);
    } catch (err) {
      console.error("Erreur chargement notifications messagerie:", err);
      setMessageNotifications([]);
    } finally {
      setIsMessageLoading(false);
    }
  };

  const refreshNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await fetchMyNotifications(30);
      setNotifications(data ?? []);
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshUnreadCount();
    void refreshMessageNotifications();

    const interval = window.setInterval(() => {
      void refreshUnreadCount();
      void refreshMessageNotifications();
    }, 25000);

    const handleMessagingUpdate = () => {
      void refreshUnreadCount();
      if (isOpen) {
        void refreshMessageNotifications();
      }
    };

    window.addEventListener(
      "messagerie-updated",
      handleMessagingUpdate as EventListener,
    );

    return () => {
      window.clearInterval(interval);
      window.removeEventListener(
        "messagerie-updated",
        handleMessagingUpdate as EventListener,
      );
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      void refreshNotifications();
      void refreshUnreadCount();
      void refreshMessageNotifications();

      const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setPanelPosition({
          top: Math.round(rect.bottom + 10),
          right: Math.max(16, Math.round(window.innerWidth - rect.right)),
        });
      };

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          panelRef.current &&
          !panelRef.current.contains(target) &&
          buttonRef.current &&
          !buttonRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleMarkOneAsRead = async (
    notificationId: string,
    isRead: boolean,
  ) => {
    if (isRead) return;
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Erreur mise a jour notification:", err);
    }
  };

  const getNotificationPostId = (notification: InAppNotification) => {
    if (!notification.data || typeof notification.data !== "object") {
      return null;
    }

    const postId = (notification.data as Record<string, unknown>).postId;
    if (typeof postId !== "string" || !postId.trim()) {
      return null;
    }

    return postId;
  };

  const handleNotificationClick = async (item: InAppNotification) => {
    await handleMarkOneAsRead(item.id, item.is_read);

    const taskData = getTaskNotificationData(item);
    if (taskData?.clubId) {
      setIsOpen(false);
      const taskId = taskData.taskId ?? "";
      const taskPath = isManagerRole(currentRole)
        ? `/my-clubs/${taskData.clubId}/tasks?taskId=${encodeURIComponent(taskId)}`
        : `/my-clubs/${taskData.clubId}/staff-tasks?taskId=${encodeURIComponent(taskId)}`;
      navigate(taskPath);
      return;
    }

    const postId = getNotificationPostId(item);
    if (postId) {
      setIsOpen(false);
      navigate(`/fil-actualite?postId=${encodeURIComponent(postId)}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Erreur mise a jour notifications:", err);
    }
  };

  const handleMessageNotificationClick = (conversationId: string) => {
    setIsOpen(false);
    navigate(
      `/messagerie?conversationId=${encodeURIComponent(conversationId)}`,
    );
  };

  return (
    <div className="relative z-50">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#436D75] transition hover:border-[#436D75] hover:bg-[#436D75]/5"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {hasUnread ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#E98A7D] px-1 text-[10px] font-black text-white">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        ) : null}
      </button>

      {isOpen
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-[3000] w-[360px] max-w-[92vw] rounded-2xl border border-gray-200 bg-white shadow-2xl"
              style={{ top: panelPosition.top, right: panelPosition.right }}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#436D75]">
                  Notifications
                </p>
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-black uppercase tracking-[0.12em] text-[#436D75] hover:text-black"
                >
                  Tout marquer lu
                </button>
              </div>

              <div className="max-h-[360px] overflow-y-auto p-2">
                <div className="mb-2 rounded-xl border border-gray-100 bg-[#F7F3E9]/40 p-2">
                  <p className="px-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#436D75]">
                    Messagerie
                  </p>
                  {isMessageLoading ? (
                    <div className="px-2 py-4 text-center text-xs font-bold text-gray-400">
                      Chargement des messages...
                    </div>
                  ) : messageNotifications.length === 0 ? (
                    <div className="px-2 py-4 text-center text-xs font-bold text-gray-400">
                      Aucun nouveau message.
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {messageNotifications.map((item) => (
                        <button
                          key={item.conversationId}
                          type="button"
                          onClick={() =>
                            handleMessageNotificationClick(item.conversationId)
                          }
                          className="w-full rounded-lg bg-white px-3 py-2 text-left transition hover:bg-[#D9E8D1]/35"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#436D75]">
                              {item.title}
                            </p>
                            <span className="text-[10px] font-bold text-gray-400">
                              {item.createdAt
                                ? formatRelativeDate(item.createdAt)
                                : "A l'instant"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-600">
                            {item.subtitle}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div className="px-3 py-6 text-center text-xs font-bold text-gray-400">
                    Chargement...
                  </div>
                ) : displayNotifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs font-bold text-gray-400">
                    Aucune notification.
                  </div>
                ) : (
                  displayNotifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void handleNotificationClick(item)}
                      className={`w-full rounded-xl px-3 py-3 text-left transition ${
                        item.is_read
                          ? "bg-white text-gray-600 hover:bg-gray-50"
                          : "bg-[#D9E8D1]/30 text-gray-800 hover:bg-[#D9E8D1]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {isTaskNotification(item) ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${getTaskNotificationTone(item.type)}`}
                            >
                              {getTaskNotificationIcon(item.type)}
                              Tache
                            </span>
                          ) : null}
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#436D75]">
                            {isTaskNotification(item)
                              ? getTaskNotificationTitle(item.type)
                              : item.titre}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">
                          {formatRelativeDate(item.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed">
                        {isTaskNotification(item)
                          ? getTaskNotificationSubtitle(item)
                          : item.message}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
