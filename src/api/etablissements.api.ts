/**
 * etablissements.api.ts — Appels API pour les établissements d'enseignement.
 *
 * RÔLE :
 *   Récupère la liste des établissements pour l'autocomplétion dans les formulaires
 *   d'inscription et de profil (champ "établissement d'étude").
 *
 * FONCTIONS EXPORTÉES :
 *   fetchEtablissements()      — GET /etablissements  → liste complète
 *   searchEtablissements(q)    — GET /etablissements/search?q=... → recherche textuelle
 */
import api from "./axios";

export async function fetchEtablissements() {
  const response = await api.get("/etablissements");
  return response.data;
}

export async function searchEtablissements(query: string) {
  const response = await api.get("/etablissements/search", {
    params: { q: query },
  });
  return response.data;
}
