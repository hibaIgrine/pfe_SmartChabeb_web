import type { MessengerMessage } from "../types";

type MessageBubbleProps = {
  message: MessengerMessage;
  isMine: boolean;
};

function renderMedia(message: MessengerMessage) {
  if (!message.media || message.media.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {message.media.map((item, index) => {
        if (typeof item !== "string") {
          return null;
        }

        if (message.type === "IMAGE") {
          return (
            <img
              key={`${message.id}-${index}`}
              src={item}
              alt="Pièce jointe"
              className="max-h-72 w-full rounded-2xl object-cover"
            />
          );
        }

        if (message.type === "VIDEO") {
          return (
            <video
              key={`${message.id}-${index}`}
              src={item}
              controls
              className="max-h-72 w-full rounded-2xl bg-black"
            />
          );
        }

        return (
          <a
            key={`${message.id}-${index}`}
            href={item}
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-inherit underline decoration-dotted underline-offset-4"
          >
            Voir la pièce jointe
          </a>
        );
      })}
    </div>
  );
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-[26px] px-4 py-3 shadow-sm ${
          isMine
            ? "bg-[#436D75] text-white"
            : "border border-gray-100 bg-white text-gray-800"
        }`}
      >
        {!isMine ? (
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#436D75]">
            {message.sender.nom} {message.sender.prenom}
          </p>
        ) : null}
        {message.content ? (
          <p
            className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed ${isMine ? "text-white" : "text-gray-700"}`}
          >
            {message.content}
          </p>
        ) : null}
        {renderMedia(message)}
        <div
          className={`mt-2 flex items-center justify-end gap-2 text-[10px] font-bold ${isMine ? "text-white/70" : "text-gray-400"}`}
        >
          <span>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span>•</span>
          <span>{message.status}</span>
        </div>
      </div>
    </div>
  );
}
