"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, ShieldCheck, Truck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { nigerianStates } from "@/lib/nigeria";

type CheckoutFields = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  state: string;
  city: string;
};

const initialFields: CheckoutFields = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  deliveryAddress: "",
  state: "",
  city: "",
};

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const [fields, setFields] = useState(initialFields);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          items: items.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      });
      const result = (await response.json()) as { orderId?: string; error?: string };
      if (!response.ok || !result.orderId) {
        throw new Error(result.error ?? "We could not place your order.");
      }
      setOrderId(result.orderId);
      clear();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not place your order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
      <nav className="mb-8 flex items-center gap-2 text-xs text-[#7a867e]">
        <Link href="/">Home</Link><span>/</span><span className="font-semibold text-[#345342]">Checkout</span>
      </nav>
      {orderId ? (
        <section className="mx-auto max-w-xl rounded-3xl border border-[#e3e9e1] bg-white px-6 py-14 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-[#4a8965]" size={48} />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b8976]">Order received</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#193b30]">Thank you for shopping Dunfeto.</h1>
          <p className="mt-4 text-sm leading-6 text-[#718078]">Your order is pending confirmation. Our dispatch team will contact you on the phone number you supplied.</p>
          <p className="mt-4 break-all rounded-lg bg-[#f3f5f1] px-4 py-3 font-mono text-xs text-[#53675a]">Order reference: {orderId}</p>
          <Link className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#173a31] px-6 py-3 text-sm font-bold text-white" href="/">Continue shopping <ArrowRight size={15} /></Link>
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#718579]">Almost home</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1b3a30] sm:text-4xl">Delivery details</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#77837b]">Tell us where to deliver your appliances. Our team will call to confirm dispatch and delivery costs.</p>

            <form className="mt-7 rounded-2xl border border-[#e5e9e3] bg-white p-5 sm:p-7" onSubmit={submitOrder}>
              <div className="mb-6 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e9f1e9] text-[#4d7b5e]"><MapPin size={18} /></span>
                <div><h2 className="text-sm font-bold text-[#2a4436]">Contact and address</h2><p className="mt-1 text-xs text-[#89938c]">All fields marked required.</p></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" name="customerName" onChange={(customerName) => setFields({ ...fields, customerName })} required value={fields.customerName} />
                <Field label="Email address" name="customerEmail" onChange={(customerEmail) => setFields({ ...fields, customerEmail })} required type="email" value={fields.customerEmail} />
                <Field label="Phone number" name="customerPhone" onChange={(customerPhone) => setFields({ ...fields, customerPhone })} placeholder="+234 800 000 0000" required type="tel" value={fields.customerPhone} />
                <label className="grid gap-1.5 text-xs font-semibold text-[#596b5f]">State
                  <select className="h-11 rounded-xl border border-[#dfe5de] bg-white px-3 text-sm font-normal text-[#30493a] outline-none focus:border-[#4c8062]" onChange={(event) => setFields({ ...fields, state: event.target.value })} required value={fields.state}>
                    <option value="">Choose state</option>{nigerianStates.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </label>
                <Field label="City / LGA" name="city" onChange={(city) => setFields({ ...fields, city })} placeholder="e.g. Ikeja" required value={fields.city} />
                <Field className="sm:col-span-2" label="Street address and delivery instructions" name="deliveryAddress" onChange={(deliveryAddress) => setFields({ ...fields, deliveryAddress })} placeholder="House number, street, area, closest landmark" required value={fields.deliveryAddress} />
              </div>
              {error && <p className="mt-4 rounded-xl bg-[#fff0eb] p-3 text-sm text-[#a84d38]" role="alert">{error}</p>}
              <button className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#173a31] text-sm font-bold text-white transition hover:bg-[#2b5947] disabled:cursor-not-allowed disabled:bg-[#aab3ab]" disabled={!items.length || submitting} type="submit">
                {submitting ? "Placing order…" : "Place order · " + formatNaira(subtotal)} <ArrowRight size={16} />
              </button>
              <p className="mt-3 text-center text-[10px] leading-5 text-[#8c958f]">This places a pending order request. Payment instructions are confirmed by our team.</p>
            </form>
          </section>

          <aside className="rounded-2xl border border-[#e5e9e3] bg-white p-5 sm:p-6 lg:sticky lg:top-36">
            <h2 className="text-lg font-extrabold text-[#1e3b31]">Your order</h2>
            <div className="mt-4 divide-y divide-[#edf0eb]">
              {items.length ? items.map(({ product, quantity }) => (
                <div className="flex items-center gap-3 py-4" key={product.id}>
                  <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#eff2ed]">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="h-full w-full object-cover" src={product.imageUrl} />
                    ) : <span className="text-[#718a78]">⚡</span>}
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#536f5a] px-1 text-[9px] font-bold text-white">{quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-semibold text-[#344a3c]">{product.title}</p><p className="mt-1 text-[10px] text-[#89938c]">Qty {quantity}</p></div>
                  <p className="shrink-0 text-xs font-bold">{formatNaira(product.price * quantity)}</p>
                </div>
              )) : <div className="py-8 text-center"><p className="text-sm font-semibold">Your basket is empty.</p><Link className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#50775f]" href="/">Browse appliances <ArrowRight size={13} /></Link></div>}
            </div>
            <div className="space-y-3 border-t border-[#e9ece6] pt-4 text-xs">
              <div className="flex justify-between"><span className="text-[#79857d]">Subtotal</span><span className="font-bold">{formatNaira(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-[#79857d]">Delivery</span><span className="font-medium">Confirmed after order</span></div>
              <div className="flex justify-between border-t border-[#e9ece6] pt-3 text-sm"><span className="font-bold">Total</span><span className="font-black text-[#1e3b31]">{formatNaira(subtotal)}</span></div>
            </div>
            <div className="mt-5 grid gap-2 rounded-xl bg-[#f4f6f2] p-4 text-[10px] text-[#687a6e]">
              <p className="flex items-center gap-2"><ShieldCheck size={14} /> Manufacturer warranty support</p>
              <p className="flex items-center gap-2"><Truck size={14} /> Delivery across Nigeria</p>
            </div>
            <Link className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#67786c]" href="/"><ArrowLeft size={14} /> Continue shopping</Link>
          </aside>
        </div>
      )}
    </main>
  );
}

function Field({
  className = "",
  label,
  name,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  className?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className={`grid gap-1.5 text-xs font-semibold text-[#596b5f] ${className}`}>
      {label}
      <input autoComplete={name} className="h-11 rounded-xl border border-[#dfe5de] px-3 text-sm font-normal text-[#30493a] outline-none placeholder:text-[#a3aca5] focus:border-[#4c8062]" name={name} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} type={type} value={value} />
    </label>
  );
}
