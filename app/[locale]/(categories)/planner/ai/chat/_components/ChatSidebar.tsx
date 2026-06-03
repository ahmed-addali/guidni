"use client";

import { useEffect, useState } from "react";
import { useChatPlannerStore } from "@/stores/chatPlannerStore";
import { MessageSquarePlus, MessageSquare, PanelLeftClose, PanelLeftOpen, Loader2, Trash2 } from "lucide-react";

type ConversationItem = {
  id: string;
  title?: string;
  created_at?: string;
};

export function ChatSidebar() {
  const { conversationId, loadConversation, reset } = useChatPlannerStore();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const resp = await fetch("/api/chat/history");
      if (resp.ok) {
        const data = await resp.json();
        setConversations(data?.conversations || data || []);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    reset();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent triggering loadConversation
    if (!confirm("Delete this conversation?")) return;

    setDeletingId(id);
    try {
      const resp = await fetch(`/api/chat/delete/${id}`, { method: "DELETE" });
      if (resp.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        // If the deleted conversation is the active one, reset
        if (conversationId === id) {
          reset();
        }
      }
    } catch (e) {
      console.error("Failed to delete conversation", e);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) {
    return (
      <div className="h-full border-r border-gray-100 bg-gray-50 flex flex-col p-2 shrink-0">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          title="Open History"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-64 border-r border-gray-100 bg-gray-50 flex flex-col shrink-0 transition-all duration-300">
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <span className="font-semibold text-gray-700">Chats</span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          title="Close History"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-primary hover:text-primary transition-colors text-sm font-medium shadow-sm"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
          Recent
        </div>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-sm text-gray-500 text-center px-4 py-8">
            No past chats found.
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === conversationId;
            const isDeleting = deletingId === c.id;
            return (
              <div
                key={c.id}
                className={`group w-full flex items-center gap-1 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!isActive) loadConversation(c.id);
                  }}
                  className="flex-1 min-w-0 flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {c.title || "Plan a trip"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 pl-5">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, c.id)}
                  disabled={isDeleting}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                  title="Delete conversation"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
