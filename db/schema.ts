import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  orderId: text("order_id").primaryKey(),
  submittedAt: text("submitted_at").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  location: text("location").notNull(),
  deliveryZone: text("delivery_zone", { enum: ["inside", "outside"] }).notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  pricePerPiece: integer("price_per_piece").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  totalPrice: integer("total_price").notNull(),
  paymentMethod: text("payment_method").notNull(),
  orderStatus: text("order_status").notNull(),
  notes: text("notes").notNull().default(""),
  savedAt: text("saved_at").notNull(),
});
