import { useState } from "react";
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
  const mimeType =
    message.type === "IMAGE"
      ? getDataUrlMimeType(value) || "image/*"
      : message.type === "VIDEO"
        ? getDataUrlMimeType(value) || "video/*"
        : getDataUrlMimeType(value) || "application/octet-stream";

  return { mimeType };
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
                className="max-h-72 w-full object-cover"
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
                className="max-h-72 w-full object-cover"
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
                {isPdf ? "PDF" : message.type}
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
          <div className="w-full max-w-4xl rounded-[30px] border border-white/30 bg-white shadow-2xl">
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

            <div className="attachment-modal">
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

              <div className="p-5">
                {message.type === "IMAGE" ? (
                  <img
                    src={preview.value}
                    alt={preview.fileName}
                    className="max-h-[75vh] w-full rounded-[24px] object-contain"
                  />
                ) : null}

                {message.type === "VIDEO" ? (
                  <video
                    src={preview.value}
                    controls
                    autoPlay
                    className="max-h-[75vh] w-full rounded-[24px] bg-black"
                  />
                ) : null}

                {message.type === "DOCUMENT" ? (
                  <div className="space-y-4">
                    {preview.mimeType.startsWith("audio/") ? (
                      <div className="rounded-[24px] border border-[#b8caa9] bg-[#D9E8D1]/60 p-6">
                        <audio
                          src={preview.value}
                          controls
                          autoPlay
                          className="w-full"
                        />
                      </div>
                    ) : preview.mimeType === "application/pdf" ? (
                      <iframe
                        src={preview.value}
                        title={preview.fileName}
                        className="h-[75vh] w-full rounded-[24px] border border-gray-200"
                      />
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-gray-200 bg-[#F7F3E9]/50 p-6">
                        <p className="text-lg font-black text-gray-900">
                          Aperçu indisponible pour ce format
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          Utilisez les boutons imprimer ou télécharger.
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
