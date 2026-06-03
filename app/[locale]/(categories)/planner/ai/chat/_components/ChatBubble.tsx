"use client";

import { Bot, User } from "lucide-react";
import { DynamicForm } from "./DynamicForm";
import { ThinkingIndicator } from "./ThinkingIndicator";
import type { ChatMessage } from "@/types/chat";

type Props = {
  message: ChatMessage;
  onFormSubmit: (answers: Record<string, string>) => void;
  isLatest?: boolean;
};

export function ChatBubble({ message, onFormSubmit, isLatest }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-primary text-white"
            : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] space-y-3 ${isUser ? "items-end" : "items-start"}`}
      >
        {/* Text content */}
        {message.content && (
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? "bg-primary text-white rounded-tr-sm"
                : "bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {/* Plan generated indicator */}
        {message.plan && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
            <span className="text-lg">🗺️</span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Plan Generated!
              </p>
              <p className="text-xs text-emerald-600">
                {message.plan.days.length} days ·{" "}
                {message.plan.days.reduce((acc, d) => acc + d.slots.length, 0)}{" "}
                activities
              </p>
            </div>
          </div>
        )}

        {/* Dynamic form from questions */}
        {message.questions &&
          message.questions.length > 0 &&
          isLatest && (
            <DynamicForm
              questions={message.questions}
              onSubmit={onFormSubmit}
            />
          )}

        {/* Thinking steps (collapsible) */}
        {message.thinkingSteps &&
          message.thinkingSteps.length > 0 && (
            <ThinkingIndicator
              steps={message.thinkingSteps}
              isThinking={false}
            />
          )}

        {/* Timestamp */}
        <p
          className={`text-[10px] px-1 ${
            isUser ? "text-right text-gray-300" : "text-gray-400"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
