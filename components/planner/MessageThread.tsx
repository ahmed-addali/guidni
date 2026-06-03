"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Image from "next/image";
import { sendMessage, markMessagesRead } from "@/lib/actions/guide-messages";
import { FiSend } from "react-icons/fi";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
  sender: { id: string; name: string | null; image: string | null };
};

type Participant = {
  id: string;
  name: string | null;
  avatarUrl?: string | null;
  image?: string | null;
};

interface Props {
  conversationId: string;
  messages: Message[];
  currentUserId: string;
  otherParticipant: Participant;
  onMessageSent?: () => void;
}

function Avatar({ name, src }: { name: string | null; src?: string | null }) {
  const initials = (name ?? "?").charAt(0).toUpperCase();
  return src ? (
    <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0">
      <Image src={src} alt={name ?? ""} fill className="object-cover" sizes="28px" />
    </div>
  ) : (
    <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
      {initials}
    </div>
  );
}

export function MessageThread({
  conversationId,
  messages: serverMessages,
  currentUserId,
  otherParticipant,
  onMessageSent,
}: Props) {
  const [optimistic, setOptimistic]  = useState<Message[]>([]);
  const [input, setInput]            = useState("");
  const [error, setError]            = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollRef    = useRef<HTMLDivElement>(null);
  const selfSentRef  = useRef(false);

  // Merge server messages with any pending optimistic ones not yet confirmed
  const messages = [
    ...serverMessages,
    ...optimistic.filter((o) => !serverMessages.some((s) => s.content === o.content)),
  ];

  // Smart scroll: always on self-send, only if near bottom on incoming
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (selfSentRef.current || nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    selfSentRef.current = false;
  }, [messages.length]);

  // Mark unread on mount
  useEffect(() => {
    markMessagesRead(conversationId).catch(() => {});
  }, [conversationId]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isPending) return;
    setInput("");
    setError(null);

    const optimisticMsg: Message = {
      id:        `opt-${Date.now()}`,
      content:   trimmed,
      createdAt: new Date(),
      readAt:    null,
      sender:    { id: currentUserId, name: "You", image: null },
    };
    selfSentRef.current = true;
    setOptimistic((prev) => [...prev, optimisticMsg]);

    startTransition(async () => {
      const result = await sendMessage(conversationId, trimmed);
      if (!result.success) {
        setError(result.error);
        setOptimistic((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setInput(trimmed);
      } else {
        setOptimistic([]);
        onMessageSent?.();
      }
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-8">
            No messages yet. Say hello to {otherParticipant.name ?? "your guide"}!
          </p>
        )}

        {messages.map((msg) => {
          const isMe      = msg.sender.id === currentUserId;
          const avatarSrc = isMe ? null : (otherParticipant.avatarUrl ?? otherParticipant.image ?? null);
          const senderName = isMe ? "You" : (otherParticipant.name ?? "Guide");

          return (
            <div
              key={msg.id}
              className={cn("flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}
            >
              {!isMe && <Avatar name={senderName} src={avatarSrc} />}

              <div className={cn("flex flex-col gap-1 max-w-[75%]", isMe ? "items-end" : "items-start")}>
                <span className="text-[11px] font-medium text-gray-400 px-1">
                  {senderName}
                </span>
                <div
                  className={cn(
                    "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                    isMe
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  )}
                >
                  {msg.content}
                  <p className={cn("text-[10px] mt-1", isMe ? "text-white/60 text-right" : "text-gray-400")}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {isMe && msg.readAt && " · Read"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 px-4 py-3 shrink-0">
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message…"
            maxLength={2000}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isPending}
            className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiSend className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
