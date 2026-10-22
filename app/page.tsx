"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Gem,
  Headphones,
  Minus,
  PackageCheck,
  Plus,
  Quote,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { formatNpr, PRODUCT } from "@/lib/order";

const gallery = [
  { src: "/images/noire-hero.png", alt: "NOIRÉ perfume in warm golden light" },
  { src: "/images/noire-pedestal.png", alt: "NOIRÉ perfume on a black pedestal" },
  { src: "/images/noire-notes.png", alt: "NOIRÉ perfume with bergamot and sandalwood" },
  { src: "/images/noire-stone.png", alt: "NOIRÉ perfume on black stone" },
];

const benefits = [
  { icon: Sparkles, number: "01", title: "Signature scent", text: "A warm, woody composition designed to feel distinctive without trying too hard." },
  { icon: Gem, number: "02", title: "Everyday luxury", text: "An elegant finishing touch for workdays, evenings, and the moments in between." },
  { icon: PackageCheck, number: "03", title: "Statement design", text: "Smoked black glass and a brushed gold cap make it worthy of being displayed." },
];

const sampleReviews = [
  { name: "Aayush Shrestha", city: "Lalitpur", text: "The warm woody profile feels polished and easy to wear. The bottle looks especially premium on the dresser." },
  { name: "Prakriti Gurung", city: "Pokhara", text: "Bergamot gives it a bright opening, while the amber and sandalwood keep it smooth and refined." },
  { name: "Nabin Karki", city: "Kathmandu", text: "A thoughtful gift presentation and a distinctive scent profile. The black-and-gold design really stands out." },
];

const faqs = [
  { question: "What does NOIRÉ smell like?", answer: "NOIRÉ opens with bright bergamot, settles into warm amber, and finishes with smooth sandalwood for a refined woody character." },
  { question: "What size is the bottle?", answer: "Each NOIRÉ Eau de Parfum bottle contains 50 ml." },
  { question: "How does Cash On Delivery work?", answer: "Place your order through the checkout form. A sales representative will call to confirm it, and you pay when the order is delivered." },
  { question: "How much is delivery?", answer: "Delivery is NPR 150 inside Kathmandu Valley and NPR 200 outside the valley. The correct fee is added automatically at checkout." },
  { question: "When will my order arrive?", answer: "Our representative will confirm the expected delivery window for your exact location during the confirmation call." },
  { question: "Can I order more than one bottle?", answer: "Yes. Select your quantity on this page or at checkout; the product total updates automatically." },
  { question: "What if I need help with my order?", answer: "Reply to your order confirmation email or contact reeongurun36@gmail.com and include your order ID." },
];

function OrderLink({ quantity, children, className = "" }: { quantity: number; children: React.ReactNode; className?: string }) {
  const checkoutUrl = `/checkout?product=${encodeURIComponent(PRODUCT.name)}&quantity=${quantity}&price=${PRODUCT.offerPrice}`;
  return (
    <a href={checkoutUrl} className={`gold-button ${className}`}>
      {children}<ArrowRight aria-hidden="true" size={18} />
    </a>
  );
}

export default function Home() {
  const [quantity, setQuantity] = useState(1);
  const [slide, setSlide] = useState(0);
  const productTotal = useMemo(() => PRODUCT.offerPrice * quantity, [quantity]);
  const changeSlide = (direction: number) => setSlide((current) => (current + direction + gallery.length) % gallery.length);

  return (
    <main className="min-h-screen overflow-hidden bg-ink text-ivory">
      <header className="absolute inset-x-0 top-0 z-40 border-b border-white/10">
        <div className="site-shell flex h-20 items-center justify-between">
          <Link href="/" className="font-display text-xl tracking-[0.34em] text-gold" aria-label="NOIRÉ home">NOIRÉ</Link>
          <nav className="hidden items-center gap-9 text-xs uppercase tracking-[0.18em] text-ivory/60 md:flex" aria-label="Primary navigation">
            <a href="#story" className="transition hover:text-gold">The scent</a><a href="#reviews" className="transition hover:text-gold">Reviews</a><a href="#faq" className="transition hover:text-gold">FAQ</a><Link href="/checkout" className="text-gold transition hover:text-[#f1d58b]">Checkout</Link>
          </nav>
          <OrderLink quantity={1} className="!min-h-10 !px-5 !py-2 text-xs">Checkout</OrderLink>
        </div>
      </header>

      <section className="relative min-h-[92svh] overflow-hidden border-b border-white/10">
        <Image src="/images/noire-hero.png" alt="NOIRÉ Eau de Parfum in a smoked-glass bottle" fill priority className="object-cover object-[62%_center] md:object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,7,6,.98)_0%,rgba(8,7,6,.86)_38%,rgba(8,7,6,.2)_72%,rgba(8,7,6,.5)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
        <div className="site-shell relative z-10 flex min-h-[92svh] items-center pt-28">
          <div className="max-w-2xl animate-rise">
            <div className="eyebrow mb-6">Eau de Parfum · 50 ml</div>
            <h1 className="font-display text-[clamp(3.25rem,16vw,10.5rem)] leading-[0.8] tracking-[-0.045em]">Leave an<span className="block italic text-gold">impression.</span></h1>
            <p className="mt-8 max-w-lg text-base leading-7 text-ivory/66 sm:text-lg">Bright bergamot. Warm amber. Smooth sandalwood. NOIRÉ is a confident woody signature housed in smoked glass and gold.</p>
            <div className="mt-9 flex flex-wrap items-center gap-5"><OrderLink quantity={1}>Purchase now</OrderLink><a href="#story" className="text-link">Discover the scent <span aria-hidden="true">↓</span></a></div>
            <div className="mt-9 flex items-baseline gap-3"><span className="font-display text-3xl text-gold">{formatNpr(PRODUCT.offerPrice)}</span><span className="text-sm text-ivory/40 line-through">{formatNpr(PRODUCT.regularPrice)}</span></div>
          </div>
        </div>
        <div className="absolute bottom-9 right-6 z-10 hidden items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-ivory/45 lg:flex xl:right-12"><span className="h-px w-20 bg-gold/50" /> Crafted for presence</div>
      </section>

      <section className="border-b border-white/10 bg-[#0d0b09]">
        <div className="site-shell grid grid-cols-2 divide-x divide-y divide-white/10 lg:grid-cols-4 lg:divide-y-0">
          {[[ShieldCheck, "Cash on delivery", "Pay when it arrives"], [Truck, "Delivery across Nepal", "NPR 150 / 200"], [Headphones, "Human confirmation", "We call before dispatch"], [PackageCheck, "Simple ordering", "A secure, guided checkout"]].map(([Icon, title, subtitle]) => {
            const TrustIcon = Icon as typeof ShieldCheck;
            return <div key={String(title)} className="flex min-h-32 items-center gap-4 px-3 py-6 sm:px-7"><TrustIcon className="shrink-0 text-gold" size={22} strokeWidth={1.4} /><div><p className="text-sm text-ivory/90">{String(title)}</p><p className="mt-1 text-xs text-ivory/40">{String(subtitle)}</p></div></div>;
          })}
        </div>
      </section>

      <section id="story" className="section-space bg-ink">
        <div className="site-shell grid items-start gap-14 lg:grid-cols-[1.1fr_.9fr] lg:gap-20">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-[#120f0c]">
            <div className="flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${slide * 100}%)` }}>
              {gallery.map((image) => <div key={image.src} className="relative h-full w-full shrink-0"><Image src={image.src} alt={image.alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" /></div>)}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent p-5 pt-24 sm:p-8">
              <div className="flex gap-2" aria-label="Product image selector">{gallery.map((image, index) => <button key={image.src} type="button" onClick={() => setSlide(index)} aria-label={`Show product image ${index + 1}`} aria-current={slide === index} className={`h-1 rounded-full transition-all ${slide === index ? "w-9 bg-gold" : "w-4 bg-white/40 hover:bg-white/70"}`} />)}</div>
              <div className="flex gap-2"><button type="button" onClick={() => changeSlide(-1)} className="icon-button" aria-label="Previous product image"><ChevronLeft size={18} /></button><button type="button" onClick={() => changeSlide(1)} className="icon-button" aria-label="Next product image"><ChevronRight size={18} /></button></div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:pt-8">
            <div className="eyebrow">The signature</div><h2 className="section-title mt-5">NOIRÉ</h2><p className="mt-3 font-display text-2xl italic text-gold">Eau de Parfum · 50 ml</p>
            <p className="mt-7 max-w-lg leading-8 text-ivory/58">NOIRÉ blends bright bergamot, warm amber, and smooth sandalwood in an elegant smoked-glass bottle—a composed scent for an assured presence.</p>
            <ul className="mt-8 space-y-4">{["Warm, woody, and distinctive", "A refined touch for the everyday", "Smoked glass with a brushed-gold finish"].map((item) => <li key={item} className="flex items-center gap-3 text-sm text-ivory/80"><span className="grid h-6 w-6 place-items-center rounded-full bg-gold/12 text-gold"><Check size={13} /></span>{item}</li>)}</ul>
            <div className="my-8 h-px bg-white/10" />
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div><p className="text-xs uppercase tracking-[0.2em] text-ivory/38">Special offer</p><div className="mt-2 flex items-baseline gap-3"><span className="font-display text-4xl text-gold">{formatNpr(PRODUCT.offerPrice)}</span><span className="text-sm text-ivory/35 line-through">{formatNpr(PRODUCT.regularPrice)}</span></div></div>
              <div><p className="mb-2 text-xs uppercase tracking-[0.18em] text-ivory/40">Quantity</p><div className="flex items-center rounded-full border border-white/15 p-1"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="quantity-button" aria-label="Decrease quantity"><Minus size={15} /></button><output className="w-10 text-center text-sm" aria-live="polite">{quantity}</output><button type="button" onClick={() => setQuantity((value) => Math.min(10, value + 1))} className="quantity-button" aria-label="Increase quantity"><Plus size={15} /></button></div></div>
            </div>
            <div className="mt-7 rounded-2xl border border-gold/20 bg-gold/[0.055] p-5"><div className="flex justify-between text-sm text-ivory/55"><span>{quantity} × {formatNpr(PRODUCT.offerPrice)}</span><span>50 ml each</span></div><div className="mt-3 flex items-baseline justify-between"><span className="text-xs uppercase tracking-[0.2em] text-ivory/45">Product total</span><span className="font-display text-3xl text-gold">{formatNpr(productTotal)}</span></div><p className="mt-2 text-right text-[11px] text-ivory/35">Delivery fee added at checkout.</p></div>
            <OrderLink quantity={quantity} className="mt-5 w-full justify-center">Continue to checkout</OrderLink><p className="mt-4 text-center text-xs text-ivory/35">No online payment required · Cash On Delivery</p>
          </div>
        </div>
      </section>

      <section className="section-space border-y border-white/10 bg-[#100d0a]">
        <div className="site-shell grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div><div className="eyebrow">The composition</div><h2 className="section-title mt-5">Three notes.<br /><span className="italic text-gold">One presence.</span></h2></div>
          <div className="grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 sm:grid-cols-3">
            {[["01", "Bergamot", "A bright, crisp opening."], ["02", "Amber", "A warm, glowing heart."], ["03", "Sandalwood", "A smooth, woody finish."]].map(([number, note, text], index) => <div key={note} className="relative min-h-64 bg-[#12100d] p-8 transition-colors hover:bg-[#18130e]"><span className="text-xs tracking-[0.2em] text-gold/55">{number}</span><div className={`mx-auto my-8 h-14 w-14 rounded-full ${index === 0 ? "bg-[#d2b05b]" : index === 1 ? "bg-[#9b5d27]" : "bg-[#58432e]"} shadow-[0_0_50px_rgba(206,153,61,.2)]`} /><h3 className="font-display text-2xl">{note}</h3><p className="mt-2 text-sm leading-6 text-ivory/45">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="section-space bg-ink">
        <div className="site-shell">
          <div className="max-w-2xl"><div className="eyebrow">Why NOIRÉ</div><h2 className="section-title mt-5">Luxury made <span className="italic text-gold">personal.</span></h2></div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">{benefits.map(({ icon: Icon, number, title, text }) => <article key={title} className="benefit-card"><div className="flex items-center justify-between"><Icon size={28} strokeWidth={1.25} className="text-gold" /><span className="font-display text-5xl text-white/[0.055]">{number}</span></div><h3 className="mt-12 font-display text-2xl">{title}</h3><p className="mt-3 text-sm leading-7 text-ivory/48">{text}</p></article>)}</div>
          <div className="mt-10 text-center"><OrderLink quantity={quantity}>Order your bottle</OrderLink></div>
        </div>
      </section>

      <section id="reviews" className="section-space border-y border-white/10 bg-[#0f0c09]">
        <div className="site-shell">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="eyebrow">Sample customer stories</div><h2 className="section-title mt-5">An impression,<br /><span className="italic text-gold">remembered.</span></h2></div><span className="w-fit rounded-full border border-gold/25 bg-gold/[0.06] px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-gold">Sample content · replace with verified reviews</span></div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">{sampleReviews.map((review) => <figure key={review.name} className="rounded-[1.6rem] border border-white/10 bg-white/[0.025] p-7"><Quote className="text-gold/70" size={24} strokeWidth={1.3} /><blockquote className="mt-7 font-display text-xl leading-8 text-ivory/84">“{review.text}”</blockquote><figcaption className="mt-8 border-t border-white/10 pt-5"><p className="text-sm text-gold">{review.name}</p><p className="mt-1 text-xs text-ivory/35">{review.city} · Sample review</p></figcaption></figure>)}</div>
        </div>
      </section>

      <section id="faq" className="section-space bg-ink">
        <div className="site-shell grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24">
          <div><div className="eyebrow">Good to know</div><h2 className="section-title mt-5">Questions,<br /><span className="italic text-gold">answered.</span></h2><p className="mt-6 max-w-sm text-sm leading-7 text-ivory/45">Still unsure? Email us at <a className="text-gold hover:underline" href="mailto:reeongurun36@gmail.com">reeongurun36@gmail.com</a>.</p></div>
          <div className="divide-y divide-white/10 border-y border-white/10">{faqs.map((faq, index) => <details key={faq.question} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left"><span className="flex items-center gap-4"><span className="text-xs text-gold/60">{String(index + 1).padStart(2, "0")}</span><span className="font-display text-xl">{faq.question}</span></span><Plus className="shrink-0 text-gold transition-transform group-open:rotate-45" size={19} /></summary><p className="ml-10 max-w-2xl pt-4 text-sm leading-7 text-ivory/48">{faq.answer}</p></details>)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10 py-24 sm:py-32">
        <Image src="/images/noire-stone.png" alt="" fill className="object-cover object-center opacity-35" sizes="100vw" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,7,6,.98),rgba(8,7,6,.78),rgba(8,7,6,.9))]" />
        <div className="site-shell relative z-10 text-center"><div className="eyebrow">Your signature awaits</div><h2 className="mx-auto mt-6 max-w-4xl font-display text-[clamp(3.2rem,8vw,7.5rem)] leading-[.92] tracking-[-.04em]">Make your presence<br /><span className="italic text-gold">unmistakable.</span></h2><p className="mx-auto mt-7 max-w-lg text-sm leading-7 text-ivory/55">NOIRÉ Eau de Parfum · 50 ml · Cash On Delivery available across Nepal.</p><OrderLink quantity={quantity} className="mt-9">Proceed to checkout</OrderLink></div>
      </section>

      <footer className="border-t border-white/10 bg-[#090806] pb-24 pt-12 md:pb-12"><div className="site-shell flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><div className="font-display text-2xl tracking-[0.3em] text-gold">NOIRÉ</div><p className="mt-3 text-xs text-ivory/35">Eau de Parfum · Kathmandu, Nepal</p><Link href="/checkout" className="mt-4 inline-block text-xs uppercase tracking-[.16em] text-gold hover:underline">Go to checkout →</Link></div><div className="text-left text-xs leading-6 text-ivory/35 md:text-right"><a className="transition hover:text-gold" href="mailto:reeongurun36@gmail.com">reeongurun36@gmail.com</a><p>© {new Date().getFullYear()} NOIRÉ. All rights reserved.</p></div></div></footer>
      <div className="fixed inset-x-4 bottom-4 z-50 md:hidden"><OrderLink quantity={quantity} className="w-full justify-center shadow-[0_14px_50px_rgba(0,0,0,.55)]">Checkout · {formatNpr(productTotal)}</OrderLink></div>
    </main>
  );
}
