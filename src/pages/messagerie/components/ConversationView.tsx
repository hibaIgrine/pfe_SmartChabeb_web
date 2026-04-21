import {
  FileImage,
  FileText,
  MoreVertical,
  Search,
  Send,
  Settings,
  Trash2,
  Type,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ConversationMessageSearch } from "./ConversationMessageSearch";
import { GroupManagementPanel } from "./GroupManagementPanel";
import { MessageBubble } from "./MessageBubble";
import { VoiceMessageRecorder } from "./VoiceMessageRecorder";
import { getUserPresenceLabel } from "../utils/presence";
import type {
  MessengerConversation,
  MessengerMessage,
  MessengerMessageType,
  MessengerUser,
} from "../types";

type ConversationViewProps = {
  meId?: string | null;
  conversation: MessengerConversation | null;
  messages: MessengerMessage[];
  typingUsers: MessengerUser[];
  loading: boolean;
  submitting: boolean;
  composerText: string;
  messageType: MessengerMessageType;
  attachmentPreview: string | null;
  attachmentName: string;
  attachmentMimeType: string;
  availableUsers: MessengerUser[];
  onComposerTextChange: (value: string) => void;
  onMessageTypeChange: (value: MessengerMessageType) => void;
  onAttachmentChange: (file: File | null) => void;
  onClearAttachment: () => void;
  onAttachVoiceMessage: (payload: {
    dataUrl: string;
    mimeType: string;
    fileName: string;
  }) => void;
  onSendMessage: () => void;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessageForMe: (messageId: string) => void;
  onDeleteMessageForEveryone: (messageId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameGroup: (title: string) => void;
  onAddGroupMembers: (userIds: string[]) => void;
  onRemoveGroupMember: (userId: string) => void;
};

export function ConversationView({
  meId,
  conversation,
  messages,
  typingUsers,
  loading,
  submitting,
  composerText,
  messageType,
  attachmentPreview,
  attachmentName,
  attachmentMimeType,
  availableUsers,
  onComposerTextChange,
  onMessageTypeChange,
  onAttachmentChange,
  onClearAttachment,
  onAttachVoiceMessage,
  onSendMessage,
  onEditMessage,
  onDeleteMessageForMe,
  onDeleteMessageForEveryone,
  onDeleteConversation,
  onRenameGroup,
  onAddGroupMembers,
  onRemoveGroupMember,
}: ConversationViewProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const messageNodesRef = useRef<Record<string, HTMLDivElement | null>>({});
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [messageSearchOpen, setMessageSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [openGroupPanel, setOpenGroupPanel] = useState<
    "settings" | "members" | null
  >(null);

  useEffect(() => {
    setHeaderMenuOpen(false);
    setMessageSearchOpen(false);
    setMessageSearchQuery("");
    setSelectedMessageId(null);
    setOpenGroupPanel(null);
  }, [conversation?.id]);

  const handleSelectSearchResult = (messageId: string) => {
    setSelectedMessageId(messageId);

    const target = messageNodesRef.current[messageId];
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onAttachmentChange(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  const openPickerForType = (nextType: MessengerMessageType) => {
    onMessageTypeChange(nextType);

    if (nextType === "IMAGE") {
      imageInputRef.current?.click();
      return;
    }

    if (nextType === "VIDEO") {
      videoInputRef.current?.click();
      return;
    }

    if (nextType === "DOCUMENT") {
      documentInputRef.current?.click();
    }
  };

  const typeActionClass = (targetType: MessengerMessageType) =>
    `inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
      messageType === targetType
        ? "border-[#436D75] bg-[#436D75] text-white"
        : "border-gray-200 bg-white text-[#436D75] hover:bg-[#F7F3E9]"
    }`;

  if (!conversation) {
    return (
      <section className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-white bg-white/65 p-8 text-center shadow-xl backdrop-blur-md">
        <div className="max-w-md space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#436D75]">
            Messagerie
          </p>
          <h3 className="text-2xl font-black tracking-tight text-gray-900">
            Choisis une conversation
          </h3>
          <p className="text-sm text-gray-500">
            Crée ou ouvre une conversation privée pour commencer à écrire.
          </p>
        </div>
      </section>
    );
  }

  const isGroupConversation = conversation.type === "group";
  const canManageGroup = conversation.current_user_role === "ADMIN";
  const conversationTitle = isGroupConversation
    ? conversation.title || "Groupe sans nom"
    : conversation.counterpart
      ? `${conversation.counterpart.nom} ${conversation.counterpart.prenom}`
      : "Conversation privée";

  const visibleTypingUsers = typingUsers.filter((user) => user.id !== meId);

  const typingLabel = (() => {
    if (visibleTypingUsers.length === 0) {
      return null;
    }

    if (!isGroupConversation) {
      return `${visibleTypingUsers[0].nom} ${visibleTypingUsers[0].prenom} est en train d'écrire`;
    }

    const names = visibleTypingUsers.map(
      (user) => `${user.nom} ${user.prenom}`,
    );
    if (names.length === 1) {
      return `${names[0]} est en train d'écrire`;
    }

    if (names.length === 2) {
      return `${names[0]} et ${names[1]} sont en train d'écrire`;
    }

    return `${names[0]}, ${names[1]} et ${names.length - 2} autres écrivent`;
  })();

  return (
    <section className="flex h-full flex-col rounded-[28px] border border-white bg-white/85 shadow-xl backdrop-blur-md">
      <header className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#436D75]">
              {isGroupConversation
                ? "Conversation de groupe"
                : "Conversation privée"}
            </p>
            <h3 className="text-xl font-black tracking-tight text-gray-900">
              {conversationTitle}
            </h3>
            {isGroupConversation ? (
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                {conversation.participant_count ??
                  conversation.participants.length}{" "}
                membres
              </p>
            ) : (
              <p className="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                <span
                  className={`h-2 w-2 rounded-full ${conversation.counterpart?.is_online ? "bg-emerald-500" : "bg-gray-300"}`}
                />
                {getUserPresenceLabel(conversation.counterpart)}
              </p>
            )}

            {typingLabel ? (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#436D75]">
                <span>{typingLabel}</span>
                <span className="inline-flex items-end">
                  <span
                    className="inline-block animate-pulse"
                    style={{ animationDelay: "0ms" }}
                  >
                    .
                  </span>
                  <span
                    className="inline-block animate-pulse"
                    style={{ animationDelay: "180ms" }}
                  >
                    .
                  </span>
                  <span
                    className="inline-block animate-pulse"
                    style={{ animationDelay: "360ms" }}
                  >
                    .
                  </span>
                </span>
              </p>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setHeaderMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#436D75] transition hover:bg-[#F7F3E9]"
              title="Actions conversation"
            >
              <MoreVertical size={16} />
            </button>

            {headerMenuOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMessageSearchOpen(true);
                    setHeaderMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-[#F7F3E9]"
                >
                  <Search size={14} />
                  Rechercher un message
                </button>

                {isGroupConversation ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenGroupPanel("settings");
                        setHeaderMenuOpen(false);
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-[#F7F3E9]"
                    >
                      <Settings size={14} />
                      Paramètres du groupe
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenGroupPanel("members");
                        setHeaderMenuOpen(false);
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-[#F7F3E9]"
                    >
                      <Users size={14} />
                      Membres du groupe
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    onDeleteConversation(conversation.id);
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Supprimer conversation
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <ConversationMessageSearch
          open={messageSearchOpen}
          query={messageSearchQuery}
          messages={messages}
          selectedMessageId={selectedMessageId}
          onQueryChange={setMessageSearchQuery}
          onClose={() => {
            setMessageSearchOpen(false);
            setMessageSearchQuery("");
            setSelectedMessageId(null);
          }}
          onSelectMessage={handleSelectSearchResult}
        />
      </header>

      {isGroupConversation && openGroupPanel ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/40 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#436D75]">
                {openGroupPanel === "settings"
                  ? "Paramètres du groupe"
                  : "Membres du groupe"}
              </p>
              <button
                type="button"
                onClick={() => setOpenGroupPanel(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
              >
                <X size={14} />
              </button>
            </div>

            <GroupManagementPanel
              section={openGroupPanel}
              conversation={conversation}
              availableUsers={availableUsers}
              canManage={canManageGroup}
              submitting={submitting}
              onRenameGroup={onRenameGroup}
              onAddMembers={onAddGroupMembers}
              onRemoveMember={onRemoveGroupMember}
            />
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
            Chargement du fil de messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
            Aucun message pour le moment.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                ref={(node) => {
                  messageNodesRef.current[message.id] = node;
                }}
                className={`rounded-[28px] transition ${
                  selectedMessageId === message.id
                    ? "ring-2 ring-[#436D75]/40 ring-offset-2"
                    : ""
                }`}
              >
                <MessageBubble
                  message={message}
                  isMine={message.sender_id === meId}
                  submitting={submitting}
                  onEditMessage={onEditMessage}
                  onDeleteForMe={onDeleteMessageForMe}
                  onDeleteForEveryone={onDeleteMessageForEveryone}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-gray-100 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onMessageTypeChange("TEXT")}
            className={typeActionClass("TEXT")}
            title="Message texte"
          >
            <Type size={18} />
          </button>
          <button
            type="button"
            onClick={() => openPickerForType("IMAGE")}
            className={typeActionClass("IMAGE")}
            title="Envoyer une image"
          >
            <FileImage size={18} />
          </button>
          <button
            type="button"
            onClick={() => openPickerForType("VIDEO")}
            className={typeActionClass("VIDEO")}
            title="Envoyer une vidéo"
          >
            <Video size={18} />
          </button>
          <button
            type="button"
            onClick={() => openPickerForType("DOCUMENT")}
            className={typeActionClass("DOCUMENT")}
            title="Envoyer un document"
          >
            <FileText size={18} />
          </button>

          <VoiceMessageRecorder
            disabled={submitting}
            onRecorded={onAttachVoiceMessage}
          />

          {attachmentPreview ? (
            <button
              type="button"
              onClick={onClearAttachment}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500 hover:bg-gray-50"
            >
              <X size={12} />
              Retirer fichier
            </button>
          ) : null}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={documentInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="grid gap-3">
          <textarea
            value={composerText}
            onChange={(event) => onComposerTextChange(event.target.value)}
            rows={3}
            placeholder={
              messageType === "TEXT"
                ? "Écrire un message..."
                : "Le texte est optionnel pour ce type de message"
            }
            className="w-full resize-none rounded-2xl border border-gray-200 bg-[#F7F3E9]/60 px-4 py-3 text-sm outline-none transition focus:border-[#436D75]/40 focus:bg-white"
          />

          {attachmentPreview ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-3">
              {messageType === "IMAGE" ? (
                <img
                  src={attachmentPreview}
                  alt="Aperçu image"
                  className="max-h-64 w-full rounded-xl object-cover"
                />
              ) : null}

              {messageType === "VIDEO" ? (
                <video
                  src={attachmentPreview}
                  controls
                  className="max-h-72 w-full rounded-xl bg-black"
                />
              ) : null}

              {messageType === "DOCUMENT" ? (
                <div className="space-y-3 rounded-xl border border-gray-100 bg-[#F7F3E9]/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-[#436D75]">
                        Document prêt
                      </p>
                      <p className="truncate text-sm text-gray-600">
                        {attachmentName || "Fichier sélectionné"}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">
                      {attachmentMimeType || "fichier"}
                    </span>
                  </div>

                  {attachmentMimeType === "application/pdf" ? (
                    <iframe
                      src={attachmentPreview}
                      title="Aperçu document PDF"
                      className="h-96 w-full rounded-xl border border-gray-200 bg-white"
                    />
                  ) : attachmentMimeType.startsWith("audio/") ? (
                    <div className="rounded-xl border border-[#b8caa9] bg-[#D9E8D1]/60 p-3">
                      <audio
                        src={attachmentPreview}
                        controls
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#436D75]/10 text-[#436D75]">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-gray-900">
                          {attachmentName || "Document sélectionné"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Aperçu visuel limité pour ce format, mais le fichier
                          est prêt à être envoyé.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {attachmentName ? (
              <span className="max-w-[180px] truncate rounded-full bg-gray-100 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#436D75]">
                {attachmentName}
              </span>
            ) : null}

            <button
              type="button"
              onClick={onSendMessage}
              disabled={submitting}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#436D75] px-5 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={14} />
              Envoyer
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}
