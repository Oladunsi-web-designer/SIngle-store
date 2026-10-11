import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { categories, products } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  }

  try {
    const inventory = await db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        categoryId: products.categoryId,
        category: categories.name,
        price: products.price,
        originalPrice: products.originalPrice,
        stockQuantity: products.stockQuantity,
        imageUrl: products.imageUrl,
        isFeatured: products.isFeatured,
        isActive: products.isActive,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(products.title));
    return NextResponse.json({ products: inventory }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load admin inventory.", error);
    return NextResponse.json({ error: "Unable to load inventory." }, { status: 500 });
  }
}
