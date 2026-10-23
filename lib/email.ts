import nodemailer from "nodemailer";
import type { ValidatedOrder } from "@/lib/order";
import { formatNpr, getDeliveryLabel } from "@/lib/order";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] || character,
  );

function shell(content: string, preview: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f1eb;font-family:Arial,sans-serif;color:#1c1917"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1eb;padding:24px 10px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(28,25,23,.08)"><tr><td style="background:#100e0b;padding:28px 32px;text-align:center"><div style="color:#d8aa52;font-family:Georgia,serif;font-size:28px;letter-spacing:7px">NOIRÉ</div><div style="margin-top:6px;color:#9b8d79;font-size:11px;letter-spacing:3px">EAU DE PARFUM</div></td></tr><tr><td style="padding:34px 32px">${content}</td></tr><tr><td style="background:#181511;padding:20px 32px;text-align:center;color:#a89c8a;font-size:12px">NOIRÉ · Kathmandu, Nepal · Cash On Delivery</td></tr></table></td></tr></table></body></html>`;
}

function detailRow(label: string, value: string) {
  return `<tr><td style="padding:10px 0;color:#78716c;font-size:13px;border-bottom:1px solid #eee9df">${escapeHtml(label)}</td><td style="padding:10px 0;text-align:right;font-weight:700;font-size:13px;border-bottom:1px solid #eee9df">${escapeHtml(value)}</td></tr>`;
}

function businessEmail(order: ValidatedOrder) {
  return shell(
    `<div style="display:inline-block;padding:7px 12px;background:#fff4d8;color:#755315;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:1px">NEW ORDER</div><h1 style="margin:18px 0 6px;font-family:Georgia,serif;font-size:30px;font-weight:500">A new order has arrived.</h1><p style="margin:0 0 24px;color:#78716c;line-height:1.6">Order <strong>${escapeHtml(order.orderId)}</strong> was received on ${escapeHtml(order.submittedAt)}.</p><h2 style="margin:26px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:2px;color:#9a6d20">Customer details</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${detailRow("Name", order.customerName)}${detailRow("Phone", order.phone)}${detailRow("Email", order.email)}${detailRow("Location", `${order.location} · ${getDeliveryLabel(order.deliveryZone)}`)}</table><h2 style="margin:26px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:2px;color:#9a6d20">Order summary</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${detailRow("Product", `${order.productName} · 50 ml`)}${detailRow("Quantity", String(order.quantity))}${detailRow("Price per piece", formatNpr(order.pricePerPiece))}${detailRow("Delivery fee", formatNpr(order.deliveryFee))}${detailRow("Total", formatNpr(order.totalPrice))}${detailRow("Payment", order.paymentMethod)}${detailRow("Status", order.orderStatus)}</table><div style="margin-top:26px;padding:18px 20px;background:#181511;border-left:4px solid #d8aa52;border-radius:8px;color:#fff5de;font-weight:700;line-height:1.5">Please call the customer soon to confirm this order.</div>`,
    `New NOIRÉ order ${order.orderId}`,
  );
}

function customerEmail(order: ValidatedOrder, supportEmail: string) {
  return shell(
    `<div style="text-align:center"><div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:50%;background:#fff4d8;color:#93691f;font-size:25px">✓</div><h1 style="margin:18px 0 8px;font-family:Georgia,serif;font-size:30px;font-weight:500">Thank you for your order.</h1><p style="margin:0 auto 24px;max-width:460px;color:#78716c;line-height:1.7">Hi ${escapeHtml(order.customerName)}, we have received your order successfully.</p></div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px">${detailRow("Order ID", order.orderId)}${detailRow("Product", `${order.productName} · 50 ml`)}${detailRow("Quantity", String(order.quantity))}${detailRow("Delivery fee", formatNpr(order.deliveryFee))}${detailRow("Total price", formatNpr(order.totalPrice))}${detailRow("Payment method", order.paymentMethod)}</table><div style="margin-top:26px;padding:18px 20px;background:#faf7f0;border:1px solid #eadfc9;border-radius:10px;color:#4b453b;line-height:1.6">Our sales representative will call you soon to confirm your order.</div><p style="margin:24px 0 0;color:#78716c;font-size:13px;line-height:1.6">Need help? Reply to this email or contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#9a6d20">${escapeHtml(supportEmail)}</a>.<br><br>Thank you,<br><strong>NOIRÉ</strong></p>`,
    `Your NOIRÉ order ${order.orderId} has been received`,
  );
}

type EmailMessage = { to: string; subject: string; html: string; idempotencyKey: string };

export function canSendOrderEmails() {
  const hasRecipientAndSender = Boolean(
    process.env.BUSINESS_EMAIL && process.env.EMAIL_FROM,
  );
  return hasRecipientAndSender && Boolean(process.env.EMAIL_SERVICE_API_KEY);
}

async function sendWithResend(message: EmailMessage, from: string, replyTo: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_SERVICE_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": message.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      reply_to: replyTo,
      subject: message.subject,
      html: message.html,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("Resend email error:", response.status, detail);
    throw new Error(`Email provider rejected a message (${response.status}).`);
  }
}

async function sendWithSmtp(message: EmailMessage, from: string, replyTo: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass || !Number.isFinite(port)) {
    throw new Error("SMTP environment variables are incomplete.");
  }
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  await transporter.sendMail({
    from,
    to: message.to,
    replyTo,
    subject: message.subject,
    html: message.html,
  });
}

export async function sendOrderEmails(order: ValidatedOrder) {
  const businessEmailAddress = process.env.BUSINESS_EMAIL;
  const from = process.env.EMAIL_FROM;
  if (!businessEmailAddress || !from) {
    throw new Error("Business email environment variables are incomplete.");
  }
  const messages: EmailMessage[] = [
    {
      to: businessEmailAddress,
      subject: `New Product Order Received - ${order.orderId}`,
      html: businessEmail(order),
      idempotencyKey: `order-received/${order.orderId}`,
    },
    {
      to: order.email,
      subject: `Your Order Has Been Received - ${process.env.BRAND_NAME || "NOIRÉ"}`,
      html: customerEmail(order, businessEmailAddress),
      idempotencyKey: `order-confirmation/${order.orderId}`,
    },
  ];
  const sender = process.env.EMAIL_SERVICE_API_KEY
    ? (message: EmailMessage) => sendWithResend(message, from, businessEmailAddress)
    : (message: EmailMessage) => sendWithSmtp(message, from, businessEmailAddress);
  await Promise.all(messages.map(sender));
}
