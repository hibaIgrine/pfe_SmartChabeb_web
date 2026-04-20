import { Search, X } from "lucide-react";
import { useMemo } from "react";
import type { MessengerMessage } from "../types";

type ConversationMessageSearchProps = {
  open: boolean;
  query: string;
  messages: MessengerMessage[];
  selectedMessageId?: string | null;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSelectMessage: (messageId: string) => void;
};

function formatResultDate(value: string) {
  return new Date(value).toLocaleString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationMessageSearch({
  open,
  query,
  messages,
  selectedMessageId,
  onQueryChange,
  onClose,
  onSelectMessage,
}: ConversationMessageSearchProps) {
  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) return [];

    return messages.filter((message) => {
      const content = (message.content ?? "").toLowerCase();
      return content.includes(normalizedQuery);
    });
  }, [messages, normalizedQuery]);

  if (!open) {
    return null;
  }

  return (
    <div className="mt-3 rounded-2xl border border-gray-200 bg-white/95 p-3">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Rechercher dans les messages..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#436D75]/40"
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
          title="Fermer recherche"
        >
          <X size={14} />
        </button>
      </div>

      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
        {normalizedQuery
          ? `${results.length} résultat(s)`
          : "Tape un mot pour afficher les résultats"}
      </p>

      {normalizedQuery ? (
        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-center text-sm text-gray-400">
              Aucun message trouvé.
            </div>
          ) : (
            results.map((message) => {
              const isActive = message.id === selectedMessageId;

              return (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => onSelectMessage(message.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                    isActive
                      ? "border-[#436D75]/30 bg-[#436D75]/8"
                      : "border-gray-200 bg-white hover:bg-[#F7F3E9]/70"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {message.content || "(message sans texte)"}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                      {message.sender.nom} {message.sender.prenom}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-gray-500">
                    {formatResultDate(message.created_at)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
