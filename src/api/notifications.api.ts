import api from "./axios";

export type InAppNotification = {
  id: string;
  titre: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, unknown> | null;
};

export async function fetchMyNotifications(limit = 20) {
  const response = await api.get<InAppNotification[]>("/notifications/me", {
    params: { limit },
  });
  return response.data;
}

export async function fetchUnreadNotificationsCount() {
  const response = await api.get<{ count: number }>("/notifications/me/unread-count");
  return response.data;
}

export async function markNotificationAsRead(notificationId: string) {
  await api.patch(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsAsRead() {
  await api.patch("/notifications/me/read-all");
}
