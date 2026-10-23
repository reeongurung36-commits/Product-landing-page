import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ValidatedOrder } from "@/lib/order";

export async function findOrderByIdempotencyKey(idempotencyKey: string) {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.idempotencyKey, idempotencyKey))
    .limit(1);

  return order ?? null;
}

export async function saveOrder(order: ValidatedOrder, idempotencyKey: string) {
  const db = getDb();

  await db.insert(orders).values({
    ...order,
    idempotencyKey,
    savedAt: new Date().toISOString(),
  });
}
