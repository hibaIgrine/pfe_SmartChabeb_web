/**
 * notifications.api.ts — Appels API pour les notifications in-app.
 *
 * RÔLE :
 *   Gère la récupération et le marquage des notifications en temps réel.
 *   Utilisé par NotificationBell dans le Layout pour afficher le badge de notifications
 *   et la liste déroulante des derniers événements (inscription, réaction, mention…).
 *
 * TYPE InAppNotification :
 *   id, titre, message  — Données d'affichage de la notification
 *   type                — Catégorie (ex: 'REACTION', 'MENTION', 'CLUB_JOIN'…)
 *   is_read             — Si l'utilisateur a déjà vu la notification
 *   created_at          — Horodatage
 *   data                — Payload optionnel JSON (ex: { postId, commentId } pour navigation)
 *
 * FONCTIONS EXPORTÉES :
 *   fetchMyNotifications(limit)      — GET /notifications/me (dernières notifications)
 *   fetchUnreadNotificationsCount()  — GET /notifications/me/unread-count (badge)
 *   markNotificationAsRead(id)       — PATCH /notifications/:id/read
 *   markAllNotificationsAsRead()     — PATCH /notifications/me/read-all
 */
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
