const COMMENT_IMAGE_TOKEN_REGEX = /\[\[img:(.*?)\]\]/g;
const COMMENT_REPLY_TOKEN_REGEX = /\[\[reply:(.*?)\]\]/g;

export type ParsedComment = {
  text: string;
  imageUrls: string[];
  replyToCommentId: string | null;
};

export function serializeCommentContent(
  text: string,
  imageUrl?: string,
  replyToCommentId?: string | null,
) {
  const cleanText = text.trim();
  const cleanImageUrl = imageUrl?.trim();
  const cleanReplyToId = replyToCommentId?.trim();
  const parts: string[] = [];

  if (cleanText) {
    parts.push(cleanText);
  }

  if (cleanReplyToId) {
    parts.push(`[[reply:${cleanReplyToId}]]`);
  }

  if (cleanImageUrl) {
    parts.push(`[[img:${cleanImageUrl}]]`);
  }

  return parts.join("\n").trim();
}

export function parseCommentContent(content: string): ParsedComment {
  const imageUrls: string[] = [];
  let replyToCommentId: string | null = null;

  const text = content
    .replace(COMMENT_REPLY_TOKEN_REGEX, (_, rawId: string) => {
      const id = String(rawId ?? "").trim();
      if (id) {
        replyToCommentId = id;
      }
      return "";
    })
    .replace(COMMENT_IMAGE_TOKEN_REGEX, (_, rawUrl: string) => {
      const url = String(rawUrl ?? "").trim();
      if (url) imageUrls.push(url);
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, imageUrls, replyToCommentId };
}
