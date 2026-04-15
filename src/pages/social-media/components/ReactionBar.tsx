import { useState } from "react";
import { MessageCircle, Share2 } from "lucide-react";
import type {
  ReactionSummary,
  ReactionType,
} from "../../../api/social-media.api";

const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  wow: "😮",
  bravo: "👏",
  instructif: "💡",
  soutien: "🤝",
  haha: "😂",
};

const REACTION_LABELS: Record<ReactionType, string> = {
  like: "J'aime",
  love: "J'adore",
  wow: "Impressionnant",
  bravo: "Bravo",
  instructif: "Instructif",
  soutien: "Je soutiens",
  haha: "Haha",
};

type ReactionBarProps = {
  reactions?: ReactionSummary;
  userReaction?: ReactionType | null;
  onReact: (reactionType: ReactionType) => void;
  onRemoveReaction: () => void;
  onCommentClick?: () => void;
  commentCount?: number;
  commentsOpen?: boolean;
  onShareClick?: () => void;
};

type ReactionPickerProps = {
  onSelect: (type: ReactionType) => void;
  isOpen: boolean;
};

function ReactionPicker({ onSelect, isOpen }: ReactionPickerProps) {
  const reactionTypes: ReactionType[] = [
    "like",
    "love",
    "wow",
    "bravo",
    "instructif",
    "soutien",
    "haha",
  ];

  if (!isOpen) return null;

  return (
    <div
      className="absolute bottom-full left-0 z-20 flex gap-1 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-lg"
      onClick={(event) => event.stopPropagation()}
    >
      {reactionTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect(type);
          }}
          className="group relative transition-transform hover:scale-125"
          title={REACTION_LABELS[type]}
        >
          <span className="text-2xl">{REACTION_EMOJIS[type]}</span>
        </button>
      ))}
    </div>
  );
}

export function ReactionBar({
  reactions,
  userReaction,
  onReact,
  onRemoveReaction,
  onCommentClick,
  commentCount = 0,
  commentsOpen = false,
  onShareClick,
}: ReactionBarProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const totalReactions = reactions?.total ?? 0;

  const reactionTypes: ReactionType[] = [
    "like",
    "love",
    "wow",
    "bravo",
    "instructif",
    "soutien",
    "haha",
  ];

  const handleReactionSelect = (type: ReactionType) => {
    onReact(type);
    setIsPickerOpen(false);
  };

  const handleRemoveReaction = () => {
    onRemoveReaction();
    setIsPickerOpen(false);
  };

  return (
    <div className="mt-4 space-y-3 border-t border-[#e7dfcf] pt-3">
      {/* Reaction counts display */}
      {totalReactions > 0 && (
        <div className="flex flex-wrap gap-2">
          {reactionTypes.map((type) => {
            const count = reactions?.aggregated?.[type]?.length ?? 0;
            if (count === 0) return null;
            return (
              <div
                key={type}
                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs gap-1"
              >
                <span className="text-sm">{REACTION_EMOJIS[type]}</span>
                <span className="font-medium text-gray-700">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Like + Comment on same line (comment centered) */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center pt-1">
        <div
          className="relative inline-block justify-self-start"
          onMouseEnter={() => setIsPickerOpen(true)}
          onMouseLeave={() => setIsPickerOpen(false)}
        >
          {userReaction && userReaction !== "like" ? (
            <button
              type="button"
              onClick={handleRemoveReaction}
              className="relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium text-sm transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100"
              title={`${REACTION_LABELS[userReaction]} - cliquez pour retirer`}
            >
              <span className="text-lg">{REACTION_EMOJIS[userReaction]}</span>
              <span>{REACTION_LABELS[userReaction]}</span>
              <ReactionPicker
                onSelect={handleReactionSelect}
                isOpen={isPickerOpen}
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleReactionSelect("like")}
              className={`relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium text-sm transition-colors ${
                userReaction === "like"
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
              title="Cliquez ou survolez pour réagir"
            >
              <span className="text-lg">👍</span>
              <span>{userReaction === "like" ? "J'aime" : "J'aime"}</span>
              <ReactionPicker
                onSelect={handleReactionSelect}
                isOpen={isPickerOpen}
              />
            </button>
          )}
        </div>

        {onCommentClick ? (
          <button
            type="button"
            onClick={onCommentClick}
            className={`justify-self-center rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              commentsOpen
                ? "bg-[#f7f3e9] text-[#2f5560]"
                : "text-[#436D75] hover:bg-[#f7f3e9]"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle size={16} />
              Commentaire ({commentCount})
            </span>
          </button>
        ) : (
          <div />
        )}

        {onShareClick ? (
          <button
            type="button"
            onClick={onShareClick}
            className="justify-self-end rounded-full px-4 py-1.5 text-sm font-semibold text-[#436D75] hover:bg-[#f7f3e9] transition-colors"
          >
            <span className="inline-flex items-center gap-1.5">
              <Share2 size={16} />
              Partager
            </span>
          </button>
        ) : (
          <div className="justify-self-end" />
        )}
      </div>
    </div>
  );
}
