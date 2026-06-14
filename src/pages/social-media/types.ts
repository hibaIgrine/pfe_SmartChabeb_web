/**
 * types.ts — Types TypeScript locaux du module social-media (frontend uniquement).
 *
 * TYPES :
 *   DraftMediaItem      — Média en cours de composition (type, url, name, mimeType)
 *                         Utilisé dans PostComposer avant envoi API
 *   SocialFeedCurrentUser — Utilisateur courant dans le contexte du feed {id, role}
 *   EMPTY_MEDIA         — Valeur initiale vide pour un DraftMediaItem
 *
 * NOTE :
 *   Les types API (Publication, ReactionType, etc.) sont dans social-media.api.ts.
 *   Ce fichier contient uniquement les types LOCAUX au frontend (brouillon, état UI).
 */
import type {
  MentionUser,
  PublicationMediaType,
} from "../../api/social-media.api";

export type DraftMediaItem = {
  type: PublicationMediaType;
  url: string;
  name: string;
  mimeType?: string;
};

export type SocialFeedCurrentUser = {
  id?: string;
  role?: string;
};

export const EMPTY_MEDIA: DraftMediaItem = {
  type: "image",
  url: "",
  name: "",
};

export const getMentionDisplayName = (user: MentionUser) =>
  `${user.nom} ${user.prenom}`;

export const SOCIAL_LOCATION_SUGGESTIONS = [
  "Maison des Jeunes Tunis",
  "Maison des Jeunes Sousse",
  "Maison des Jeunes Sfax",
  "Maison des Jeunes Monastir",
  "Maison des Jeunes Nabeul",
  "Complexe Sportif El Menzah",
  "Stade Municipal",
  "Centre Culturel Municipal",
  "Centre de Jeunesse et Sports",
  "Bibliotheque Municipale",
  "Parc Urbain Ennahli",
  "Avenue Habib Bourguiba",
  "Campus Universitaire",
  "Maison de la Culture",
];
