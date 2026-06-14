/**
 * uploads.api.ts — Appels API pour l'upload de fichiers.
 *
 * RÔLE :
 *   Gère l'envoi de fichiers en multipart/form-data vers le backend NestJS UploadsModule.
 *   Actuellement utilisé uniquement pour les preuves de réalisation de tâches de club.
 *
 * FONCTIONS EXPORTÉES :
 *   uploadTaskProof(file) — POST /uploads/task-proof (multipart/form-data)
 *     → Retourne { url, filename, type } (URL publique stockée sur le serveur)
 *     → Utilisé dans ClubTasksPage pour attacher une photo/document comme preuve
 */
import api from "./axios";

export async function uploadTaskProof(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/uploads/task-proof", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data; // { url, filename, type }
}

export default { uploadTaskProof };
