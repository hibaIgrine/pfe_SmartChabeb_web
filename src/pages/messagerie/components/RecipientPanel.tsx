import { PlusCircle } from "lucide-react";
import type { MessengerUser } from "../types";

type RecipientPanelProps = {
  recipients: MessengerUser[];
  selectedRecipientId: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelectRecipient: (recipientId: string) => void;
  onCreateConversation: () => void;
  submitting: boolean;
};

export function RecipientPanel({
  recipients,
  selectedRecipientId,
  searchValue,
  onSearchChange,
  onSelectRecipient,
  onCreateConversation,
  submitting,
}: RecipientPanelProps) {
  return (
    <section className="rounded-[28px] border border-white bg-white/85 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#436D75]">
            Nouveau message
          </p>
          <h3 className="text-lg font-black tracking-tight text-gray-900">
            Démarrer une conversation
          </h3>
        </div>
        <button
          type="button"
          onClick={onCreateConversation}
          disabled={submitting || !selectedRecipientId}
          className="inline-flex items-center gap-2 rounded-full bg-[#436D75] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusCircle size={14} />
          Ouvrir
        </button>
      </div>

      <div className="mt-4">
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher un utilisateur"
          className="w-full rounded-2xl border border-gray-200 bg-[#F7F3E9]/60 px-4 py-3 text-sm outline-none transition focus:border-[#436D75]/40 focus:bg-white"
        />
      </div>

      <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
        {recipients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
            Aucun utilisateur trouvé.
          </div>
        ) : (
          recipients.map((recipient) => {
            const selected = recipient.id === selectedRecipientId;
            return (
              <button
                key={recipient.id}
                type="button"
                onClick={() => onSelectRecipient(recipient.id)}
                className={`flex w-full items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition ${
                  selected
                    ? "border-[#436D75]/25 bg-[#436D75]/6"
                    : "border-transparent bg-[#F7F3E9]/60 hover:border-gray-200 hover:bg-white"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#436D75] text-xs font-black text-white">
                  {recipient.photo_profil_url ? (
                    <img
                      src={recipient.photo_profil_url}
                      alt={`${recipient.nom} ${recipient.prenom}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    `${recipient.nom?.[0] ?? "?"}${recipient.prenom?.[0] ?? "?"}`
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-gray-900">
                    {recipient.nom} {recipient.prenom}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                    {recipient.role ?? "Utilisateur"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
