import { MoreVertical, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import type { MessengerConversationSummary } from "../types";
import { getUserPresenceLabel } from "../utils/presence";

type ConversationListProps = {
  conversations: MessengerConversationSummary[];
  activeConversationId?: string | null;
  loading: boolean;
  onOpenConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
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
  onDeleteConversation,
  onRefresh,
}: ConversationListProps) {
  const [menuConversationId, setMenuConversationId] = useState<string | null>(
    null,
  );

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
              const counterpartName =
                conversation.type === "group"
                  ? conversation.title || "Groupe sans nom"
                  : conversation.counterpart
                    ? `${conversation.counterpart.nom} ${conversation.counterpart.prenom}`
                    : "Conversation privée";
              const preview = conversation.last_message?.content?.trim();
              const metadata =
                conversation.type === "group"
                  ? `${conversation.participant_count ?? 0} membres`
                  : getUserPresenceLabel(conversation.counterpart);

              return (
                <div
                  key={conversation.id}
                  className={`group relative rounded-[22px] border px-4 py-4 transition ${
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-gray-900">
                          {counterpartName}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#436D75]/70">
                          {metadata}
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
                            onDeleteConversation(conversation.id);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-700 transition hover:bg-red-50"
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
