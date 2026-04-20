import { PlusCircle, Save, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { MessengerConversation, MessengerUser } from "../types";
import { getUserPresenceLabel } from "../utils/presence";

type GroupManagementPanelProps = {
  conversation: MessengerConversation;
  availableUsers: MessengerUser[];
  canManage: boolean;
  submitting: boolean;
  section: "settings" | "members";
  onRenameGroup: (title: string) => void;
  onAddMembers: (userIds: string[]) => void;
  onRemoveMember: (userId: string) => void;
};

export function GroupManagementPanel({
  conversation,
  availableUsers,
  canManage,
  submitting,
  section,
  onRenameGroup,
  onAddMembers,
  onRemoveMember,
}: GroupManagementPanelProps) {
  const [titleDraft, setTitleDraft] = useState(conversation.title ?? "");
  const [search, setSearch] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);

  useEffect(() => {
    setTitleDraft(conversation.title ?? "");
    setSelectedToAdd([]);
    setSearch("");
  }, [conversation.id, conversation.title]);

  const memberIds = useMemo(
    () =>
      new Set(
        conversation.participants.map((participant) => participant.user_id),
      ),
    [conversation.participants],
  );

  const candidateUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return availableUsers.filter((user) => {
      if (memberIds.has(user.id)) return false;
      if (!query) return true;
      return `${user.nom} ${user.prenom}`.toLowerCase().includes(query);
    });
  }, [availableUsers, memberIds, search]);

  const toggleAddMember = (userId: string) => {
    setSelectedToAdd((prev) =>
      prev.includes(userId)
        ? prev.filter((item) => item !== userId)
        : [...prev, userId],
    );
  };

  const handleRename = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed) return;
    onRenameGroup(trimmed);
  };

  const handleAdd = () => {
    if (selectedToAdd.length === 0) return;
    onAddMembers(selectedToAdd);
    setSelectedToAdd([]);
  };

  return (
    <div className="rounded-[24px] border border-gray-200 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[#436D75]">
        <Users size={16} />
        <p className="text-[10px] font-black uppercase tracking-[0.18em]">
          {section === "settings"
            ? "Paramètres du groupe"
            : "Membres du groupe"}
        </p>
      </div>

      {section === "settings" ? (
        <>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              placeholder="Nom du groupe"
              className="flex-1 rounded-2xl border border-gray-200 bg-[#F7F3E9]/50 px-4 py-3 text-sm outline-none transition focus:border-[#436D75]/40"
              disabled={!canManage || submitting}
            />
            <button
              type="button"
              onClick={handleRename}
              disabled={!canManage || submitting || !titleDraft.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#436D75] px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              Renommer
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-[#F7F3E9]/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                Ajouter des membres
              </p>
              <span className="text-[10px] font-bold text-gray-400">
                {selectedToAdd.length} sélectionné(s)
              </span>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un utilisateur"
              className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
              disabled={!canManage || submitting}
            />

            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
              {candidateUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-5 text-center text-sm text-gray-400">
                  Aucun utilisateur disponible.
                </div>
              ) : (
                candidateUsers.map((user) => {
                  const selected = selectedToAdd.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleAddMember(user.id)}
                      disabled={!canManage || submitting}
                      className={`flex w-full items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition ${
                        selected
                          ? "border-[#436D75]/25 bg-[#436D75]/6"
                          : "border-transparent bg-white hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#436D75] text-xs font-black text-white">
                        {user.photo_profil_url ? (
                          <img
                            src={user.photo_profil_url}
                            alt={`${user.nom} ${user.prenom}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          `${user.nom?.[0] ?? "?"}${user.prenom?.[0] ?? "?"}`
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-gray-900">
                          {user.nom} {user.prenom}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                          {user.role ?? "Utilisateur"}
                        </p>
                      </div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-[#436D75]">
                        {selected ? "✓" : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!canManage || submitting || selectedToAdd.length === 0}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#436D75]/20 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#436D75] transition hover:bg-[#F7F3E9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusCircle size={14} />
              Ajouter sélection
            </button>
          </div>
        </>
      ) : null}

      {section === "members" ? (
        <div className="mt-4">
          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
            {conversation.participants.map((participant) => {
              const isCreator = participant.user_id === conversation.created_by;
              const canRemove = canManage && !isCreator;

              return (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 rounded-[18px] border border-gray-200 bg-[#F7F3E9]/40 px-3 py-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#436D75] text-xs font-black text-white">
                    {participant.user.photo_profil_url ? (
                      <img
                        src={participant.user.photo_profil_url}
                        alt={`${participant.user.nom} ${participant.user.prenom}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      `${participant.user.nom?.[0] ?? "?"}${participant.user.prenom?.[0] ?? "?"}`
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-gray-900">
                      {participant.user.nom} {participant.user.prenom}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                      {isCreator ? "Créateur" : participant.role}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">
                      {getUserPresenceLabel(participant.user)}
                    </p>
                  </div>
                  {canRemove ? (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(participant.user_id)}
                      disabled={submitting}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      Supprimer
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
