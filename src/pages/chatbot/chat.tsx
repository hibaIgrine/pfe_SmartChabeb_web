import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, SendHorizontal, ShieldAlert, Sparkles, Zap } from "lucide-react";
import api from "../../api/axios";

type ChatRole = "user" | "model";

interface ChatMessage {
  role: ChatRole;
  parts: { text: string }[];
}

interface ChatbotResponse {
  response: string;
}

interface StoredConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

const STORAGE_KEY = "smartchabeb_chatbot_conversations";
const MAX_HISTORY = 10;

const quickPrompts = [
  "Quels clubs sont actifs en ce moment ?",
  "Quels événements sont prévus cette semaine ?",
  "Comment m'inscrire à un club ?",
  "شنوة الأنشطة المتوفرة اليوم ؟",
];

const emptyConversation = (): ChatMessage[] => [];

function createConversationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildConversationTitle(messages: ChatMessage[]) {
  const firstUserMessage = messages
    .find((message) => message.role === "user")
    ?.parts[0]?.text?.trim();

  if (!firstUserMessage) {
    return "Nouvelle conversation";
  }

  return firstUserMessage.length > 42
    ? `${firstUserMessage.slice(0, 42).trim()}...`
    : firstUserMessage;
}

function safeParseConversations(rawValue: string | null): StoredConversation[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredConversation[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (conversation) => conversation && typeof conversation.id === "string",
      )
      .map((conversation) => ({
        ...conversation,
        messages: Array.isArray(conversation.messages)
          ? conversation.messages
          : [],
      }));
  } catch {
    return [];
  }
}

const Chat = () => {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>(emptyConversation);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    const savedConversations = safeParseConversations(
      localStorage.getItem(STORAGE_KEY),
    );

    setConversations(savedConversations);

    if (savedConversations.length > 0) {
      const latestConversation = [...savedConversations].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      )[0];

      setActiveConversationId(latestConversation.id);
      activeConversationIdRef.current = latestConversation.id;
      setMessages(latestConversation.messages);
    }
  }, []);

  useEffect(() => {
    if (conversations.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading],
  );

  const upsertConversation = (
    conversationMessages: ChatMessage[],
    conversationId = activeConversationIdRef.current ?? createConversationId(),
  ) => {
    const conversationTitle = buildConversationTitle(conversationMessages);
    const updatedConversation: StoredConversation = {
      id: conversationId,
      title: conversationTitle,
      messages: conversationMessages,
      updatedAt: new Date().toISOString(),
    };

    setActiveConversationId(conversationId);
    activeConversationIdRef.current = conversationId;
    setConversations((previousConversations) => {
      const remainingConversations = previousConversations.filter(
        (conversation) => conversation.id !== conversationId,
      );

      return [updatedConversation, ...remainingConversations].slice(0, 12);
    });
  };

  const openConversation = (conversation: StoredConversation) => {
    setActiveConversationId(conversation.id);
    activeConversationIdRef.current = conversation.id;
    setMessages(conversation.messages);
    setInput("");
    setError(null);
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    activeConversationIdRef.current = null;
    setMessages([]);
    setInput("");
    setError(null);
  };

  const sendMessage = async (presetMessage?: string) => {
    const messageToSend = (presetMessage ?? input).trim();

    if (!messageToSend || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: messageToSend }],
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    const conversationId =
      activeConversationIdRef.current ?? createConversationId();
    upsertConversation(nextMessages, conversationId);

    try {
      const response = await api.post<ChatbotResponse>("/chatbot/ask", {
        message: messageToSend,
        history: nextMessages.slice(-MAX_HISTORY),
      });

      const botReply =
        response.data.response?.trim() ||
        "Désolé, je n'ai pas pu générer de réponse pour le moment.";

      setMessages((previousMessages) => {
        const nextConversationMessages: ChatMessage[] = [
          ...previousMessages,
          { role: "model", parts: [{ text: botReply }] },
        ];

        upsertConversation(nextConversationMessages, conversationId);
        return nextConversationMessages;
      });
    } catch (requestError) {
      console.error("Erreur chatbot:", requestError);
      setError(
        "Le bot n'a pas répondu correctement. Réessaie dans un instant.",
      );
      setMessages((previousMessages) => {
        const nextConversationMessages: ChatMessage[] = [
          ...previousMessages,
          {
            role: "model",
            parts: [
              {
                text: "Je rencontre un souci de connexion avec l'assistant. Réessaie juste après.",
              },
            ],
          },
        ];

        upsertConversation(nextConversationMessages, conversationId);
        return nextConversationMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(67,109,117,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(233,138,125,0.18),_transparent_28%),linear-gradient(180deg,_#f7f3e9_0%,_#eef4ef_100%)] p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-[0_24px_80px_rgba(34,51,48,0.12)] backdrop-blur-xl">
          <div className="border-b border-[#dbe7e2] bg-[linear-gradient(135deg,_rgba(67,109,117,0.1),_rgba(233,138,125,0.1))] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#436D75]/15 bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#436D75] shadow-sm">
                  <Sparkles size={14} />
                  Assistant Maison des Jeunes
                </div>
                <h1 className="text-3xl font-black tracking-tight text-[#1A1C1E] sm:text-4xl">
                  Chatbot Gemini pour les clubs et événements
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                  Pose tes questions en français ou en derja tunisienne.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 lg:max-w-2xl lg:justify-end">
                <div className="rounded-full border border-[#d8e5df] bg-white/90 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                  Réponses en temps réel
                </div>
                <div className="rounded-full border border-[#d8e5df] bg-white/90 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                  Refus hors sujet
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="border-b border-[#e7eee9] lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between border-b border-[#e7eee9] px-5 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#436D75] text-white shadow-lg shadow-[#436D75]/20">
                    <Bot size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">
                      Conversation en direct
                    </p>
                    <p className="text-xs text-slate-500">
                      Historique sauvegardé sur l'appareil.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-[#F7F3E9] px-3 py-1 text-xs font-bold text-[#7a5c35]">
                  <ShieldAlert size={13} />
                  Hors sujet refusé
                </div>
              </div>

              <div className="max-h-[62vh] min-h-[24rem] space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                {messages.length === 0 ? (
                  <div className="flex h-full min-h-[22rem] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[#d6e2db] bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(247,243,233,0.8))] px-6 py-10 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#436D75] text-white shadow-xl shadow-[#436D75]/20">
                      <Zap size={28} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">
                      Demande ce qui se passe à la Maison des Jeunes
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                      Tu peux demander les clubs actifs, les événements
                      programmés, les horaires, ou une aide pour l'inscription.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {quickPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => {
                            setInput(prompt);
                          }}
                          className="rounded-full border border-[#d6e2db] bg-white px-4 py-2 text-sm font-semibold text-[#355860] transition hover:border-[#436D75]/30 hover:bg-[#f3f8f6]"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const isUser = message.role === "user";

                      return (
                        <div
                          key={`${message.role}-${index}`}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[72%] ${
                              isUser
                                ? "bg-[#436D75] text-white"
                                : "border border-[#dde7e2] bg-white text-slate-800"
                            }`}
                          >
                            <div className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] opacity-70">
                              {isUser ? "Vous" : "Assistant"}
                            </div>
                            <p className="whitespace-pre-wrap break-words">
                              {message.parts[0]?.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="rounded-3xl border border-[#dde7e2] bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                          Le bot réfléchit...
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-[#e7eee9] bg-white/80 px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[#d6e2db] bg-white p-3 shadow-sm sm:flex-row sm:items-center">
                  <input
                    value={input}
                    onChange={(event) => {
                      setInput(event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Écris ta question sur les clubs ou les événements..."
                    className="min-w-0 flex-1 rounded-2xl border border-transparent bg-[#f7faf8] px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#436D75]/20 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void sendMessage();
                    }}
                    disabled={!canSend}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#436D75] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#436D75]/20 transition hover:translate-y-[-1px] hover:bg-[#365861] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <SendHorizontal size={16} />
                    Envoyer
                  </button>
                </div>

                {error && (
                  <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <aside className="bg-[linear-gradient(180deg,_rgba(67,109,117,0.06),_rgba(233,138,125,0.06))] p-5 sm:p-6">
              <div className="rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[#355860]">
                      Historique
                    </p>
                    <p className="text-sm text-slate-500">
                      Conversations récentes enregistrées localement.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={startNewConversation}
                    className="rounded-full border border-[#d8e5df] bg-white px-3 py-2 text-xs font-bold text-[#355860] transition hover:border-[#436D75]/30 hover:bg-[#f3f8f6]"
                  >
                    Nouvelle
                  </button>
                </div>

                <div className="mt-5 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                  {conversations.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d6e2db] bg-[#f8fbf9] px-4 py-4 text-sm text-slate-500">
                      Aucune conversation sauvegardée.
                    </div>
                  ) : (
                    conversations.map((conversation) => {
                      const isActive = conversation.id === activeConversationId;
                      const previewMessage =
                        conversation.messages.find(
                          (message) => message.role === "user",
                        )?.parts[0]?.text ?? "Conversation vide";

                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() => {
                            openConversation(conversation);
                          }}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            isActive
                              ? "border-[#436D75]/30 bg-[#f2f8f6]"
                              : "border-[#d8e5df] bg-[#f8fbf9] hover:border-[#436D75]/30 hover:bg-white"
                          }`}
                        >
                          <p className="text-sm font-bold text-slate-800">
                            {conversation.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {previewMessage}
                          </p>
                          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {new Date(conversation.updatedAt).toLocaleString(
                              "fr-TN",
                            )}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Chat;
