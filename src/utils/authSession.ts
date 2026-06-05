export const AUTH_SESSION_INVALIDATED_EVENT = "auth-session-invalidated";
export const AUTH_USER_UPDATED_EVENT = "user-updated";

function parseStoredUser() {
  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw);
    return {
      ...user,
      role: user?.role === "ADHERANT" ? "ADHERENT" : user?.role,
    };
  } catch {
    localStorage.removeItem("user");
    return null;
  }
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
  const currentUser = parseStoredUser();
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
