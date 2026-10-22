"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Mail, Phone, ShieldCheck } from "lucide-react";
import { formatNpr, PRODUCT } from "@/lib/order";

function ThankYouContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId") || "Confirmation pending";
  const product = params.get("product") || PRODUCT.name;
  const quantity = Math.max(1, Number(params.get("quantity")) || 1);
  const total = Math.max(0, Number(params.get("total")) || PRODUCT.offerPrice + 150);
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ink px-4 py-16 text-ivory">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-gold/[.08] blur-[120px]" />
      <div className="relative w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#100d0a]/90 p-6 text-center shadow-2xl backdrop-blur sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/30 bg-gold/10 text-gold"><Check size={30} strokeWidth={1.5} /></div>
        <div className="eyebrow mt-8">Order received</div><h1 className="mt-4 font-display text-5xl leading-[.95] tracking-[-.04em] sm:text-6xl">Thank you for<br /><span className="italic text-gold">your order!</span></h1><p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-ivory/50">Our sales representative will call you soon to confirm your order.</p>
        <div className="mt-9 rounded-2xl border border-white/10 bg-black/20 p-5 text-left sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5"><div><p className="text-[10px] uppercase tracking-[.18em] text-ivory/35">Order ID</p><p className="mt-1 text-sm text-gold">{orderId}</p></div><span className="rounded-full border border-gold/25 bg-gold/[.06] px-3 py-1 text-[10px] uppercase tracking-[.16em] text-gold">New Order</span></div><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-ivory/40">Product ordered</dt><dd>{product} · 50 ml</dd></div><div className="flex justify-between"><dt className="text-ivory/40">Quantity</dt><dd>{quantity}</dd></div><div className="flex justify-between"><dt className="text-ivory/40">Total price</dt><dd className="text-gold">{formatNpr(total)}</dd></div><div className="flex justify-between gap-4"><dt className="text-ivory/40">Payment method</dt><dd>Cash On Delivery</dd></div></dl></div>
        <div className="mt-6 grid gap-3 text-left sm:grid-cols-2"><div className="flex items-center gap-3 rounded-xl border border-white/8 p-4"><Phone size={17} className="text-gold" /><p className="text-xs leading-5 text-ivory/48">Keep your phone nearby for our confirmation call.</p></div><div className="flex items-center gap-3 rounded-xl border border-white/8 p-4"><Mail size={17} className="text-gold" /><p className="text-xs leading-5 text-ivory/48">Save this confirmation and order ID for your records.</p></div></div>
        <Link href="/" className="gold-button mt-8">Back to home <ArrowRight size={18} /></Link><p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-ivory/30"><ShieldCheck size={13} /> Cash On Delivery · NOIRÉ Nepal</p>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return <Suspense fallback={<main className="min-h-screen bg-ink" />}><ThankYouContent /></Suspense>;
}
