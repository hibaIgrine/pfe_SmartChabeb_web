import type { FormEvent } from "react";
import type {
  MentionUser,
  PublicationMediaType,
} from "../../../../api/social-media.api";
import type { DraftMediaItem } from "../../types";

export type PostComposerProps = {
  composerText: string;
  draftMediaItems: DraftMediaItem[];
  location: string;
  mentions: MentionUser[];
  hashtagInput: string;
  hashtags: string[];
  mentionUsers: MentionUser[];
  canSubmit: boolean;
  submitting: boolean;
  isEditing: boolean;
  onSubmit: (event: FormEvent) => void;
  setComposerText: (value: string) => void;
  setLocation: (value: string) => void;
  setHashtagInput: (value: string) => void;
  onAddMediaFile: (type: PublicationMediaType, file: File | null) => void;
  onRemoveMediaLine: (index: number) => void;
  onAddMentionById: (id: string) => void;
  onRemoveMention: (id: string) => void;
  onAddHashtag: () => void;
  onRemoveHashtag: (tag: string) => void;
  onCancelEdit: () => void;
};
