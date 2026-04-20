import type { MessengerUser } from "../types";

function formatRelativeDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) return "a l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;

  return `il y a ${Math.floor(diffHours / 24)} j`;
}

export function getUserPresenceLabel(user?: MessengerUser | null) {
  if (!user) return "Hors ligne";
  if (user.is_online) return "En ligne";

  if (!user.last_seen_at) {
    return "Hors ligne";
  }

  return `Hors ligne • Derniere connexion ${formatRelativeDate(user.last_seen_at)}`;
}
