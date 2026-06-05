export const AUTH_SESSION_INVALIDATED_EVENT = "auth-session-invalidated";

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

export function isAccountLockMessage(message?: string | null) {
  if (!message) {
    return false;
  }

  return /suspendu|desactive|desactiv|bloque|ban/i.test(message);
}