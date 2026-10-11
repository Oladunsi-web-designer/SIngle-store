import { asc } from "drizzle-orm";
import { connection, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { categories } from "@/lib/schema";

export async function GET() {
  await connection();
  try {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        imageUrl: categories.imageUrl,
      })
      .from(categories)
      .orderBy(asc(categories.name));
    return NextResponse.json(
      { categories: result },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } },
    );
  } catch (error) {
    console.error("Failed to load categories.", error);
    return NextResponse.json({ error: "Unable to load categories." }, { status: 500 });
  }
}
