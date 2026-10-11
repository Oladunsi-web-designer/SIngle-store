import { config } from "dotenv";
import { resolve } from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "../lib/schema";

config({ path: resolve(process.cwd(), "../.env.local") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be set before running the seed script.");
}

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString, max: 1 });
const db = drizzle(pool, { schema });

const categorySeed = [
  {
    name: "Refrigerators",
    slug: "refrigerators",
    imageUrl: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Air Conditioners",
    slug: "air-conditioners",
    imageUrl: "https://images.unsplash.com/photo-1631545806609-6f16d3c6ad71?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Washing Machines",
    slug: "washing-machines",
    imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Kitchen Appliances",
    slug: "kitchen-appliances",
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Fans",
    slug: "fans",
    imageUrl: "https://images.unsplash.com/photo-1631545806609-6f16d3c6ad71?auto=format&fit=crop&w=900&q=85",
  },
];

const productSeed = [
  {
    title: "Hisense 205L Double Door Fridge",
    slug: "hisense-205l-double-door-fridge",
    description: "A spacious, energy-conscious double-door refrigerator with flexible storage for the modern Nigerian home.",
    categorySlug: "refrigerators",
    price: 485000,
    originalPrice: 535000,
    stockQuantity: 12,
    imageUrl: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=1200&q=90",
    isFeatured: true,
  },
  {
    title: "Haier Thermocool 1.5HP GenPAL Inverter AC",
    slug: "haier-thermocool-1-5hp-genpal-inverter-ac",
    description: "Efficient inverter cooling designed to deliver dependable comfort through changing power conditions.",
    categorySlug: "air-conditioners",
    price: 1250000,
    originalPrice: 1395000,
    stockQuantity: 8,
    imageUrl: "https://images.unsplash.com/photo-1631545806609-6f16d3c6ad71?auto=format&fit=crop&w=1200&q=90",
    isFeatured: true,
  },
  {
    title: 'Century 18" Standing Fan',
    slug: "century-18-inch-standing-fan",
    description: "A sturdy adjustable-height standing fan with three speed settings for a cool, comfortable room.",
    categorySlug: "fans",
    price: 87500,
    originalPrice: null,
    stockQuantity: 25,
    imageUrl: "https://images.unsplash.com/photo-1631545806609-6f16d3c6ad71?auto=format&fit=crop&w=1200&q=90",
    isFeatured: true,
  },
  {
    title: "LG 8kg Front Load Washing Machine",
    slug: "lg-8kg-front-load-washing-machine",
    description: "An 8kg front-load washer with thoughtful cycles for everyday laundry and reliable home performance.",
    categorySlug: "washing-machines",
    price: 945000,
    originalPrice: 1025000,
    stockQuantity: 6,
    imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1200&q=90",
    isFeatured: false,
  },
  {
    title: "Nexus 6L Digital Air Fryer",
    slug: "nexus-6l-digital-air-fryer",
    description: "A roomy digital air fryer for crisp weeknight favourites with less oil and easy-to-use settings.",
    categorySlug: "kitchen-appliances",
    price: 148000,
    originalPrice: 169000,
    stockQuantity: 15,
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=90",
    isFeatured: true,
  },
  {
    title: "Hisense 25L Digital Microwave",
    slug: "hisense-25l-digital-microwave",
    description: "A practical 25-litre microwave with digital controls for quick heating and convenient everyday cooking.",
    categorySlug: "kitchen-appliances",
    price: 239000,
    originalPrice: null,
    stockQuantity: 10,
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=90",
    isFeatured: false,
  },
];

try {
  const insertedCategories = [];
  for (const category of categorySeed) {
    const [savedCategory] = await db
      .insert(schema.categories)
      .values(category)
      .onConflictDoUpdate({
        target: schema.categories.slug,
        set: { name: sql`excluded.name`, imageUrl: sql`excluded.image_url` },
      })
      .returning({ id: schema.categories.id, slug: schema.categories.slug });
    insertedCategories.push(savedCategory);
  }
  const categoryIdBySlug = new Map(
    insertedCategories.map((category) => [category.slug, category.id]),
  );

  const productValues = productSeed.map(({ categorySlug, ...product }) => {
    const categoryId = categoryIdBySlug.get(categorySlug);
    if (!categoryId) throw new Error(`Seed category is missing: ${categorySlug}`);
    return { ...product, categoryId };
  });

  await db
    .insert(schema.products)
    .values(productValues)
    .onConflictDoUpdate({
      target: schema.products.slug,
      set: {
        title: sql`excluded.title`,
        description: sql`excluded.description`,
        categoryId: sql`excluded.category_id`,
        price: sql`excluded.price`,
        originalPrice: sql`excluded.original_price`,
        stockQuantity: sql`excluded.stock_quantity`,
        imageUrl: sql`excluded.image_url`,
        isFeatured: sql`excluded.is_featured`,
      },
    });

  console.log(`Seeded ${insertedCategories.length} categories and ${productValues.length} appliance products.`);
} finally {
  await pool.end();
}
