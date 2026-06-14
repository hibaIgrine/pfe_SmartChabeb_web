/**
 * shared-post-content.ts — Parsing des métadonnées de publication partagée.
 *
 * RÔLE :
 *   Quand un post est partagé, son contenu encode les métadonnées de l'original
 *   dans un token [[shared:JSON_encoded]] dans le champ `content`.
 *
 * TYPE :
 *   SharedPostMetadata { author, content, location, created_at, originalPostId }
 *
 * FONCTIONS :
 *   parseSharedPostContent(content) — Extrait les métadonnées SharedPostMetadata
 *                                     depuis le content encodé d'un post partagé
 *
 * UTILISATION :
 *   PostCard.tsx — affichage de l'aperçu du post original sous le contenu du partage
 *   FavoritePostsBell.tsx — affichage du résumé des posts favoris partagés
 */
const SHARED_POST_TOKEN_REGEX = /\[\[shared:(.*?)\]\]/g;

export type SharedPostMetadata = {
  author: string;
  content: string;
  location: string | null;
  created_at: string;
  originalPostId: string;
};

export type ParsedSharedPostContent = {
  messageText: string;
  shared: SharedPostMetadata | null;
};

function decodeBase64Utf8(input: string) {
  try {
    const binaryString = atob(input);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

export function parseSharedPostContent(
  content: string,
): ParsedSharedPostContent {
  let shared: SharedPostMetadata | null = null;

  const messageText = content
    .replace(SHARED_POST_TOKEN_REGEX, (_, rawPayload: string) => {
      const decoded = decodeBase64Utf8(String(rawPayload ?? "").trim());
      if (!decoded) {
        return "";
      }

      try {
        const payload = JSON.parse(decoded) as Partial<SharedPostMetadata>;
        if (payload.author && typeof payload.author === "string") {
          shared = {
            author: payload.author,
            content: typeof payload.content === "string" ? payload.content : "",
            location:
              typeof payload.location === "string" || payload.location === null
                ? payload.location
                : null,
            created_at:
              typeof payload.created_at === "string"
                ? payload.created_at
                : new Date().toISOString(),
            originalPostId:
              typeof payload.originalPostId === "string"
                ? payload.originalPostId
                : "",
          };
        }
      } catch {
        // Ignore malformed payload
      }

      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { messageText, shared };
}
