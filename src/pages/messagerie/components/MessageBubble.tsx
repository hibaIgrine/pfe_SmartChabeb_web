import { useEffect, useState } from "react";
import {
  Check,
  Download,
  MoreVertical,
  Pencil,
  Pin,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import api from "../../../api/axios";
import type { MessengerMessage } from "../types";

type MessageBubbleProps = {
  message: MessengerMessage;
  isMine: boolean;
  submitting: boolean;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteForMe: (messageId: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
  onTogglePin: (messageId: string, isPinned: boolean) => void;
};

type AttachmentPreview = {
  value: string;
  fileName: string;
  mimeType: string;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
};

const OFFICE_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const TEXT_MIME_TYPES = new Set(["text/plain", "text/csv", "application/json"]);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPreviewHtml(content: string) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: Inter, Arial, sans-serif;
            color: #111827;
            background: #ffffff;
          }

          img, video {
            max-width: 100%;
            height: auto;
          }

          table {
            border-collapse: collapse;
            width: 100%;
          }

          td, th {
            border: 1px solid #e5e7eb;
            padding: 8px;
            vertical-align: top;
          }

          pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: Consolas, Monaco, 'Courier New', monospace;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
}

function resolveAttachmentUrl(value: string) {
  if (value.startsWith("data:")) {
    return value;
  }

  const baseUrl = api.defaults.baseURL || window.location.origin;
  return new URL(value, baseUrl).toString();
}

function getAttachmentExtension(value: string) {
  if (value.startsWith("data:")) {
    return "";
  }

  try {
    const pathname = new URL(
      value,
      api.defaults.baseURL || window.location.origin,
    ).pathname;
    return pathname.split(".").pop()?.toLowerCase() ?? "";
  } catch {
    return "";
  }
}

function inferAttachmentMimeType(message: MessengerMessage, value: string) {
  const dataUrlMime = getDataUrlMimeType(value).toLowerCase();
  if (dataUrlMime) {
    return dataUrlMime;
  }

  const extension = getAttachmentExtension(value);
  if (extension && MIME_BY_EXTENSION[extension]) {
    return MIME_BY_EXTENSION[extension];
  }

  if (message.type === "IMAGE") return "image/*";
  if (message.type === "VIDEO") return "video/*";

  return "application/octet-stream";
}

function getMessageStatusLabel(status: MessengerMessage["status"]) {
  if (status === "READ") {
    return "Vu";
  }

  if (status === "DELIVERED") {
    return "Livré";
  }

  return "Envoyé";
}

function getDataUrlMimeType(value: string) {
  const match = /^data:([^;]+);/i.exec(value);
  return match?.[1] ?? "";
}

function getAttachmentMeta(message: MessengerMessage, value: string) {
  const mimeType = inferAttachmentMimeType(message, value);

  return { mimeType };
}

function getDocumentLabel(mimeType: string) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "application/msword") return "Word";
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "Word";
  }
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "Excel";
  }
  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "PowerPoint";
  }
  if (mimeType === "text/plain") return "Texte";
  if (mimeType === "text/csv") return "CSV";
  if (mimeType === "application/json") return "JSON";
  return "Document";
}

function isPublicHttpUrl(value: string) {
  try {
    const parsedUrl = new URL(value);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return false;
    }

    return !["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

function getOfficeViewerUrl(value: string) {
  if (!isPublicHttpUrl(value)) {
    return null;
  }

  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(value)}`;
}

function VoiceAudioCard({ src }: { src: string }) {
  return (
    <div className="w-[320px] max-w-full rounded-2xl border border-[#b8caa9] bg-[#D9E8D1]/60 px-3 py-3">
      <audio src={src} controls className="w-full" preload="metadata" />
    </div>
  );
}

function renderMedia(
  message: MessengerMessage,
  onOpen: (value: string, fileName: string) => void,
) {
  if (!message.media || message.media.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {message.media.map((item, index) => {
        if (typeof item !== "string") {
          return null;
        }

        if (message.type === "IMAGE") {
          return (
            <button
              key={`${message.id}-${index}`}
              type="button"
              onClick={() => onOpen(item, `image-${index + 1}`)}
              className="block w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 text-left transition hover:bg-white/15"
            >
              <img
                src={item}
                alt="Pièce jointe"
                className="max-h-72 w-full bg-white object-contain"
              />
              <div className="px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-80">
                  Image
                </p>
                <p className="text-sm font-semibold">Cliquer pour ouvrir</p>
              </div>
            </button>
          );
        }

        if (message.type === "VIDEO") {
          return (
            <button
              key={`${message.id}-${index}`}
              type="button"
              onClick={() => onOpen(item, `video-${index + 1}`)}
              className="block w-full overflow-hidden rounded-2xl border border-white/20 bg-black text-left transition hover:opacity-90"
            >
              <video
                src={item}
                muted
                className="max-h-72 w-full bg-black object-contain"
              />
              <div className="px-4 py-3 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-80">
                  Vidéo
                </p>
                <p className="text-sm font-semibold">Cliquer pour ouvrir</p>
              </div>
            </button>
          );
        }

        const mimeType = getDataUrlMimeType(item);
        const isPdf = mimeType === "application/pdf";
        const isAudio = mimeType.startsWith("audio/");
        const documentLabel = getDocumentLabel(mimeType);

        if (isAudio) {
          return <VoiceAudioCard key={`${message.id}-${index}`} src={item} />;
        }

        return (
          <button
            key={`${message.id}-${index}`}
            type="button"
            onClick={() => onOpen(item, `piece-jointe-${index + 1}`)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left transition hover:bg-white/15"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-80">
                {isPdf ? "PDF" : documentLabel}
              </p>
              <p className="truncate text-sm font-semibold">
                Cliquer pour ouvrir
              </p>
            </div>

            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-inherit">
              Ouvrir pièce jointe
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function MessageBubble({
  message,
  isMine,
  submitting,
  onEditMessage,
  onDeleteForMe,
  onDeleteForEveryone,
  onTogglePin,
}: MessageBubbleProps) {
  const [preview, setPreview] = useState<AttachmentPreview | null>(null);
  const [documentPreviewHtml, setDocumentPreviewHtml] = useState<string | null>(
    null,
  );
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(
    null,
  );
  const [documentPreviewLoading, setDocumentPreviewLoading] = useState(false);
  const [documentPreviewError, setDocumentPreviewError] = useState<
    string | null
  >(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content ?? "");

  const isDeletedForEveryone = Boolean(message.deleted_for_everyone_at);
  const isPinned = Boolean(message.pinned_at);
  const canEdit = isMine && !isDeletedForEveryone && message.type === "TEXT";

  const handleStartEdit = () => {
    setDraft(message.content ?? "");
    setEditing(true);
    setMenuOpen(false);
  };

  const handleSaveEdit = () => {
    const normalized = draft.trim();
    if (!normalized || normalized === (message.content ?? "")) {
      setEditing(false);
      return;
    }

    onEditMessage(message.id, normalized);
    setEditing(false);
  };

  const handleDeleteForMe = () => {
    setMenuOpen(false);
    onDeleteForMe(message.id);
  };

  const handleDeleteForEveryone = () => {
    setMenuOpen(false);
    onDeleteForEveryone(message.id);
  };

  const handleTogglePin = () => {
    setMenuOpen(false);
    onTogglePin(message.id, !isPinned);
  };

  const openPreview = (value: string, fileName: string) => {
    const { mimeType } = getAttachmentMeta(message, value);
    setPreview({ value, fileName, mimeType });
  };

  const closePreview = () => setPreview(null);

  useEffect(() => {
    if (!preview) {
      setDocumentPreviewHtml(null);
      setDocumentPreviewUrl(null);
      setDocumentPreviewLoading(false);
      setDocumentPreviewError(null);
      return;
    }

    const mimeType = preview.mimeType.toLowerCase();

    if (
      mimeType.startsWith("image/") ||
      mimeType.startsWith("video/") ||
      mimeType.startsWith("audio/") ||
      mimeType === "application/pdf"
    ) {
      setDocumentPreviewHtml(null);
      setDocumentPreviewUrl(null);
      setDocumentPreviewLoading(false);
      setDocumentPreviewError(null);
      return;
    }

    let cancelled = false;

    const loadDocumentPreview = async () => {
      setDocumentPreviewLoading(true);
      setDocumentPreviewHtml(null);
      setDocumentPreviewUrl(null);
      setDocumentPreviewError(null);

      try {
        const resolvedUrl = resolveAttachmentUrl(preview.value);

        if (mimeType === "application/msword") {
          const officeUrl = getOfficeViewerUrl(resolvedUrl);
          if (officeUrl) {
            if (!cancelled) {
              setDocumentPreviewUrl(officeUrl);
            }
            return;
          }
        }

        if (
          mimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          const mammoth = await import("mammoth");
          const response = await fetch(resolvedUrl);
          if (!response.ok) {
            throw new Error("Impossible de charger le document");
          }

          const { value } = await mammoth.convertToHtml({
            arrayBuffer: await response.arrayBuffer(),
          });

          if (!cancelled) {
            setDocumentPreviewHtml(buildPreviewHtml(value));
          }
          return;
        }

        if (
          mimeType === "application/vnd.ms-excel" ||
          mimeType ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ) {
          const xlsx = await import("xlsx");
          const response = await fetch(resolvedUrl);
          if (!response.ok) {
            throw new Error("Impossible de charger le tableur");
          }

          const workbook = xlsx.read(await response.arrayBuffer(), {
            type: "array",
          });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            throw new Error("Aucune feuille trouvée dans le tableur");
          }

          const sheetHtml = xlsx.utils.sheet_to_html(
            workbook.Sheets[firstSheetName],
          );

          if (!cancelled) {
            setDocumentPreviewHtml(buildPreviewHtml(sheetHtml));
          }
          return;
        }

        if (TEXT_MIME_TYPES.has(mimeType)) {
          const response = await fetch(resolvedUrl);
          if (!response.ok) {
            throw new Error("Impossible de charger le fichier texte");
          }

          const text = await response.text();
          const formattedText =
            mimeType === "application/json"
              ? JSON.stringify(JSON.parse(text), null, 2)
              : text;

          if (!cancelled) {
            setDocumentPreviewHtml(
              buildPreviewHtml(`<pre>${escapeHtml(formattedText)}</pre>`),
            );
          }
          return;
        }

        const officeViewerUrl = getOfficeViewerUrl(resolvedUrl);
        if (officeViewerUrl && OFFICE_MIME_TYPES.has(mimeType)) {
          if (!cancelled) {
            setDocumentPreviewUrl(officeViewerUrl);
          }
          return;
        }

        throw new Error("Aperçu indisponible pour ce format");
      } catch {
        if (!cancelled) {
          setDocumentPreviewError(
            "Aperçu indisponible pour ce format. Utilise le téléchargement.",
          );
        }
      } finally {
        if (!cancelled) {
          setDocumentPreviewLoading(false);
        }
      }
    };

    void loadDocumentPreview();

    return () => {
      cancelled = true;
    };
  }, [preview]);

  useEffect(() => {
    if (!preview) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePreview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [preview]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[78%] rounded-[26px] px-4 py-3 shadow-sm ${
            isMine
              ? "bg-[#436D75] text-white"
              : "border border-gray-100 bg-white text-gray-800"
          }`}
        >
          {!isMine ? (
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#436D75]">
              {message.sender.nom} {message.sender.prenom}
            </p>
          ) : null}

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="mt-1 space-y-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={3}
                    className={`w-full resize-none rounded-2xl border px-3 py-2 text-sm leading-relaxed outline-none ${
                      isMine
                        ? "border-white/30 bg-white/10 text-white placeholder:text-white/60"
                        : "border-gray-200 bg-white text-gray-700"
                    }`}
                    placeholder="Modifier le message"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setDraft(message.content ?? "");
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-gray-500"
                    >
                      <X size={12} />
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={submitting}
                      className="inline-flex items-center gap-1 rounded-full bg-[#436D75] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Check size={12} />
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {isDeletedForEveryone ? (
                    <p
                      className={`mt-1 italic text-sm leading-relaxed ${isMine ? "text-white/80" : "text-gray-500"}`}
                    >
                      Ce message a été supprimé.
                    </p>
                  ) : message.content ? (
                    <p
                      className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed ${isMine ? "text-white" : "text-gray-700"}`}
                    >
                      {message.content}
                    </p>
                  ) : null}

                  {!isDeletedForEveryone
                    ? renderMedia(message, openPreview)
                    : null}
                </>
              )}
            </div>

            {!editing ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
                    isMine
                      ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                  title="Actions message"
                >
                  <MoreVertical size={13} />
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                    {!isDeletedForEveryone ? (
                      <button
                        type="button"
                        onClick={handleTogglePin}
                        disabled={submitting}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-700 transition hover:bg-[#F7F3E9] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pin size={13} />
                        {isPinned ? "Désépingler" : "Épingler"}
                      </button>
                    ) : null}

                    {canEdit ? (
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-700 transition hover:bg-[#F7F3E9]"
                      >
                        <Pencil size={13} />
                        Modifier
                      </button>
                    ) : null}

                    {isMine && !isDeletedForEveryone ? (
                      <button
                        type="button"
                        onClick={handleDeleteForEveryone}
                        disabled={submitting}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        Retirer pour tout le monde
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleDeleteForMe}
                      disabled={submitting}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      Retirer pour vous
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div
            className={`mt-2 flex items-center justify-end gap-2 text-[10px] font-bold ${isMine ? "text-white/70" : "text-gray-400"}`}
          >
            <span>
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span>•</span>
            <span>{getMessageStatusLabel(message.status)}</span>
          </div>
        </div>
      </div>

      {preview ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-[30px] border border-white/30 bg-white shadow-2xl">
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .attachment-modal,
                .attachment-modal * {
                  visibility: visible;
                }
                .attachment-modal {
                  position: static !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  box-shadow: none !important;
                  border: none !important;
                }
              }
            `}</style>

            <div className="attachment-modal flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#436D75]">
                    Pièce jointe
                  </p>
                  <p className="truncate text-sm font-semibold text-gray-700">
                    {preview.fileName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={preview.value}
                    download={preview.fileName}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#436D75] transition hover:bg-[#F7F3E9]"
                  >
                    <Download size={12} />
                    Télécharger
                  </a>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#436D75] transition hover:bg-[#F7F3E9]"
                  >
                    <Printer size={12} />
                    Imprimer
                  </button>
                  <button
                    type="button"
                    onClick={closePreview}
                    className="inline-flex items-center gap-2 rounded-full bg-[#436D75] px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-black"
                  >
                    <X size={12} />
                    Fermer
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto p-5">
                {message.type === "IMAGE" ? (
                  <img
                    src={preview.value}
                    alt={preview.fileName}
                    className="mx-auto block max-h-[75vh] max-w-full rounded-[24px] object-contain"
                  />
                ) : null}

                {message.type === "VIDEO" ? (
                  <video
                    src={preview.value}
                    controls
                    autoPlay
                    className="mx-auto block max-h-[75vh] max-w-full rounded-[24px] bg-black"
                  />
                ) : null}

                {message.type === "DOCUMENT" ? (
                  <div className="space-y-4">
                    {preview.mimeType === "application/pdf" ? (
                      <iframe
                        src={preview.value}
                        title={preview.fileName}
                        className="h-[75vh] w-full rounded-[24px] border border-gray-200 bg-white"
                      />
                    ) : documentPreviewLoading ? (
                      <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-gray-200 bg-[#F7F3E9]/40 px-6 py-10 text-sm text-gray-500">
                        Préparation de l’aperçu...
                      </div>
                    ) : documentPreviewHtml ? (
                      <iframe
                        srcDoc={documentPreviewHtml}
                        title={preview.fileName}
                        className="h-[75vh] w-full rounded-[24px] border border-gray-200 bg-white"
                      />
                    ) : documentPreviewUrl ? (
                      <iframe
                        src={documentPreviewUrl}
                        title={preview.fileName}
                        className="h-[75vh] w-full rounded-[24px] border border-gray-200 bg-white"
                      />
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-gray-200 bg-[#F7F3E9]/50 p-6">
                        <p className="text-lg font-black text-gray-900">
                          {documentPreviewError ??
                            "Aperçu indisponible pour ce format"}
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          Utilise les boutons imprimer ou télécharger.
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
