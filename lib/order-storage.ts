import { eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import {
  appendOrderToGoogleSheet,
  findOrderInGoogleSheet,
} from "@/lib/google-sheets";
import type { ValidatedOrder } from "@/lib/order";

async function getCloudflareDb() {
  const isVercelRuntime = Boolean(
    process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.VERCEL_URL ||
      process.env.NOW_REGION,
  );
  if (isVercelRuntime) return null;

  const { getDb } = await import("@/db");
  return getDb();
}

export async function findOrderByIdempotencyKey(idempotencyKey: string) {
  const db = await getCloudflareDb();
  if (!db) return findOrderInGoogleSheet(idempotencyKey);

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.idempotencyKey, idempotencyKey))
    .limit(1);

  return order ?? null;
}

export async function saveOrder(order: ValidatedOrder, idempotencyKey: string) {
  const db = await getCloudflareDb();
  if (!db) {
    await appendOrderToGoogleSheet(order, idempotencyKey);
    return { googleSheetsPersisted: true };
  }

  await db.insert(orders).values({
    ...order,
    idempotencyKey,
    savedAt: new Date().toISOString(),
  });

  return { googleSheetsPersisted: false };
}
