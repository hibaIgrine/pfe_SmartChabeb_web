/**
 * ConversationFilters.tsx — Barre de filtres au-dessus de la liste des conversations.
 *
 * RÔLE :
 *   4 boutons radio pour filtrer la liste des conversations :
 *   • Tous (MessageCircle)
 *   • Non lus (CheckCheck) — conversations avec unread_count > 0
 *   • Groupes (Users) — conversations de type GROUP
 *   • Archivés (Archive) — conversations archivées par l'utilisateur
 */
import { Archive, CheckCheck, MessageCircle, Users } from "lucide-react";
import type { ConversationListFilterMode } from "../conversationFilters";

type ConversationFiltersProps = {
  value: ConversationListFilterMode;
  onChange: (value: ConversationListFilterMode) => void;
};

const FILTERS: Array<{
  value: ConversationListFilterMode;
  label: string;
  icon: typeof MessageCircle;
}> = [
  { value: "ALL", label: "Tous", icon: MessageCircle },
  { value: "UNREAD", label: "Non lues", icon: CheckCheck },
  { value: "GROUP", label: "Groupe", icon: Users },
  { value: "ARCHIVED", label: "Archive", icon: Archive },
];

export function ConversationFilters({
  value,
  onChange,
}: ConversationFiltersProps) {
  return (
    <nav aria-label="Filtres conversations" className="px-4 pb-2 pt-3">
      <div className="grid grid-cols-4 gap-2 rounded-[18px] border border-gray-200 bg-white p-2">
        {FILTERS.map((filter) => {
          const Icon = filter.icon;
          const active = value === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onChange(filter.value)}
              className={`flex items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                active
                  ? "bg-[#436D75] text-white shadow-sm"
                  : "text-[#436D75] hover:bg-[#F7F3E9]"
              }`}
            >
              <Icon size={12} />
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
