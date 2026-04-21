import { Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConversationList } from "./components/ConversationList";
import { ConversationView } from "./components/ConversationView";
import { RecipientPanel } from "./components/RecipientPanel";
import { useMessageriePage } from "./hooks/useMessageriePage";

export default function MessageriePage() {
  const page = useMessageriePage();
  const [showSearchUsers, setShowSearchUsers] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const recipientOptions = useMemo(
    () => page.filteredUsers,
    [page.filteredUsers],
  );

  useEffect(() => {
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) return;

    void page.openOrReloadConversation(conversationId).finally(() => {
      const next = new URLSearchParams(searchParams);
      next.delete("conversationId");
      setSearchParams(next, { replace: true });
    });
  }, [page, searchParams, setSearchParams]);

  return (
    <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[340px_1fr]">
      <div className="space-y-5">
        <RecipientPanel
          searchValue={page.searchRecipient}
          onSearchChange={page.setSearchRecipient}
          onSearchActivate={() => setShowSearchUsers(true)}
          onCreateConversation={page.startPrivateConversation}
          submitting={page.submitting}
          mode={page.conversationMode}
          onModeChange={page.setConversationMode}
          groupTitle={page.groupTitle}
          onGroupTitleChange={page.setGroupTitle}
          selectedRecipientId={page.selectedRecipientId}
          selectedGroupRecipientIds={page.selectedGroupRecipientIds}
          onCreateGroupConversation={page.startGroupConversation}
        />

        <div className="relative">
          <ConversationList
            conversations={page.conversations}
            activeConversationId={page.activeConversation?.id}
            loading={page.loadingConversations}
            onOpenConversation={page.openOrReloadConversation}
            onDeleteConversation={page.deleteConversationById}
            onRefresh={page.refreshConversations}
          />

          {showSearchUsers ? (
            <section className="absolute inset-0 z-30 rounded-[28px] border border-white bg-white/95 p-4 shadow-2xl backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#436D75]">
                  Résultats utilisateurs
                </p>
                <button
                  type="button"
                  onClick={() => setShowSearchUsers(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
                  title="Fermer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
                {recipientOptions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
                    Aucun utilisateur trouvé.
                  </div>
                ) : (
                  recipientOptions.map((recipient) => {
                    const selected =
                      page.conversationMode === "private"
                        ? recipient.id === page.selectedRecipientId
                        : page.selectedGroupRecipientIds.includes(recipient.id);

                    return (
                      <button
                        key={recipient.id}
                        type="button"
                        onClick={() =>
                          page.conversationMode === "private"
                            ? page.setSelectedRecipientId(recipient.id)
                            : page.toggleGroupRecipient(recipient.id)
                        }
                        className={`flex w-full items-center gap-3 rounded-[16px] border px-3 py-3 text-left transition ${
                          selected
                            ? "border-[#436D75]/25 bg-[#436D75]/6"
                            : "border-transparent bg-[#F7F3E9]/60 hover:border-gray-200 hover:bg-white"
                        }`}
                      >
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#436D75] text-xs font-black text-white">
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

                        {page.conversationMode === "group" ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-[#436D75]">
                            {selected ? <Check size={12} /> : null}
                          </div>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        {page.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {page.error}
          </div>
        ) : null}

        <ConversationView
          meId={page.me?.id}
          conversation={page.activeConversation}
          messages={page.activeMessages}
          typingUsers={page.typingUsers}
          loading={page.loadingConversation}
          submitting={page.submitting}
          composerText={page.composerText}
          messageType={page.messageType}
          attachmentPreview={page.attachmentPreview}
          attachmentName={page.attachmentName}
          attachmentMimeType={page.attachmentMimeType}
          availableUsers={page.groupCandidateUsers}
          onComposerTextChange={page.setComposerText}
          onMessageTypeChange={page.setMessageType}
          onAttachmentChange={page.handleAttachmentChange}
          onClearAttachment={page.clearAttachment}
          onAttachVoiceMessage={page.attachVoiceMessage}
          onSendMessage={page.sendMessage}
          onEditMessage={page.editMessage}
          onDeleteMessageForMe={page.deleteMessageForMe}
          onDeleteMessageForEveryone={page.deleteMessageForEveryone}
          onDeleteConversation={page.deleteConversationById}
          onRenameGroup={page.renameActiveGroup}
          onAddGroupMembers={page.addMembersToActiveGroup}
          onRemoveGroupMember={page.removeMemberFromActiveGroup}
        />
      </div>
    </div>
  );
}
