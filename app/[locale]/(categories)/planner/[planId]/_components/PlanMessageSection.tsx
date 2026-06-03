"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { MessageThread } from "@/components/planner/MessageThread";
import { getOrStartConversation, getConversationMessages } from "@/lib/actions/guide-messages";

const POLL_INTERVAL = 3000;

type Guide = {
  displayName: string;
  avatarUrl?: string | null;
};

interface Props {
  planId:        string;
  guide:         Guide;
  currentUserId: string;
}

type Message = {
  id:        string;
  content:   string;
  createdAt: Date;
  readAt:    Date | null;
  sender:    { id: string; name: string | null; image: string | null };
};

export function PlanMessageSection({ planId, guide, currentUserId }: Props) {
  const [open, setOpen]             = useState(false);
  const [conversationId, setConvId] = useState<string | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [loading, setLoading]       = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const convIdRef                   = useRef<string | null>(null);

  const loadMessages = useCallback(async (convId: string) => {
    const data = await getConversationMessages(convId);
    if (data) setMessages(data.messages);
  }, []);

  // Keep ref in sync so interval callback always has latest convId
  useEffect(() => { convIdRef.current = conversationId; }, [conversationId]);

  // Poll while open
  useEffect(() => {
    if (!open || !conversationId) return;
    const id = setInterval(() => {
      if (convIdRef.current) loadMessages(convIdRef.current);
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [open, conversationId, loadMessages]);

  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    setStartError(null);

    let convId = conversationId;
    if (!convId) {
      const result = await getOrStartConversation(planId);
      if (!result.success) {
        setStartError(result.error);
        setLoading(false);
        return;
      }
      convId = result.conversationId;
      setConvId(convId);
    }

    await loadMessages(convId);
    setLoading(false);
  }

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Message {guide.displayName}</p>
            <p className="text-xs text-gray-400">Questions about your trip? Ask your guide directly.</p>
          </div>
        </div>
        {open
          ? <ChevronUp   className="h-4 w-4 text-gray-400 shrink-0" />
          : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="border-t border-gray-100 h-80">
          {loading && (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              Loading conversation…
            </div>
          )}
          {startError && (
            <div className="flex items-center justify-center h-full text-sm text-red-500">
              {startError}
            </div>
          )}
          {!loading && !startError && conversationId && (
            <MessageThread
              conversationId={conversationId}
              messages={messages}
              currentUserId={currentUserId}
              otherParticipant={{ id: "", name: guide.displayName, avatarUrl: guide.avatarUrl }}
              onMessageSent={() => loadMessages(conversationId)}
            />
          )}
        </div>
      )}
    </div>
  );
}
