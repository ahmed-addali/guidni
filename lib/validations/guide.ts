import { z } from "zod";

export const GuideProfileSchema = z.object({
  displayName:     z.string().min(2).max(80),
  bio:             z.string().min(50).max(2000),
  arabicBio:       z.string().max(2000).optional(),
  tagline:         z.string().max(120).optional(),
  avatarUrl:       z.string().url().optional().or(z.literal("")),
  coverUrl:        z.string().url().optional().or(z.literal("")),
  specializations: z.array(z.string()).min(1, "Select at least one specialization"),
  languages:       z.array(z.string()).min(1, "Select at least one language"),
  experienceYears: z.coerce.number().int().min(0).max(50).optional(),
  country:         z.string().min(2),
  destinationId:   z.string().optional(),
  website:         z.string().url().optional().or(z.literal("")),
  instagram:       z.string().optional(),
  facebook:        z.string().optional(),
  tiktok:          z.string().optional(),
});

export type GuideProfileInput = z.infer<typeof GuideProfileSchema>;

export const GuidePlanPublishSchema = z.object({
  planType:    z.enum(["GUIDE_FREE", "GUIDE_PAID"]),
  summary:     z.string().min(50, "Summary must be at least 50 characters").max(1000),
  tags:        z.array(z.string()).min(1, "Add at least one tag"),
  difficulty:  z.enum(["easy", "moderate", "active"]).optional(),
  suitableFor: z.array(z.string()).min(1, "Select who this plan is for"),
  season:      z.string().optional(),
  previewDays: z.number().int().min(1).max(3).default(1),
  price:       z.number().int().min(0).default(0),
});

export type GuidePlanPublishInput = z.infer<typeof GuidePlanPublishSchema>;
