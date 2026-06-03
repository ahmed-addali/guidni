import { z } from "zod";

export const PassSchema = z.object({
  passKey:          z.string().min(2).max(50),
  name:             z.string().min(2).max(120),
  arabicName:       z.string().max(120).optional().or(z.literal("")),
  description:      z.string().max(2000).optional().or(z.literal("")),
  arabicDescription:z.string().max(2000).optional().or(z.literal("")),
  price:            z.number().int().min(0),
  discount:         z.number().int().min(0).max(100),
  popular:          z.boolean().default(false),
  optionalCount:    z.number().int().min(0),
  destinationId:    z.string().optional().or(z.literal("")),
});

export const PassReservationSchema = z.object({
  passId:       z.string(),
  passKey:      z.string(),
  date:         z.string(),
  participants: z.number().int().min(1),
  totalPrice:   z.number().min(0),
  language:     z.string().optional(),
  notes:        z.string().optional(),
  selectedOptionalActivityIds: z.array(z.string()).optional(),
});

export type PassInput = z.infer<typeof PassSchema>;
export type PassReservationInput = z.infer<typeof PassReservationSchema>;
