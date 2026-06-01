import {
  Archive,
  ArchiveRestore,
  CircleUserRound,
  MoreVertical,
  Users,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { ConversationFilters } from "./ConversationFilters";
import {
  filterConversations,
  type ConversationListFilterMode,
} from "../conversationFilters";
import type { MessengerConversationSummary } from "../types";
import { getUserPresenceLabel } from "../utils/presence";

type ConversationListProps = {
  conversations: MessengerConversationSummary[];
  activeConversationId?: string | null;
  meId?: string | null;
  loading: boolean;
  onOpenConversation: (conversationId: string) => void;
  onArchiveConversation: (conversationId: string, isArchived: boolean) => void;
  onDeleteConversation: (conversationId: string) => void;
  embedded?: boolean;
};

function formatRelativeDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "A l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  return `Il y a ${Math.floor(diffHours / 24)} j`;
}

function getDataUrlMimeType(value: string) {
  const match = /^data:([^;]+);/i.exec(value);
  return match?.[1]?.toLowerCase() ?? "";
}

function getUrlExtension(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    return url.pathname.split(".").pop()?.toLowerCase() ?? "";
  } catch {
    return "";
  }
}

function getAttachmentMimeType(value?: string | null) {
  if (!value) return "";

  const dataUrlMimeType = getDataUrlMimeType(value);
  if (dataUrlMimeType) {
    return dataUrlMimeType;
  }

  const extension = getUrlExtension(value);
  if (extension === "pdf") return "application/pdf";
  if (extension === "doc" || extension === "docx") {
    return "application/msword";
  }
  if (extension === "xls" || extension === "xlsx") {
    return "application/vnd.ms-excel";
  }
  if (extension === "ppt" || extension === "pptx") {
    return "application/vnd.ms-powerpoint";
  }
  if (extension === "txt") return "text/plain";

  return "";
}

function getConversationPreview(
  conversation: MessengerConversationSummary,
  meId?: string | null,
) {
  const lastMessage = conversation.last_message;
  const isMine = lastMessage?.sender_id === meId;
  const prefix = isMine ? "Vous avez envoyé " : "";
  const suffix = isMine ? "" : " a envoyé ";

  if (!lastMessage) {
    return "Aucun message.";
  }

  const content = lastMessage.content?.trim();
  if (content) {
    return isMine
      ? `Vous : ${content}`
      : `${conversation.counterpart?.prenom ?? "Quelqu'un"} a envoyé ${content}`;
  }

  if (lastMessage.type === "IMAGE") {
    return isMine
      ? `${prefix}une image`
      : `${conversation.counterpart?.prenom ?? "Quelqu'un"}${suffix}une image`;
  }

  if (lastMessage.type === "VIDEO") {
    return isMine
      ? `${prefix}une vidéo`
      : `${conversation.counterpart?.prenom ?? "Quelqu'un"}${suffix}une vidéo`;
  }

  if (lastMessage.type === "DOCUMENT") {
    const mediaMimeType = getAttachmentMimeType(lastMessage.media?.[0]);
    if (mediaMimeType.startsWith("audio/")) {
      return isMine
        ? `${prefix}un message vocal`
        : `${conversation.counterpart?.prenom ?? "Quelqu'un"}${suffix}un message vocal`;
    }

    return isMine
      ? `${prefix}une pièce jointe`
      : `${conversation.counterpart?.prenom ?? "Quelqu'un"}${suffix}une pièce jointe`;
  }

  return "Aucun message.";
}

function ConversationAvatar({
  type,
  name,
  photoUrl,
}: {
  type: string;
  name: string;
  photoUrl?: string | null;
}) {
  const isGroup = type === "group";

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border ${
        isGroup
          ? "border-[#436D75]/15 bg-[#436D75]/10 text-[#436D75]"
          : "border-gray-200 bg-[#F7F3E9] text-gray-500"
      }`}
    >
      {isGroup ? (
        <Users size={18} />
      ) : photoUrl ? (
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <CircleUserRound size={20} />
      )}
    </div>
  );
}

export function ConversationList({
  conversations,
  activeConversationId,
  meId,
  loading,
  onOpenConversation,
  onArchiveConversation,
  onDeleteConversation,
  embedded = false,
}: ConversationListProps) {
  const [menuConversationId, setMenuConversationId] = useState<string | null>(
    null,
  );
  const [filterMode, setFilterMode] =
    useState<ConversationListFilterMode>("ALL");

  const filteredConversations = filterConversations(
    conversations,
    filterMode,
    meId,
  );

  return (
    <section
      className={
        embedded
          ? "flex h-full min-h-0 flex-col"
          : "flex h-full min-h-0 flex-col rounded-[28px] border border-white bg-white/85 shadow-xl backdrop-blur-md"
      }
    >
      <ConversationFilters value={filterMode} onChange={setFilterMode} />

      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm font-medium text-gray-400">
            Chargement des conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm font-medium text-gray-400">
            {filterMode === "ARCHIVED"
              ? "Aucune conversation archivée."
              : filterMode === "UNREAD"
                ? "Aucune conversation non lue."
                : filterMode === "GROUP"
                  ? "Aucune conversation de groupe."
                  : "Aucune conversation pour le moment. Sélectionne une personne pour démarrer."}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const isArchived = Boolean(conversation.current_user_archived_at);
              const counterpartName =
                conversation.type === "group"
                  ? conversation.title || "Groupe sans nom"
                  : conversation.counterpart
                    ? `${conversation.counterpart.nom} ${conversation.counterpart.prenom}`
                    : "Conversation privée";
              const preview = getConversationPreview(conversation, meId);
              const metadata =
                conversation.type === "group"
                  ? `${conversation.participant_count ?? 0} membres`
                  : getUserPresenceLabel(conversation.counterpart);
              const isMuted = Boolean(conversation.current_user_is_muted);

              return (
                <div
                  key={conversation.id}
                  className={`group relative rounded-[22px] border px-3 py-3 transition ${
                    isActive
                      ? "border-[#436D75]/25 bg-[#436D75]/6 shadow-sm"
                      : "border-transparent bg-[#F7F3E9]/60 hover:border-gray-200 hover:bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onOpenConversation(conversation.id)}
                    className="w-full pr-9 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <ConversationAvatar
                        type={conversation.type}
                        name={counterpartName}
                        photoUrl={conversation.counterpart?.photo_profil_url}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-gray-900">
                              {counterpartName}
                            </p>
                            <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#436D75]/70">
                              {metadata}
                              {isMuted ? (
                                <span className="ml-2 rounded-full bg-gray-900 px-2 py-0.5 text-[9px] text-white">
                                  Muet
                                </span>
                              ) : null}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] font-bold text-gray-400">
                            {formatRelativeDate(conversation.last_message_at)}
                          </span>
                        </div>

                        <p
                          className="mt-2 text-sm text-gray-600"
                          style={{
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            overflow: "hidden",
                          }}
                        >
                          {preview || "Aucun message."}
                        </p>
                      </div>
                    </div>
                  </button>

                  <div className="absolute right-3 top-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuConversationId((prev) =>
                          prev === conversation.id ? null : conversation.id,
                        );
                      }}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 ${
                        menuConversationId === conversation.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                      title="Actions conversation"
                    >
                      <MoreVertical size={13} />
                    </button>

                    {menuConversationId === conversation.id ? (
                      <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuConversationId(null);
                            onArchiveConversation(conversation.id, !isArchived);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-700 transition hover:bg-[#F7F3E9]"
                        >
                          {isArchived ? (
                            <ArchiveRestore size={13} />
                          ) : (
                            <Archive size={13} />
                          )}
                          {isArchived ? "Désarchiver" : "Archiver"}
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuConversationId(null);
                            onDeleteConversation(conversation.id);
                          }}
                          className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-700 transition hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                          Supprimer conversation
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
