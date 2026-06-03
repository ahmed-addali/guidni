import { z } from "zod";

export const RestaurantSchema = z.object({
  name:                z.string().min(2).max(120),
  arabicName:          z.string().optional(),
  description:         z.string().min(10).max(3000),
  arabicDescription:   z.string().optional(),
  phone:               z.string().optional(),
  type:                z.enum(["RESTAURANT", "CAFEE_SHOP", "BOTH"]),
  category:            z.string().optional(),
  meals:               z.string().optional(),
  foodTypes:           z.array(z.string()).optional(),
  dietTypes:           z.array(z.string()).optional(),
  attributes:          z.array(z.string()).optional(),
  country:             z.string().min(2),
  city:                z.string().min(2),
  address:             z.string().optional(),
  location:            z.string().optional(),
  website:             z.string().optional(),
  instagram:           z.string().optional(),
  facebook:            z.string().optional(),
  pdfMenu:             z.string().optional(),
  reservationsEnabled: z.boolean(),
  maxGuests:           z.coerce.number().int().positive().optional().nullable(),
  tables:              z.coerce.number().int().positive().optional().nullable(),
  featuredInHome:      z.boolean().optional(),
  destinationId:       z.string().optional().nullable(),
});

export type RestaurantInput = z.infer<typeof RestaurantSchema>;

export const MenuItemSchema = z.object({
  name:        z.string().min(1).max(120),
  description: z.string().min(2).max(500),
  price:       z.coerce.number().int().nonnegative(),
  category:    z.string().optional(),
  visible:     z.boolean().optional(),
});

export type MenuItemInput = z.infer<typeof MenuItemSchema>;

export const HoursSchema = z.object({
  day:              z.string(),
  opening:          z.string().optional(),
  closing:          z.string().optional(),
  isClosed:         z.boolean(),
  isFullDayOpening: z.boolean(),
});

export type HoursInput = z.infer<typeof HoursSchema>;
