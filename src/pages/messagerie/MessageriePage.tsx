import { useMemo } from "react";
import { ConversationList } from "./components/ConversationList";
import { ConversationView } from "./components/ConversationView";
import { RecipientPanel } from "./components/RecipientPanel";
import { useMessageriePage } from "./hooks/useMessageriePage";

export default function MessageriePage() {
  const page = useMessageriePage();

  const recipientOptions = useMemo(
    () => page.filteredUsers,
    [page.filteredUsers],
  );

  return (
    <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[340px_1fr]">
      <div className="space-y-5">
        <RecipientPanel
          recipients={recipientOptions}
          selectedRecipientId={page.selectedRecipientId}
          searchValue={page.searchRecipient}
          onSearchChange={page.setSearchRecipient}
          onSelectRecipient={page.setSelectedRecipientId}
          onCreateConversation={page.startPrivateConversation}
          submitting={page.submitting}
        />

        <ConversationList
          conversations={page.conversations}
          activeConversationId={page.activeConversation?.id}
          loading={page.loadingConversations}
          onOpenConversation={page.openOrReloadConversation}
          onRefresh={page.refreshConversations}
        />
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
          loading={page.loadingConversation}
          submitting={page.submitting}
          composerText={page.composerText}
          messageType={page.messageType}
          attachmentName={page.attachmentName}
          onComposerTextChange={page.setComposerText}
          onMessageTypeChange={page.setMessageType}
          onAttachmentChange={page.handleAttachmentChange}
          onSendMessage={page.sendMessage}
        />
      </div>
    </div>
  );
}
