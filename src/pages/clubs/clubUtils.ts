/**
 * clubUtils.ts — Utilitaires partagés entre les pages du module clubs.
 *
 * FONCTIONS :
 *   getAuthHeaders() — Retourne l'en-tête Authorization Bearer depuis localStorage["token"].
 *                      Utilisé pour les appels API manuels (sans passer par api.axios.ts).
 *                      Retourne {} si aucun token n'est trouvé.
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
