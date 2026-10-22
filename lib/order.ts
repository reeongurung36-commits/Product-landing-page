export const PRODUCT = {
  name: "NOIRÉ",
  size: "50 ml",
  regularPrice: 4999,
  offerPrice: 3499,
  currency: "NPR",
} as const;

export const DELIVERY_FEES = {
  inside: 150,
  outside: 200,
} as const;

export type DeliveryZone = keyof typeof DELIVERY_FEES;

export type ValidatedOrder = {
  orderId: string;
  submittedAt: string;
  customerName: string;
  phone: string;
  email: string;
  location: string;
  deliveryZone: DeliveryZone;
  productName: typeof PRODUCT.name;
  quantity: number;
  pricePerPiece: number;
  deliveryFee: number;
  totalPrice: number;
  paymentMethod: "Cash On Delivery";
  orderStatus: "New Order";
  notes: string;
};

export function formatNpr(amount: number) {
  return `NPR ${new Intl.NumberFormat("en-NP").format(amount)}`;
}

export function getDeliveryLabel(zone: DeliveryZone) {
  return zone === "inside"
    ? "Inside Kathmandu Valley"
    : "Outside Kathmandu Valley";
}

export function createOrderId() {
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((item) => item.type === type)?.value ?? "";
  const date = `${part("year")}${part("month")}${part("day")}`;
  return `NOIRE-${date}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
