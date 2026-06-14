/**
 * axios.ts — Instance Axios configurée pour toutes les requêtes HTTP vers le backend NestJS.
 *
 * RÔLE :
 *   Point d'entrée unique pour tous les appels API. Toutes les fonctions des fichiers *.api.ts
 *   importent cet objet `api` au lieu d'utiliser axios directement.
 *
 * CONFIGURATION :
 *   baseURL = VITE_API_URL (variable d'env Vite) || 'http://localhost:3000'
 *
 * INTERCEPTEUR DE REQUÊTE (request.use) :
 *   Injecte automatiquement le token JWT Bearer dans chaque requête sortante.
 *   Source du token : localStorage.getItem("token").
 *   Permet à l'utilisateur de ne pas passer le token manuellement.
 *
 * INTERCEPTEUR DE RÉPONSE (response.use) :
 *   CAS 1 — Succès 2xx, route /users/me/profile, compte_actif === false :
 *     → forceLogout("account-disabled") : déconnecte l'utilisateur désactivé silencieusement.
 *   CAS 2 — Erreur 401 (Unauthorized) :
 *     → forceLogout("unauthorized") : token expiré ou invalide → redirection vers /auth.
 *   CAS 3 — Erreur 403, message de type "suspendu/banni/bloqué" :
 *     → forceLogout(message) : compte suspendu → redirection vers /auth.
 *
 * SÉCURITÉ :
 *   Toute déconnexion forcée passe par forceLogout() qui :
 *     1. Nettoie localStorage (token + user)
 *     2. Dispatch AUTH_SESSION_INVALIDATED_EVENT pour que App.tsx redirige vers /auth
 */
import axios from "axios";
import { forceLogout, isAccountLockMessage } from "../utils/authSession";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    const url = response.config?.url || "";

    if (
      url.includes("/users/me/profile") &&
      response.data &&
      response.data.compte_actif === false
    ) {
      forceLogout("account-disabled");
    }

    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    if (status === 401) {
      forceLogout("unauthorized");
    } else if (status === 403 && isAccountLockMessage(message)) {
      forceLogout(message);
    }

    return Promise.reject(error);
  },
);

export default api;
