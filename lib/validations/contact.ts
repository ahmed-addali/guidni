import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(6, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(/^\+?[\d\s\-().]+$/, "Invalid phone number format"),
});

export type ContactFormData = z.infer<typeof ContactSchema>;
