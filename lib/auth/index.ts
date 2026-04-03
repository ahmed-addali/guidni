import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        input: false,
      },
      phone: { type: "string", required: false },
      bio: { type: "string", required: false },
      address: { type: "string", required: false },
      country: { type: "string", required: false },
      city: { type: "string", required: false },
      postalCode: { type: "string", required: false },
    },
  },

  // Auto-promote the designated admin email on first account creation
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (
            process.env.ADMIN_EMAIL &&
            user.email === process.env.ADMIN_EMAIL
          ) {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "ADMIN" },
            });
          }
        },
      },
    },
  },

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
