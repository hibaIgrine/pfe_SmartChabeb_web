import type { FormEvent } from "react";
import type {
  MentionUser,
  PublicationMediaType,
  PublicationVisibility,
} from "../../../../api/social-media.api";
import type { DraftMediaItem } from "../../types";

export type PostComposerProps = {
  composerText: string;
  draftMediaItems: DraftMediaItem[];
  location: string;
  visibility: PublicationVisibility;
  mentions: MentionUser[];
  hiddenUsers: MentionUser[];
  hashtagInput: string;
  hashtags: string[];
  mentionUsers: MentionUser[];
  canSubmit: boolean;
  submitting: boolean;
  isEditing: boolean;
  onSubmit: (event: FormEvent) => void;
  setComposerText: (value: string) => void;
  setLocation: (value: string) => void;
  setVisibility: (value: PublicationVisibility) => void;
  setHashtagInput: (value: string) => void;
  onAddMediaFile: (type: PublicationMediaType, file: File | null) => void;
  onRemoveMediaLine: (index: number) => void;
  onAddMentionById: (id: string) => void;
  onRemoveMention: (id: string) => void;
  onAddHiddenUserById: (id: string) => void;
  onRemoveHiddenUser: (id: string) => void;
  onAddHashtag: () => void;
  onRemoveHashtag: (tag: string) => void;
  onCancelEdit: () => void;
};
