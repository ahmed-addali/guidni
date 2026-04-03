import { z } from "zod";

export const RentalSchema = z.object({
  title:           z.string().min(3).max(120),
  description:     z.string().min(20).max(3000),
  type:            z.enum(["CAR", "BIKE", "SCOOTER", "BOAT", "OTHER"]),
  pricePerDay:     z.coerce.number().int().positive(),
  pricePerHour:    z.coerce.number().int().positive().optional().nullable(),
  minDays:         z.coerce.number().int().positive().default(1),
  capacity:        z.coerce.number().int().positive().default(1),
  brand:           z.string().optional(),
  model:           z.string().optional(),
  year:            z.coerce.number().int().optional().nullable(),
  color:           z.string().optional(),
  transmission:    z.string().optional(),
  fuelType:        z.string().optional(),
  hasAC:           z.boolean().default(false),
  hasGPS:          z.boolean().default(false),
  hasInsurance:    z.boolean().default(false),
  requiresLicense: z.boolean().default(true),
  country:         z.string().min(2),
  region:          z.string().min(2),
  city:            z.string().optional(),
  address:         z.string().optional(),
  phone:           z.string().optional(),
  destinationId:   z.string().optional().nullable(),
});

export type RentalInput = z.infer<typeof RentalSchema>;
