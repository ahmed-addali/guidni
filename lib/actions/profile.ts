"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function getProfile() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      bio: true,
      address: true,
      city: true,
      country: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });
}

const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
});

export async function updateProfile(input: z.infer<typeof ProfileSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Not authenticated." };

  const result = ProfileSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: result.error.flatten().fieldErrors };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: result.data,
  });

  return { success: true };
}
