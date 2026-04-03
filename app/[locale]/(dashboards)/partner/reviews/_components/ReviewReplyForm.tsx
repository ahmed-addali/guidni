"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addPartnerReply } from "@/lib/actions/reviews";
import { FiSend, FiMessageSquare } from "react-icons/fi";

export function ReviewReplyForm({
  reviewId,
  existingResponse,
}: {
  reviewId: string;
  existingResponse?: string | null;
}) {
  const [open, setOpen]         = useState(false);
  const [text, setText]         = useState(existingResponse ?? "");
  const [pending, start]        = useTransition();

  if (existingResponse && !open) {
    return (
      <div className="mt-3 bg-primary/5 border border-primary/15 rounded-xl p-3 space-y-1">
        <p className="text-xs font-semibold text-primary">Your reply</p>
        <p className="text-sm text-gray-700">{existingResponse}</p>
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-primary hover:underline"
        >
          Edit reply
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors"
        >
          <FiMessageSquare className="h-3.5 w-3.5" />
          Reply to review
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Write a professional, helpful response..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
          <div className="flex gap-2">
            <button
              disabled={pending || !text.trim()}
              onClick={() => {
                start(async () => {
                  const res = await addPartnerReply(reviewId, text.trim());
                  if (res.success) {
                    toast.success("Reply posted");
                    setOpen(false);
                  } else {
                    toast.error(res.error ?? "Failed to post reply");
                  }
                });
              }}
              className="flex items-center gap-1.5 text-sm bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <FiSend className="h-3.5 w-3.5" />
              {pending ? "Posting…" : "Post reply"}
            </button>
            <button
              onClick={() => { setOpen(false); setText(existingResponse ?? ""); }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
