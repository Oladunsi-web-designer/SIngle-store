import { and, asc, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { categories, products } from "@/lib/schema";
import { hasValidAdminOrigin, requireAdmin } from "@/lib/session";
import { productInputSchema, productQuerySchema } from "@/lib/validation";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown database error.";
}

export async function GET(request: NextRequest) {
  const parsed = productQuerySchema.safeParse({
    category: request.nextUrl.searchParams.get("category") ?? undefined,
    q: request.nextUrl.searchParams.get("q") ?? undefined,
    sort: request.nextUrl.searchParams.get("sort") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product query.", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  const { category, q, sort, limit } = parsed.data;
  const filters: SQL[] = [eq(products.isActive, true)];
  if (category) filters.push(eq(categories.slug, category));
  if (q) {
    const pattern = `%${q}%`;
    const search = or(ilike(products.title, pattern), ilike(products.description, pattern));
    if (search) filters.push(search);
  }

  const orderBy: SQL[] = {
    featured: [desc(products.isFeatured), desc(products.createdAt)],
    "price-asc": [asc(products.price)],
    "price-desc": [desc(products.price)],
    newest: [desc(products.createdAt)],
  }[sort];

  try {
    const result = await db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        description: products.description,
        categoryId: products.categoryId,
        category: categories.name,
        categorySlug: categories.slug,
        categoryImageUrl: categories.imageUrl,
        price: products.price,
        originalPrice: products.originalPrice,
        stockQuantity: products.stockQuantity,
        imageUrl: products.imageUrl,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...filters))
      .orderBy(...orderBy)
      .limit(limit);

    return NextResponse.json(
      { products: result },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load products.", error);
    return NextResponse.json(
      { error: "Unable to load products right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!hasValidAdminOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product.", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const [product] = await db.insert(products).values(parsed.data).returning();
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product.", error);
    return NextResponse.json(
      {
        error: getErrorMessage(error).includes("products_slug_unique")
          ? "A product with that slug already exists."
          : getErrorMessage(error).includes("products_category_id")
            ? "Select an existing category."
            : "Unable to create the product.",
      },
      { status: getErrorMessage(error).includes("products_slug_unique") ? 409 : 400 },
    );
  }
}
