/**
 * authSession.ts — Gestion de la session utilisateur côté client.
 *
 * RÔLE :
 *   Centralise toutes les opérations sur le token JWT et l'objet user
 *   stockés dans le localStorage. Fournit aussi un mécanisme d'événements
 *   personnalisés pour que l'application réagisse aux changements de session
 *   sans passer par un store global (Redux, Zustand…).
 *
 * ÉVÉNEMENTS CUSTOM (window.dispatchEvent) :
 *   AUTH_SESSION_INVALIDATED_EVENT — émis lors d'un logout forcé (401, compte banni…).
 *     → App.tsx écoute cet événement pour rediriger vers /auth.
 *   AUTH_USER_UPDATED_EVENT        — émis quand le profil user est mis à jour en mémoire.
 *     → App.tsx re-rend les gardes de routes (ProtectedRoute) quand le rôle change.
 *
 * RÔLES APPLICATIFS :
 *   ADMIN              — Administrateur système (accès complet)
 *   RESPONSABLE_CENTRE — Gestionnaire de maison des jeunes
 *   RESPONSABLE_CLUB   — Coach/responsable d'un club sportif
 *   ADHERENT           — Membre d'un club
 *   ADHERANT           — Alias legacy (faute de frappe en BDD) → normalisé en ADHERENT
 *
 * FONCTIONS EXPORTÉES :
 *   normalizeRole()         — Corrige 'ADHERANT' → 'ADHERENT'
 *   getStoredUser()         — Parse localStorage["user"] avec normalisation du rôle
 *   getStoredRole()         — Retourne le rôle normalisé du user courant
 *   clearAuthSession()      — Supprime token + user du localStorage
 *   forceLogout(reason)     — clearAuthSession + dispatch AUTH_SESSION_INVALIDATED_EVENT
 *   syncStoredUserFromProfile() — Met à jour localStorage["user"] depuis le profil serveur,
 *                                 dispatch AUTH_USER_UPDATED_EVENT si changement détecté
 *   isAccountLockMessage()  — Détecte si un message 403 indique une suspension/ban
 */
export const AUTH_SESSION_INVALIDATED_EVENT = "auth-session-invalidated";
export const AUTH_USER_UPDATED_EVENT = "user-updated";

export type AppRole =
  | "ADMIN"
  | "RESPONSABLE_CENTRE"
  | "RESPONSABLE_CLUB"
  | "ADHERENT"
  | "ADHERANT";

export function normalizeRole(role?: string | null) {
  if (role === "ADHERANT") {
    return "ADHERENT";
  }

  return role ?? null;
}

export function getStoredUser() {
  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw);
    return {
      ...user,
      role: normalizeRole(user?.role),
    };
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function getStoredRole() {
  return normalizeRole(getStoredUser()?.role);
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function forceLogout(reason?: string) {
  clearAuthSession();

  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_INVALIDATED_EVENT, {
      detail: { reason: reason ?? null },
    }),
  );
}

export function syncStoredUserFromProfile(profile: Record<string, any>) {
  const currentUser = getStoredUser();
  if (!profile) {
    return false;
  }

  const nextUser = {
    ...(currentUser || {}),
    ...profile,
    role:
      profile?.role === "ADHERANT"
        ? "ADHERENT"
        : profile?.role || currentUser?.role,
  };

  const currentSerialized = currentUser ? JSON.stringify(currentUser) : null;
  const nextSerialized = JSON.stringify(nextUser);

  if (currentSerialized === nextSerialized) {
    return false;
  }

  localStorage.setItem("user", nextSerialized);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));
  }

  return true;
}

export function isAccountLockMessage(message?: string | null) {
  if (!message) {
    return false;
  }

  return /suspendu|desactive|desactiv|bloque|ban/i.test(message);
}
