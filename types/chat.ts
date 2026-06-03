// ─────────────────────────────────────────────────────────────
// AI Chat Planner — Type Definitions
// ─────────────────────────────────────────────────────────────

import type { PlanItem } from "@/lib/planner/types";

/** A single question the agent asks, with optional suggested answers. */
export type QuestionOption = {
  question: string;
  suggestions: string[];
};

/** One step of the agent's internal reasoning chain (shown in collapsible UI). */
export type ThinkingStep = {
  step: string;
  tool_used?: string;
  result_summary?: string;
};

// ─── Backend Plan Structures (mirrored from Python schemas) ──

export type PlanSlot = {
  time: string;
  end_time: string;
  type: string; // "activity" | "meal" | "rest" | "stay_suggestion"
  activity_id?: string;
  title: string;
  description: string;
  category: string;
  price: number;
  duration: number; // minutes
  reason: string;
  image?: string;
  bookable: boolean;
  latitude?: number;
  longitude?: number;
};

export type DayPlan = {
  day_number: number;
  date: string;
  theme: string;
  slots: PlanSlot[];
};

export type StaySuggestion = {
  stay_id: string;
  title: string;
  price: number;
  rating: number;
  image?: string;
  reason: string;
};

export type BudgetBreakdown = {
  activities: number;
  accommodation: number;
  food: number;
  transport: number;
  total: number;
};

export type FullPlan = {
  days: DayPlan[];
  summary: string;
  total_budget: number;
  stay_suggestions: StaySuggestion[];
  tips: string[];
  budget_breakdown?: BudgetBreakdown;
};

// ─── Chat Messages ───────────────────────────────────────────

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  questions?: QuestionOption[];
  plan?: FullPlan;
  thinkingSteps?: ThinkingStep[];
  responseType?: string;
};

// ─── Backend Response ────────────────────────────────────────

export type PlannerResponse = {
  conversation_id: string;
  response_type: "plan" | "question" | "modification" | "text";
  content: string;
  plan?: FullPlan;
  thinking_steps: ThinkingStep[];
  questions?: QuestionOption[];
  ids: { id: string; type: string }[];
  alternatives?: PlanItem[];
};
