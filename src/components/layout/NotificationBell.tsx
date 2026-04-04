import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import {
  fetchMyNotifications,
  fetchUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type InAppNotification,
} from "../../api/notifications.api";

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

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const hasUnread = unreadCount > 0;

  const displayNotifications = useMemo(
    () => notifications.slice(0, 12),
    [notifications],
  );

  const refreshUnreadCount = async () => {
    try {
      const data = await fetchUnreadNotificationsCount();
      setUnreadCount(data.count ?? 0);
    } catch (err) {
      console.error("Erreur chargement compteur notifications:", err);
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
    refreshUnreadCount();
    const interval = window.setInterval(refreshUnreadCount, 25000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
      refreshUnreadCount();
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

  return (
    <div className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#436D75] transition hover:border-[#436D75] hover:bg-[#436D75]/5"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {hasUnread ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#E98A7D] px-1 text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[120] w-[360px] max-w-[90vw] rounded-2xl border border-gray-200 bg-white shadow-2xl">
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
                  onClick={() => handleMarkOneAsRead(item.id, item.is_read)}
                  className={`w-full rounded-xl px-3 py-3 text-left transition ${
                    item.is_read
                      ? "bg-white text-gray-600 hover:bg-gray-50"
                      : "bg-[#D9E8D1]/30 text-gray-800 hover:bg-[#D9E8D1]/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#436D75]">
                      {item.titre}
                    </p>
                    <span className="text-[10px] font-bold text-gray-400">
                      {formatRelativeDate(item.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed">{item.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
