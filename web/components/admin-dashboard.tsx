"use client";

import {
  Boxes,
  CircleDollarSign,
  ClipboardList,
  ImagePlus,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { formatNaira } from "@/lib/format";

type Category = { id: string; name: string; slug: string };
type InventoryProduct = {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  category: string;
  price: number;
  originalPrice: number | null;
  stockQuantity: number;
  imageUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
};
type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  state: string;
  city: string;
  totalAmount: number;
  status: "pending" | "confirmed" | "delivered";
  createdAt: string;
  items: { title: string; quantity: number; unitPrice: number }[];
};

const emptyForm = {
  title: "",
  slug: "",
  categoryId: "",
  price: "",
  originalPrice: "",
  stockQuantity: "",
  imageUrl: "",
  description: "",
  isFeatured: false,
};

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"overview" | "products" | "orders">("overview");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [formMessage, setFormMessage] = useState("");
  const [formBusy, setFormBusy] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [query, setQuery] = useState("");

  const loadDashboard = useCallback(async () => {
    const [categoryResponse, productResponse, orderResponse] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch("/api/admin/orders", { cache: "no-store" }),
    ]);

    if (productResponse.status === 401 || orderResponse.status === 401) {
      setAuthenticated(false);
      return;
    }
    if (!categoryResponse.ok || !productResponse.ok || !orderResponse.ok) {
      throw new Error("Dashboard data could not be loaded.");
    }

    const [categoryData, productData, orderData] = await Promise.all([
      categoryResponse.json() as Promise<{ categories: Category[] }>,
      productResponse.json() as Promise<{ products: InventoryProduct[] }>,
      orderResponse.json() as Promise<{ orders: Order[] }>,
    ]);
    setCategories(categoryData.categories);
    setProducts(productData.products);
    setOrders(orderData.orders);
  }, []);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then(async (data: { authenticated: boolean }) => {
        setAuthenticated(data.authenticated);
        if (data.authenticated) await loadDashboard();
      })
      .catch((error: unknown) => {
        console.error("Admin session check failed.", error);
        setLoginError("Unable to check admin session. Refresh and try again.");
      })
      .finally(() => setChecking(false));
  }, [loadDashboard]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(normalized) ||
        product.category.toLowerCase().includes(normalized),
    );
  }, [products, query]);

  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const totalStock = products.reduce((sum, product) => sum + product.stockQuantity, 0);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = (await response.json()) as { error?: string; authenticated?: boolean };
    if (!response.ok || !result.authenticated) {
      setLoginError(result.error ?? "Could not sign in.");
      return;
    }
    setAuthenticated(true);
    setPassword("");
    try {
      await loadDashboard();
    } catch (error) {
      console.error("Dashboard load failed.", error);
      setLoginError("You are signed in, but dashboard data could not be loaded.");
    }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setProducts([]);
    setOrders([]);
  }

  function updateForm<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormBusy(true);
    setFormMessage("");

    const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      stockQuantity: Number(form.stockQuantity),
      imageUrl: form.imageUrl || null,
    };
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setFormMessage(result.error ?? "Product could not be created.");
      setFormBusy(false);
      return;
    }
    setForm(emptyForm);
    setFormMessage("Product added to the Dunfeto catalogue.");
    setFormBusy(false);
    await loadDashboard();
  }

  async function saveStock(productId: string, stockQuantity: number) {
    setBusyId(productId);
    const response = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQuantity }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      window.alert(result.error ?? "Stock could not be updated.");
      await loadDashboard();
    } else {
      const result = (await response.json()) as { product: InventoryProduct };
      setProducts((current) => current.map((product) => product.id === productId ? { ...product, stockQuantity: result.product.stockQuantity } : product));
    }
    setBusyId("");
  }

  async function deleteProduct(productId: string) {
    if (!window.confirm("Delete this product? Products in order history cannot be deleted.")) return;
    setBusyId(productId);
    const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      window.alert(result.error ?? "Product could not be deleted.");
    } else {
      setProducts((current) => current.filter((product) => product.id !== productId));
    }
    setBusyId("");
  }

  async function changeOrderStatus(orderId: string, status: Order["status"]) {
    setBusyId(orderId);
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      window.alert(result.error ?? "Order status could not be updated.");
    } else {
      const result = (await response.json()) as { order: { status: Order["status"] } };
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status: result.order.status } : order));
    }
    setBusyId("");
  }

  if (checking) {
    return <main className="grid min-h-[65vh] place-items-center"><LoaderCircle className="animate-spin text-[#4d8064]" size={30} /></main>;
  }

  if (!authenticated) {
    return (
      <main className="grid min-h-[75vh] place-items-center bg-[#f3f5f1] px-5 py-12">
        <form className="w-full max-w-md rounded-3xl border border-[#e4e9e2] bg-white p-7 shadow-sm sm:p-9" onSubmit={login}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f0e9] text-[#3d7256]"><ShieldCheck size={23} /></span>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#698474]">Dunfeto store management</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1e3b31]">Welcome back.</h1>
          <p className="mt-2 text-sm text-[#7c8780]">Sign in to manage products and incoming orders.</p>
          <label className="mt-6 grid gap-2 text-xs font-semibold text-[#52675a]">Admin email
            <input autoComplete="username" className="h-11 rounded-xl border border-[#dfe5de] px-3 text-sm outline-none focus:border-[#4d8064]" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label className="mt-4 grid gap-2 text-xs font-semibold text-[#52675a]">Password
            <input autoComplete="current-password" className="h-11 rounded-xl border border-[#dfe5de] px-3 text-sm outline-none focus:border-[#4d8064]" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          {loginError && <p className="mt-4 rounded-xl bg-[#fff0eb] p-3 text-xs text-[#a84d38]" role="alert">{loginError}</p>}
          <button className="mt-6 h-12 w-full rounded-full bg-[#173a31] text-sm font-bold text-white hover:bg-[#295847]" type="submit">Sign in to admin</button>
          <p className="mt-4 text-center text-[10px] leading-5 text-[#96a098]">Set ADMIN_EMAIL and ADMIN_PASSWORD in the workspace .env.local file.</p>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-[#f5f6f3]">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-7 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#728679]">Dunfeto back office</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#1a3a30]">Store dashboard</h1>
            <p className="mt-1 text-xs text-[#818b84]">Manage your catalogue and fulfill customer orders.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-[#dfe5de] bg-white px-4 py-2.5 text-xs font-semibold text-[#55685b] hover:bg-[#f6f8f4]" onClick={logout} type="button"><LogOut size={15} /> Sign out</button>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Boxes, label: "Products", value: products.length.toString(), tint: "bg-[#eaf1e9] text-[#508064]" },
            { icon: ClipboardList, label: "Orders to confirm", value: pendingOrders.toString(), tint: "bg-[#fff1e7] text-[#d47b4a]" },
            { icon: Package, label: "Units in stock", value: totalStock.toLocaleString("en-NG"), tint: "bg-[#edf0f4] text-[#627f9a]" },
          ].map(({ icon: Icon, label, value, tint }) => (
            <div className="flex items-center gap-4 rounded-2xl border border-[#e8ebe5] bg-white p-5" key={label}>
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}><Icon size={20} /></span>
              <span><span className="block text-2xl font-black text-[#1e3b31]">{value}</span><span className="mt-1 block text-xs text-[#77837b]">{label}</span></span>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-2 border-b border-[#e1e6df]">
          {[
            { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
            { id: "products" as const, label: "Products", icon: ShoppingBag },
            { id: "orders" as const, label: `Orders${pendingOrders ? ` · ${pendingOrders}` : ""}`, icon: ClipboardList },
          ].map(({ id, label, icon: Icon }) => (
            <button className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${tab === id ? "border-[#317454] text-[#286144]" : "border-transparent text-[#7b867e] hover:text-[#355645]"}`} key={id} onClick={() => setTab(id)} type="button"><Icon size={15} />{label}</button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold text-[#284437]">Recent orders</h2><p className="mt-1 text-xs text-[#88928b]">Latest customer requests</p></div><button className="text-xs font-bold text-[#4d7b60]" onClick={() => setTab("orders")} type="button">View all</button></div>
              {orders.slice(0, 5).length ? orders.slice(0, 5).map((order) => <OrderSummary key={order.id} order={order} />) : <EmptyNotice icon={ClipboardList} title="No orders yet" note="New customer orders will appear here." />}
            </section>
            <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5 sm:p-6">
              <div><h2 className="text-sm font-extrabold text-[#284437]">Quick actions</h2><p className="mt-1 text-xs text-[#88928b]">Keep the shop up to date</p></div>
              <button className="mt-5 flex w-full items-center gap-3 rounded-xl bg-[#f2f5f1] p-4 text-left hover:bg-[#eaf1e9]" onClick={() => setTab("products")} type="button"><span className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#4d7a5c]"><Plus size={19} /></span><span><span className="block text-xs font-bold text-[#355242]">Add a product</span><span className="mt-1 block text-[10px] text-[#7e8a81]">Publish an appliance to the catalogue</span></span></button>
              <button className="mt-3 flex w-full items-center gap-3 rounded-xl bg-[#fff4ec] p-4 text-left hover:bg-[#ffede0]" onClick={() => setTab("orders")} type="button"><span className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#cc7b4c]"><Truck size={19} /></span><span><span className="block text-xs font-bold text-[#65452f]">Review dispatches</span><span className="mt-1 block text-[10px] text-[#9b836f]">{pendingOrders} order{pendingOrders === 1 ? "" : "s"} awaiting confirmation</span></span></button>
              <div className="mt-5 rounded-xl border border-[#e8ede6] p-4"><p className="flex items-center gap-2 text-xs font-bold text-[#42634e]"><CircleDollarSign size={16} /> Currency</p><p className="mt-2 text-[11px] leading-5 text-[#818b84]">All Dunfeto catalogue and order totals are recorded in Nigerian Naira (₦).</p></div>
            </section>
          </div>
        )}

        {tab === "products" && (
          <div className="mt-6 grid items-start gap-5 xl:grid-cols-[360px_1fr]">
            <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5">
              <div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9f1e9] text-[#4b7d60]"><ImagePlus size={19} /></span><div><h2 className="text-sm font-extrabold text-[#284437]">Add a product</h2><p className="mt-1 text-[10px] text-[#8a948d]">Add to your Dunfeto catalogue</p></div></div>
              <form className="grid gap-3" onSubmit={addProduct}>
                <AdminField label="Product title" onChange={(value) => { updateForm("title", value); if (!form.slug || form.slug === slugify(form.title)) updateForm("slug", slugify(value)); }} required value={form.title} />
                <AdminField label="URL slug" onChange={(value) => updateForm("slug", slugify(value))} required value={form.slug} />
                <label className="grid gap-1.5 text-[10px] font-semibold text-[#566a5c]">Category<select className="h-10 rounded-lg border border-[#dfe5de] bg-white px-3 text-xs outline-none focus:border-[#4c8062]" onChange={(event) => updateForm("categoryId", event.target.value)} required value={form.categoryId}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <div className="grid grid-cols-2 gap-3"><AdminField label="Price (₦)" min="1" onChange={(value) => updateForm("price", value)} required type="number" value={form.price} /><AdminField label="Was (₦), optional" min="1" onChange={(value) => updateForm("originalPrice", value)} type="number" value={form.originalPrice} /></div>
                <AdminField label="Stock quantity" min="0" onChange={(value) => updateForm("stockQuantity", value)} required type="number" value={form.stockQuantity} />
                <AdminField label="Image URL (https)" onChange={(value) => updateForm("imageUrl", value)} type="url" value={form.imageUrl} />
                <label className="grid gap-1.5 text-[10px] font-semibold text-[#566a5c]">Description<textarea className="min-h-24 resize-y rounded-lg border border-[#dfe5de] p-3 text-xs font-normal outline-none focus:border-[#4c8062]" onChange={(event) => updateForm("description", event.target.value)} required value={form.description} /></label>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#566a5c]"><input checked={form.isFeatured} className="accent-[#377454]" onChange={(event) => updateForm("isFeatured", event.target.checked)} type="checkbox" /> Feature on storefront</label>
                {formMessage && <p className="rounded-lg bg-[#f0f5ef] p-3 text-xs text-[#467254]" role="status">{formMessage}</p>}
                <button className="mt-1 flex h-10 items-center justify-center gap-2 rounded-full bg-[#173a31] text-xs font-bold text-white hover:bg-[#2b5947] disabled:opacity-50" disabled={formBusy} type="submit">{formBusy ? <LoaderCircle className="animate-spin" size={15} /> : <Plus size={15} />} Add product</button>
              </form>
            </section>

            <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e7ebe5] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9ede7] p-5">
                <div><h2 className="text-sm font-extrabold text-[#284437]">Product management</h2><p className="mt-1 text-[10px] text-[#8a948d]">{products.length} products in inventory</p></div>
                <label className="flex h-9 items-center gap-2 rounded-lg border border-[#e1e6df] px-3"><Search size={14} className="text-[#87938a]" /><input className="w-36 text-xs outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Find product..." value={query} /></label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead className="bg-[#f7f8f5] text-[10px] uppercase tracking-wider text-[#7f8a82]"><tr><th className="px-5 py-3">Appliance</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock · edit</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
                  <tbody className="divide-y divide-[#edf0eb]">
                    {filteredProducts.map((product) => <InventoryRow busy={busyId === product.id} key={`${product.id}:${product.stockQuantity}`} onDelete={() => deleteProduct(product.id)} onSaveStock={(quantity) => saveStock(product.id, quantity)} product={product} />)}
                    {!filteredProducts.length && <tr><td className="px-5 py-12 text-center text-[#89938c]" colSpan={6}>No products found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {tab === "orders" && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7ebe5] bg-white">
            <div className="border-b border-[#e9ede7] p-5"><h2 className="text-sm font-extrabold text-[#284437]">Customer orders</h2><p className="mt-1 text-[10px] text-[#8a948d]">Review delivery details and update dispatch status.</p></div>
            <div className="divide-y divide-[#edf0eb]">
              {orders.length ? orders.map((order) => (
                <div className="grid gap-4 p-5 lg:grid-cols-[1.1fr_1fr_.8fr_auto] lg:items-center" key={order.id}>
                  <div><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-[#2c4537]">{order.customerName}</span><StatusPill status={order.status} /></div><p className="mt-1 text-[10px] text-[#859087]">{new Date(order.createdAt).toLocaleString("en-NG")} · {order.id.slice(0, 8)}</p><p className="mt-1 text-xs text-[#78847b]">{order.customerEmail} · {order.customerPhone}</p></div>
                  <div className="text-xs leading-5 text-[#66756a]"><p className="font-semibold text-[#3e5547]">{order.city}, {order.state}</p><p>{order.deliveryAddress}</p></div>
                  <div><p className="font-extrabold text-[#234335]">{formatNaira(order.totalAmount)}</p><p className="mt-1 text-[10px] text-[#88928b]">{order.items.map((item) => `${item.quantity}× ${item.title}`).join(", ")}</p></div>
                  <label className="flex items-center gap-2 text-[10px] font-semibold text-[#6d7b71]">Status
                    <select className="h-9 rounded-lg border border-[#dfe5de] bg-white px-2 text-xs capitalize outline-none focus:border-[#4c8062]" disabled={busyId === order.id} onChange={(event) => changeOrderStatus(order.id, event.target.value as Order["status"])} value={order.status}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="delivered">Delivered</option></select>
                  </label>
                </div>
              )) : <EmptyNotice icon={ClipboardList} title="No customer orders" note="Orders will appear here after checkout." />}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function AdminField({
  label,
  onChange,
  required = false,
  type = "text",
  value,
  min,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
  min?: string;
}) {
  return <label className="grid gap-1.5 text-[10px] font-semibold text-[#566a5c]">{label}<input className="h-10 rounded-lg border border-[#dfe5de] px-3 text-xs font-normal outline-none focus:border-[#4c8062]" min={min} onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} /></label>;
}

function InventoryRow({
  product,
  busy,
  onSaveStock,
  onDelete,
}: {
  product: InventoryProduct;
  busy: boolean;
  onSaveStock: (quantity: number) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [stock, setStock] = useState(String(product.stockQuantity));
  return (
    <tr>
      <td className="px-5 py-4"><p className="max-w-52 truncate font-bold text-[#304a3a]">{product.title}</p><p className="mt-1 text-[10px] text-[#8b958d]">{product.slug}</p></td>
      <td className="px-4 py-4 text-[#758078]">{product.category}</td>
      <td className="px-4 py-4 font-bold text-[#385543]">{formatNaira(product.price)}</td>
      <td className="px-4 py-4"><div className="flex items-center gap-2"><input aria-label={`Stock quantity for ${product.title}`} className="h-8 w-16 rounded-md border border-[#dfe5de] px-2 text-xs outline-none focus:border-[#4c8062]" min="0" onChange={(event) => setStock(event.target.value)} onBlur={() => { const next = Number(stock); if (Number.isInteger(next) && next !== product.stockQuantity) void onSaveStock(next); }} type="number" value={stock} />{busy && <LoaderCircle className="animate-spin text-[#598166]" size={13} />}</div></td>
      <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${product.isActive ? "bg-[#eaf3eb] text-[#4d795c]" : "bg-[#f2eeea] text-[#927661]"}`}>{product.isActive ? product.stockQuantity > 0 ? "Active" : "Out of stock" : "Hidden"}</span></td>
      <td className="px-4 py-4 text-right"><button aria-label={`Delete ${product.title}`} className="grid h-8 w-8 place-items-center rounded-lg text-[#a66b61] transition hover:bg-[#fff0ec]" disabled={busy} onClick={() => void onDelete()} type="button"><Trash2 size={15} /></button></td>
    </tr>
  );
}

function StatusPill({ status }: { status: Order["status"] }) {
  const colors = {
    pending: "bg-[#fff2e6] text-[#bf7540]",
    confirmed: "bg-[#eaf1fb] text-[#5675a0]",
    delivered: "bg-[#e9f3eb] text-[#4d805e]",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold capitalize ${colors[status]}`}>{status}</span>;
}

function OrderSummary({ order }: { order: Order }) {
  return <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0eb] pt-4"><div><p className="text-xs font-bold text-[#3b5344]">{order.customerName}</p><p className="mt-1 text-[10px] text-[#88928b]">{order.city}, {order.state} · {order.items.length} item(s)</p></div><div className="text-right"><p className="text-xs font-extrabold text-[#264634]">{formatNaira(order.totalAmount)}</p><span className="mt-1 inline-block rounded-full bg-[#fff2e6] px-2 py-0.5 text-[9px] font-bold capitalize text-[#bf7540]">{order.status}</span></div></div>;
}

function EmptyNotice({ icon: Icon, title, note }: { icon: typeof ClipboardList; title: string; note: string }) {
  return <div className="grid justify-items-center px-5 py-12 text-center"><Icon className="text-[#a6b1a8]" size={30} /><p className="mt-3 text-sm font-bold text-[#3d5546]">{title}</p><p className="mt-1 text-xs text-[#89938c]">{note}</p></div>;
}
