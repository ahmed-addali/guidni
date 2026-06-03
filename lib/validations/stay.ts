import { z } from "zod";

export const StaySchema = z.object({
  // Core
  title:              z.string().min(3).max(120),
  arabicTitle:        z.string().max(120).optional(),
  description:        z.string().min(20).max(3000),
  arabicDescription:  z.string().max(3000).optional(),
  propertyType:       z.string().min(2),
  category:           z.string().min(2),

  // Capacity
  guestCount:         z.coerce.number().int().positive().default(1),
  bedroomCount:       z.coerce.number().int().positive().default(1),
  bedCount:           z.coerce.number().int().positive().default(1),
  bathroomCount:      z.coerce.number().int().positive().default(1),

  // Location
  country:            z.string().min(2),
  region:             z.string().min(2),
  city:               z.string().optional(),
  address:            z.string().optional(),
  phone:              z.string().min(6, "Enter a valid phone number"),

  // Policies
  checkInTime:        z.string().optional(),
  checkOutTime:       z.string().optional(),
  minStayNights:      z.coerce.number().int().positive().default(1),

  // Pricing
  price:              z.coerce.number().int().positive(),
  cleaningFee:        z.coerce.number().int().min(0).default(0),

  // Amenities
  hasWifi:              z.boolean().default(false),
  hasPool:              z.boolean().default(false),
  hasParking:           z.boolean().default(false),
  hasKitchen:           z.boolean().default(false),
  hasAirConditioning:   z.boolean().default(false),
  isPetFriendly:        z.boolean().default(false),
  hasHeating:           z.boolean().default(false),
  hasGarden:            z.boolean().default(false),
  hasBalcony:           z.boolean().default(false),
  hasSecurity:          z.boolean().default(false),
  hasConcierge:         z.boolean().default(false),
  isSmokeFree:          z.boolean().default(true),
  wheelchairAccessible: z.boolean().default(false),
  elevatorAvailable:    z.boolean().default(false),

  // Relations
  destinationId:      z.string().optional().nullable(),
});

export type StayInput = z.infer<typeof StaySchema>;
