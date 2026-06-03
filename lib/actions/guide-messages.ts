"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not authenticated");
  return session.user;
}

async function requireGuide() {
  const user = await requireUser();
  const guide = await prisma.guideProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!guide) throw new Error("Not a guide");
  return { user, guideId: guide.id };
}

// ── User: start or get conversation for a purchased or requested plan ─────────

export async function getOrStartConversation(
  planId: string
): Promise<
  | { success: true; conversationId: string }
  | { success: false; error: string }
> {
  const user = await requireUser();

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: {
      guideId: true,
      guide:   { select: { id: true, chatEnabled: true } },
    },
  });
  if (!plan?.guideId) return { success: false as const, error: "Plan has no guide" };
  if (!plan.guide?.chatEnabled) return { success: false as const, error: "Guide has disabled chat" };

  // Allow access if user purchased the plan OR has an active custom request with this guide
  const [purchase, activeRequest] = await Promise.all([
    prisma.planPurchase.findUnique({
      where:  { userId_planId: { userId: user.id, planId } },
      select: { id: true },
    }),
    prisma.planRequest.findFirst({
      where: {
        userId:  user.id,
        guideId: plan.guideId,
        status:  { notIn: ["CANCELLED", "DECLINED"] },
      },
      select: { id: true },
    }),
  ]);

  if (!purchase && !activeRequest) {
    return { success: false as const, error: "Chat is only available for purchased or requested plans" };
  }

  // Upsert conversation — idempotent
  const conversation = await prisma.planConversation.upsert({
    where:  { planId_userId: { planId, userId: user.id } },
    create: { planId, userId: user.id, guideId: plan.guideId },
    update: {},
    select: { id: true },
  });

  return { success: true as const, conversationId: conversation.id };
}

// ── Fetch thread messages ─────────────────────────────────────────────────────

export async function getConversationMessages(conversationId: string) {
  const user = await requireUser();

  const conversation = await prisma.planConversation.findUnique({
    where: { id: conversationId },
    select: { userId: true, guideId: true },
  });
  if (!conversation) return null;

  // Verify viewer is participant (user or guide owner)
  const guide = await prisma.guideProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  const isGuide    = guide?.id === conversation.guideId;
  const isUser     = conversation.userId === user.id;
  if (!isGuide && !isUser) return null;

  return prisma.planConversation.findUnique({
    where: { id: conversationId },
    include: {
      plan: { select: { id: true, title: true, duration: true, destination: { select: { city: true } } } },
      user: { select: { id: true, name: true, image: true } },
      guide: { select: { id: true, displayName: true, avatarUrl: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, image: true } } },
      },
    },
  });
}

// ── Send a message ────────────────────────────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireUser();

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 2000) {
    return { success: false as const, error: "Message must be 1–2000 characters" };
  }

  const conversation = await prisma.planConversation.findUnique({
    where: { id: conversationId },
    select: { userId: true, guideId: true },
  });
  if (!conversation) return { success: false as const, error: "Conversation not found" };

  const guide = await prisma.guideProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  const isParticipant =
    conversation.userId === user.id || guide?.id === conversation.guideId;
  if (!isParticipant) return { success: false as const, error: "Not a participant" };

  await prisma.planMessage.create({
    data: {
      conversationId,
      senderId: user.id,
      content:  trimmed,
    },
  });

  // Touch conversation updatedAt for inbox ordering
  await prisma.planConversation.update({
    where: { id: conversationId },
    data:  { updatedAt: new Date() },
  });

  return { success: true as const };
}

// ── Mark messages as read (messages sent by the other party) ─────────────────

export async function markMessagesRead(
  conversationId: string
): Promise<void> {
  const user = await requireUser();

  await prisma.planMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: user.id },
      readAt:   null,
    },
    data: { readAt: new Date() },
  });
}

// ── Guide: get all conversations (inbox) ─────────────────────────────────────

export async function getGuideConversations() {
  const { guideId } = await requireGuide();

  return prisma.planConversation.findMany({
    where: { guideId },
    include: {
      plan: { select: { id: true, title: true, duration: true, destination: { select: { city: true } } } },
      user: { select: { id: true, name: true, image: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take:    1,
        include: { sender: { select: { id: true, name: true } } },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// ── Guide: unread count for sidebar badge ────────────────────────────────────

export async function getGuideUnreadCount(): Promise<number> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return 0;

    const guide = await prisma.guideProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!guide) return 0;

    return prisma.planMessage.count({
      where: {
        conversation: { guideId: guide.id },
        senderId: { not: session.user.id },
        readAt:   null,
      },
    });
  } catch {
    return 0;
  }
}

// ── User: get all conversations for purchased plans ───────────────────────────

export async function getUserConversations() {
  const user = await requireUser();

  return prisma.planConversation.findMany({
    where: { userId: user.id },
    include: {
      plan: { select: { id: true, title: true, duration: true, destination: { select: { city: true } } } },
      guide: { select: { id: true, displayName: true, avatarUrl: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take:    1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}
