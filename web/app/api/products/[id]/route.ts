import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { hasValidAdminOrigin, requireAdmin } from "@/lib/session";
import { productUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!hasValidAdminOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product update.", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const [updated] = await db
      .update(products)
      .set(parsed.data)
      .where(eq(products.id, id))
      .returning();
    if (!updated) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("Failed to update product.", error);
    return NextResponse.json(
      { error: "Unable to update the product. Check the category and price values." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!hasValidAdminOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });
  }

  try {
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });
    if (!deleted) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, id: deleted.id });
  } catch (error) {
    console.error("Failed to delete product.", error);
    return NextResponse.json(
      { error: "This product has order history and cannot be deleted. Mark it inactive instead." },
      { status: 409 },
    );
  }
}
