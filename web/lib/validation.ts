import { z } from "zod";

export const productQuerySchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  sort: z.enum(["featured", "price-asc", "price-desc", "newest"]).default("featured"),
  limit: z.coerce.number().int().min(1).max(100).default(48),
});

const imageUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2000)
  .refine((value) => value.startsWith("https://"), "Use a secure https image URL.");

export const productInputSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug."),
    description: z.string().trim().min(10).max(5000),
    categoryId: z.string().uuid(),
    price: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    originalPrice: z.number().int().positive().nullable().optional(),
    stockQuantity: z.number().int().min(0).max(1_000_000),
    imageUrl: imageUrlSchema.nullable().optional(),
    isFeatured: z.boolean().default(false),
  })
  .strict()
  .superRefine((product, context) => {
    if (product.originalPrice !== undefined && product.originalPrice !== null) {
      if (product.originalPrice <= product.price) {
        context.addIssue({
          code: "custom",
          path: ["originalPrice"],
          message: "Discount price must be higher than the current price.",
        });
      }
    }
  });

export const productUpdateSchema = z
  .object({
    title: z.string().trim().min(2).max(180).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    categoryId: z.string().uuid().optional(),
    price: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
    originalPrice: z.number().int().positive().nullable().optional(),
    stockQuantity: z.number().int().min(0).max(1_000_000).optional(),
    imageUrl: imageUrlSchema.nullable().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((product) => Object.keys(product).length > 0, {
    message: "Provide at least one field to update.",
  });

export const createOrderSchema = z
  .object({
    customerName: z.string().trim().min(2).max(120),
    customerEmail: z.string().trim().email().max(254),
    customerPhone: z.string().trim().min(7).max(24),
    deliveryAddress: z.string().trim().min(5).max(400),
    state: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(100),
    items: z
      .array(
        z
          .object({
            productId: z.string().uuid(),
            quantity: z.number().int().min(1).max(50),
          })
          .strict(),
      )
      .min(1)
      .max(30),
  })
  .strict()
  .superRefine(({ items }, context) => {
    const ids = items.map((item) => item.productId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "Each product may only appear once in an order.",
        path: ["items"],
      });
    }
  });

export const orderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "delivered"]),
});
