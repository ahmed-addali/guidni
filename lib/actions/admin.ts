"use server";

import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────
// Auth guard
// ─────────────────────────────────────────

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// ─────────────────────────────────────────
// Overview stats
// ─────────────────────────────────────────

export const getAdminStats = cache(async () => {
  await requireAdmin();

  const [
    totalUsers,
    totalPartners,
    totalActivities,
    totalStays,
    activityBookings,
    stayBookings,
    reviewStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.businessProfile.count(),
    prisma.activity.count(),
    prisma.stay.count(),
    prisma.activityReservation.aggregate({
      _sum: { totalPrice: true },
      _count: true,
    }),
    prisma.staysReservation.aggregate({
      _sum: { totalPrice: true },
      _count: true,
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  const totalBookings = activityBookings._count + stayBookings._count;
  const totalRevenue =
    Number(activityBookings._sum.totalPrice ?? 0) +
    Number(stayBookings._sum.totalPrice ?? 0);
  const avgRating = reviewStats._avg.rating ?? 0;

  return {
    totalUsers,
    totalPartners,
    totalActivities,
    totalStays,
    totalBookings,
    totalRevenue,
    avgRating,
    totalReviews: reviewStats._count,
  };
});

// ─────────────────────────────────────────
// Recent bookings (activity + stays, merged)
// ─────────────────────────────────────────

export const getAdminRecentBookings = cache(async (limit = 10) => {
  await requireAdmin();

  const [activityBookings, stayBookings] = await Promise.all([
    prisma.activityReservation.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        activity: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.staysReservation.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        stay: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const merged = [
    ...activityBookings.map((b) => ({
      id: b.id,
      bookingRef: b.bookingRef,
      type: "activity" as const,
      title: b.activity.title,
      customer: b.user.name ?? b.user.email,
      date: b.createdAt,
      amount: Number(b.totalPrice),
      status: b.status,
    })),
    ...stayBookings.map((b) => ({
      id: b.id,
      bookingRef: b.bookingRef,
      type: "stay" as const,
      title: b.stay.title,
      customer: b.user.name ?? b.user.email,
      date: b.createdAt,
      amount: Number(b.totalPrice),
      status: b.status,
    })),
  ];

  return merged.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
});

// ─────────────────────────────────────────
// Users
// ─────────────────────────────────────────

export const getAdminUsers = cache(async (role?: string) => {
  await requireAdmin();

  return prisma.user.findMany({
    where: role && role !== "ALL" ? { role: role as never } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      _count: { select: { activityReservations: true, staysReservations: true } },
    },
  });
});

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as never },
  });

  return { success: true };
}

// ─────────────────────────────────────────
// Partners / Business Profiles
// ─────────────────────────────────────────

const adminPartnersInclude = {
  user:        { select: { name: true, email: true } },
  destination: { select: { city: true } },
  _count:      { select: { activities: true, stays: true } },
} satisfies Prisma.BusinessProfileInclude;

export type AdminPartner = Prisma.BusinessProfileGetPayload<{
  include: typeof adminPartnersInclude;
}>;

export const getAdminPartners = cache(async (category?: string): Promise<AdminPartner[]> => {
  await requireAdmin();

  return prisma.businessProfile.findMany({
    where: category && category !== "ALL" ? { categories: { has: category } } : undefined,
    orderBy: { createdAt: "desc" },
    include: adminPartnersInclude,
  });
});

export async function togglePartnerVerified(profileId: string, verified: boolean) {
  await requireAdmin();

  await prisma.businessProfile.update({
    where: { id: profileId },
    data: { isVerified: verified },
  });

  return { success: true };
}

// ─────────────────────────────────────────
// Listings — featured toggles
// ─────────────────────────────────────────

export const getAdminActivities = cache(async () => {
  await requireAdmin();

  return prisma.activity.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      price: true,
      featuredInHome: true,
      destination: { select: { city: true } },
      businessProfile: { select: { name: true } },
    },
  });
});

export async function toggleActivityFeatured(id: string, featured: boolean) {
  await requireAdmin();

  await prisma.activity.update({ where: { id }, data: { featuredInHome: featured } });
  return { success: true };
}

export const getAdminStays = cache(async () => {
  await requireAdmin();

  return prisma.stay.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      propertyType: true,
      price: true,
      featuredInHome: true,
      destination: { select: { city: true } },
      businessProfile: { select: { name: true } },
    },
  });
});

export async function toggleStayFeatured(id: string, featured: boolean) {
  await requireAdmin();

  await prisma.stay.update({ where: { id }, data: { featuredInHome: featured } });
  return { success: true };
}

// ─────────────────────────────────────────
// All bookings
// ─────────────────────────────────────────

export const getAdminAllBookings = cache(async () => {
  await requireAdmin();

  const [activityBookings, stayBookings] = await Promise.all([
    prisma.activityReservation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        activity: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.staysReservation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        stay: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const merged = [
    ...activityBookings.map((b) => ({
      id: b.id,
      bookingRef: b.bookingRef,
      type: "Activity" as const,
      title: b.activity.title,
      customer: b.user.name ?? b.user.email,
      customerEmail: b.user.email,
      date: b.createdAt,
      checkIn: b.date,
      amount: Number(b.totalPrice),
      status: b.status,
    })),
    ...stayBookings.map((b) => ({
      id: b.id,
      bookingRef: b.bookingRef,
      type: "Stay" as const,
      title: b.stay.title,
      customer: b.user.name ?? b.user.email,
      customerEmail: b.user.email,
      date: b.createdAt,
      checkIn: b.checkIn,
      amount: Number(b.totalPrice),
      status: b.status,
    })),
  ];

  return merged.sort((a, b) => b.date.getTime() - a.date.getTime());
});

// ─────────────────────────────────────────
// Destinations
// ─────────────────────────────────────────

export const getAdminDestinations = cache(async () => {
  await requireAdmin();

  return prisma.destination.findMany({
    orderBy: { city: "asc" },
    include: {
      _count: { select: { activities: true, stays: true } },
    },
  });
});

export async function toggleDestinationActive(id: string, active: boolean) {
  await requireAdmin();

  await prisma.destination.update({ where: { id }, data: { active } });
  return { success: true };
}

export async function toggleDestinationFeatured(id: string, featured: boolean) {
  await requireAdmin();

  await prisma.destination.update({ where: { id }, data: { featured } });
  return { success: true };
}
