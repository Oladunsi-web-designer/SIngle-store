"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Product } from "@/lib/cart";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";

export default function ProductDetail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { add, items } = useCart();
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products/slug/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as {
          product?: Product;
          error?: string;
        };
        if (!response.ok) throw new Error(body.error ?? "Product unavailable.");
        return body.product!;
      })
      .then(setProduct)
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name !== "AbortError") {
          setError(cause.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  const quantity = product
    ? items.find((item) => item.product.id === product.id)?.quantity ?? 0
    : 0;

  if (loading) {
    return (
      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-2 sm:px-8">
        <div className="aspect-square animate-pulse rounded-3xl bg-[#edf0eb]" />
        <div className="space-y-5 pt-10">
          <div className="h-4 w-28 animate-pulse rounded bg-[#edf0eb]" />
          <div className="h-12 w-3/4 animate-pulse rounded bg-[#edf0eb]" />
          <div className="h-28 animate-pulse rounded bg-[#edf0eb]" />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8">
        <h1 className="text-3xl font-black text-[#1e3b31]">This appliance is unavailable.</h1>
        <p className="mt-3 text-sm text-[#7a857e]">{error || "It may have moved or sold out."}</p>
        <Link className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#173a31] px-5 py-3 text-sm font-bold text-white" href="/">
          <ArrowLeft size={16} /> Back to the store
        </Link>
      </main>
    );
  }

  const discounted = product.originalPrice && product.originalPrice > product.price;
  const brand = product.title.split(" ").slice(0, 2).join(" ");

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
      <nav className="mb-7 flex items-center gap-2 text-xs text-[#79857d]">
        <Link className="hover:text-[#de7748]" href="/">Home</Link>
        <ChevronRight size={13} />
        <Link className="hover:text-[#de7748]" href={`/?category=${encodeURIComponent(product.categorySlug)}#products`}>{product.category}</Link>
        <ChevronRight size={13} />
        <span className="max-w-[13rem] truncate font-semibold text-[#375044]">{product.title}</span>
      </nav>

      <div className="grid gap-9 lg:grid-cols-[1fr_.92fr] lg:gap-14">
        <div>
          <div className="group relative aspect-square overflow-hidden rounded-[1.75rem] border border-[#e8ebe5] bg-[#eff2ed]">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="h-full w-full object-cover" src={product.imageUrl} alt={product.title} />
            ) : (
              <div className="grid h-full place-items-center bg-gradient-to-br from-[#f2f4ef] to-[#dfe8e2]">
                <div className="grid h-[62%] w-[52%] place-items-center rounded-[2rem] border border-white bg-white/70 shadow-xl">
                  <Zap className="text-[#5a786b]" size={100} strokeWidth={1} />
                </div>
              </div>
            )}
            {discounted && (
              <span className="absolute left-5 top-5 rounded-full bg-[#e77b4d] px-4 py-2 text-xs font-bold text-white">
                SPECIAL PRICE
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((index) => (
              <div className={`aspect-square overflow-hidden rounded-xl border ${index === 0 ? "border-[#4f8065]" : "border-[#e8ebe5]"} bg-[#eff2ed]`} key={index}>
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="h-full w-full object-cover" src={product.imageUrl} alt={`${product.title} view ${index + 1}`} />
                ) : (
                  <div className="grid h-full place-items-center"><Zap className="text-[#8aa092]" size={24} /></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:pt-4">
          <span className="inline-flex rounded-full bg-[#e8f0e9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#50725d]">{product.category}</span>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-[#1b3b30] sm:text-4xl">{product.title}</h1>
          <p className="mt-4 text-sm leading-7 text-[#68766e]">{product.description}</p>

          <div className="mt-6 flex items-end gap-3">
            <span className="text-3xl font-black tracking-tight text-[#1e3b31]">{formatNaira(product.price)}</span>
            {discounted && (
              <>
                <span className="pb-1 text-base text-[#a3aaa3] line-through">{formatNaira(product.originalPrice!)}</span>
                <span className="mb-1 rounded-full bg-[#fff1e8] px-2.5 py-1 text-[10px] font-bold text-[#d66f42]">
                  Save {Math.round((1 - product.price / product.originalPrice!) * 100)}%
                </span>
              </>
            )}
          </div>
          <p className={`mt-2 text-xs font-semibold ${product.stockQuantity ? "text-[#4c896b]" : "text-[#b85d48]"}`}>
            {product.stockQuantity ? `${product.stockQuantity} available` : "Currently out of stock"}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#173a31] text-sm font-bold text-white transition hover:bg-[#2d5a48] disabled:bg-[#aab3ab]"
              disabled={!product.stockQuantity || quantity >= product.stockQuantity}
              onClick={() => add(product)}
              type="button"
            >
              {quantity ? <><Check size={17} /> In basket ({quantity})</> : <><ShoppingBag size={17} /> Add to basket</>}
            </button>
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#d7e0d8] px-5 text-sm font-bold text-[#365b48] transition hover:bg-[#f0f4ef] disabled:opacity-40"
              disabled={!product.stockQuantity}
              onClick={() => {
                if (!quantity) add(product);
                router.push("/checkout");
              }}
              type="button"
            >
              Buy now <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-7 divide-y divide-[#e8ebe5] rounded-2xl border border-[#e8ebe5] bg-white">
            <div className="flex items-center gap-3 px-4 py-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e9f1e9] text-[#4c7c60]"><ShieldCheck size={18} /></span>
              <span><span className="block text-xs font-bold">Manufacturer warranty support</span><span className="mt-1 block text-[10px] text-[#879189]">Warranty terms vary by brand and product.</span></span>
            </div>
            <div className="flex items-center gap-3 px-4 py-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e9eff2] text-[#537c88]"><Truck size={18} /></span>
              <span><span className="block text-xs font-bold">Delivery across Nigeria</span><span className="mt-1 block text-[10px] text-[#879189]">Dispatch timing and fees depend on your location.</span></span>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-bold text-[#263e33]">Product details</h2>
            <dl className="mt-3 divide-y divide-[#e8ebe5] border-y border-[#e8ebe5]">
              {[
                ["Brand", brand],
                ["Category", product.category],
                ["Availability", product.stockQuantity ? "In stock" : "Out of stock"],
                ["Warranty", "Manufacturer terms apply"],
              ].map(([label, value]) => (
                <div className="flex justify-between gap-4 py-3 text-xs" key={label}>
                  <dt className="text-[#7e8981]">{label}</dt><dd className="text-right font-semibold text-[#385244]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <Link className="mt-12 inline-flex items-center gap-2 text-xs font-bold text-[#567862] hover:text-[#de7748]" href="/">
        <ArrowLeft size={15} /> Back to all appliances
      </Link>
    </main>
  );
}
