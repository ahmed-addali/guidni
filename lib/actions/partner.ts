"use server";

import { cache } from "react";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  BusinessProfileSchema,
  UpdateBusinessProfileSchema,
  UpdateCategoriesSchema,
} from "@/lib/validations/partner";
import type { BookingStatus } from "@prisma/client";
import { ActivitySchema } from "@/lib/validations/activity";
import { StaySchema } from "@/lib/validations/stay";
import { uniqueSlug } from "@/lib/utils/slugify";

export const getMyBusinessProfile = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
});

export async function createBusinessProfile(rawData: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const existing = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) return { success: false, error: "You already have a business profile" };

  const parsed = BusinessProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const { website, category, ...rest } = parsed.data;

  try {
    await prisma.$transaction([
      prisma.businessProfile.create({
        data: {
          ...rest,
          categories: [category],
          website: website || null,
          userId: session.user.id,
          isVerified: true,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { role: "PARTNER" },
      }),
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("createBusinessProfile error:", error);
    return { success: false, error: "Failed to create profile. Please try again." };
  }
}

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export const getPartnerDashboardStats = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, averageRating: true, nbReviews: true },
  });
  if (!profile) return null;

  const activityIds = (
    await prisma.activity.findMany({
      where: { profileId: profile.id },
      select: { id: true },
    })
  ).map((a) => a.id);

  const stayIds = (
    await prisma.stay.findMany({
      where: { profileId: profile.id },
      select: { id: true },
    })
  ).map((s) => s.id);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activityBookings, stayBookings] = await Promise.all([
    prisma.activityReservation.findMany({
      where: { activityId: { in: activityIds } },
      select: { totalPrice: true, status: true, createdAt: true },
    }),
    prisma.staysReservation.findMany({
      where: { stayId: { in: stayIds } },
      select: { totalPrice: true, status: true, createdAt: true },
    }),
  ]);

  const allBookings = [
    ...activityBookings.map((b) => ({ ...b, totalPrice: Number(b.totalPrice) })),
    ...stayBookings.map((b) => ({ ...b, totalPrice: Number(b.totalPrice) })),
  ];

  const totalRevenue = allBookings
    .filter((b) => b.status === "COMPLETED" || b.status === "CONFIRMED")
    .reduce((s, b) => s + b.totalPrice, 0);

  const currentMonthRevenue = allBookings
    .filter(
      (b) =>
        (b.status === "COMPLETED" || b.status === "CONFIRMED") &&
        new Date(b.createdAt) >= firstOfMonth
    )
    .reduce((s, b) => s + b.totalPrice, 0);

  const totalBookings = allBookings.length;
  const currentMonthBookings = allBookings.filter(
    (b) => new Date(b.createdAt) >= firstOfMonth
  ).length;

  const upcomingBookings = allBookings.filter(
    (b) => b.status === "CONFIRMED"
  ).length;

  return {
    totalRevenue,
    currentMonthRevenue,
    totalBookings,
    currentMonthBookings,
    upcomingBookings,
    rating: profile.averageRating ?? 0,
    totalReviews: profile.nbReviews,
    totalActivities: activityIds.length,
    totalStays: stayIds.length,
  };
});

export const getPartnerRecentBookings = cache(async (limit = 5) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return [];

  const activityIds = (
    await prisma.activity.findMany({
      where: { profileId: profile.id },
      select: { id: true },
    })
  ).map((a) => a.id);

  const stayIds = (
    await prisma.stay.findMany({
      where: { profileId: profile.id },
      select: { id: true },
    })
  ).map((s) => s.id);

  const [activityBookings, stayBookings] = await Promise.all([
    prisma.activityReservation.findMany({
      where: { activityId: { in: activityIds } },
      select: {
        id: true,
        bookingRef: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        date: true,
        adults: true,
        children: true,
        activity: { select: { title: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.staysReservation.findMany({
      where: { stayId: { in: stayIds } },
      select: {
        id: true,
        bookingRef: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        checkIn: true,
        checkOut: true,
        nights: true,
        adults: true,
        children: true,
        stay: { select: { title: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  const combined = [
    ...activityBookings.map((b) => ({
      id: b.id,
      bookingRef: b.bookingRef,
      title: b.activity.title,
      slug: b.activity.slug,
      date: b.date.toISOString(),
      amount: Number(b.totalPrice),
      status: b.status,
      customer: b.user.name ?? b.user.email,
      guests: b.adults + b.children,
      type: "activity" as const,
    })),
    ...stayBookings.map((b) => ({
      id: b.id,
      bookingRef: b.bookingRef,
      title: b.stay.title,
      slug: b.stay.slug,
      date: b.checkIn.toISOString(),
      checkOut: b.checkOut?.toISOString(),
      nights: b.nights,
      amount: Number(b.totalPrice),
      status: b.status,
      customer: b.user.name ?? b.user.email,
      guests: b.adults + b.children,
      type: "stay" as const,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  return combined;
});

export const getPartnerAllBookings = cache(
  async (statusFilter?: BookingStatus) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return [];

    const profile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) return [];

    const activityIds = (
      await prisma.activity.findMany({
        where: { profileId: profile.id },
        select: { id: true },
      })
    ).map((a) => a.id);

    const stayIds = (
      await prisma.stay.findMany({
        where: { profileId: profile.id },
        select: { id: true },
      })
    ).map((s) => s.id);

    const restaurantIds = (
      await prisma.restaurant.findMany({
        where: { profileId: profile.id },
        select: { id: true },
      })
    ).map((r) => r.id);

    const rentalIds = (
      await prisma.rental.findMany({
        where: { profileId: profile.id },
        select: { id: true },
      })
    ).map((r) => r.id);

    const [activityBookings, stayBookings, restaurantBookings, rentalBookings] = await Promise.all([
      prisma.activityReservation.findMany({
        where: {
          activityId: { in: activityIds },
          ...(statusFilter && { status: statusFilter }),
        },
        select: {
          id: true,
          bookingRef: true,
          activityId: true,
          totalPrice: true,
          status: true,
          createdAt: true,
          date: true,
          adults: true,
          children: true,
          activity: { select: { title: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.staysReservation.findMany({
        where: {
          stayId: { in: stayIds },
          ...(statusFilter && { status: statusFilter }),
        },
        select: {
          id: true,
          bookingRef: true,
          stayId: true,
          totalPrice: true,
          status: true,
          createdAt: true,
          checkIn: true,
          checkOut: true,
          nights: true,
          adults: true,
          children: true,
          stay: { select: { title: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.restaurantReservation.findMany({
        where: {
          restaurantId: { in: restaurantIds },
          ...(statusFilter && { status: statusFilter }),
        },
        select: {
          id: true,
          bookingRef: true,
          restaurantId: true,
          status: true,
          createdAt: true,
          date: true,
          time: true,
          guests: true,
          guestName: true,
          restaurant: { select: { name: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.rentalReservation.findMany({
        where: {
          rentalId: { in: rentalIds },
          ...(statusFilter && { status: statusFilter }),
        },
        select: {
          id: true,
          bookingRef: true,
          rentalId: true,
          totalPrice: true,
          status: true,
          createdAt: true,
          startDate: true,
          endDate: true,
          days: true,
          rental: { select: { title: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return [
      ...activityBookings.map((b) => ({
        id: b.id,
        bookingRef: b.bookingRef,
        title: b.activity.title,
        listingId: b.activityId,
        date: b.date.toISOString(),
        amount: Number(b.totalPrice),
        status: b.status,
        customer: b.user.name ?? b.user.email,
        guests: b.adults + b.children,
        type: "activity" as const,
      })),
      ...stayBookings.map((b) => ({
        id: b.id,
        bookingRef: b.bookingRef,
        title: b.stay.title,
        listingId: b.stayId,
        date: b.checkIn.toISOString(),
        checkOut: b.checkOut?.toISOString(),
        nights: b.nights,
        amount: Number(b.totalPrice),
        status: b.status,
        customer: b.user.name ?? b.user.email,
        guests: b.adults + b.children,
        type: "stay" as const,
      })),
      ...restaurantBookings.map((b) => ({
        id: b.id,
        bookingRef: b.bookingRef,
        title: b.restaurant.name,
        listingId: b.restaurantId,
        date: b.date.toISOString(),
        amount: 0,
        status: b.status,
        customer: b.guestName ?? b.user.name ?? b.user.email,
        guests: b.guests,
        type: "restaurant" as const,
        meta: b.time,
      })),
      ...rentalBookings.map((b) => ({
        id: b.id,
        bookingRef: b.bookingRef,
        title: b.rental.title,
        listingId: b.rentalId,
        date: b.startDate.toISOString(),
        checkOut: b.endDate.toISOString(),
        nights: b.days,
        amount: Number(b.totalPrice),
        status: b.status,
        customer: b.user.name ?? b.user.email,
        guests: 1,
        type: "rental" as const,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
);

export const getPartnerReviews = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return [];

  const activityIds = (
    await prisma.activity.findMany({
      where: { profileId: profile.id },
      select: { id: true },
    })
  ).map((a) => a.id);

  const stayIds = (
    await prisma.stay.findMany({
      where: { profileId: profile.id },
      select: { id: true },
    })
  ).map((s) => s.id);

  return prisma.review.findMany({
    where: {
      OR: [
        { relationType: "ACTIVITY", relationId: { in: activityIds } },
        { relationType: "STAY", relationId: { in: stayIds } },
      ],
    },
    include: {
      user: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
});

const PARTNER_ACTIVITIES_PER_PAGE = 20;

export const getPartnerActivities = cache(async (page = 1) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { activities: [], total: 0, totalPages: 0 };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { activities: [], total: 0, totalPages: 0 };

  const where = { profileId: profile.id };
  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        images: { select: { id: true, url: true }, take: 1 },
        _count: { select: { reservations: true } },
      },
      orderBy: { title: "asc" },
      skip:  (page - 1) * PARTNER_ACTIVITIES_PER_PAGE,
      take:  PARTNER_ACTIVITIES_PER_PAGE,
    }),
    prisma.activity.count({ where }),
  ]);

  const activityIds = activities.map((a) => a.id);
  const badges = activityIds.length
    ? await prisma.listingBadge.findMany({
        where: { relationType: "ACTIVITY", relationId: { in: activityIds } },
        select: { relationId: true, badgeKey: true },
      })
    : [];

  const badgeMap = new Map<string, string[]>();
  for (const b of badges) {
    const keys = badgeMap.get(b.relationId) ?? [];
    keys.push(b.badgeKey);
    badgeMap.set(b.relationId, keys);
  }

  return {
    activities: activities.map((a) => ({
      ...a,
      badges: (badgeMap.get(a.id) ?? []).map((key) => ({ badgeKey: key })),
    })),
    total,
    totalPages: Math.ceil(total / PARTNER_ACTIVITIES_PER_PAGE),
    page,
  };
});

const PARTNER_STAYS_PER_PAGE = 12;

export const getPartnerStays = cache(async (page = 1) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { stays: [], total: 0, totalPages: 0 };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { stays: [], total: 0, totalPages: 0 };

  const where = { profileId: profile.id };
  const [stayRows, total] = await Promise.all([
    prisma.stay.findMany({
      where,
      select: {
        id:            true,
        slug:          true,
        title:         true,
        propertyType:  true,
        category:      true,
        price:         true,
        guestCount:    true,
        bedroomCount:  true,
        region:        true,
        approvalStatus: true,
        nbReviews:     true,
        averageRating: true,
        images:        { select: { id: true, url: true }, take: 1 },
        _count:        { select: { reservations: true } },
      },
      orderBy: { title: "asc" },
      skip:  (page - 1) * PARTNER_STAYS_PER_PAGE,
      take:  PARTNER_STAYS_PER_PAGE,
    }),
    prisma.stay.count({ where }),
  ]);

  const stayIds = stayRows.map((s) => s.id);
  const badges = stayIds.length
    ? await prisma.listingBadge.findMany({
        where: { relationType: "STAY", relationId: { in: stayIds } },
        select: { relationId: true, badgeKey: true },
      })
    : [];

  const badgeMap = new Map<string, string[]>();
  for (const b of badges) {
    const keys = badgeMap.get(b.relationId) ?? [];
    keys.push(b.badgeKey);
    badgeMap.set(b.relationId, keys);
  }

  return {
    stays: stayRows.map((s) => ({
      ...s,
      badges: (badgeMap.get(s.id) ?? []).map((key) => ({ badgeKey: key })),
    })),
    total,
    totalPages: Math.ceil(total / PARTNER_STAYS_PER_PAGE),
    page,
  };
});

export async function updateBookingStatus(
  bookingId: string,
  type: "activity" | "stay" | "restaurant" | "rental",
  status: BookingStatus
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false, error: "No business profile" };

  try {
    if (type === "activity") {
      const booking = await prisma.activityReservation.findUnique({
        where: { id: bookingId },
        include: { activity: { select: { profileId: true } } },
      });
      if (!booking || booking.activity.profileId !== profile.id)
        return { success: false, error: "Unauthorized" };
      await prisma.activityReservation.update({ where: { id: bookingId }, data: { status } });
    } else if (type === "stay") {
      const booking = await prisma.staysReservation.findUnique({
        where: { id: bookingId },
        include: { stay: { select: { profileId: true } } },
      });
      if (!booking || booking.stay.profileId !== profile.id)
        return { success: false, error: "Unauthorized" };
      await prisma.staysReservation.update({
        where: { id: bookingId },
        data: {
          status,
          ...(status === "CONFIRMED" ? { confirmedAt: new Date() } : {}),
          ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
        },
      });
    } else if (type === "restaurant") {
      const booking = await prisma.restaurantReservation.findUnique({
        where: { id: bookingId },
        include: { restaurant: { select: { profileId: true } } },
      });
      if (!booking || booking.restaurant.profileId !== profile.id)
        return { success: false, error: "Unauthorized" };
      await prisma.restaurantReservation.update({ where: { id: bookingId }, data: { status } });
    } else {
      const booking = await prisma.rentalReservation.findUnique({
        where: { id: bookingId },
        include: { rental: { select: { profileId: true } } },
      });
      if (!booking || booking.rental.profileId !== profile.id)
        return { success: false, error: "Unauthorized" };
      await prisma.rentalReservation.update({ where: { id: bookingId }, data: { status } });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateBookingStatus error:", error);
    return { success: false, error: "Failed to update booking." };
  }
}

export async function updateBusinessProfile(rawData: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = UpdateBusinessProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const { website, ...rest } = parsed.data;

  try {
    await prisma.businessProfile.update({
      where: { userId: session.user.id },
      data: { ...rest, website: website || null },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateBusinessProfile error:", error);
    return { success: false, error: "Failed to update profile." };
  }
}

export async function updateBusinessProfileCategories(rawData: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const parsed = UpdateCategoriesSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  try {
    await prisma.businessProfile.update({
      where: { userId: session.user.id },
      data: { categories: parsed.data.categories },
    });
    revalidatePath("/");
    return { success: true as const };
  } catch (error) {
    console.error("updateBusinessProfileCategories error:", error);
    return { success: false as const, error: "Failed to update categories." };
  }
}

export async function updateProfileImage(imageUrl: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  try {
    await prisma.businessProfile.update({
      where: { userId: session.user.id },
      data: { profileImage: imageUrl },
    });
    revalidatePath("/");
    return { success: true as const };
  } catch (error) {
    console.error("updateProfileImage error:", error);
    return { success: false as const, error: "Failed to update profile image." };
  }
}

export async function getActivityReviews(activityId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { reviews: [], guidniReview: null };

  const [reviews, guidniReview] = await Promise.all([
    prisma.review.findMany({
      where: { relationType: "ACTIVITY", relationId: activityId },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.guidniReview.findUnique({
      where: { relationType_relationId: { relationType: "ACTIVITY", relationId: activityId } },
      select: {
        id: true,
        status: true,
        reviewerName: true,
        visitedAt: true,
        summaryQuote: true,
        fullReview: true,
        whatWeLoved: true,
        worthKnowing: true,
        bestFor: true,
        scoreTotal: true,
        publishedAt: true,
        images: { select: { url: true }, take: 3 },
      },
    }),
  ]);

  return { reviews, guidniReview };
}

// ─── Activity CRUD ────────────────────────────────────────────────────────────

export async function createActivity(rawData: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false, error: "No business profile" };

  const parsed = ActivitySchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  // Validate destinationId exists if provided
  if (parsed.data.destinationId) {
    const dest = await prisma.destination.findUnique({ where: { id: parsed.data.destinationId }, select: { id: true } });
    if (!dest) return { success: false, error: "Invalid destination" };
  }

  try {
    const slug = uniqueSlug(parsed.data.title);
    const { destinationId, categories, availableTimes, ...rest } = parsed.data;
    const created = await prisma.activity.create({
      data: {
        ...rest,
        availableTimes: availableTimes.join(","),
        categories,
        slug,
        profileId: profile.id,
        ...(destinationId ? { destinationId } : {}),
        timeSlots: { create: availableTimes.map((time) => ({ time })) },
      },
      select: { id: true, slug: true },
    });
    revalidatePath("/");

    // Referral milestone: first listing (fire-and-forget)
    const { triggerReferralFirstListing } = await import("@/lib/utils/agent-referral-milestones");
    triggerReferralFirstListing(profile.id).catch(() => null);

    return { success: true as const, data: created };
  } catch (error) {
    console.error("createActivity error:", error);
    return { success: false as const, error: "Failed to create activity." };
  }
}

export async function updateActivity(activityId: string, rawData: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false, error: "No business profile" };

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { profileId: true },
  });
  if (!activity || activity.profileId !== profile.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = ActivitySchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  // Validate destinationId exists if provided
  if (parsed.data.destinationId) {
    const dest = await prisma.destination.findUnique({ where: { id: parsed.data.destinationId }, select: { id: true } });
    if (!dest) return { success: false, error: "Invalid destination" };
  }

  try {
    const { categories, availableTimes, ...rest } = parsed.data;
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        ...rest,
        availableTimes: availableTimes.join(","),
        categories,
        timeSlots: {
          deleteMany: {},
          createMany: { data: availableTimes.map((time) => ({ time })) },
        },
      },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateActivity error:", error);
    return { success: false, error: "Failed to update activity." };
  }
}

export async function deleteActivity(activityId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false, error: "No business profile" };

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { profileId: true },
  });
  if (!activity || activity.profileId !== profile.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.activity.delete({ where: { id: activityId } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("deleteActivity error:", error);
    return { success: false, error: "Failed to delete activity." };
  }
}

export async function updateActivityStatus(
  activityId: string,
  status: "DRAFT" | "ACTIVE" | "SUSPENDED"
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false, error: "No business profile" };

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { profileId: true },
  });
  if (!activity || activity.profileId !== profile.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        status,
        ...(status === "ACTIVE" ? { publishedAt: new Date() } : {}),
      },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateActivityStatus error:", error);
    return { success: false, error: "Failed to update status." };
  }
}

export async function setActivityImageAsCover(imageId: string, activityId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false as const, error: "No business profile" };

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { profileId: true },
  });
  if (!activity || activity.profileId !== profile.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const images = await prisma.images.findMany({
    where: { activityId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  // Move target image to position 0, renumber the rest
  const reordered = [
    { id: imageId },
    ...images.filter((img) => img.id !== imageId),
  ];

  try {
    await prisma.$transaction(
      reordered.map((img, i) =>
        prisma.images.update({ where: { id: img.id }, data: { order: i } })
      )
    );
    revalidatePath("/");
    return { success: true as const };
  } catch (error) {
    console.error("setActivityImageAsCover error:", error);
    return { success: false as const, error: "Failed to set cover image." };
  }
}

export async function reorderActivityImages(activityId: string, orderedIds: string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false as const, error: "No business profile" };

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { profileId: true },
  });
  if (!activity || activity.profileId !== profile.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  try {
    await prisma.$transaction(
      orderedIds.map((id, i) => prisma.images.update({ where: { id }, data: { order: i } }))
    );
    revalidatePath("/");
    return { success: true as const };
  } catch (error) {
    console.error("reorderActivityImages error:", error);
    return { success: false as const, error: "Failed to reorder images." };
  }
}

// ─── Stay CRUD ────────────────────────────────────────────────────────────────

export async function createStay(rawData: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false, error: "No business profile" };

  const parsed = StaySchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  try {
    const slug = uniqueSlug(parsed.data.title);
    const { destinationId, ...rest } = parsed.data;
    const created = await prisma.stay.create({
      data: {
        ...rest,
        slug,
        profileId: profile.id,
        hostName:  session.user.name ?? "Partner",
        ...(destinationId ? { destinationId } : {}),
      },
    });
    revalidatePath("/");
    return { success: true as const, data: created };
  } catch (error) {
    console.error("createStay error:", error);
    return { success: false as const, error: "Failed to create stay." };
  }
}

export async function updateStay(stayId: string, rawData: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false, error: "No business profile" };

  const stay = await prisma.stay.findUnique({
    where: { id: stayId },
    select: { profileId: true, slug: true },
  });
  if (!stay || stay.profileId !== profile.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = StaySchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  try {
    await prisma.stay.update({
      where: { id: stayId },
      data: {
        ...parsed.data,
        arabicTitle:       parsed.data.arabicTitle       || null,
        arabicDescription: parsed.data.arabicDescription || null,
      },
    });
    revalidatePath("/");
    revalidatePath(`/stays/${stay.slug}`);
    return { success: true };
  } catch (error) {
    console.error("updateStay error:", error);
    return { success: false, error: "Failed to update stay." };
  }
}

export async function deleteStay(stayId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false, error: "No business profile" };

  const stay = await prisma.stay.findUnique({
    where: { id: stayId },
    select: { profileId: true, slug: true },
  });
  if (!stay || stay.profileId !== profile.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.stay.delete({ where: { id: stayId } });
    revalidatePath("/");
    revalidatePath(`/stays/${stay.slug}`);
    return { success: true };
  } catch (error) {
    console.error("deleteStay error:", error);
    return { success: false, error: "Failed to delete stay." };
  }
}

export async function reorderStayImages(stayId: string, orderedIds: string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false as const, error: "No business profile" };

  const stay = await prisma.stay.findUnique({
    where: { id: stayId },
    select: { profileId: true },
  });
  if (!stay || stay.profileId !== profile.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  try {
    await prisma.$transaction(
      orderedIds.map((id, i) => prisma.images.update({ where: { id }, data: { order: i } }))
    );
    revalidatePath("/");
    return { success: true as const };
  } catch (error) {
    console.error("reorderStayImages error:", error);
    return { success: false as const, error: "Failed to reorder images." };
  }
}

export async function getStayReviews(stayId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { reviews: [], guidniReview: null };

  const [reviews, guidniReview] = await Promise.all([
    prisma.review.findMany({
      where: { relationType: "STAY", relationId: stayId },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.guidniReview.findUnique({
      where: { relationType_relationId: { relationType: "STAY", relationId: stayId } },
      select: {
        id: true,
        status: true,
        reviewerName: true,
        visitedAt: true,
        summaryQuote: true,
        fullReview: true,
        whatWeLoved: true,
        worthKnowing: true,
        bestFor: true,
        scoreTotal: true,
        publishedAt: true,
        images: { select: { url: true }, take: 3 },
      },
    }),
  ]);

  return { reviews, guidniReview };
}

// ─── Image management ─────────────────────────────────────────────────────────

export async function addListingImage(
  listingId: string,
  type: "activity" | "stay",
  url: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false, error: "No business profile" };

  // Ownership check
  const owned =
    type === "activity"
      ? await prisma.activity.findFirst({ where: { id: listingId, profileId: profile.id } })
      : await prisma.stay.findFirst({ where: { id: listingId, profileId: profile.id } });

  if (!owned) return { success: false, error: "Unauthorized" };

  try {
    await prisma.images.create({
      data: type === "activity" ? { url, activityId: listingId } : { url, stayId: listingId },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to add image." };
  }
}

export async function removeListingImage(imageId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { success: false, error: "No business profile" };

  const image = await prisma.images.findUnique({
    where: { id: imageId },
    include: {
      activity: { select: { profileId: true } },
      stay:     { select: { profileId: true } },
    },
  });
  if (!image) return { success: false, error: "Image not found" };

  const ownerProfileId = image.activity?.profileId ?? image.stay?.profileId;
  if (ownerProfileId !== profile.id) return { success: false, error: "Unauthorized" };

  try {
    await prisma.images.delete({ where: { id: imageId } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to remove image." };
  }
}

// ── Stay blocked dates ────────────────────────────────────────────────────────

async function verifyStayOwnership(stayId: string, userId: string) {
  const profile = await prisma.businessProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;
  const stay = await prisma.stay.findUnique({
    where: { id: stayId },
    select: { profileId: true },
  });
  if (!stay || stay.profileId !== profile.id) return null;
  return profile;
}

export async function getBlockedDates(stayId: string): Promise<string[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  const profile = await verifyStayOwnership(stayId, session.user.id);
  if (!profile) return [];

  const dates = await prisma.stayBlockedDate.findMany({
    where: { stayId },
    select: { date: true },
    orderBy: { date: "asc" },
  });
  return dates.map((d) => d.date.toISOString().slice(0, 10));
}

export async function toggleBlockedDate(stayId: string, dateStr: string) {
  "use server";
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false as const, error: "Not authenticated" };
  const profile = await verifyStayOwnership(stayId, session.user.id);
  if (!profile) return { success: false as const, error: "Unauthorized" };

  const date = new Date(dateStr + "T00:00:00.000Z");

  const existing = await prisma.stayBlockedDate.findUnique({
    where: { stayId_date: { stayId, date } },
  });

  if (existing) {
    await prisma.stayBlockedDate.delete({ where: { id: existing.id } });
    return { success: true as const, blocked: false };
  } else {
    await prisma.stayBlockedDate.create({ data: { stayId, date } });
    return { success: true as const, blocked: true };
  }
}

export async function getAvailabilityData(stayId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { blocked: [] as string[], reservations: [] as { checkIn: string; checkOut: string; status: string; bookingRef: string }[] };

  const profile = await verifyStayOwnership(stayId, session.user.id);
  if (!profile) return { blocked: [] as string[], reservations: [] as { checkIn: string; checkOut: string; status: string; bookingRef: string }[] };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [blockedRows, reservations] = await Promise.all([
    prisma.stayBlockedDate.findMany({
      where: { stayId },
      select: { date: true },
      orderBy: { date: "asc" },
    }),
    prisma.staysReservation.findMany({
      where: {
        stayId,
        status: { in: ["PENDING", "CONFIRMED"] },
        checkOut: { gte: today },
      },
      select: { checkIn: true, checkOut: true, status: true, bookingRef: true },
      orderBy: { checkIn: "asc" },
    }),
  ]);

  return {
    blocked: blockedRows.map((d) => d.date.toISOString().slice(0, 10)),
    reservations: reservations.map((r) => ({
      checkIn:    r.checkIn.toISOString().slice(0, 10),
      checkOut:   r.checkOut.toISOString().slice(0, 10),
      status:     r.status,
      bookingRef: r.bookingRef,
    })),
  };
}
