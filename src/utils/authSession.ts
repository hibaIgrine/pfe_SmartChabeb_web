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
