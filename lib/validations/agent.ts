import { z } from "zod";

export const AgentApplicationSchema = z.object({
  displayName:   z.string().min(2, "Name must be at least 2 characters"),
  pseudonym:     z
    .string()
    .min(3, "Pseudonym must be at least 3 characters")
    .max(30, "Pseudonym must be 30 characters or fewer")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed")
    .optional()
    .or(z.literal("")),
  phone:         z.string().min(8, "Enter a valid phone number"),
  country:       z.string().min(1, "Country is required"),
  city:          z.string().min(1, "City is required"),
  bio:           z.string().max(500, "Bio must be 500 characters or fewer").optional(),
  touchPoint:    z.string().min(10, "Please describe how you interact with tourists (min 10 characters)"),
  destinationId: z.string().optional(),
});

export type AgentApplicationInput = z.infer<typeof AgentApplicationSchema>;

export const AgentInvitationSchema = z
  .object({
    listingType:  z.enum(["ACTIVITY"]),
    listingId:    z.string().min(1),
    date:         z.string().optional(),
    timeSlot:     z.string().optional(),
    adults:       z.number().min(1),
    children:     z.number().min(0).default(0),
    touristEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
    touristPhone: z.string().optional(),
    note:         z.string().max(300).optional(),
  })
  .refine(
    (d) => (d.touristEmail && d.touristEmail.length > 0) || (d.touristPhone && d.touristPhone.length > 0),
    { message: "Provide at least an email or phone number", path: ["touristEmail"] }
  );

export type AgentInvitationInput = z.infer<typeof AgentInvitationSchema>;
