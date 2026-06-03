"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles } from "lucide-react";
import { useChatPlannerStore } from "@/stores/chatPlannerStore";
import { ChatBubble } from "./ChatBubble";
import { ThinkingIndicator } from "./ThinkingIndicator";

type Props = {
  userId: string;
};

export function ChatPanel({ userId }: Props) {
  const { messages, isLoading, sendMessage, submitForm } =
    useChatPlannerStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, isLoading]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed, userId);
  }, [input, isLoading, sendMessage, userId]);

  const handleFormSubmit = useCallback(
    (answers: Record<string, string>) => {
      submitForm(answers, userId);
    },
    [submitForm, userId]
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Guidni AI Planner
            </h2>
            <p className="text-[11px] text-gray-400">
              Describe your ideal trip and I&apos;ll plan it
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold text-gray-900">
                Plan your perfect trip
              </p>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Tell me about your travel plans — destination, dates, interests
                — and I&apos;ll create a personalized itinerary for you.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {[
                "Plan a 3-day trip in Djerba",
                "I want a relaxed beach vacation",
                "Family trip with kids for 5 days",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-full hover:bg-gray-100 hover:border-gray-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            onFormSubmit={handleFormSubmit}
            isLatest={i === messages.length - 1}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <ThinkingIndicator steps={[]} isThinking />
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-gray-100 px-4 py-3 bg-white">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe your ideal trip…"
            maxLength={2000}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 bg-gray-50 placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
