import { z } from "zod";

const BUSINESS_CATEGORIES = ["activities", "stays", "restaurant", "rentals", "transfers", "shop", "guide"] as const;

// Used by the become-partner wizard (single initial category)
export const BusinessProfileSchema = z.object({
  name:        z.string().min(2, "Business name must be at least 2 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  category:    z.enum(BUSINESS_CATEGORIES, "Please select a category"),
  type:        z.enum(["INDIVIDUAL", "COMPANY"]).default("INDIVIDUAL"),
  country:     z.string().min(2, "Country is required"),
  region:      z.string().min(2, "Region is required"),
  address:     z.string().max(200).optional(),
  phone:       z.string().max(30).optional(),
  companyRN:   z.string().max(50).optional(),
  website:     z.string().url("Enter a valid URL").optional().or(z.literal("")),
  instagram:   z.string().max(60).optional(),
  facebook:    z.string().max(100).optional(),
  languages:   z.string().max(100).optional(),
});

export type BusinessProfileFormData = z.infer<typeof BusinessProfileSchema>;

// Used by the profile edit form (without categories — managed separately)
export const UpdateBusinessProfileSchema = z.object({
  name:        z.string().min(2, "Business name must be at least 2 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  type:        z.enum(["INDIVIDUAL", "COMPANY"]).default("INDIVIDUAL"),
  country:     z.string().min(2, "Country is required"),
  region:      z.string().min(2, "Region is required"),
  address:     z.string().max(200).optional(),
  phone:       z.string().max(30).optional(),
  companyRN:   z.string().max(50).optional(),
  website:     z.string().url("Enter a valid URL").optional().or(z.literal("")),
  instagram:   z.string().max(60).optional(),
  facebook:    z.string().max(100).optional(),
  languages:   z.string().max(100).optional(),
});

export type UpdateBusinessProfileFormData = z.infer<typeof UpdateBusinessProfileSchema>;

// Used by the categories management section
export const UpdateCategoriesSchema = z.object({
  categories: z
    .array(z.enum(BUSINESS_CATEGORIES))
    .min(1, "Select at least one category"),
});

export const SUPPORTED_CATEGORIES = BUSINESS_CATEGORIES;
