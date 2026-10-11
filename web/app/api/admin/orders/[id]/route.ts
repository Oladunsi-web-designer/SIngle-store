import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { orders } from "@/lib/schema";
import { hasValidAdminOrigin, requireAdmin } from "@/lib/session";
import { orderStatusSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasValidAdminOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  }

  try {
    const [order] = await db
      .update(orders)
      .set({ status: parsed.data.status })
      .where(eq(orders.id, id))
      .returning({ id: orders.id, status: orders.status });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Failed to update order status.", error);
    return NextResponse.json({ error: "Unable to update order status." }, { status: 500 });
  }
}
