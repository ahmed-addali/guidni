import { z } from "zod";

export const ActivitySchema = z.object({
  title:            z.string().min(3).max(120),
  arabicTitle:      z.string().max(120).optional(),
  description:      z.string().min(20).max(3000),
  arabicDescription: z.string().max(3000).optional(),
  categories:       z.array(z.string().min(1)).min(1, "Select at least one category"),
  price:            z.coerce.number().int().positive(),
  capacity:         z.coerce.number().int().positive(),
  availableTimes:   z
    .array(z.string().regex(/^\d{2}:\d{2}$/, "Each time must be in HH:MM format"))
    .min(1, "Add at least one time slot"),
  duration:         z.string().optional(),
  durationMinutes:  z.coerce.number().int().min(0).optional(),
  includes:         z.string().optional(),
  excludes:         z.string().optional(),
  allowed:          z.string().optional(),
  forbidden:        z.string().optional(),
  country:          z.string().min(2),
  region:           z.string().min(2),
  city:             z.string().optional(),
  address:          z.string().optional(),
  phone:            z.string().min(6, "Enter a valid phone number"),
  cancelation:      z.boolean().optional(),
  paynow:           z.boolean().optional(),
  destinationId:    z.string().optional().nullable(),
});

export type ActivityInput = z.infer<typeof ActivitySchema>;
