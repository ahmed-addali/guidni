"use server";

import { headers } from "next/headers";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// ─── Transfers ────────────────────────────────────────────────────────────────

export const getAdminTransfers = cache(async () => {
  await requireAdmin();

  return prisma.transfer.findMany({
    orderBy: { id: "desc" },
    select: {
      id:             true,
      title:          true,
      slug:           true,
      type:           true,
      status:         true,
      featuredInHome: true,
      createdAt:      true,
      destination:    { select: { city: true } },
      businessProfile: { select: { name: true, isVerified: true } },
      _count:         { select: { reservations: true } },
    },
  });
});

export async function adminUpdateTransferStatus(
  transferId: string,
  status: "DRAFT" | "ACTIVE" | "SUSPENDED"
) {
  await requireAdmin();

  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: { slug: true },
  });
  if (!transfer) return { success: false as const, error: "Transfer not found" };

  await prisma.transfer.update({ where: { id: transferId }, data: { status } });

  revalidatePath("/admin/transport");
  revalidatePath("/transport/transfers");
  revalidatePath("/");
  revalidatePath(`/transport/transfers/${transfer.slug}`);

  return { success: true as const };
}

export async function adminToggleTransferFeatured(id: string, featured: boolean) {
  await requireAdmin();

  await prisma.transfer.update({ where: { id }, data: { featuredInHome: featured } });
  revalidatePath("/admin/transport");
  revalidatePath("/");
  return { success: true as const };
}

// ─── Rentals ──────────────────────────────────────────────────────────────────

export const getAdminRentals = cache(async () => {
  await requireAdmin();

  return prisma.rental.findMany({
    orderBy: { id: "desc" },
    select: {
      id:             true,
      title:          true,
      slug:           true,
      type:           true,
      status:         true,
      featuredInHome: true,
      createdAt:      true,
      destination:    { select: { city: true } },
      businessProfile: { select: { name: true, isVerified: true } },
      _count:         { select: { reservations: true } },
    },
  });
});

export async function adminUpdateRentalStatus(
  rentalId: string,
  status: "DRAFT" | "ACTIVE" | "SUSPENDED"
) {
  await requireAdmin();

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { slug: true },
  });
  if (!rental) return { success: false as const, error: "Rental not found" };

  await prisma.rental.update({ where: { id: rentalId }, data: { status } });

  revalidatePath("/admin/transport");
  revalidatePath("/transport/rentals");
  revalidatePath("/");
  revalidatePath(`/transport/rentals/${rental.slug}`);

  return { success: true as const };
}

export async function adminToggleRentalFeatured(id: string, featured: boolean) {
  await requireAdmin();

  await prisma.rental.update({ where: { id }, data: { featuredInHome: featured } });
  revalidatePath("/admin/transport");
  revalidatePath("/");
  return { success: true as const };
}
