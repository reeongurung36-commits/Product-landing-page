import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canSendOrderEmails, sendOrderEmails } from "@/lib/email";
import {
  appendOrderToGoogleSheet,
  canSyncOrdersToGoogleSheet,
} from "@/lib/google-sheets";
import {
  createOrderId,
  DELIVERY_FEES,
  PRODUCT,
  type ValidatedOrder,
} from "@/lib/order";
import { saveOrder } from "@/lib/order-storage";

export const dynamic = "force-dynamic";

const orderSchema = z.object({
  customerName: z.string({ required_error: "Name is required." }).trim().min(2, "Please enter your full name.").max(100),
  phone: z
    .string({ required_error: "Phone number is required." })
    .trim()
    .regex(/^(?:\+?977[-\s]?)?(?:9[678]\d{8}|0?1[-\s]?\d{7})$/, "Enter a valid Nepal phone number."),
  email: z.string({ required_error: "Email address is required." }).trim().email("Enter a valid email address.").max(160),
  location: z.string({ required_error: "Location is required." }).trim().min(5, "Please share your exact location.").max(300),
  deliveryZone: z.enum(["inside", "outside"], { required_error: "Delivery area is required." }),
  productName: z.string({ required_error: "Product name is required." }).refine((value) => value === PRODUCT.name, "Product name is invalid."),
  quantity: z.preprocess(
    (value) => (value === undefined || value === "" ? Number.NaN : Number(value)),
    z.number({ invalid_type_error: "Quantity is required." }).int().min(1).max(10),
  ),
  website: z.string().max(0).optional(),
});

function originAllowed(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const configuredOrigin = process.env.FRONTEND_URL?.replace(/\/$/, "");
  return origin === request.nextUrl.origin || origin === configuredOrigin;
}

export async function POST(request: NextRequest) {
  if (!originAllowed(request)) {
    return NextResponse.json({ error: "This order origin is not allowed." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "The order request is not valid JSON." }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || "Please check your order details.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const deliveryFee = DELIVERY_FEES[parsed.data.deliveryZone];
  const totalPrice = PRODUCT.offerPrice * parsed.data.quantity + deliveryFee;
  const order: ValidatedOrder = {
    orderId: createOrderId(),
    submittedAt: new Intl.DateTimeFormat("en-NP", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kathmandu",
    }).format(new Date()),
    customerName: parsed.data.customerName,
    phone: parsed.data.phone,
    email: parsed.data.email,
    location: parsed.data.location,
    deliveryZone: parsed.data.deliveryZone,
    productName: PRODUCT.name,
    quantity: parsed.data.quantity,
    pricePerPiece: PRODUCT.offerPrice,
    deliveryFee,
    totalPrice,
    paymentMethod: "Cash On Delivery",
    orderStatus: "New Order",
    notes: "",
  };

  try {
    await saveOrder(order);
  } catch (error) {
    console.error("Order database submission failed:", error);
    return NextResponse.json(
      { error: "We could not save your order. Please try again shortly." },
      { status: 503 },
    );
  }

  const followUpTasks: Promise<unknown>[] = [];
  if (canSyncOrdersToGoogleSheet()) {
    followUpTasks.push(appendOrderToGoogleSheet(order));
  }
  if (canSendOrderEmails()) {
    followUpTasks.push(sendOrderEmails(order));
  }

  const followUpResults = await Promise.allSettled(followUpTasks);
  for (const result of followUpResults) {
    if (result.status === "rejected") {
      console.error(`Optional follow-up for order ${order.orderId} failed:`, result.reason);
    }
  }

  return NextResponse.json({
    success: true,
    order: {
      orderId: order.orderId,
      productName: order.productName,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
    },
  });
}
