import { getDb } from "@/db";
import { orders } from "@/db/schema";
import type { ValidatedOrder } from "@/lib/order";

export async function saveOrder(order: ValidatedOrder) {
  const db = getDb();

  await db.insert(orders).values({
    ...order,
    savedAt: new Date().toISOString(),
  });
}
