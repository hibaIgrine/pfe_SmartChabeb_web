/**
 * comments.api.ts — Appels API pour les commentaires de tâches de club.
 *
 * RÔLE :
 *   Gère la lecture et la création des commentaires attachés aux tâches (ClubTask).
 *   Utilisé dans ClubTasksPage et StaffClubTasksPage pour la collaboration autour des tâches.
 *
 * ROUTES COUVERTES :
 *   GET  /clubs/:clubId/tasks/:taskId/comments  → getTaskComments()
 *   POST /clubs/:clubId/tasks/:taskId/comments  → createTaskComment()
 */
import api from "./axios";

export async function getTaskComments(clubId: string, taskId: string) {
  const res = await api.get(`/clubs/${clubId}/tasks/${taskId}/comments`);
  return res.data;
}

export async function createTaskComment(
  clubId: string,
  taskId: string,
  message: string,
) {
  const res = await api.post(`/clubs/${clubId}/tasks/${taskId}/comments`, {
    message,
  });
  return res.data;
}
