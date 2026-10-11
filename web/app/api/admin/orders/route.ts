import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  }

  try {
    const result = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        deliveryAddress: orders.deliveryAddress,
        state: orders.state,
        city: orders.city,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        itemId: orderItems.id,
        productTitle: orderItems.productTitle,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .orderBy(desc(orders.createdAt));

    type GroupedOrder = {
      id: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      deliveryAddress: string;
      state: string;
      city: string;
      totalAmount: number;
      status: "pending" | "confirmed" | "delivered";
      createdAt: Date;
      items: Array<{ title: string; quantity: number; unitPrice: number }>;
    };
    const grouped = new Map<string, GroupedOrder>();
    for (const row of result) {
      let order = grouped.get(row.id);
      if (!order) {
        order = {
          id: row.id,
          customerName: row.customerName,
          customerEmail: row.customerEmail,
          customerPhone: row.customerPhone,
          deliveryAddress: row.deliveryAddress,
          state: row.state,
          city: row.city,
          totalAmount: row.totalAmount,
          status: row.status,
          createdAt: row.createdAt,
          items: [],
        };
        grouped.set(row.id, order);
      }
      if (row.itemId) {
        order.items.push({
          title: row.productTitle ?? "Product",
          quantity: row.quantity ?? 0,
          unitPrice: row.unitPrice ?? 0,
        });
      }
    }

    return NextResponse.json(
      { orders: [...grouped.values()] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load admin orders.", error);
    return NextResponse.json({ error: "Unable to load orders." }, { status: 500 });
  }
}
