import { PlusCircle, Users } from "lucide-react";

type RecipientPanelProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchActivate: () => void;
  submitting: boolean;
  mode: "private" | "group";
  onModeChange: (mode: "private" | "group") => void;
  groupTitle: string;
  onGroupTitleChange: (value: string) => void;
  selectedGroupRecipientIds: string[];
  onCreateGroupConversation: () => void;
  embedded?: boolean;
};

export function RecipientPanel({
  searchValue,
  onSearchChange,
  onSearchActivate,
  submitting,
  mode,
  onModeChange,
  groupTitle,
  onGroupTitleChange,
  selectedGroupRecipientIds,
  onCreateGroupConversation,
  embedded = false,
}: RecipientPanelProps) {
  const isPrivate = mode === "private";

  return (
    <section
      className={
        embedded
          ? "p-1"
          : "rounded-[28px] border border-white bg-white/85 p-5 shadow-xl backdrop-blur-md"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#436D75]">
            Nouveau message
          </p>
          <h3 className="text-lg font-black tracking-tight text-gray-900">
            Discussions
          </h3>
        </div>
        <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => onModeChange("private")}
            className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
              isPrivate
                ? "bg-[#436D75] text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Privé
          </button>
          <button
            type="button"
            onClick={() => onModeChange("group")}
            className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
              !isPrivate
                ? "bg-[#436D75] text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Groupe
          </button>
        </div>
      </div>

      {!isPrivate ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-[#F7F3E9]/50 p-3">
          <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#436D75]">
            Nom du groupe
          </label>
          <input
            value={groupTitle}
            onChange={(event) => onGroupTitleChange(event.target.value)}
            placeholder="Ex: Club, projet, équipe..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#436D75]/40"
          />
        </div>
      ) : null}

      <div className="mt-4">
        <input
          value={searchValue}
          onFocus={onSearchActivate}
          onClick={onSearchActivate}
          onChange={(event) => {
            onSearchChange(event.target.value);
            onSearchActivate();
          }}
          placeholder="Rechercher un utilisateur"
          className="w-full rounded-2xl border border-gray-200 bg-[#F7F3E9]/60 px-4 py-3 text-sm outline-none transition focus:border-[#436D75]/40 focus:bg-white"
        />
      </div>

      {!isPrivate ? (
        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
          {selectedGroupRecipientIds.length} membre(s) sélectionné(s)
        </p>
      ) : null}

      {!isPrivate ? (
        <button
          type="button"
          onClick={onCreateGroupConversation}
          disabled={
            submitting ||
            !groupTitle.trim() ||
            selectedGroupRecipientIds.length === 0
          }
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#436D75] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Users size={14} />
          Créer groupe
        </button>
      ) : null}
    </section>
  );
}
