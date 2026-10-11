"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Menu,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";

type Category = { id: string; name: string; slug: string };

function whatsappHref(message: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const base = number ? `https://wa.me/${number}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname.startsWith("/admin");
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { items, count, subtotal, setQuantity, remove } = useCart();

  useEffect(() => {
    fetch("/api/categories")
      .then((response) => {
        if (!response.ok) throw new Error(`Category request failed: ${response.status}`);
        return response.json() as Promise<{ categories: Category[] }>;
      })
      .then((data) => setCategories(data.categories))
      .catch((error: unknown) => console.error("Failed to load navigation categories.", error));
  }, []);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/${params.size ? `?${params.toString()}` : ""}#products`);
  }

  return (
    <>
      {!isAdmin && (
        <>
          <div className="bg-[#163b32] px-4 py-2 text-center text-[11px] font-medium tracking-[0.12em] text-white">
            <span className="inline-flex items-center gap-2">
              <Truck size={14} /> DELIVERY ACROSS NIGERIA · FLEXIBLE PAYMENT
            </span>
          </div>
          <header className="sticky top-0 z-40 border-b border-[#e9e7e1] bg-[#fffefa]/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-7">
              <button
                className="grid h-10 w-10 place-items-center rounded-full border border-[#e6e5df] md:hidden"
                aria-label="Open categories"
                onClick={() => setMenuOpen(true)}
                type="button"
              >
                <Menu size={19} />
              </button>
              <Link href="/" className="min-w-fit text-xl font-black tracking-[-0.06em] text-[#173a31] sm:text-2xl">
                dunfeto<span className="text-[#de7748]">.</span>
              </Link>
              <nav className="hidden items-center gap-5 pl-5 text-[13px] font-medium text-[#4d5954] lg:flex">
                {categories.slice(0, 4).map((category) => (
                  <Link
                    key={category.id}
                    href={`/?category=${encodeURIComponent(category.slug)}#products`}
                    className="whitespace-nowrap transition hover:text-[#de7748]"
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
              <form
                onSubmit={search}
                className="ml-auto hidden h-11 max-w-[21rem] flex-1 items-center gap-2 rounded-full border border-[#e6e5df] bg-white px-4 md:flex"
              >
                <Search size={17} className="shrink-0 text-[#84908b]" />
                <input
                  aria-label="Search appliances"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a6aaa5]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search appliances..."
                  value={query}
                />
              </form>
              <button
                aria-label={`Open basket, ${count} items`}
                className="relative ml-auto grid h-11 w-11 place-items-center rounded-full bg-[#173a31] text-white transition hover:bg-[#245547] md:ml-2"
                onClick={() => setCartOpen(true)}
                type="button"
              >
                <ShoppingBag size={18} />
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#e37b4d] px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </button>
            </div>
            <form onSubmit={search} className="flex items-center gap-2 px-4 pb-3 md:hidden">
              <Search size={17} className="text-[#84908b]" />
              <input
                aria-label="Search appliances"
                className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-[#a6aaa5]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search appliances..."
                value={query}
              />
              <button className="text-xs font-semibold text-[#de7748]" type="submit">
                Search
              </button>
            </form>
          </header>
        </>
      )}
      {children}
      {!isAdmin && (
        <>
          <footer className="bg-[#173a31] px-5 py-10 text-white">
            <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
              <div>
                <Link href="/" className="text-2xl font-black tracking-[-0.06em]">
                  dunfeto<span className="text-[#e37b4d]">.</span>
                </Link>
                <p className="mt-3 text-sm text-white/65">
                  Premium Living, Reliable Appliances
                </p>
              </div>
              <div className="text-sm leading-7 text-white/70">
                <p className="font-semibold text-white">Shop with confidence</p>
                <p>Genuine products · Manufacturer warranty</p>
                <p>Delivery across Nigeria</p>
              </div>
              <div className="text-sm leading-7 text-white/70">
                <p className="font-semibold text-white">Need a hand?</p>
                <p>WhatsApp us for product guidance and order support.</p>
                <a
                  className="mt-2 inline-flex items-center gap-2 font-semibold text-[#b7d6bb] hover:text-white"
                  href={whatsappHref("Hello Dunfeto, I need help choosing an appliance.")}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle size={16} /> Chat on WhatsApp
                </a>
              </div>
            </div>
            <p className="mx-auto mt-9 max-w-7xl border-t border-white/15 pt-5 text-xs text-white/50">
              Dunfeto. Premium Living, Reliable Appliances.
            </p>
          </footer>
          <a
            aria-label="Quick WhatsApp support"
            className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lg transition hover:scale-105"
            href={whatsappHref("Hello Dunfeto, I need help with an appliance.")}
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle size={25} />
          </a>
        </>
      )}

      {!isAdmin && (cartOpen || menuOpen) && (
        <button
          aria-label="Close overlay"
          className="fixed inset-0 z-50 cursor-default bg-[#13251e]/45"
          onClick={() => {
            setCartOpen(false);
            setMenuOpen(false);
          }}
          type="button"
        />
      )}

      {!isAdmin && (
        <aside
          aria-label="Shopping basket"
          aria-modal="true"
          className={`fixed right-0 top-0 z-[60] flex h-full w-full max-w-md flex-col bg-[#fffefa] shadow-2xl transition-transform duration-300 ${
            cartOpen ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
        >
          <div className="flex items-center justify-between border-b border-[#e9e7e1] px-6 py-5">
            <div>
              <p className="text-lg font-bold">Your basket</p>
              <p className="mt-1 text-xs text-[#737f78]">{count} item{count === 1 ? "" : "s"}</p>
            </div>
            <button
              aria-label="Close basket"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#f0f2ed]"
              onClick={() => setCartOpen(false)}
              type="button"
            >
              <X size={19} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6">
            {items.length ? (
              <div className="divide-y divide-[#e9e7e1]">
                {items.map(({ product, quantity }) => (
                  <div className="flex gap-4 py-5" key={product.id}>
                    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f1f3ed]">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="h-full w-full object-cover" src={product.imageUrl} alt="" />
                      ) : (
                        <Zap className="text-[#95a49a]" size={25} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold">{product.title}</p>
                      <p className="mt-1 text-sm font-bold text-[#d66f42]">{formatNaira(product.price)}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          aria-label={`Reduce ${product.title} quantity`}
                          className="grid h-7 w-7 place-items-center rounded-full border border-[#e3e4dd]"
                          onClick={() => setQuantity(product.id, quantity - 1)}
                          type="button"
                        ><Minus size={13} /></button>
                        <span className="text-xs">{quantity}</span>
                        <button
                          aria-label={`Increase ${product.title} quantity`}
                          className="grid h-7 w-7 place-items-center rounded-full border border-[#e3e4dd] disabled:opacity-40"
                          disabled={quantity >= product.stockQuantity}
                          onClick={() => setQuantity(product.id, quantity + 1)}
                          type="button"
                        ><Plus size={13} /></button>
                        <button
                          className="ml-auto text-xs text-[#89928c] hover:text-red-600"
                          onClick={() => remove(product.id)}
                          type="button"
                        >Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ShoppingBag className="text-[#b7c0b9]" size={38} />
                <p className="mt-4 font-semibold">Your basket is taking a nap.</p>
                <p className="mt-1 text-sm text-[#7b857e]">Add something useful to wake it up.</p>
              </div>
            )}
          </div>
          <div className="border-t border-[#e9e7e1] px-6 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6f7a72]">Subtotal</span>
              <span className="text-lg font-bold">{formatNaira(subtotal)}</span>
            </div>
            <p className="mt-2 text-xs text-[#89928c]">Delivery fee confirmed after dispatch details.</p>
            <Link
              className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-[#173a31] text-sm font-semibold text-white transition hover:bg-[#245547]"
              href="/checkout"
              onClick={() => setCartOpen(false)}
            >
              Continue to checkout <ArrowRight size={16} />
            </Link>
            <Link
              className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-[#69776e]"
              href="/#products"
              onClick={() => setCartOpen(false)}
            >
              Continue shopping <ChevronRight size={14} />
            </Link>
          </div>
        </aside>
      )}

      {!isAdmin && (
        <aside
          aria-label="Appliance categories"
          className={`fixed inset-y-0 left-0 z-[60] w-[min(82vw,320px)] bg-[#fffefa] p-6 shadow-2xl transition-transform ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="text-lg font-bold">Browse categories</span>
            <button aria-label="Close menu" onClick={() => setMenuOpen(false)} type="button">
              <X size={20} />
            </button>
          </div>
          <div className="grid gap-2">
            {categories.map((category) => (
              <Link
                className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-[#f0f2ed]"
                href={`/?category=${encodeURIComponent(category.slug)}#products`}
                key={category.id}
                onClick={() => setMenuOpen(false)}
              >
                {category.name}<ChevronRight size={15} />
              </Link>
            ))}
          </div>
        </aside>
      )}
    </>
  );
}

export function TrustStrip() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        { icon: ShieldCheck, title: "Manufacturer warranty", note: "Confidence in every purchase" },
        { icon: Truck, title: "Delivery across Nigeria", note: "To your doorstep, nationwide" },
        { icon: Check, title: "Genuine appliances", note: "Carefully selected brands" },
      ].map(({ icon: Icon, title, note }) => (
        <div className="flex items-center gap-3 rounded-xl border border-[#e8e9e2] bg-white/70 px-4 py-3" key={title}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e9f0e9] text-[#34705b]"><Icon size={19} /></span>
          <span><span className="block text-xs font-bold">{title}</span><span className="mt-1 block text-[10px] text-[#7e8881]">{note}</span></span>
        </div>
      ))}
    </div>
  );
}
