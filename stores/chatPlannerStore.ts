"use client";

import { create } from "zustand";
import type {
  ChatMessage,
  FullPlan,
  PlannerResponse,
  PlanSlot,
} from "@/types/chat";
import type { PlanItem } from "@/lib/planner/types";

// ─── State Shape ─────────────────────────────────────────────

type ChatPlannerState = {
  // Chat
  conversationId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;

  // Plan
  plan: FullPlan | null;
  alternatives: PlanItem[];
  selectedSlotIds: Set<string>;

  // UI
  panelRatio: number; // 0.0–1.0 left panel width fraction
  rightTab: "plan" | "map" | "alternatives";

  // Actions — Chat
  sendMessage: (text: string, userId: string) => Promise<void>;
  submitForm: (answers: Record<string, string>, userId: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;

  // Actions — Plan manipulation
  reorderSlot: (
    srcDayIdx: number,
    srcSlotIdx: number,
    dstDayIdx: number,
    dstSlotIdx: number
  ) => void;
  toggleSlotSelection: (slotId: string) => void;
  clearSelection: () => void;
  regenerateSelected: (userId: string) => Promise<void>;
  swapAlternative: (
    dayIdx: number,
    slotIdx: number,
    replacement: PlanItem
  ) => void;

  // Actions — UI
  setPanelRatio: (ratio: number) => void;
  setRightTab: (tab: "plan" | "map" | "alternatives") => void;
  reset: () => void;
};

// ─── Helpers ─────────────────────────────────────────────────

function makeId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function postChat(
  message: string,
  userId: string,
  conversationId: string | null
): Promise<PlannerResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      user_id: userId,
      model: "lightning/lightning-ai/gpt-oss-120b",
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error ?? `Chat failed: ${res.status}`);
  }
  return res.json();
}

// ─── Store ───────────────────────────────────────────────────

export const useChatPlannerStore = create<ChatPlannerState>((set, get) => ({
  // Initial state
  conversationId: null,
  messages: [],
  isLoading: false,
  plan: null,
  alternatives: [],
  selectedSlotIds: new Set(),
  panelRatio: 0.4,
  rightTab: "plan",

  // ── Send a text message ──────────────────────────────────
  sendMessage: async (text, userId) => {
    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      isLoading: true,
    }));

    try {
      const resp = await postChat(text, userId, get().conversationId);
      const botMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: resp.content,
        timestamp: new Date(),
        questions: resp.questions,
        plan: resp.plan ?? undefined,
        thinkingSteps: resp.thinking_steps,
        responseType: resp.response_type,
      };

      set((s) => ({
        conversationId: resp.conversation_id ?? s.conversationId,
        messages: [...s.messages, botMsg],
        isLoading: false,
        plan: resp.plan ?? s.plan,
        alternatives: resp.alternatives ?? s.alternatives,
        rightTab: resp.plan ? "plan" : s.rightTab,
      }));
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: `⚠️ Something went wrong: ${err instanceof Error ? err.message : "Unknown error"}`,
        timestamp: new Date(),
      };
      set((s) => ({
        messages: [...s.messages, errorMsg],
        isLoading: false,
      }));
    }
  },

  // ── Submit dynamic form answers ──────────────────────────
  submitForm: async (answers, userId) => {
    // Format answers as a structured message
    const lines = Object.entries(answers)
      .filter(([, v]) => v.trim())
      .map(([q, a]) => `${q}: ${a}`);
    const formatted = lines.join("\n");
    await get().sendMessage(formatted, userId);
  },

  // ── Load Conversation ────────────────────────────────────
  loadConversation: async (conversationId: string) => {
    set({ isLoading: true });
    try {
      const resp = await fetch(`/api/chat/detail/${conversationId}`);
      if (!resp.ok) throw new Error("Failed to load conversation");
      const data = await resp.json();

      const newMessages: ChatMessage[] = (data.messages || []).map((m: any) => ({
        id: makeId(),
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at || Date.now()),
      }));

      set({
        conversationId,
        messages: newMessages,
        plan: data.current_plan?.planData || null,
        rightTab: data.current_plan ? "plan" : "plan",
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ isLoading: false });
    }
  },

  // ── Reorder a slot via drag & drop ───────────────────────
  reorderSlot: (srcDayIdx, srcSlotIdx, dstDayIdx, dstSlotIdx) => {
    set((s) => {
      if (!s.plan) return s;
      const days = s.plan.days.map((d) => ({ ...d, slots: [...d.slots] }));

      const [moved] = days[srcDayIdx].slots.splice(srcSlotIdx, 1);
      if (!moved) return s;
      days[dstDayIdx].slots.splice(dstSlotIdx, 0, moved);

      return { plan: { ...s.plan, days } };
    });
  },

  // ── Toggle slot selection for regeneration ───────────────
  toggleSlotSelection: (slotId) => {
    set((s) => {
      const next = new Set(s.selectedSlotIds);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return { selectedSlotIds: next };
    });
  },

  clearSelection: () => set({ selectedSlotIds: new Set() }),

  // ── Regenerate selected activities ───────────────────────
  regenerateSelected: async (userId) => {
    const { selectedSlotIds, plan } = get();
    if (!plan || selectedSlotIds.size === 0) return;

    // Collect selected slot titles for the message
    const selectedTitles: string[] = [];
    const selectedIds: string[] = [];
    for (const day of plan.days) {
      for (const slot of day.slots) {
        const key = slot.activity_id ?? `${slot.title}-${slot.time}`;
        if (selectedSlotIds.has(key)) {
          selectedTitles.push(slot.title);
          selectedIds.push(key);
        }
      }
    }

    const message = `Please replace the following activities with better alternatives:\n${selectedTitles.map((t) => `- ${t}`).join("\n")}\n\n[selected_slot_ids: ${selectedIds.join(", ")}]`;

    set({ selectedSlotIds: new Set() });
    await get().sendMessage(message, userId);
  },

  // ── Swap an alternative into the plan ────────────────────
  swapAlternative: (dayIdx, slotIdx, replacement) => {
    set((s) => {
      if (!s.plan) return s;
      const days = s.plan.days.map((d) => ({ ...d, slots: [...d.slots] }));
      const oldSlot = days[dayIdx].slots[slotIdx];
      if (!oldSlot) return s;

      const newSlot: PlanSlot = {
        ...oldSlot,
        title: replacement.name,
        activity_id: replacement.id,
        price: replacement.price,
        description: "",
        image: replacement.imageUrl,
        latitude: undefined,
        longitude: undefined,
      };
      days[dayIdx].slots[slotIdx] = newSlot;

      // Remove from alternatives, add old item back
      const newAlts = s.alternatives.filter((a) => a.id !== replacement.id);

      return {
        plan: { ...s.plan, days },
        alternatives: newAlts,
      };
    });
  },

  // ── UI Actions ───────────────────────────────────────────
  setPanelRatio: (ratio) =>
    set({ panelRatio: Math.max(0.2, Math.min(0.8, ratio)) }),

  setRightTab: (tab) => set({ rightTab: tab }),

  reset: () =>
    set({
      conversationId: null,
      messages: [],
      isLoading: false,
      plan: null,
      alternatives: [],
      selectedSlotIds: new Set(),
      panelRatio: 0.4,
      rightTab: "plan",
    }),
}));
