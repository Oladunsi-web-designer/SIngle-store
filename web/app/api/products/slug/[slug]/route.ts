import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { categories, products } from "@/lib/schema";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  try {
    const [product] = await db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        description: products.description,
        categoryId: products.categoryId,
        category: categories.name,
        categorySlug: categories.slug,
        price: products.price,
        originalPrice: products.originalPrice,
        stockQuantity: products.stockQuantity,
        imageUrl: products.imageUrl,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);

    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ product }, { headers: { "Cache-Control": "public, s-maxage=60" } });
  } catch (error) {
    console.error("Failed to load product detail.", error);
    return NextResponse.json({ error: "Unable to load the product." }, { status: 500 });
  }
}
