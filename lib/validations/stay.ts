import { z } from "zod";

export const StaySchema = z.object({
  title:            z.string().min(3).max(120),
  description:      z.string().min(20).max(3000),
  propertyType:     z.string().min(2),
  category:         z.string().min(2),
  price:            z.coerce.number().int().positive(),
  guestCount:       z.coerce.number().int().positive().default(1),
  bedroomCount:     z.coerce.number().int().positive().default(1),
  bedCount:         z.coerce.number().int().positive().default(1),
  bathroomCount:    z.coerce.number().int().positive().default(1),
  country:          z.string().min(2),
  region:           z.string().min(2),
  city:             z.string().optional(),
  address:          z.string().optional(),
  phone:            z.string().optional(),
  checkInTime:      z.string().optional(),
  checkOutTime:     z.string().optional(),
  minStayNights:    z.coerce.number().int().positive().default(1),
  hasWifi:          z.boolean().default(false),
  hasPool:          z.boolean().default(false),
  hasParking:       z.boolean().default(false),
  hasKitchen:       z.boolean().default(false),
  hasAirConditioning: z.boolean().default(false),
  isPetFriendly:    z.boolean().default(false),
  destinationId:    z.string().optional().nullable(),
});

export type StayInput = z.infer<typeof StaySchema>;
