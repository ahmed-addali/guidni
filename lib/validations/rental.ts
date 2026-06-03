import { z } from "zod";

export const RentalSchema = z.object({
  title:            z.string().min(3).max(120),
  arabicTitle:      z.string().optional().nullable(),
  description:      z.string().min(20).max(3000),
  arabicDescription: z.string().optional().nullable(),
  type:             z.enum(["CAR", "MOTORBIKE", "SCOOTER", "BICYCLE", "BOAT", "QUAD", "BUGGY", "JET_SKI", "OTHER"]),
  pricePerDay:      z.coerce.number().int().positive(),
  pricePerHour:     z.coerce.number().int().positive().optional().nullable(),
  deposit:          z.coerce.number().int().min(0).optional().nullable(),
  minDays:          z.coerce.number().int().positive().default(1),
  capacity:         z.coerce.number().int().positive().default(1),
  brand:            z.string().optional().nullable(),
  model:            z.string().optional().nullable(),
  year:             z.coerce.number().int().optional().nullable(),
  color:            z.string().optional().nullable(),
  transmission:     z.string().optional().nullable(),
  fuelType:         z.string().optional().nullable(),
  hasAC:            z.boolean().default(false),
  hasGPS:           z.boolean().default(false),
  hasInsurance:     z.boolean().default(false),
  requiresLicense:  z.boolean().default(true),
  freeCancellation: z.boolean().default(false),
  country:          z.string().min(2),
  region:           z.string().min(2),
  city:             z.string().optional().nullable(),
  address:          z.string().optional().nullable(),
  phone:            z.string().optional().nullable(),
  destinationId:    z.string().optional().nullable(),
});

export type RentalInput = z.infer<typeof RentalSchema>;
