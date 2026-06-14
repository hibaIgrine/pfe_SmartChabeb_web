/**
 * utils.ts — Utilitaires du module staff de club.
 *
 * CONSTANTES :
 *   BLOCKED_STAFF_ROLE  — "RESPONSABLE_CLUB" : rôle système non modifiable par les autres
 *
 * FONCTIONS :
 *   normalizeRoleKey(value) — Convertit un nom de rôle en clé normalisée
 *                             (MAJUSCULES, espaces/tirets → underscores)
 *   formatRoleLabel(roleName)— Formate une clé de rôle en label lisible
 *                              (underscores → espaces, première lettre de chaque mot en majuscule)
 */
export const BLOCKED_STAFF_ROLE = "RESPONSABLE_CLUB";

export const normalizeRoleKey = (value: string) =>
  value
    .toUpperCase()
    .trim()
    .replace(/[\s-]+/g, "_");

export const formatRoleLabel = (roleName: string) =>
  roleName
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
