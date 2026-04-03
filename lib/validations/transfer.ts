import { z } from "zod";

export const TransferSchema = z.object({
  title:            z.string().min(3).max(120),
  arabicTitle:      z.string().optional(),
  description:      z.string().min(20).max(3000),
  arabicDescription: z.string().optional(),
  type:             z.enum(["AIRPORT_TRANSFER", "TAXI", "CHAUFFEUR", "SHUTTLE"]),

  // Pricing — only the relevant field is required based on type
  pricePerTrip:   z.coerce.number().int().positive().optional().nullable(),
  pricePerHour:   z.coerce.number().int().positive().optional().nullable(),
  pricePerPerson: z.coerce.number().int().positive().optional().nullable(),

  // Vehicle details
  capacity:    z.coerce.number().int().positive().default(4),
  vehicleType: z.string().optional(),
  brand:       z.string().optional(),
  model:       z.string().optional(),
  year:        z.coerce.number().int().optional().nullable(),
  isAC:        z.boolean().default(true),
  isMeetGreet: z.boolean().default(false),
  isChildSeat: z.boolean().default(false),
  languages:   z.string().optional(),
  phone:       z.string().optional(),

  // Location
  country:       z.string().min(2),
  region:        z.string().min(2),
  city:          z.string().optional(),
  address:       z.string().optional(),
  destinationId: z.string().optional().nullable(),
  featuredInHome: z.boolean().default(false),
});

export type TransferInput = z.infer<typeof TransferSchema>;
