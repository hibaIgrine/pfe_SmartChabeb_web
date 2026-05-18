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
