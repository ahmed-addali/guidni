import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ChatPlannerShell } from "./_components/ChatPlannerShell";

export const metadata: Metadata = {
  title: "AI Chat Planner — Guidni",
  description:
    "Chat with our AI to build your personalized travel itinerary with drag-and-drop editing, map view, and smart alternatives.",
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AIChatPlannerPage({ params }: Props) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/planner/ai/chat`);
  }

  return <ChatPlannerShell userId={session.user.id} />;
}
