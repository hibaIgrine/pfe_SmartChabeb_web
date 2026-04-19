import { Paperclip, Send } from "lucide-react";
import type { ChangeEvent } from "react";
import { MessageBubble } from "./MessageBubble";
import type {
  MessengerConversation,
  MessengerMessage,
  MessengerMessageType,
} from "../types";

type ConversationViewProps = {
  meId?: string | null;
  conversation: MessengerConversation | null;
  messages: MessengerMessage[];
  loading: boolean;
  submitting: boolean;
  composerText: string;
  messageType: MessengerMessageType;
  attachmentName: string;
  onComposerTextChange: (value: string) => void;
  onMessageTypeChange: (value: MessengerMessageType) => void;
  onAttachmentChange: (file: File | null) => void;
  onSendMessage: () => void;
};

export function ConversationView({
  meId,
  conversation,
  messages,
  loading,
  submitting,
  composerText,
  messageType,
  attachmentName,
  onComposerTextChange,
  onMessageTypeChange,
  onAttachmentChange,
  onSendMessage,
}: ConversationViewProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onAttachmentChange(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

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

  const counterpart = conversation.counterpart
    ? `${conversation.counterpart.nom} ${conversation.counterpart.prenom}`
    : "Conversation privée";

  return (
    <section className="flex h-full flex-col rounded-[28px] border border-white bg-white/85 shadow-xl backdrop-blur-md">
      <header className="border-b border-gray-100 px-5 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#436D75]">
          Conversation privée
        </p>
        <h3 className="text-xl font-black tracking-tight text-gray-900">
          {counterpart}
        </h3>
      </header>

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
              <MessageBubble
                key={message.id}
                message={message}
                isMine={message.sender_id === meId}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-gray-100 p-4">
        <div className="grid gap-3 md:grid-cols-[140px_1fr]">
          <select
            value={messageType}
            onChange={(event) =>
              onMessageTypeChange(event.target.value as MessengerMessageType)
            }
            className="h-12 rounded-2xl border border-gray-200 bg-[#F7F3E9]/60 px-4 text-sm font-semibold outline-none transition focus:border-[#436D75]/40 focus:bg-white"
          >
            <option value="TEXT">Texte</option>
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Vidéo</option>
            <option value="DOCUMENT">Document</option>
          </select>

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
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#436D75] transition hover:bg-[#436D75]/5">
            <Paperclip size={14} />
            Joindre un fichier
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>

          <div className="flex items-center gap-3">
            {attachmentName ? (
              <span className="max-w-[180px] truncate rounded-full bg-[#D9E8D1]/40 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#436D75]">
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
