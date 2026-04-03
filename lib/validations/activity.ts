import { z } from "zod";

export const ActivitySchema = z.object({
  title:           z.string().min(3).max(120),
  description:     z.string().min(20).max(3000),
  category:        z.string().min(2),
  price:           z.coerce.number().int().positive(),
  capacity:        z.coerce.number().int().positive(),
  availableTimes:  z.string().min(1),
  duration:        z.string().optional(),
  country:         z.string().min(2),
  region:          z.string().min(2),
  city:            z.string().optional(),
  address:         z.string().optional(),
  phone:           z.string().optional(),
  cancelation:     z.boolean().optional(),
  paynow:          z.boolean().optional(),
  destinationId:   z.string().optional().nullable(),
});

export type ActivityInput = z.infer<typeof ActivitySchema>;
