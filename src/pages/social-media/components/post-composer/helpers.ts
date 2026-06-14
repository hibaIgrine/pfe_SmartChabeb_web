/**
 * helpers.ts — Fonctions utilitaires du PostComposer (suggestions de localisation).
 *
 * CONSTANTES :
 *   CUSTOM_LOCATION_STORAGE_KEY — Clé localStorage pour les localisations personnalisées
 *
 * FONCTIONS :
 *   normalizeLocation(value)          — Trim + suppression des espaces multiples
 *   readCustomLocationSuggestions()   — Lit les localisations mémorisées depuis localStorage
 *   saveCustomLocationSuggestion(loc) — Ajoute une localisation dans localStorage (max 10)
 *   getAllLocationSuggestions()        — Combine SOCIAL_LOCATION_SUGGESTIONS + localisations custom
 *
 * UTILISATION :
 *   PostComposer.tsx — pour afficher les suggestions de localisation dans le champ lieu
 */
import { SOCIAL_LOCATION_SUGGESTIONS } from "../../types";

export const CUSTOM_LOCATION_STORAGE_KEY = "social-feed-custom-locations";

export function normalizeLocation(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function readCustomLocationSuggestions() {
  if (typeof window === "undefined") {
    return SOCIAL_LOCATION_SUGGESTIONS;
  }

  try {
    const rawValue = window.localStorage.getItem(CUSTOM_LOCATION_STORAGE_KEY);
    if (!rawValue) {
      return SOCIAL_LOCATION_SUGGESTIONS;
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return SOCIAL_LOCATION_SUGGESTIONS;
    }

    const mergedValues = [...SOCIAL_LOCATION_SUGGESTIONS, ...parsedValue]
      .map((item) => normalizeLocation(String(item)))
      .filter(Boolean);

    return Array.from(new Set(mergedValues));
  } catch {
    return SOCIAL_LOCATION_SUGGESTIONS;
  }
}
