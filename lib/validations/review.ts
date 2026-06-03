import { z } from "zod";

export const ReviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  title: z.string().max(120).optional(),
  comment: z.string().max(1000).optional(),
});

export type ReviewFormData = z.infer<typeof ReviewSchema>;
