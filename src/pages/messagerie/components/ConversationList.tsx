import { Search } from "lucide-react";
import type { MessengerConversationSummary } from "../types";

type ConversationListProps = {
  conversations: MessengerConversationSummary[];
  activeConversationId?: string | null;
  loading: boolean;
  onOpenConversation: (conversationId: string) => void;
  onRefresh: () => void;
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

export function ConversationList({
  conversations,
  activeConversationId,
  loading,
  onOpenConversation,
  onRefresh,
}: ConversationListProps) {
  return (
    <section className="flex h-full flex-col rounded-[28px] border border-white bg-white/85 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#436D75]">
            Messagerie
          </p>
          <h3 className="text-lg font-black tracking-tight text-gray-900">
            Conversations
          </h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-[#436D75] transition hover:bg-[#436D75]/5"
          title="Actualiser"
        >
          <Search size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm font-medium text-gray-400">
            Chargement des conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm font-medium text-gray-400">
            Aucune conversation pour le moment.
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const counterpartName = conversation.counterpart
                ? `${conversation.counterpart.nom} ${conversation.counterpart.prenom}`
                : "Conversation privée";
              const preview = conversation.last_message?.content?.trim();

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onOpenConversation(conversation.id)}
                  className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-[#436D75]/25 bg-[#436D75]/6 shadow-sm"
                      : "border-transparent bg-[#F7F3E9]/60 hover:border-gray-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-gray-900">
                        {counterpartName}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#436D75]/70">
                        {conversation.type}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">
                      {formatRelativeDate(conversation.last_message_at)}
                    </span>
                  </div>
                  <p
                    className="mt-3 text-sm text-gray-600"
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      overflow: "hidden",
                    }}
                  >
                    {preview || "Aucun message."}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
