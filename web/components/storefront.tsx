"use client";

import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  BadgePercent,
  Check,
  ChevronRight,
  Fan,
  Flame,
  Refrigerator,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Truck,
  WashingMachine,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { Product } from "@/lib/cart";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { TrustStrip } from "@/components/site-shell";

type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
};

const categoryArt = [
  { icon: Refrigerator, color: "bg-[#e5ede7]", label: "Cooling" },
  { icon: WashingMachine, color: "bg-[#e8edf1]", label: "Laundry" },
  { icon: Snowflake, color: "bg-[#e5eff0]", label: "Air care" },
  { icon: Flame, color: "bg-[#f4e9df]", label: "Kitchen" },
];

function ApplianceArt({ product, large = false }: { product: Product; large?: boolean }) {
  if (product.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={product.title}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        src={product.imageUrl}
      />
    );
  }

  const title = product.title.toLowerCase();
  const Icon = title.includes("fridge") || title.includes("refrigerator")
    ? Refrigerator
    : title.includes("fan")
      ? Fan
      : title.includes("wash")
        ? WashingMachine
        : title.includes("air fryer") || title.includes("microwave")
          ? Flame
          : Snowflake;

  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f2f4ef] to-[#dfe8e2] ${large ? "min-h-80" : ""}`}>
      <div className="relative grid h-[68%] w-[55%] place-items-center rounded-[2rem] border border-white/90 bg-white/65 shadow-[0_25px_55px_-35px_rgba(23,58,49,0.5)] backdrop-blur-sm">
        <div className="absolute inset-3 rounded-[1.5rem] border border-[#e6ebe6]" />
        <Icon className="relative text-[#5a786b]" size={large ? 88 : 62} strokeWidth={1.1} />
        <span className="absolute bottom-4 left-0 right-0 mx-auto w-fit rounded-full bg-white/80 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#7b8a81]">
          Dunfeto select
        </span>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const { add, items } = useCart();
  const quantity = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const discounted = product.originalPrice && product.originalPrice > product.price;
  const savings = discounted
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0;

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#e9eae4] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_-30px_rgba(22,56,46,.38)]">
      <Link
        className="relative block aspect-[1/0.88] overflow-hidden"
        href={`/products/${product.slug}`}
      >
        <ApplianceArt product={product} />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold text-[#53635a] shadow-sm">
          {product.category}
        </span>
        {discounted ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#e77b4d] px-2.5 py-1.5 text-[10px] font-bold text-white">
            <BadgePercent size={12} /> SAVE {savings}%
          </span>
        ) : product.isFeatured ? (
          <span className="absolute right-3 top-3 rounded-full bg-[#f5c76c] px-2.5 py-1.5 text-[10px] font-bold text-[#513918]">
            BEST SELLER
          </span>
        ) : null}
      </Link>
      <div className="p-4 sm:p-5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-11 text-sm font-bold leading-5 text-[#243d33] transition hover:text-[#dc7548]">
            {product.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-5 text-[#78837c]">
          {product.description}
        </p>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-extrabold tracking-tight text-[#1e3b31]">
              {formatNaira(product.price)}
            </p>
            {discounted && (
              <p className="text-xs text-[#99a099] line-through">
                {formatNaira(product.originalPrice!)}
              </p>
            )}
          </div>
          <span className={`pb-1 text-[10px] font-medium ${product.stockQuantity ? "text-[#448064]" : "text-[#c46b53]"}`}>
            {product.stockQuantity ? "In stock" : "Out of stock"}
          </span>
        </div>
        <button
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#173a31] text-xs font-bold text-white transition hover:bg-[#295847] disabled:cursor-not-allowed disabled:bg-[#a9b1aa]"
          disabled={!product.stockQuantity || quantity >= product.stockQuantity}
          onClick={() => add(product)}
          type="button"
        >
          {quantity > 0 ? <><Check size={15} /> Added · {quantity}</> : <>Add to cart <ArrowRight size={14} /></>}
        </button>
      </div>
      <span className="sr-only">Collection item {index + 1}</span>
    </article>
  );
}

export default function Storefront({
  initialCategory,
  initialQuery,
}: {
  initialCategory: string;
  initialQuery: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sort, setSort] = useState("featured");
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/categories")
      .then((response) => {
        if (!response.ok) throw new Error("Categories could not be loaded.");
        return response.json() as Promise<{ categories: Category[] }>;
      })
      .then((data) => setCategories(data.categories))
      .catch((cause: unknown) => console.error("Failed to load categories.", cause));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ sort, limit: "48" });
    if (selectedCategory) params.set("category", selectedCategory);
    if (query) params.set("q", query);

    fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as { products?: Product[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Products could not be loaded.");
        return body.products ?? [];
      })
      .then(setProducts)
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name !== "AbortError") {
          setError(cause.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selectedCategory, sort, query, refreshKey]);

  const featuredProduct = products.find((product) => product.isFeatured) ?? products[0];

  return (
    <main>
      <section className="relative overflow-hidden bg-[#f1f4ef]">
        <div className="absolute -right-24 -top-36 h-[34rem] w-[34rem] rounded-full bg-[#dce8df] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-9 px-5 py-12 sm:px-8 sm:py-16 lg:min-h-[520px] lg:grid-cols-[1.03fr_.97fr] lg:py-20">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#cbd9ce] bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#527362]">
              <Sparkles size={13} /> Premium Living, Reliable Appliances
            </span>
            <h1 className="mt-6 max-w-2xl text-[2.7rem] font-black leading-[1.04] tracking-[-0.055em] text-[#193c32] sm:text-6xl lg:text-[4.2rem]">
              Comfort that works as hard as you do.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#65746b] sm:text-base">
              Reliable, energy-smart appliances for the rhythm of Nigerian homes.
              Find the right fit, shop with confidence, and let us bring it to you.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a className="inline-flex h-12 items-center gap-2 rounded-full bg-[#173a31] px-6 text-sm font-bold text-white transition hover:bg-[#2d5a48]" href="#products">
                Shop appliances <ArrowRight size={16} />
              </a>
              <a className="inline-flex h-12 items-center gap-2 rounded-full border border-[#cad6cc] bg-white/60 px-5 text-sm font-semibold text-[#315647] transition hover:bg-white" href="#why-dunfeto">
                Why Dunfeto <ChevronRight size={16} />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-[#62746a]">
              <span className="inline-flex items-center gap-1.5"><Zap size={14} className="text-[#dc794b]" /> Inverter-ready picks</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#4b8064]" /> Warranty support</span>
              <span className="inline-flex items-center gap-1.5"><Truck size={14} className="text-[#4b8064]" /> Nationwide delivery</span>
            </div>
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#dfe9e1] via-[#eff2ed] to-[#e8ddd0] p-5 sm:min-h-[400px]">
            <div className="absolute right-[-3rem] top-[-4rem] h-64 w-64 rounded-full border border-white/70" />
            <div className="absolute right-[-1rem] top-[-2rem] h-56 w-56 rounded-full border border-white/50" />
            <div className="absolute bottom-[-6rem] left-[-4rem] h-64 w-64 rounded-full bg-[#c5d8c8]/70 blur-2xl" />
            {featuredProduct ? (
              <div className="absolute inset-5 flex items-center justify-center overflow-hidden rounded-[1.5rem] bg-white/35">
                <div className="group h-full w-full">
                  <ApplianceArt product={featuredProduct} large />
                </div>
                <Link href={`/products/${featuredProduct.slug}`} className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-white/90 p-4 shadow-lg backdrop-blur">
                  <span>
                    <span className="block text-[10px] font-semibold uppercase tracking-widest text-[#64806f]">Featured pick</span>
                    <span className="mt-1 block max-w-[14rem] truncate text-sm font-bold text-[#233d32]">{featuredProduct.title}</span>
                  </span>
                  <span className="whitespace-nowrap text-sm font-extrabold text-[#d36f43]">{formatNaira(featuredProduct.price)}</span>
                </Link>
              </div>
            ) : (
              <div className="relative flex h-full min-h-[320px] items-center justify-center">
                <div className="relative grid h-56 w-44 place-items-center rounded-[2rem] border border-white/90 bg-white/60 shadow-[0_32px_70px_-40px_rgba(23,58,49,.55)] sm:h-72 sm:w-56">
                  <div className="absolute inset-3 rounded-[1.5rem] border border-[#dce6dd]" />
                  <Refrigerator className="text-[#648170]" size={110} strokeWidth={1} />
                  <div className="absolute bottom-7 flex items-center gap-1 rounded-full bg-[#173a31] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white"><Zap size={11} /> Energy-smart living</div>
                </div>
                <span className="absolute bottom-5 right-3 rotate-[-5deg] rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#355848] shadow-lg">Built for everyday Nigeria</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <TrustStrip />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-9 pt-4 sm:px-8 sm:pb-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#738579]">Shop by need</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1e3b31] sm:text-3xl">Find your kind of comfort</h2>
          </div>
          <a href="#products" className="hidden items-center gap-1 text-xs font-bold text-[#567a65] sm:flex">All appliances <ArrowRight size={14} /></a>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {categories.map((category, index) => {
            const art = categoryArt[index % categoryArt.length];
            const Icon = art.icon;
            return (
              <button
                className={`group relative flex min-h-28 items-center justify-between overflow-hidden rounded-2xl p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${art.color}`}
                key={category.id}
                onClick={() => {
                  setLoading(true);
                  setError("");
                  setSelectedCategory(category.slug);
                  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                }}
                type="button"
              >
                <span className="relative z-10">
                  <span className="block text-sm font-bold text-[#294438]">{category.name}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#708078]">Explore <ArrowRight size={12} /></span>
                </span>
                <Icon className="text-[#789285]/55 transition group-hover:scale-110" size={40} strokeWidth={1.25} />
              </button>
            );
          })}
          {!categories.length && categoryArt.map((art) => {
            const Icon = art.icon;
            return <div className={`flex min-h-28 items-center justify-between rounded-2xl p-4 ${art.color}`} key={art.label}><span className="text-sm font-bold text-[#294438]">{art.label}</span><Icon className="text-[#789285]/60" size={38} /></div>;
          })}
        </div>
      </section>

      <section id="products" className="scroll-mt-32 bg-[#f4f5f1]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#738579]">Dunfeto collection</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1e3b31] sm:text-3xl">
                {query ? `Results for “${query}”` : "Good appliances. Better living."}
              </h2>
            </div>
            <label className="flex h-10 items-center gap-2 rounded-full border border-[#dce2db] bg-white px-4 text-xs font-semibold text-[#5c6f63]">
              <ArrowDownWideNarrow size={15} />
              <span className="sr-only">Sort products</span>
              <select className="bg-transparent outline-none"               onChange={(event) => {
                setLoading(true);
                setError("");
                setSort(event.target.value);
              }} value={sort}>
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className={`rounded-full px-4 py-2 text-[11px] font-semibold ${!selectedCategory ? "bg-[#173a31] text-white" : "border border-[#dce2db] bg-white text-[#627068]"}`}
              onClick={() => {
                setLoading(true);
                setError("");
                setSelectedCategory("");
              }}
              type="button"
            >All appliances</button>
            {categories.map((category) => (
              <button
                className={`rounded-full px-4 py-2 text-[11px] font-semibold ${selectedCategory === category.slug ? "bg-[#173a31] text-white" : "border border-[#dce2db] bg-white text-[#627068]"}`}
                key={category.id}
                onClick={() => {
                  setLoading(true);
                  setError("");
                  setSelectedCategory(category.slug);
                }}
                type="button"
              >{category.name}</button>
            ))}
          </div>

          {error ? (
            <div className="mt-8 rounded-2xl border border-[#f1d4c8] bg-white p-10 text-center">
              <p className="font-bold text-[#804c3b]">We couldn’t load the collection.</p>
              <p className="mt-2 text-sm text-[#7a827d]">{error}</p>
              <button className="mt-5 rounded-full bg-[#173a31] px-5 py-2.5 text-xs font-bold text-white" onClick={() => setRefreshKey((current) => current + 1)} type="button">Try again</button>
            </div>
          ) : loading ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => <div className="h-80 animate-pulse rounded-2xl bg-white" key={index} />)}
            </div>
          ) : products.length ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {products.map((product, index) => <ProductCard index={index} key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-white px-6 py-16 text-center">
              <Search className="mx-auto text-[#a4afa7]" size={32} />
              <p className="mt-4 font-bold text-[#31493c]">Nothing on this shelf just yet.</p>
              <p className="mt-2 text-sm text-[#808982]">Try another category or check back soon.</p>
              <button className="mt-5 text-xs font-bold text-[#4b765e]" onClick={() => { setLoading(true); setError(""); setSelectedCategory(""); setQuery(""); }} type="button">Clear filters</button>
            </div>
          )}
        </div>
      </section>

      <section id="why-dunfeto" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="rounded-[2rem] bg-[#173a31] px-6 py-9 text-white sm:px-10 sm:py-12">
          <div className="grid gap-8 md:grid-cols-[.9fr_1.1fr] md:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b2cfb7]">Your home deserves dependable</p>
              <h2 className="mt-3 max-w-md text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">Thoughtful picks for power, comfort & everyday living.</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/65">Explore appliances selected for dependable performance, energy-conscious use, and the realities of Nigerian homes.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Zap, title: "Inverter-ready", copy: "Smart choices for changing power conditions" },
                { icon: ShieldCheck, title: "Warranty support", copy: "Clear manufacturer warranty guidance" },
                { icon: Truck, title: "Nigeria-wide", copy: "Delivery to homes across the country" },
              ].map(({ icon: Icon, title, copy }) => (
                <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4" key={title}>
                  <Icon className="text-[#bed6bd]" size={21} />
                  <p className="mt-4 text-sm font-bold">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-white/55">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
