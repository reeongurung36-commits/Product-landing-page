"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, LoaderCircle, LockKeyhole, Minus, Plus, ShieldCheck } from "lucide-react";
import { DELIVERY_FEES, formatNpr, PRODUCT, type DeliveryZone } from "@/lib/order";

type FormState = { customerName: string; phone: string; email: string; location: string; deliveryZone: DeliveryZone; website: string };
type Errors = Partial<Record<keyof FormState, string>>;

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const initialQuantity = Math.min(10, Math.max(1, Number(params.get("quantity")) || 1));
  const [quantity, setQuantity] = useState(initialQuantity);
  const [form, setForm] = useState<FormState>({ customerName: "", phone: "", email: "", location: "", deliveryZone: "inside", website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const deliveryFee = DELIVERY_FEES[form.deliveryZone];
  const total = useMemo(() => PRODUCT.offerPrice * quantity + deliveryFee, [quantity, deliveryFee]);

  const update = (field: keyof FormState, value: string) => {
    idempotencyKey.current = null;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next: Errors = {};
    if (form.customerName.trim().length < 2) next.customerName = "Please enter your full name.";
    if (!/^(?:\+?977[-\s]?)?(?:9[678]\d{8}|0?1[-\s]?\d{7})$/.test(form.phone.trim())) next.phone = "Enter a valid Nepal phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (form.location.trim().length < 5) next.location = "Kindly share your exact location.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    setApiError("");
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, productName: PRODUCT.name, quantity, idempotencyKey: idempotencyKey.current }),
      });
      const data = (await response.json()) as { error?: string; order?: { orderId: string; productName: string; quantity: number; totalPrice: number } };
      if (!response.ok || !data.order) throw new Error(data.error || "We could not submit your order. Please try again.");
      const next = new URLSearchParams({ orderId: data.order.orderId, product: data.order.productName, quantity: String(data.order.quantity), total: String(data.order.totalPrice) });
      router.push(`/thank-you?${next.toString()}`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "We could not submit your order. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink text-ivory">
      <header className="border-b border-white/10"><div className="site-shell flex h-20 items-center justify-between"><Link href="/" className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ivory/55 transition hover:text-gold"><ArrowLeft size={16} /> Back to shop</Link><Link href="/" className="font-display text-xl tracking-[0.34em] text-gold">NOIRÉ</Link><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-ivory/38"><LockKeyhole size={14} /> Secure order</div></div></header>
      <div className="site-shell grid gap-12 py-12 lg:grid-cols-[1.05fr_.75fr] lg:gap-20 lg:py-20">
        <section>
          <div className="eyebrow">Cash On Delivery</div><h1 className="mt-5 font-display text-5xl leading-none tracking-[-.035em] sm:text-6xl">Complete your <span className="italic text-gold">order.</span></h1><p className="mt-5 max-w-xl text-sm leading-7 text-ivory/48">No online payment is required. Enter your details below and our representative will call to confirm your order.</p>
          <form onSubmit={submitOrder} noValidate className="mt-10 space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label><span className="form-label">Full name</span><input className="form-input" value={form.customerName} onChange={(e) => update("customerName", e.target.value)} placeholder="Your full name" autoComplete="name" aria-invalid={Boolean(errors.customerName)} />{errors.customerName && <p className="form-error">{errors.customerName}</p>}</label>
              <label><span className="form-label">Phone number</span><input className="form-input" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="98XXXXXXXX" inputMode="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />{errors.phone && <p className="form-error">{errors.phone}</p>}</label>
            </div>
            <label className="block"><span className="form-label">Email address</span><input className="form-input" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} />{errors.email && <p className="form-error">{errors.email}</p>}</label>
            <label className="block"><span className="form-label">Delivery address</span><textarea className="form-input min-h-28 resize-y" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Kindly share your exact location" autoComplete="street-address" aria-invalid={Boolean(errors.location)} />{errors.location && <p className="form-error">{errors.location}</p>}</label>
            <label className="block"><span className="form-label">Delivery area</span><select className="form-input appearance-none" value={form.deliveryZone} onChange={(e) => update("deliveryZone", e.target.value)}><option value="inside" className="bg-[#15120e]">Inside Kathmandu Valley — {formatNpr(150)}</option><option value="outside" className="bg-[#15120e]">Outside Kathmandu Valley — {formatNpr(200)}</option></select></label>
            <label className="absolute -left-[9999px]" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} /></label>
            {apiError && <div role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm leading-6 text-red-200">{apiError}</div>}
            <button type="submit" disabled={submitting} className="gold-button w-full disabled:cursor-not-allowed disabled:opacity-65">{submitting ? <><LoaderCircle className="animate-spin" size={18} /> Submitting order...</> : <>Order now · {formatNpr(total)} <ShieldCheck size={18} /></>}</button>
            <p className="flex items-center justify-center gap-2 text-center text-[11px] text-ivory/35"><LockKeyhole size={13} /> Your information is used only to process this order.</p>
          </form>
        </section>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#100d0a]"><div className="relative aspect-[16/10]"><Image src="/images/noire-hero.png" alt="NOIRÉ Eau de Parfum" fill className="object-cover" sizes="(max-width:1024px) 100vw, 38vw" /><div className="absolute inset-0 bg-gradient-to-t from-[#100d0a] via-transparent to-transparent" /></div><div className="p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="font-display text-2xl">NOIRÉ</p><p className="mt-1 text-xs text-ivory/38">Eau de Parfum · 50 ml</p></div><span className="rounded-full border border-gold/20 bg-gold/[.06] px-3 py-1 text-[10px] uppercase tracking-[.16em] text-gold">COD</span></div>
            <div className="my-6 h-px bg-white/10" /><div className="flex items-center justify-between"><span className="text-xs uppercase tracking-[.14em] text-ivory/40">Quantity</span><div className="flex items-center rounded-full border border-white/15 p-1"><button type="button" className="quantity-button" onClick={() => { idempotencyKey.current = null; setQuantity((value) => Math.max(1, value - 1)); }} aria-label="Decrease quantity"><Minus size={14} /></button><output className="w-10 text-center text-sm">{quantity}</output><button type="button" className="quantity-button" onClick={() => { idempotencyKey.current = null; setQuantity((value) => Math.min(10, value + 1)); }} aria-label="Increase quantity"><Plus size={14} /></button></div></div>
            <dl className="mt-7 space-y-3 text-sm"><div className="flex justify-between text-ivory/48"><dt>Price per piece</dt><dd>{formatNpr(PRODUCT.offerPrice)}</dd></div><div className="flex justify-between text-ivory/48"><dt>Product subtotal</dt><dd>{formatNpr(PRODUCT.offerPrice * quantity)}</dd></div><div className="flex justify-between text-ivory/48"><dt>Delivery</dt><dd>{formatNpr(deliveryFee)}</dd></div><div className="h-px bg-white/10" /><div className="flex items-baseline justify-between"><dt className="text-xs uppercase tracking-[.16em] text-ivory/55">Total</dt><dd className="font-display text-3xl text-gold">{formatNpr(total)}</dd></div></dl>
            <div className="mt-7 space-y-3 rounded-xl border border-white/8 bg-white/[.025] p-4">{["Pay only when delivered", "Order confirmation by phone", "Email receipt after submission"].map((item) => <p key={item} className="flex items-center gap-3 text-xs text-ivory/48"><Check size={14} className="text-gold" />{item}</p>)}</div>
          </div></div>
        </aside>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-ink text-gold"><LoaderCircle className="animate-spin" /></main>}><CheckoutContent /></Suspense>;
}
