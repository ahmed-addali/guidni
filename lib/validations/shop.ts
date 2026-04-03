import { z } from "zod";

export const ShopSchema = z.object({
  name:              z.string().min(2).max(120),
  arabicName:        z.string().optional(),
  description:       z.string().min(20).max(3000),
  arabicDescription: z.string().optional(),
  category:          z.string().min(1),
  phone:             z.string().optional(),
  country:           z.string().min(2),
  region:            z.string().min(2),
  city:              z.string().optional(),
  address:           z.string().optional(),
  location:          z.string().optional(),
  coverPhoto:        z.string().optional(),
  logo:              z.string().optional(),
  website:           z.string().optional(),
  instagram:         z.string().optional(),
  facebook:          z.string().optional(),
  deliveryMethods:   z.array(
    z.enum(["PICKUP", "LOCAL_DELIVERY", "NATIONWIDE", "INTERNATIONAL"])
  ).min(1, "At least one delivery method is required"),
  freeShippingAbove: z.coerce.number().int().positive().optional().nullable(),
  minOrderAmount:    z.coerce.number().int().positive().optional().nullable(),
  isOpen:            z.boolean().default(true),
  featuredInHome:    z.boolean().default(false),
  destinationId:     z.string().optional().nullable(),
});

export type ShopInput = z.infer<typeof ShopSchema>;

export const ProductSchema = z.object({
  name:              z.string().min(2).max(120),
  arabicName:        z.string().optional(),
  description:       z.string().min(10).max(3000),
  arabicDescription: z.string().optional(),
  price:             z.coerce.number().int().min(1, "Price must be at least 1 TND"),
  comparePrice:      z.coerce.number().int().positive().optional().nullable(),
  category:          z.string().min(1),
  material:          z.string().optional(),
  origin:            z.string().optional(),
  weight:            z.coerce.number().int().positive().optional().nullable(),
  stock:             z.coerce.number().int().min(0).default(0),
  isHandmade:        z.boolean().default(false),
  isLocalOnly:       z.boolean().default(false),
  featured:          z.boolean().default(false),
  tags:              z.array(z.string()).default([]),
});

export type ProductInput = z.infer<typeof ProductSchema>;

export const ProductOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      shopId:    z.string(),
      quantity:  z.coerce.number().int().min(1),
      unitPrice: z.coerce.number().int().min(0),
    })
  ).min(1, "Cart is empty"),
  deliveryMethod:  z.enum(["PICKUP", "LOCAL_DELIVERY", "NATIONWIDE", "INTERNATIONAL"]),
  deliveryAddress: z.string().optional(),
  deliveryCity:    z.string().optional(),
  deliveryCountry: z.string().optional(),
  notes:           z.string().optional(),
});

export type ProductOrderInput = z.infer<typeof ProductOrderSchema>;
