"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { MessageThread } from "@/components/planner/MessageThread";
import { getConversationMessages, markMessagesRead } from "@/lib/actions/guide-messages";
import { cn } from "@/lib/utils";

const POLL_INTERVAL = 3000;

type ConversationSummary = {
  id: string;
  updatedAt: Date;
  plan: {
    id: string;
    title: string | null;
    duration: number;
    destination: { city: string } | null;
  };
  user: { id: string; name: string | null; image: string | null };
  messages: {
    content: string;
    createdAt: Date;
    sender: { id: string; name: string | null };
  }[];
  _count: { messages: number };
};

type Message = {
  id:        string;
  content:   string;
  createdAt: Date;
  readAt:    Date | null;
  sender:    { id: string; name: string | null; image: string | null };
};

interface Props {
  conversations:  ConversationSummary[];
  currentUserId:  string;
}

export function MessagesInboxClient({ conversations, currentUserId }: Props) {
  const [selected, setSelected] = useState<string | null>(conversations[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(false);
  const selectedRef             = useRef<string | null>(null);

  const loadThread = useCallback(async (convId: string, showLoading = false) => {
    if (showLoading) setLoading(true);
    const data = await getConversationMessages(convId);
    if (showLoading) setLoading(false);
    if (data) setMessages(data.messages);
  }, []);

  // Keep ref in sync for polling closure
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // Load first conversation on mount
  useEffect(() => {
    if (conversations[0]?.id) {
      loadThread(conversations[0].id, true);
      markMessagesRead(conversations[0].id).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll active conversation
  useEffect(() => {
    if (!selected) return;
    const id = setInterval(() => {
      if (selectedRef.current) loadThread(selectedRef.current);
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [selected, loadThread]);

  async function handleSelect(convId: string) {
    setSelected(convId);
    await loadThread(convId, true);
    markMessagesRead(convId).catch(() => {});
  }

  const active = conversations.find((c) => c.id === selected);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <MessageCircle className="h-10 w-10 text-gray-200 mb-4" />
        <p className="text-gray-500 font-medium">No messages yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Conversations with travelers will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex bg-white border border-gray-100 rounded-2xl overflow-hidden h-[calc(100vh-12rem)] min-h-[500px]">
      {/* Left: conversation list */}
      <div className="w-72 shrink-0 border-r border-gray-100 overflow-y-auto">
        {conversations.map((conv) => {
          const lastMsg    = conv.messages[0];
          const isSelected = conv.id === selected;
          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => handleSelect(conv.id)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-4 border-b border-gray-50 text-left transition-colors",
                isSelected ? "bg-primary/5" : "hover:bg-gray-50"
              )}
            >
              {conv.user.image ? (
                <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0">
                  <Image src={conv.user.image} alt={conv.user.name ?? ""} fill className="object-cover" sizes="36px" />
                </div>
              ) : (
                <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                  {(conv.user.name ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {conv.user.name ?? "Traveler"}
                  </p>
                  <p className="text-[10px] text-gray-400 shrink-0">
                    {new Date(conv.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {conv.plan.title ?? `${conv.plan.duration}-Day Plan`}
                  {conv.plan.destination ? ` · ${conv.plan.destination.city}` : ""}
                </p>
                {lastMsg && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {lastMsg.sender.id === currentUserId ? "You: " : ""}
                    {lastMsg.content}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Right: thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {active && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
            {active.user.image ? (
              <div className="relative h-8 w-8 rounded-full overflow-hidden">
                <Image src={active.user.image} alt={active.user.name ?? ""} fill className="object-cover" sizes="32px" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                {(active.user.name ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{active.user.name ?? "Traveler"}</p>
              <p className="text-xs text-gray-400 truncate">
                {active.plan.title ?? `${active.plan.duration}-Day Plan`}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading…</div>
        )}
        {!loading && selected && (
          <div className="flex-1 min-h-0">
            <MessageThread
              conversationId={selected}
              messages={messages}
              currentUserId={currentUserId}
              otherParticipant={{
                id:    active?.user.id ?? "",
                name:  active?.user.name ?? null,
                image: active?.user.image ?? null,
              }}
              onMessageSent={() => {
                loadThread(selected);
                markMessagesRead(selected).catch(() => {});
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
