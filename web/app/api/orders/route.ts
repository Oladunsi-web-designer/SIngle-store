import { and, asc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { orderItems, orders, products } from "@/lib/schema";
import { createOrderSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { items, ...customer } = parsed.data;
  const productIds = items.map((item) => item.productId);

  try {
    const created = await db.transaction(async (transaction) => {
      const availableProducts = await transaction
        .select()
        .from(products)
        .where(
          and(
            inArray(products.id, productIds),
            eq(products.isActive, true),
          ),
        )
        .orderBy(asc(products.id))
        .for("update");

      if (availableProducts.length !== items.length) {
        throw new OrderConflict("One or more products are unavailable.");
      }

      const byId = new Map(availableProducts.map((product) => [product.id, product]));
      const pricedItems = items.map((item) => {
        const product = byId.get(item.productId);
        if (!product || product.stockQuantity < item.quantity) {
          throw new OrderConflict(
            `Not enough stock available for ${product?.title ?? "a product"}.`,
          );
        }
        return { product, quantity: item.quantity };
      });

      const totalAmount = pricedItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
      if (!Number.isSafeInteger(totalAmount)) {
        throw new OrderConflict("The order total is too large.");
      }

      const [order] = await transaction
        .insert(orders)
        .values({
          customerName: customer.customerName,
          customerEmail: customer.customerEmail.toLowerCase(),
          customerPhone: customer.customerPhone,
          deliveryAddress: customer.deliveryAddress,
          state: customer.state,
          city: customer.city,
          totalAmount,
        })
        .returning({ id: orders.id });

      await transaction.insert(orderItems).values(
        pricedItems.map(({ product, quantity }) => ({
          orderId: order.id,
          productId: product.id,
          productTitle: product.title,
          quantity,
          unitPrice: product.price,
        })),
      );

      for (const { product, quantity } of pricedItems) {
        await transaction
          .update(products)
          .set({ stockQuantity: product.stockQuantity - quantity })
          .where(eq(products.id, product.id));
      }

      return { id: order.id, totalAmount };
    });

    return NextResponse.json(
      { orderId: created.id, totalAmount: created.totalAmount, status: "pending" },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof OrderConflict) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Failed to create order.", error);
    return NextResponse.json(
      { error: "Unable to place your order right now." },
      { status: 500 },
    );
  }
}

class OrderConflict extends Error {}
