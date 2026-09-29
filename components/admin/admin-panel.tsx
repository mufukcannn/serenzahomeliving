"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Box,
  ChevronRight,
  CircleDollarSign,
  Command,
  CreditCard,
  ExternalLink,
  FileText,
  Layers3,
  Moon,
  Package,
  PanelLeft,
  Plus,
  Printer,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Truck,
  Trash2,
  Upload,
  Users
} from "lucide-react";
import { AdminOrder, AdminProduct, AdminRole, AdminSection, AdminVariant, adminRoleDefinitions } from "@/lib/admin-data";
import { orderWorkflow, shipmentWorkflow } from "@/lib/admin/order-workflow";
import { useAdminStore } from "@/lib/admin-store";
import { adminFieldLabel, adminStatusLabel, adminTr } from "@/lib/i18n/admin-tr";
import { catalogTaxonomy, getCollectionsForCategory } from "@/lib/catalog-taxonomy";

const navItems: Array<{ id: AdminSection; label: string; icon: React.ElementType }> = [
  { id: "dashboard", label: adminTr.nav.dashboard, icon: BarChart3 },
  { id: "products", label: adminTr.nav.products, icon: Box },
  { id: "inventory", label: adminTr.nav.inventory, icon: Package },
  { id: "orders", label: adminTr.nav.orders, icon: ShoppingBag },
  { id: "payment_logs", label: "Payment Logs", icon: CreditCard },
  { id: "customers", label: adminTr.nav.customers, icon: Users },
  { id: "shipping", label: adminTr.nav.shipping, icon: Truck },
  { id: "marketplaces", label: adminTr.nav.marketplaces, icon: Sparkles },
  { id: "campaigns", label: "Kampanyalar", icon: CircleDollarSign },
  { id: "roles", label: adminTr.nav.roles, icon: ShieldCheck },
  { id: "reports", label: adminTr.nav.reports, icon: FileText },
  { id: "settings", label: adminTr.nav.settings, icon: Settings }
];

export function AdminPanel() {
  const section = useAdminStore((state) => state.section);
  const setSection = useAdminStore((state) => state.setSection);
  const mode = useAdminStore((state) => state.mode);
  const toggleMode = useAdminStore((state) => state.toggleMode);
  const search = useAdminStore((state) => state.search);
  const setSearch = useAdminStore((state) => state.setSearch);
  const createProduct = useAdminStore((state) => state.createProduct);
  const loadProducts = useAdminStore((state) => state.loadProducts);
  const [activeRole, setActiveRole] = useState<AdminRole>("admin");
  const roleDefinition = adminRoleDefinitions.find((role) => role.id === activeRole) ?? adminRoleDefinitions[0];
  const visibleNavItems = navItems.filter((item) => roleDefinition.allowedSections.includes(item.id));
  const canCreateProducts = Boolean(roleDefinition.permissions.products?.includes("create"));

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const queryRole = new URLSearchParams(window.location.search).get("role") as AdminRole | null;
    if (queryRole && adminRoleDefinitions.some((role) => role.id === queryRole)) {
      setActiveRole(queryRole);
      return;
    }
    const storedRole = window.localStorage.getItem("serenza-admin-role") as AdminRole | null;
    if (storedRole && adminRoleDefinitions.some((role) => role.id === storedRole)) setActiveRole(storedRole);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("serenza-admin-role", activeRole);
    if (!roleDefinition.allowedSections.includes(section)) setSection(roleDefinition.allowedSections[0]);
  }, [activeRole, roleDefinition, section, setSection]);

  const shellTone = mode === "dark" ? "bg-[#11100e] text-[#f6f1e9]" : "bg-[#f7f4ef] text-stone-950";

  return (
    <main className={`min-h-screen ${shellTone}`}>
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="sticky top-0 z-20 border-b border-stone-200/60 bg-[#fbfaf7]/92 px-4 py-4 backdrop-blur lg:h-screen lg:border-b-0 lg:border-r lg:px-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Serenza Home Living</p>
              <h1 className="mt-1 truncate font-serif text-2xl leading-none text-stone-950">Admin Studio</h1>
            </Link>
            <button onClick={toggleMode} className="grid h-9 w-9 place-items-center border border-stone-200/80 text-stone-500 transition hover:bg-[#f3efe8] hover:text-stone-950">
              {mode === "dark" ? <Sun size={16} strokeWidth={1.25} /> : <Moon size={16} strokeWidth={1.25} />}
            </button>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto lg:block lg:space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`flex shrink-0 items-center gap-3 px-3 py-2.5 text-sm transition duration-300 lg:w-full ${
                    active ? "bg-stone-950 text-[#f8f1e7]" : "text-stone-600 hover:bg-[#f3efe8] hover:text-stone-950"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.35} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 hidden border border-stone-200/70 bg-[#f3efe8]/45 p-4 lg:block">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Aktif rol</p>
            <select
              value={activeRole}
              onChange={(event) => setActiveRole(event.target.value as AdminRole)}
              className="mt-3 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-2 text-sm text-stone-950 outline-none"
            >
              {adminRoleDefinitions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
            <p className="mt-3 text-sm leading-6 text-stone-600">{roleDefinition.description}</p>
          </div>

          <div className="mt-4 hidden border border-stone-200/70 bg-[#f3efe8]/45 p-4 lg:block">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">{adminTr.sections.backendReady}</p>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              {adminTr.descriptions.backendReady}
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-stone-200/60 bg-[#fbfaf7]/88 px-5 py-4 backdrop-blur md:px-8">
            <div className="mx-auto flex max-w-[1480px] items-center gap-4">
              <PanelLeft size={18} strokeWidth={1.25} className="hidden text-stone-400 lg:block" />
              <label className="flex h-10 min-w-0 flex-1 items-center gap-3 border border-stone-200/80 bg-[#fbfaf7] px-3 text-sm text-stone-500 transition focus-within:border-stone-500">
                <Search size={15} strokeWidth={1.25} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent outline-none" placeholder="Ürün, sipariş, koleksiyon ara" />
                <Command size={14} strokeWidth={1.25} className="text-stone-300" />
              </label>
              {canCreateProducts ? (
              <button onClick={createProduct} className="hidden items-center gap-2 bg-stone-950 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7] transition hover:bg-stone-800 md:inline-flex">
                <Plus size={14} strokeWidth={1.3} />
                {adminTr.actions.createProduct}
              </button>
              ) : null}
            </div>
          </header>

          <div className="mx-auto max-w-[1480px] px-5 py-6 md:px-8 md:py-8">
            {section === "dashboard" ? <Dashboard /> : null}
            {section === "products" ? <Products /> : null}
            {section === "inventory" ? <Inventory /> : null}
            {section === "orders" ? <Orders role={activeRole} /> : null}
            {section === "payment_logs" ? <PaymentLogs /> : null}
            {section === "customers" ? <Customers /> : null}
            {section === "shipping" ? <Shipping role={activeRole} /> : null}
            {section === "marketplaces" ? <Marketplaces /> : null}
            {section === "campaigns" ? <Campaigns /> : null}
            {section === "roles" ? <RolesPermissions activeRole={activeRole} /> : null}
            {section === "reports" ? <Reports /> : null}
            {section === "settings" ? <SettingsPanel role={activeRole} /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

type TrendyolPreviewProduct = {
  id?: string | number;
  title: string;
  barcode: string;
  stockCode?: string;
  quantity: number;
  salePrice: number;
  listPrice: number;
  categoryName: string;
  images: string[];
  attributes: Array<{ name: string; value: string }>;
  status: "active" | "draft" | "archived";
};

type TrendyolPreviewResponse = {
  products?: TrendyolPreviewProduct[];
  credentialsMissing?: boolean;
  error?: string;
};

const trendyolOrderStatuses = ["Created", "Picking", "Invoiced", "Shipped"] as const;
type TrendyolOrderStatus = (typeof trendyolOrderStatuses)[number];

type TrendyolOrderSyncResponse = {
  found?: number;
  uniqueFound?: number;
  imported?: number;
  skipped?: number;
  failed?: number;
  error?: string;
  statusResults?: Array<{ status: string; found: number; totalElements: number; error?: string }>;
};

const orderSourceFilters = [
  { id: "all", label: "Tüm Siparişler" },
  { id: "website", label: "Web Sitesi" },
  { id: "trendyol", label: "Trendyol" },
  { id: "hepsiburada", label: "Hepsiburada" },
  { id: "amazon", label: "Amazon" }
] as const;

type OrderSourceFilter = (typeof orderSourceFilters)[number]["id"];

type PaymentLogRow = {
  id: string;
  orderId?: string | null;
  orderNumber?: string | null;
  paymentId?: string | null;
  provider: string;
  eventType: string;
  callbackStatus?: string | null;
  resultLabel?: string | null;
  status?: string | null;
  providerRef?: string | null;
  merchantOid?: string | null;
  amount?: number | null;
  installment?: number | null;
  fraudScore?: number | null;
  riskLevel?: string | null;
  duplicate: boolean;
  hashVerified: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  errorMessage?: string | null;
  createdAt: string;
};

type CampaignRow = {
  id: string;
  name: string;
  discountType: "percent" | "fixed_amount";
  discountValue: number;
  targetType: "all" | "category" | "collection" | "product" | "variant";
  targetValue?: string | null;
  targetValues: string[];
  productIds: string[];
  variantIds: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  active: boolean;
  priority: number;
  createdAt: string;
};

type CampaignPreview = {
  affectedProducts: number;
  affectedVariants: number;
  averageOldPrice: number;
  averageNewPrice: number;
  totalDiscountImpact: number;
};

type CampaignDraft = {
  id?: string;
  name: string;
  discountType: "percent" | "fixed_amount";
  discountValue: number;
  targetType: "all" | "category" | "collection" | "product" | "variant";
  targetValues: string[];
  productIds: string[];
  variantIds: string[];
  startsAt: string;
  endsAt: string;
  active: boolean;
  priority: number;
};

type IntegrationRow = {
  id?: string;
  category: "payment" | "marketplace" | "shipping";
  provider: string;
  label: string;
  active: boolean;
  mode: "test" | "live";
  isDefault: boolean;
  syncInterval?: number | null;
  config: Record<string, string | number | boolean | null>;
  secretMasks: Record<string, string>;
  lastSyncAt?: string | null;
  lastTestStatus?: string | null;
  lastTestError?: string | null;
  lastTestedAt?: string | null;
  lastSuccessfulAt?: string | null;
  logs: Array<{ id: string; provider: string; operation: string; success: boolean; error?: string | null; createdAt: string }>;
};

type IntegrationLogRow = {
  id: string;
  category: string;
  provider: string;
  operation: string;
  success: boolean;
  statusCode?: number | null;
  error?: string | null;
  createdAt: string;
};

function useAdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/admin/orders", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Siparişler alınamadı.");
        return response.json() as Promise<{ orders?: AdminOrder[] }>;
      })
      .then((data) => {
        if (active) setOrders(data.orders ?? []);
      })
      .catch(() => {
        if (active) setOrders([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { orders, loading };
}

function Marketplaces() {
  const [products, setProducts] = useState<TrendyolPreviewProduct[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [orderStatuses, setOrderStatuses] = useState<Record<TrendyolOrderStatus, boolean>>({
    Created: true,
    Picking: true,
    Invoiced: false,
    Shipped: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Trendyol bağlantısı bekliyor.");
  const loadProducts = useAdminStore((state) => state.loadProducts);
  const setSection = useAdminStore((state) => state.setSection);

  async function fetchProducts() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/trendyol/import?size=50");
      const data = (await response.json()) as TrendyolPreviewResponse;
      if (!response.ok) throw new Error(data.error ?? "Trendyol urunleri cekilemedi.");
      const nextProducts = data.products ?? [];
      setProducts(nextProducts);
      setSelected(Object.fromEntries(nextProducts.map((product) => [product.barcode, true])));
      setMessage(data.credentialsMissing ? "Trendyol API bilgileri eksik; canlı ürün çekilemedi." : `${nextProducts.length} ürün Trendyol'dan çekildi.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Trendyol bağlantısı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function importSelected() {
    const chosen = products.filter((product) => selected[product.barcode]);
    if (!chosen.length) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/trendyol/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: chosen })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Urunler ice aktarilamadi.");
      setMessage(`${data.imported ?? 0} ürün içe aktarıldı, ${data.skipped ?? 0} ürün barcode/SKU eşleşmesi nedeniyle atlandı.`);
      await loadProducts();
      setSection("products");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ürünler içe aktarılamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function sync(type: "stock" | "price") {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/trendyol/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, barcodes: products.filter((product) => selected[product.barcode]).map((product) => product.barcode) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Senkronizasyon tamamlanamadi.");
      setMessage(`${type === "stock" ? "Stok" : "Fiyat"} senkronizasyonu tamamlandı. Güncellenen kayıt: ${data.updated ?? 0}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Senkronizasyon tamamlanamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function syncOrders() {
    const statuses = trendyolOrderStatuses.filter((status) => orderStatuses[status]);
    setLoading(true);
    try {
      const response = await fetch("/api/marketplaces/trendyol/sync-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statuses })
      });
      const data = (await response.json()) as TrendyolOrderSyncResponse;
      if (!response.ok) throw new Error(data.error ?? "Sipariş senkronizasyonu tamamlanamadı.");
      const statusSummary = data.statusResults?.map((item) => `${item.status}: ${item.found}`).join(" / ");
      setMessage(
        `Sipariş senkronizasyonu tamamlandı. Bulunan: ${data.found ?? 0}, tekil: ${data.uniqueFound ?? 0}, yeni: ${data.imported ?? 0}, mevcut: ${data.skipped ?? 0}, hata: ${data.failed ?? 0}${statusSummary ? ` (${statusSummary})` : ""}`
      );
      setSection("orders");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Siparişler senkronize edilemedi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <PageTitle
        eyebrow={adminTr.sections.marketplaceImport}
        title="Trendyol ürün aktarımı"
        description={adminTr.descriptions.marketplaces}
        action={
          <button onClick={fetchProducts} disabled={loading} className="bg-stone-950 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7] disabled:opacity-50">
            {loading ? adminTr.actions.processing : adminTr.actions.connectTrendyol}
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Bağlantı bilgileri", "TRENDYOL_SUPPLIER_ID / API_KEY / API_SECRET"],
          ["Eşleştirme", "Ürün / Varyant / Görsel / Envanter"],
          ["Güvenlik", "Barkod ve SKU varsa üzerine yazılmaz"],
          ["Görseller", "Cache + WebP pipeline hazır"]
        ].map(([title, detail]) => (
          <article key={title} className="border border-stone-200/70 bg-[#fbfaf7] p-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{title}</p>
            <p className="mt-3 text-sm leading-6 text-stone-600">{detail}</p>
          </article>
        ))}
      </div>

      <Panel title={adminTr.sections.importControls} action={message}>
        <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-stone-200/70 pb-4">
          <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Sipariş statüsü</span>
          {trendyolOrderStatuses.map((status) => (
            <label key={status} className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-stone-600">
              <input
                type="checkbox"
                checked={orderStatuses[status]}
                onChange={(event) => setOrderStatuses((current) => ({ ...current, [status]: event.target.checked }))}
                className="h-4 w-4 accent-stone-950"
              />
              {status}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={fetchProducts} disabled={loading} className="border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] transition hover:border-stone-900 disabled:opacity-50">
            {adminTr.actions.fetchProducts}
          </button>
          <button onClick={importSelected} disabled={loading || !products.length} className="bg-stone-950 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7] transition hover:bg-stone-800 disabled:opacity-50">
            {adminTr.actions.importSelected}
          </button>
          <button onClick={() => sync("stock")} disabled={loading || !products.length} className="border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] transition hover:border-stone-900 disabled:opacity-50">
            {adminTr.actions.syncStock}
          </button>
          <button onClick={() => sync("price")} disabled={loading || !products.length} className="border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] transition hover:border-stone-900 disabled:opacity-50">
            {adminTr.actions.syncPrice}
          </button>
          <button onClick={syncOrders} disabled={loading} className="border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] transition hover:border-stone-900 disabled:opacity-50">
            Siparişleri Senkronize Et
          </button>
        </div>
      </Panel>

      <Panel title={adminTr.sections.previewProducts} action={`${products.length} ürün`}>
        {products.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-stone-200/70 text-[10px] uppercase tracking-[0.18em] text-stone-400">
                <tr>
                  <th className="py-3">{adminTr.actions.import}</th>
                  <th>Ürün</th>
                  <th>{adminTr.fields.barcode}</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Fiyat</th>
                  <th>{adminTr.fields.status}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.barcode} className="border-b border-stone-200/60">
                    <td className="py-4">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[product.barcode])}
                        onChange={(event) => setSelected((current) => ({ ...current, [product.barcode]: event.target.checked }))}
                      />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-11 overflow-hidden bg-stone-100">
                          {product.images[0] ? <Image src={product.images[0]} alt={product.title} fill sizes="44px" className="object-cover" /> : null}
                        </div>
                        <div>
                          <p className="font-medium text-stone-950">{product.title}</p>
                          <p className="mt-1 text-xs text-stone-500">{product.stockCode ?? "SKU bekliyor"}</p>
                        </div>
                      </div>
                    </td>
                    <td>{product.barcode}</td>
                    <td>{product.categoryName}</td>
                    <td>{product.quantity}</td>
                    <td>
                      <p>{product.salePrice.toLocaleString("tr-TR")} TL</p>
                      {product.listPrice > product.salePrice ? <p className="text-xs text-stone-400 line-through">{product.listPrice.toLocaleString("tr-TR")} TL</p> : null}
                    </td>
                    <td><StatusPill value={product.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-56 place-items-center border border-dashed border-stone-300/80 bg-[#f3efe8]/45 text-center">
            <div>
              <p className="font-serif text-3xl text-stone-950">Henüz ürün çekilmedi.</p>
              <p className="mt-3 text-sm text-stone-500">{adminTr.descriptions.noImportProducts}</p>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Dashboard() {
  const products = useAdminStore((state) => state.products);
  const { orders, loading } = useAdminOrders();
  const lowStock = products.flatMap((product) => product.variants.map((variant) => ({ product, variant }))).filter((line) => line.variant.stock <= 3);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const marketplaceCount = orders.filter((order) => order.source !== "website").length;
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-7">
      <PageTitle eyebrow={adminTr.sections.dashboard} title={adminTr.sections.operationsCenter} description={adminTr.descriptions.dashboard} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Gelir" value={`${revenue.toLocaleString("tr-TR")} TL`} detail="Canlı sipariş havuzu" icon={CircleDollarSign} />
        <MetricCard title="Sipariş" value={loading ? "..." : String(orders.length)} detail={`${marketplaceCount} pazaryeri`} icon={ShoppingBag} />
        <MetricCard title="Ürün" value={String(products.length)} detail={`${products.filter((item) => item.status === "published").length} yayında`} icon={Package} />
        <MetricCard title="Düşük Stok" value={String(lowStock.length)} detail="Varyant bazlı takip" icon={Sparkles} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title={adminTr.sections.recentOrders} action={adminTr.actions.viewAll}>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-stone-200/70 py-3 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-stone-950">{order.orderNumber}</p>
                  <p className="mt-1 text-xs text-stone-500">{order.customer.name} · {order.address.city} · {order.source}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-900">{order.total.toLocaleString("tr-TR")} TL</p>
                  <StatusPill value={order.orderStatus} />
                </div>
              </div>
            ))}
            {!loading && recentOrders.length === 0 ? <p className="py-8 text-center text-sm text-stone-500">Henüz canlı sipariş yok.</p> : null}
          </div>
        </Panel>

        <Panel title={adminTr.sections.lowStockProducts} action={adminTr.actions.manageStock}>
          <div className="space-y-3">
            {lowStock.slice(0, 5).map(({ product, variant }) => (
              <div key={variant.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-stone-950">{product.title}</p>
                  <p className="mt-1 text-xs text-stone-500">{variant.size} / {variant.color} · {variant.sku}</p>
                </div>
                <span className="text-sm text-stone-950">{variant.stock}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title={adminTr.sections.analyticsPlaceholder} action={adminTr.actions.soon}>
        <div className="grid h-64 place-items-center border border-dashed border-stone-300/80 bg-[#fbfaf7]">
          <div className="text-center">
            <BarChart3 className="mx-auto text-stone-300" size={32} strokeWidth={1.1} />
            <p className="mt-4 text-sm text-stone-500">Gelir, dönüşüm oranı ve kanal dağılımı grafikleri için alan hazır.</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Products() {
  const products = useAdminStore((state) => state.products);
  const productsLoading = useAdminStore((state) => state.productsLoading);
  const productsError = useAdminStore((state) => state.productsError);
  const loadProducts = useAdminStore((state) => state.loadProducts);
  const search = useAdminStore((state) => state.search.toLowerCase());
  const selectedProductId = useAdminStore((state) => state.selectedProductId);
  const selectProduct = useAdminStore((state) => state.selectProduct);
  const updateProduct = useAdminStore((state) => state.updateProduct);
  const deleteProduct = useAdminStore((state) => state.deleteProduct);
  const createProduct = useAdminStore((state) => state.createProduct);
  const filtered = products.filter((product) => `${product.title} ${product.collection} ${product.category}`.toLowerCase().includes(search));
  const selected = products.find((product) => product.id === selectedProductId) ?? filtered[0];

  return (
    <div className="space-y-7">
      <PageTitle
        eyebrow={adminTr.sections.productManagement}
        title={adminTr.sections.productCatalog}
        description={adminTr.descriptions.products}
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void loadProducts()} className="border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-stone-700 transition hover:border-stone-900">{adminTr.actions.sync}</button>
            <button onClick={createProduct} className="bg-stone-950 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7]">{adminTr.actions.createProduct}</button>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel title={adminTr.nav.products} action={productsLoading ? "Yükleniyor" : `${filtered.length} kayıt`}>
          {productsError ? <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{productsError}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-stone-200/70 text-[10px] uppercase tracking-[0.18em] text-stone-400">
                <tr>
                  <th className="py-3 font-normal">Ürün</th>
                  <th className="py-3 font-normal">Durum</th>
                  <th className="py-3 font-normal">Varyant</th>
                  <th className="py-3 font-normal">Stok</th>
                  <th className="py-3 font-normal">Fiyat</th>
                  <th className="py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const stock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
                  const price = product.variants[0]?.price ?? 0;
                  return (
                    <tr key={product.id} onClick={() => selectProduct(product.id)} className={`cursor-pointer border-b border-stone-200/60 transition hover:bg-[#f3efe8]/60 ${selected?.id === product.id ? "bg-[#f3efe8]" : ""}`}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-10 overflow-hidden bg-stone-100">
                            <Image src={product.images[0]} alt={product.title} fill sizes="40px" className="object-cover" />
                          </div>
                          <div>
                            <p className="font-medium text-stone-950">{product.title}</p>
                            <p className="mt-1 text-xs text-stone-500">{product.collection}</p>
                          </div>
                        </div>
                      </td>
      <td className="py-4"><StatusPill value={product.status} /></td>
                      <td className="py-4 text-stone-600">{product.variants.length}</td>
                      <td className="py-4 text-stone-600">{stock}</td>
                      <td className="py-4 text-stone-900">{price.toLocaleString("tr-TR")} TL</td>
                      <td className="py-4 text-right">
                        <button onClick={(event) => { event.stopPropagation(); deleteProduct(product.id); }} className="text-stone-300 transition hover:text-stone-950">
                          <Trash2 size={15} strokeWidth={1.25} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {selected ? <ProductEditor product={selected} onChange={(patch) => updateProduct(selected.id, patch)} /> : null}
      </div>
    </div>
  );
}

function ProductEditor({ product, onChange }: { product: AdminProduct; onChange: (patch: Partial<AdminProduct>) => void }) {
  const statusOptions = ["draft", "published", "archived"] as const;
  const collectionOptions = getCollectionsForCategory(product.category);
  return (
    <Panel title={adminTr.sections.editProduct} action="Prisma hazır">
      <div className="space-y-5">
        <Field label="Ürün adı" value={product.title} onChange={(value) => onChange({ title: value })} />
        <Field label="Storefront kısa başlık" value={product.displayTitle ?? ""} onChange={(value) => onChange({ displayTitle: value.trim() || undefined })} />
        <Field label="Slug" value={product.slug} onChange={(value) => onChange({ slug: value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Ana kategori"
            value={product.category}
            options={catalogTaxonomy.map((category) => category.title)}
            onChange={(value) => {
              const firstCollection = getCollectionsForCategory(value)[0]?.title ?? product.collection;
              onChange({ category: value, collection: firstCollection, feedCategory: `${value} > ${firstCollection}` });
            }}
          />
          <SelectField
            label="Alt kategori / koleksiyon"
            value={product.collection}
            options={collectionOptions.length ? collectionOptions.map((collection) => collection.title) : [product.collection]}
            onChange={(value) => onChange({ collection: value, feedCategory: `${product.category} > ${value}` })}
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{adminTr.fields.status}</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {statusOptions.map((status) => (
              <button key={status} onClick={() => onChange({ status })} className={`border px-3 py-2 text-xs transition ${product.status === status ? "border-stone-900 bg-stone-950 text-[#f8f1e7]" : "border-stone-200 text-stone-500 hover:border-stone-500"}`}>
                {adminStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{adminTr.fields.images}</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {product.images.map((image) => (
              <button key={image} onClick={() => onChange({ hoverImage: image })} className={`relative aspect-[4/5] overflow-hidden border bg-stone-100 ${product.hoverImage === image ? "border-stone-950" : "border-stone-200"}`}>
                <Image src={image} alt={product.title} fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-500">{adminTr.descriptions.imageHint}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{adminTr.fields.variants}</p>
          <div className="mt-3 space-y-2">
            {product.variants.slice(0, 4).map((variant) => (
              <div key={variant.id} className="grid grid-cols-[1fr_auto] gap-3 border border-stone-200/70 p-3">
                <div>
                  <p className="text-sm text-stone-950">{variant.size} / {variant.color}</p>
                  <p className="mt-1 text-xs text-stone-500">{variant.sku}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{variant.stock} stok</p>
                  <p className="mt-1 text-stone-950">{(variant.finalPrice ?? variant.price).toLocaleString("tr-TR")} TL web</p>
                  {variant.marketplacePrice ? <p className="mt-1 text-xs text-stone-400">{variant.marketplacePrice.toLocaleString("tr-TR")} TL Trendyol</p> : null}
                  {variant.campaignName ? <p className="mt-1 text-xs text-emerald-700">{variant.campaignName}</p> : null}
                  {variant.discountPercent ? <p className="mt-1 text-xs text-stone-500">%{variant.discountPercent.toLocaleString("tr-TR")} indirim</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Field label="SEO başlığı" value={product.seoTitle ?? ""} onChange={(value) => onChange({ seoTitle: value })} />
        <Field label="SEO açıklaması" value={product.seoDescription ?? ""} onChange={(value) => onChange({ seoDescription: value })} />
        <Field label="Ana görsel alt metni" value={product.imageAltText ?? ""} onChange={(value) => onChange({ imageAltText: value })} />
        <div className="border-t border-stone-200/70 pt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Feed görünürlüğü</p>
              <p className="mt-2 text-sm text-stone-600">{adminTr.descriptions.feedVisibility}</p>
            </div>
            <button
              onClick={() => onChange({ feedEnabled: !product.feedEnabled })}
              className={`px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition ${product.feedEnabled ? "bg-stone-950 text-[#f8f1e7]" : "border border-stone-200 text-stone-500"}`}
            >
              {product.feedEnabled ? "Aktif" : "Pasif"}
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Feed başlığı" value={product.feedTitle ?? ""} onChange={(value) => onChange({ feedTitle: value })} />
            <Field label="Feed kategori eşleştirme" value={product.feedCategory ?? ""} onChange={(value) => onChange({ feedCategory: value })} />
            <Field label="Google ürün kategorisi" value={product.googleProductCategory ?? ""} onChange={(value) => onChange({ googleProductCategory: value })} />
            <Field label="Feed görsel URL" value={product.feedImage ?? ""} onChange={(value) => onChange({ feedImage: value })} />
          </div>
          <Field label="Feed açıklaması" value={product.feedDescription ?? ""} onChange={(value) => onChange({ feedDescription: value })} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Makine tarafından okunabilir özellikler</p>
          <div className="mt-3 space-y-2">
            {(product.attributes ?? []).map((attribute) => (
              <div key={attribute.name} className="flex items-center justify-between border border-stone-200/70 px-3 py-2 text-sm">
                <span className="text-stone-500">{attribute.name}</span>
                <span className="text-stone-950">{attribute.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Collections() {
  const products = useAdminStore((state) => state.products);
  const collections = buildAdminCollections(products);

  return (
    <div className="space-y-7">
      <PageTitle eyebrow={adminTr.sections.collectionManagement} title={adminTr.nav.collections} description="Sadece yayında ürün barındıran Serenza Home Living kategori ve alt koleksiyonları gösterilir." action={<button className="bg-stone-950 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7]">{adminTr.actions.createCollection}</button>} />
      <div className="grid gap-5 lg:grid-cols-3">
        {collections.map((collection) => (
          <Panel key={collection.id} title={collection.title} action={adminStatusLabel(collection.status)}>
            <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
              <Image src={collection.heroImage} alt={collection.title} fill sizes="33vw" className="object-cover" />
            </div>
            <p className="mt-4 text-sm leading-6 text-stone-600">{collection.description}</p>
            <div className="mt-4 border-t border-stone-200/70 pt-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">SEO</p>
              <p className="mt-2 text-sm text-stone-950">{collection.seoTitle}</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">{collection.seoDescription}</p>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-stone-200/70 pt-4 text-sm">
              <span className="text-stone-500">{collection.productIds.length} ürün atanmış</span>
              <Link href={`/collections/${collection.handle}`} className="inline-flex items-center gap-1 text-stone-950">Sitede Gör <ChevronRight size={14} /></Link>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function MediaLibrary() {
  const products = useAdminStore((state) => state.products);
  const media = buildAdminMedia(products);

  return (
    <div className="space-y-7">
      <PageTitle eyebrow={adminTr.sections.mediaLibrary} title="Görsel kütüphanesi" description="Demo görseller kaldırıldı; burada yalnızca ürün kataloğunda kullanılan gerçek ürün görselleri listelenir." action={<button className="inline-flex items-center gap-2 bg-stone-950 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7]"><Upload size={14} /> {adminTr.actions.upload}</button>} />
      <Panel title={adminTr.sections.assets} action={`${media.length} gerçek görsel`}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {media.map((item, index) => (
            <div key={item.id} className="group">
              <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
                <Image src={item.url} alt={item.alt} fill sizes="25vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                <span className="absolute left-3 top-3 bg-[#fbfaf7]/86 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-stone-600 backdrop-blur">#{index + 1}</span>
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <p className="line-clamp-2 text-sm text-stone-950">{item.alt}</p>
                  <p className="mt-1 text-xs text-stone-500">{item.type}</p>
                </div>
                <StatusPill value={item.optimized ? "webp ready" : "optimize"} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function buildAdminCollections(products: AdminProduct[]) {
  return catalogTaxonomy
    .map((category) => {
      const categoryProducts = products.filter((product) => product.category === category.title);
      if (!categoryProducts.length) return null;
      const primaryCollection = category.collections[0];
      const heroProduct = categoryProducts.find((product) => product.images[0]) ?? categoryProducts[0];
      const title = category.title;
      const collectionTitle = primaryCollection?.title ?? title;

      return {
        id: category.slug,
        title,
        handle: category.slug,
        description: `${collectionTitle} altında ${categoryProducts.length} ürün yayına hazır.`,
        heroImage: heroProduct.images[0] ?? "/brand-images/hali-koleksiyon.png",
        seoTitle: `${title} | Serenza Home Living`,
        seoDescription: `${title} kategorisindeki ürünler Serenza Home Living kataloğunda kategori/alt koleksiyon yapısına göre yönetilir.`,
        productIds: categoryProducts.map((product) => product.id),
        status: "visible" as const
      };
    })
    .filter((collection): collection is NonNullable<typeof collection> => Boolean(collection));
}

function buildAdminMedia(products: AdminProduct[]) {
  const seen = new Set<string>();
  return products
    .flatMap((product) =>
      product.images.map((url, index) => ({
        id: `${product.id}-${index}`,
        url,
        alt: `${product.displayTitle || product.title} görseli`,
        type: product.category,
        optimized: url.startsWith("/") || url.includes("cdn.dsmcdn.com")
      }))
    )
    .filter((media) => {
      if (!media.url || seen.has(media.url)) return false;
      seen.add(media.url);
      return true;
    })
    .slice(0, 32);
}

function Orders({ role = "admin" }: { role?: AdminRole }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<OrderSourceFilter>("all");
  const [paymentLogs, setPaymentLogs] = useState<PaymentLogRow[]>([]);

  useEffect(() => {
    let active = true;

    fetch("/api/admin/orders", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Siparişler alınamadı.");
        return response.json() as Promise<{ orders?: AdminOrder[] }>;
      })
      .then((data) => {
        if (active) setOrders(data.orders ?? []);
      })
      .catch(() => {
        if (active) setOrders([]);
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });
    fetch("/api/admin/payment-logs", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { logs?: typeof paymentLogs }) => {
        if (active) setPaymentLogs(data.logs ?? []);
      })
      .catch(() => {
        if (active) setPaymentLogs([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredOrders = sourceFilter === "all" ? orders : orders.filter((order) => order.source === sourceFilter);
  const filterCounts = orderSourceFilters.reduce<Record<OrderSourceFilter, number>>((counts, filter) => {
    counts[filter.id] = filter.id === "all" ? orders.length : orders.filter((order) => order.source === filter.id).length;
    return counts;
  }, {} as Record<OrderSourceFilter, number>);

  return (
    <div className="space-y-7">
      <PageTitle eyebrow={adminTr.sections.orderManagement} title={adminTr.nav.orders} description={adminTr.descriptions.orders} />
      <Panel title={adminTr.sections.orderWorkflow} action="oluşturuldu → teslim edildi">
        <div className="grid gap-3 md:grid-cols-5">
          {orderWorkflow.map((status, index) => (
            <div key={status} className="relative border border-stone-200/70 bg-[#f3efe8]/45 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Adım {index + 1}</p>
              <p className="mt-3 text-sm font-medium text-stone-950">{adminStatusLabel(status)}</p>
              {index < orderWorkflow.length - 1 ? <span className="absolute -right-2 top-1/2 hidden h-px w-4 bg-stone-300 md:block" /> : null}
            </div>
          ))}
        </div>
      </Panel>
      <Panel title={adminTr.sections.orderTable} action={`${filteredOrders.length} kayıt`}>
        <div className="mb-4 flex flex-wrap gap-2 border-b border-stone-200/70 pb-4">
          {orderSourceFilters.map((filter) => {
            const active = sourceFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSourceFilter(filter.id)}
                className={`inline-flex items-center gap-2 border px-3 py-2 text-[10px] uppercase tracking-[0.16em] transition ${
                  active ? "border-stone-950 bg-stone-950 text-[#f8f1e7]" : "border-stone-300 text-stone-600 hover:border-stone-900 hover:text-stone-950"
                }`}
              >
                {filter.label}
                <span className={`text-[10px] ${active ? "text-[#f8f1e7]/75" : "text-stone-400"}`}>{filterCounts[filter.id] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-stone-200/70 text-[10px] uppercase tracking-[0.18em] text-stone-400">
              <tr>
                <th className="py-3 font-normal">Sipariş</th>
                <th className="py-3 font-normal">Müşteri</th>
                <th className="py-3 font-normal">Kaynak</th>
                <th className="py-3 font-normal">Ödeme</th>
                <th className="py-3 font-normal">Durum</th>
                <th className="py-3 font-normal">Toplam</th>
                <th className="py-3 font-normal">{adminTr.fields.carrier}</th>
                <th className="py-3 font-normal">{adminTr.fields.tracking}</th>
                <th className="py-3 font-normal">{adminTr.fields.shipment}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-stone-200/60">
                  <td className="py-4">
                    <Link href={`/admin/orders/${order.id}?role=${role}`} className="font-medium text-stone-950 transition hover:text-stone-500">{order.orderNumber}</Link>
                    <p className="mt-1 text-xs text-stone-500">{order.createdAt}</p>
                  </td>
                  <td className="py-4">
                    <p>{order.customer.name}</p>
                    <p className="mt-1 text-xs text-stone-500">{order.customer.email}</p>
                  </td>
                  <td className="py-4"><ChannelBadge source={order.source} /></td>
                  <td className="py-4"><StatusPill value={order.paymentStatus} /></td>
                  <td className="py-4">
                    <select defaultValue={order.orderStatus} className="border border-stone-200 bg-[#fbfaf7] px-3 py-2 outline-none">
                      {orderWorkflow.map((status) => (
                        <option key={status} value={status}>{adminStatusLabel(status)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4">{order.total.toLocaleString("tr-TR")} TL</td>
                  <td className="py-4 text-stone-500">{order.carrier ?? "Atanmadı"}</td>
                  <td className="py-4">
                    {order.trackingCode ? (
                      <a href={order.trackingUrl ?? "#"} target="_blank" className="inline-flex items-center gap-1 text-stone-950 transition hover:text-stone-500">
                        {order.trackingCode}
                        <ExternalLink size={12} strokeWidth={1.25} />
                      </a>
                    ) : (
                      <span className="text-stone-400">Bekliyor</span>
                    )}
                  </td>
                  <td className="py-4">
                    <select defaultValue={order.shipmentStatus} className="border border-stone-200 bg-[#fbfaf7] px-3 py-2 outline-none">
                      {shipmentWorkflow.map((status) => (
                        <option key={status} value={status}>{adminStatusLabel(status)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!ordersLoading && !filteredOrders.length ? <p className="py-5 text-sm text-stone-500">Bu kaynakta canlı sipariş bulunamadı.</p> : null}
        </div>
      </Panel>
      <Panel title={adminTr.sections.shippingFields} action="kargo firması / takip">
        <div className="grid gap-3 md:grid-cols-4">
          {["carrier", "carrierProvider", "trackingCode", "trackingUrl", "shipmentStatus", "shippingServiceLevel", "shippingCost", "shippingRequiresReview"].map((field) => (
            <div key={field} className="border border-stone-200/70 bg-[#f3efe8]/45 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{adminTr.fields.field}</p>
              <p className="mt-3 text-sm font-medium text-stone-950">{adminFieldLabel(field)}</p>
            </div>
          ))}
        </div>
      </Panel>
      <PaymentLogTable logs={paymentLogs} />
    </div>
  );
}

function PaymentLogs() {
  const [logs, setLogs] = useState<PaymentLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/payment-logs", { cache: "no-store" });
      const data = (await response.json()) as { logs?: PaymentLogRow[] };
      setLogs(data.logs ?? []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, []);

  const callbackCount = logs.filter((log) => log.eventType.startsWith("webhook_")).length;
  const verified = logs.filter((log) => log.hashVerified).length;
  const duplicates = logs.filter((log) => log.duplicate).length;

  return (
    <div className="space-y-7">
      <PageTitle
        eyebrow="Payment Logs"
        title="Ödeme olay kayıtları"
        description="PayTR checkout, callback, duplicate, hash ve tutar doğrulama kayıtları bu ekranda izlenir."
        action={
          <button onClick={() => void loadLogs()} className="border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] transition hover:border-stone-900">
            Yenile
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Log" value={String(logs.length)} detail={loading ? "Yükleniyor" : "Son 100 kayıt"} icon={CreditCard} />
        <MetricCard title="Callback" value={String(callbackCount)} detail="PayTR dönüş kaydı" icon={CreditCard} />
        <MetricCard title="Hash" value={String(verified)} detail="Doğrulanan callback" icon={ShieldCheck} />
        <MetricCard title="Duplicate" value={String(duplicates)} detail="Tekrar callback" icon={Command} />
      </div>
      <PaymentLogTable logs={logs} />
    </div>
  );
}

function PaymentLogTable({ logs }: { logs: PaymentLogRow[] }) {
  return (
    <Panel title="Payment Logs" action={`${logs.length} kayıt`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="border-b border-stone-200/70 text-[10px] uppercase tracking-[0.18em] text-stone-400">
            <tr>
              <th className="py-3 font-normal">Sipariş</th>
              <th className="py-3 font-normal">Tarih</th>
              <th className="py-3 font-normal">Tutar</th>
              <th className="py-3 font-normal">Sağlayıcı</th>
              <th className="py-3 font-normal">Callback Durumu</th>
              <th className="py-3 font-normal">Sonuç</th>
              <th className="py-3 font-normal">IP</th>
              <th className="py-3 font-normal">Hash</th>
              <th className="py-3 font-normal">Merchant OID</th>
              <th className="py-3 font-normal">Provider Ref</th>
              <th className="py-3 font-normal">Duplicate</th>
              <th className="py-3 font-normal">Hata</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-stone-200/60 align-top">
                <td className="py-4">
                  {log.orderId ? (
                    <Link href={`/admin/orders/${log.orderId}?role=admin`} className="font-medium text-stone-950 transition hover:text-stone-500">
                      {log.orderNumber ?? log.orderId}
                    </Link>
                  ) : (
                    <span className="text-stone-400">-</span>
                  )}
                </td>
                <td className="py-4 text-stone-500">{new Date(log.createdAt).toLocaleString("tr-TR")}</td>
                <td className="py-4">{log.amount ? `${log.amount.toLocaleString("tr-TR")} TL` : "-"}</td>
                <td className="py-4"><StatusPill value={log.provider} /></td>
                <td className="py-4">
                  <p className="text-stone-800">{log.callbackStatus ?? log.eventType}</p>
                  <p className="mt-1 text-xs text-stone-400">{log.eventType}</p>
                </td>
                <td className="py-4"><PaymentResultBadge label={log.resultLabel ?? "Kayıt"} status={log.status} hasError={Boolean(log.errorMessage)} /></td>
                <td className="py-4 text-xs text-stone-500">{log.ipAddress ?? "-"}</td>
                <td className="py-4">{log.hashVerified ? "doğrulandı" : "başarısız/bekliyor"}</td>
                <td className="py-4 text-xs text-stone-500">{log.merchantOid ?? "-"}</td>
                <td className="py-4 text-xs text-stone-500">{log.providerRef ?? "-"}</td>
                <td className="py-4">{log.duplicate ? "evet" : "hayır"}</td>
                <td className="max-w-[240px] py-4 text-xs leading-5 text-red-700">{log.errorMessage ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length ? <p className="py-5 text-sm text-stone-500">Henüz ödeme logu oluşmadı.</p> : null}
      </div>
    </Panel>
  );
}

function Inventory() {
  const products = useAdminStore((state) => state.products);
  const rows = products.flatMap((product) =>
    product.variants.map((variant) => ({
      product,
      variant,
      available: Math.max(0, variant.stock),
      reserved: Math.max(0, Math.min(2, variant.stock))
    }))
  );
  const lowStock = rows.filter((row) => row.available <= 3);

  return (
    <div className="space-y-7">
      <PageTitle eyebrow={adminTr.sections.inventoryManagement} title="Stok ve rezervasyon merkezi" description="Ürün varyantları, stok seviyeleri, rezervasyonlar ve kanal bazlı stok kararları bu modülde toplanır." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Toplam SKU" value={String(rows.length)} detail="Varyant bazlı takip" icon={Package} />
        <MetricCard title="Düşük stok" value={String(lowStock.length)} detail="3 ve altı adet" icon={Sparkles} />
        <MetricCard title="Kanal stokları" value="Hazır" detail="Website + pazaryerleri" icon={Layers3} />
      </div>
      <Panel title="Envanter tablosu" action={`${rows.length} SKU`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-stone-200/70 text-[10px] uppercase tracking-[0.18em] text-stone-400">
              <tr>
                <th className="py-3 font-normal">SKU</th>
                <th className="py-3 font-normal">Ürün</th>
                <th className="py-3 font-normal">Varyant</th>
                <th className="py-3 font-normal">Elde</th>
                <th className="py-3 font-normal">Rezerve</th>
                <th className="py-3 font-normal">Satılabilir</th>
                <th className="py-3 font-normal">Durum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ product, variant, available, reserved }) => (
                <tr key={variant.id} className="border-b border-stone-200/60">
                  <td className="py-4 font-medium text-stone-950">{variant.sku}</td>
                  <td className="py-4 text-stone-700">{product.title}</td>
                  <td className="py-4 text-stone-500">{variant.size} / {variant.color}</td>
                  <td className="py-4">{variant.stock}</td>
                  <td className="py-4">{reserved}</td>
                  <td className="py-4">{Math.max(0, available - reserved)}</td>
                  <td className="py-4"><StatusPill value={available <= 3 ? "low_stock" : "active"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Customers() {
  const { orders, loading } = useAdminOrders();
  const customers = orders.map((order) => ({
    id: order.customer.email,
    name: order.customer.name,
    email: order.customer.email,
    phone: order.customer.phone,
    city: order.address.city,
    orderCount: orders.filter((item) => item.customer.email === order.customer.email).length,
    total: orders.filter((item) => item.customer.email === order.customer.email).reduce((sum, item) => sum + item.total, 0)
  }));
  const uniqueCustomers = Array.from(new Map(customers.map((customer) => [customer.email, customer])).values());

  return (
    <div className="space-y-7">
      <PageTitle eyebrow={adminTr.sections.customerManagement} title="Müşteri havuzu" description="Website ve pazaryeri siparişlerinden gelen müşteri kayıtları destek ve muhasebe süreçleri için tek yerde tutulur." />
      <Panel title="Müşteri listesi" action={`${uniqueCustomers.length} kayıt`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-stone-200/70 text-[10px] uppercase tracking-[0.18em] text-stone-400">
              <tr>
                <th className="py-3 font-normal">Müşteri</th>
                <th className="py-3 font-normal">Telefon</th>
                <th className="py-3 font-normal">Şehir</th>
                <th className="py-3 font-normal">Sipariş</th>
                <th className="py-3 font-normal">Toplam harcama</th>
              </tr>
            </thead>
            <tbody>
              {uniqueCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-stone-200/60">
                  <td className="py-4">
                    <p className="font-medium text-stone-950">{customer.name}</p>
                    <p className="mt-1 text-xs text-stone-500">{customer.email}</p>
                  </td>
                  <td className="py-4 text-stone-600">{customer.phone}</td>
                  <td className="py-4 text-stone-600">{customer.city}</td>
                  <td className="py-4">{customer.orderCount}</td>
                  <td className="py-4">{customer.total.toLocaleString("tr-TR")} TL</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && uniqueCustomers.length === 0 ? <p className="py-10 text-center text-sm text-stone-500">Henüz canlı müşteri kaydı yok.</p> : null}
        </div>
      </Panel>
    </div>
  );
}

function Shipping({ role = "admin" }: { role?: AdminRole }) {
  const { orders, loading } = useAdminOrders();
  const ready = orders.filter((order) => order.shipmentStatus === "label_created" || order.shipmentStatus === "not_ready");
  const inTransit = orders.filter((order) => order.shipmentStatus === "in_transit");

  return (
    <div className="space-y-7">
      <PageTitle
        eyebrow={adminTr.sections.shippingManagement}
        title="Sevkiyat işleme ekranı"
        description="Sevkiyat rolü bu modül ve sipariş işleme ekranı dışında hiçbir modüle erişemez."
        action={
          <button className="inline-flex items-center gap-2 bg-stone-950 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7]">
            <Printer size={14} strokeWidth={1.25} />
            Toplu Etiket Yazdır
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Hazırlanacak" value={String(ready.length)} detail="Etiket / paketleme" icon={Truck} />
        <MetricCard title="Taşımada" value={String(inTransit.length)} detail="Kargo takipte" icon={Package} />
        <MetricCard title="İstisna" value={String(orders.filter((order) => order.shipmentStatus === "exception").length)} detail="Manuel kontrol" icon={Sparkles} />
      </div>
      <Panel title="Kargo operasyon kuyruğu" action="tek havuz">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-stone-200/70 text-[10px] uppercase tracking-[0.18em] text-stone-400">
              <tr>
                <th className="py-3 font-normal">Sipariş</th>
                <th className="py-3 font-normal">Kanal</th>
                <th className="py-3 font-normal">Müşteri</th>
                <th className="py-3 font-normal">Kargo durumu</th>
                <th className="py-3 font-normal">Firma</th>
                <th className="py-3 font-normal">Takip</th>
                <th className="py-3 font-normal">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-stone-200/60">
                  <td className="py-4 font-medium text-stone-950">{order.orderNumber}</td>
                  <td className="py-4"><StatusPill value={order.source} /></td>
                  <td className="py-4 text-stone-600">{order.customer.name}</td>
                  <td className="py-4"><StatusPill value={order.shipmentStatus} /></td>
                  <td className="py-4 text-stone-600">{order.carrier ?? "Atanmadı"}</td>
                  <td className="py-4 text-stone-600">{order.trackingCode ?? "Bekliyor"}</td>
                  <td className="py-4">
                    <Link href={`/admin/orders/${order.id}?role=${role}`} className="inline-flex items-center gap-1 text-stone-950">
                      İşle
                      <ChevronRight size={14} strokeWidth={1.25} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && orders.length === 0 ? <p className="py-10 text-center text-sm text-stone-500">Sevkiyat kuyruğunda canlı sipariş yok.</p> : null}
        </div>
      </Panel>
    </div>
  );
}

function Campaigns() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Kampanya motoru web fiyatını Trendyol fiyatı üzerinden hesaplar.");
  const [preview, setPreview] = useState<CampaignPreview | null>(null);
  const products = useAdminStore((state) => state.products);
  const loadProducts = useAdminStore((state) => state.loadProducts);
  const [draft, setDraft] = useState<CampaignDraft>({
    name: "",
    discountType: "percent",
    discountValue: 15,
    targetType: "all",
    targetValues: [],
    productIds: [],
    variantIds: [],
    startsAt: "",
    endsAt: "",
    active: true,
    priority: 100
  });

  const categories = Array.from(new Set(products.map((product) => product.category))).filter(Boolean);
  const collections = Array.from(new Set(products.map((product) => product.collection))).filter(Boolean);
  const variants = products.flatMap((product) => product.variants.map((variant) => ({ ...variant, productTitle: product.displayTitle || product.title })));

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/campaigns", { cache: "no-store" });
      const data = (await response.json()) as { campaigns?: CampaignRow[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Kampanyalar alınamadı.");
      setCampaigns(data.campaigns ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kampanyalar alınamadı.");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadCampaigns(), loadProducts()]);
  }, [loadCampaigns, loadProducts]);

  const payloadFromDraft = useCallback((nextDraft = draft) => {
    return {
      id: nextDraft.id,
      name: nextDraft.name || "Yeni kampanya",
      discountType: nextDraft.discountType,
      discountValue: nextDraft.discountValue,
      targetType: nextDraft.targetType,
      targetValue: nextDraft.targetValues[0] ?? null,
      targetValues: nextDraft.targetType === "category" || nextDraft.targetType === "collection" ? nextDraft.targetValues : [],
      productIds: nextDraft.targetType === "product" ? nextDraft.productIds : [],
      variantIds: nextDraft.targetType === "variant" ? nextDraft.variantIds : [],
      startsAt: nextDraft.startsAt || null,
      endsAt: nextDraft.endsAt || null,
      active: nextDraft.active,
      priority: nextDraft.priority
    };
  }, [draft]);

  const previewCampaign = useCallback(async () => {
    if (!draft.name.trim() && draft.discountValue <= 0) {
      setPreview(null);
      return;
    }
    try {
      const response = await fetch("/api/admin/campaigns/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromDraft())
      });
      const data = (await response.json()) as { preview?: CampaignPreview; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Önizleme hesaplanamadı.");
      setPreview(data.preview ?? null);
    } catch (error) {
      setPreview(null);
      setMessage(error instanceof Error ? error.message : "Önizleme hesaplanamadı.");
    }
  }, [draft, payloadFromDraft]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void previewCampaign();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [previewCampaign, products.length]);

  async function saveCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(draft.id ? `/api/admin/campaigns/${draft.id}` : "/api/admin/campaigns", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromDraft())
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Kampanya oluşturulamadı.");
      resetDraft();
      setMessage(draft.id ? "Kampanya güncellendi." : "Kampanya oluşturuldu; web fiyatları pricing engine üzerinden yeniden hesaplanacak.");
      await Promise.all([loadCampaigns(), loadProducts()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kampanya kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleCampaign(campaign: CampaignRow) {
    await mutateCampaign(campaign.id, { active: !campaign.active }, "Kampanya durumu güncellendi.");
  }

  async function deleteCampaign(campaign: CampaignRow) {
    if (!window.confirm(`${campaign.name} silinsin mi?`)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaign.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Kampanya silinemedi.");
      setMessage("Kampanya silindi.");
      await Promise.all([loadCampaigns(), loadProducts()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kampanya silinemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function mutateCampaign(id: string, patch: Partial<CampaignDraft>, successMessage: string) {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Kampanya güncellenemedi.");
      setMessage(successMessage);
      await Promise.all([loadCampaigns(), loadProducts()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kampanya güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  function editCampaign(campaign: CampaignRow) {
    setDraft({
      id: campaign.id,
      name: campaign.name,
      discountType: campaign.discountType,
      discountValue: campaign.discountValue,
      targetType: campaign.targetType,
      targetValues: campaign.targetValues.length ? campaign.targetValues : campaign.targetValue ? [campaign.targetValue] : [],
      productIds: campaign.productIds,
      variantIds: campaign.variantIds,
      startsAt: campaign.startsAt ? toDatetimeLocal(campaign.startsAt) : "",
      endsAt: campaign.endsAt ? toDatetimeLocal(campaign.endsAt) : "",
      active: campaign.active,
      priority: campaign.priority
    });
  }

  function resetDraft() {
    setDraft({
      name: "",
      discountType: "percent",
      discountValue: 15,
      targetType: "all",
      targetValues: [],
      productIds: [],
      variantIds: [],
      startsAt: "",
      endsAt: "",
      active: true,
      priority: 100
    });
    setPreview(null);
  }

  function updateDraft(patch: Partial<CampaignDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="space-y-7">
      <PageTitle eyebrow="Pricing Engine" title="Kampanyalar" description="Trendyol fiyatı ana kaynak olarak saklanır; web satış fiyatı aktif kampanya kurallarından hesaplanır." />
      <Panel title="Kampanya oluştur" action={saving ? "kaydediliyor" : "aktif"}>
        <form onSubmit={saveCampaign} className="grid gap-4 lg:grid-cols-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Kampanya adı</span>
            <input value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} required className="mt-2 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-3 text-sm outline-none" placeholder="Web %15" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">İndirim tipi</span>
            <select value={draft.discountType} onChange={(event) => updateDraft({ discountType: event.target.value as CampaignDraft["discountType"] })} className="mt-2 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-3 text-sm outline-none">
              <option value="percent">Yüzde</option>
              <option value="fixed_amount">Sabit tutar</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">İndirim değeri</span>
            <input value={draft.discountValue} onChange={(event) => updateDraft({ discountValue: Number(event.target.value) })} type="number" min="0" max={draft.discountType === "percent" ? 80 : undefined} step="0.01" required className="mt-2 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-3 text-sm outline-none" placeholder="15" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Öncelik</span>
            <input value={draft.priority} onChange={(event) => updateDraft({ priority: Number(event.target.value) })} type="number" className="mt-2 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-3 text-sm outline-none" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Hedef</span>
            <select
              value={draft.targetType}
              onChange={(event) =>
                updateDraft({ targetType: event.target.value as CampaignDraft["targetType"], targetValues: [], productIds: [], variantIds: [] })
              }
              className="mt-2 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-3 text-sm outline-none"
            >
              <option value="all">Tüm ürünler</option>
              <option value="category">Kategori</option>
              <option value="collection">Koleksiyon</option>
              <option value="product">Belirli ürünler</option>
              <option value="variant">Belirli varyantlar</option>
            </select>
          </label>
          <TargetSelector draft={draft} categories={categories} collections={collections} products={products} variants={variants} onChange={updateDraft} />
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Başlangıç</span>
            <input value={draft.startsAt} onChange={(event) => updateDraft({ startsAt: event.target.value })} type="datetime-local" className="mt-2 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-3 text-sm outline-none" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Bitiş</span>
            <input value={draft.endsAt} onChange={(event) => updateDraft({ endsAt: event.target.value })} type="datetime-local" className="mt-2 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-3 text-sm outline-none" />
          </label>
          <div className="flex items-center gap-4 lg:col-span-4">
            <label className="inline-flex items-center gap-2 text-sm text-stone-700">
              <input checked={draft.active} onChange={(event) => updateDraft({ active: event.target.checked })} type="checkbox" />
              Aktif
            </label>
            <button disabled={saving} className="bg-stone-950 px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7] disabled:opacity-50">
              {draft.id ? "Kampanya Güncelle" : "Kampanya Oluştur"}
            </button>
            {draft.id ? (
              <button type="button" onClick={resetDraft} className="border border-stone-300 px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-stone-600">
                Vazgeç
              </button>
            ) : null}
            <p className="text-sm text-stone-500">{message}</p>
          </div>
        </form>
      </Panel>
      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard title="Etkilenen Ürün" value={String(preview?.affectedProducts ?? 0)} detail="Önizleme" icon={Box} />
        <MetricCard title="Etkilenen Varyant" value={String(preview?.affectedVariants ?? 0)} detail="Önizleme" icon={Layers3} />
        <MetricCard title="Ortalama Eski" value={`${(preview?.averageOldPrice ?? 0).toLocaleString("tr-TR")} TL`} detail="Base fiyat" icon={CircleDollarSign} />
        <MetricCard title="Ortalama Yeni" value={`${(preview?.averageNewPrice ?? 0).toLocaleString("tr-TR")} TL`} detail="Final fiyat" icon={CircleDollarSign} />
        <MetricCard title="Toplam Etki" value={`${(preview?.totalDiscountImpact ?? 0).toLocaleString("tr-TR")} TL`} detail="İndirim" icon={Sparkles} />
      </div>
      <Panel title="Kampanya listesi" action={loading ? "yükleniyor" : `${campaigns.length} kayıt`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-stone-200/70 text-[10px] uppercase tracking-[0.18em] text-stone-400">
              <tr>
                <th className="py-3 font-normal">Ad</th>
                <th className="py-3 font-normal">İndirim</th>
                <th className="py-3 font-normal">Hedef</th>
                <th className="py-3 font-normal">Tarih</th>
                <th className="py-3 font-normal">Öncelik</th>
                <th className="py-3 font-normal">Durum</th>
                <th className="py-3 font-normal">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-stone-200/60">
                  <td className="py-4 font-medium text-stone-950">{campaign.name}</td>
                  <td className="py-4">{campaign.discountType === "percent" ? `%${campaign.discountValue}` : `${campaign.discountValue.toLocaleString("tr-TR")} TL`}</td>
                  <td className="py-4 text-stone-600">{campaign.targetType} · {campaignTargetLabel(campaign)}</td>
                  <td className="py-4 text-xs text-stone-500">{campaign.startsAt ? new Date(campaign.startsAt).toLocaleDateString("tr-TR") : "hemen"} - {campaign.endsAt ? new Date(campaign.endsAt).toLocaleDateString("tr-TR") : "süresiz"}</td>
                  <td className="py-4">{campaign.priority}</td>
                  <td className="py-4"><StatusPill value={campaign.active ? "active" : "draft"} /></td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => toggleCampaign(campaign)} className="border border-stone-300 px-3 py-2 text-[10px] uppercase tracking-[0.14em]">{campaign.active ? "Pasifleştir" : "Aktifleştir"}</button>
                      <button onClick={() => editCampaign(campaign)} className="border border-stone-300 px-3 py-2 text-[10px] uppercase tracking-[0.14em]">Düzenle</button>
                      <button onClick={() => deleteCampaign(campaign)} className="border border-red-200 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-red-700">Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !campaigns.length ? <p className="py-8 text-sm text-stone-500">Henüz kampanya yok.</p> : null}
        </div>
      </Panel>
    </div>
  );
}

function TargetSelector({
  draft,
  categories,
  collections,
  products,
  variants,
  onChange
}: {
  draft: CampaignDraft;
  categories: string[];
  collections: string[];
  products: AdminProduct[];
  variants: Array<AdminVariant & { productTitle: string }>;
  onChange: (patch: Partial<CampaignDraft>) => void;
}) {
  if (draft.targetType === "all") {
    return (
      <div className="border border-stone-200 bg-[#f3efe8]/45 px-3 py-3 text-sm text-stone-500">
        Tüm aktif ürünler ve varyantlar hedeflenir.
      </div>
    );
  }

  if (draft.targetType === "category") {
    return <MultiSelect label="Kategoriler" values={draft.targetValues} options={categories.map((value) => ({ value, label: value }))} onChange={(targetValues) => onChange({ targetValues })} />;
  }

  if (draft.targetType === "collection") {
    return <MultiSelect label="Koleksiyonlar" values={draft.targetValues} options={collections.map((value) => ({ value, label: value }))} onChange={(targetValues) => onChange({ targetValues })} />;
  }

  if (draft.targetType === "product") {
    return <MultiSelect label="Ürünler" values={draft.productIds} options={products.map((product) => ({ value: product.id, label: product.displayTitle || product.title }))} onChange={(productIds) => onChange({ productIds })} />;
  }

  return (
    <MultiSelect
      label="Varyantlar"
      values={draft.variantIds}
      options={variants.map((variant) => ({ value: variant.id, label: `${variant.productTitle} · ${variant.size} / ${variant.color} · ${variant.sku}` }))}
      onChange={(variantIds) => onChange({ variantIds })}
    />
  );
}

function MultiSelect({ label, values, options, onChange }: { label: string; values: string[]; options: Array<{ value: string; label: string }>; onChange: (values: string[]) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{label}</span>
      <select
        multiple
        value={values}
        onChange={(event) => onChange(Array.from(event.currentTarget.selectedOptions).map((option) => option.value))}
        className="mt-2 h-[122px] w-full border border-stone-200 bg-[#fbfaf7] px-3 py-3 text-sm outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function campaignTargetLabel(campaign: CampaignRow) {
  if (campaign.targetType === "all") return "Tüm ürünler";
  if (campaign.targetType === "product") return `${campaign.productIds.length} ürün`;
  if (campaign.targetType === "variant") return `${campaign.variantIds.length} varyant`;
  return (campaign.targetValues.length ? campaign.targetValues : campaign.targetValue ? [campaign.targetValue] : []).join(", ") || "-";
}

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function RolesPermissions({ activeRole }: { activeRole: AdminRole }) {
  return (
    <div className="space-y-7">
      <PageTitle eyebrow={adminTr.sections.rolesPermissions} title="Rol ve yetki matrisi" description="Bu matris Prisma RolePermission tablosuyla uyumlu tasarlandı; API guard katmanı aynı modül/aksiyon listesini kullanabilir." />
      <div className="grid gap-5 xl:grid-cols-2">
        {adminRoleDefinitions.map((role) => (
          <Panel key={role.id} title={role.label} action={role.id === activeRole ? "aktif" : undefined}>
            <p className="text-sm leading-6 text-stone-600">{role.description}</p>
            <div className="mt-5 space-y-3">
              {Object.entries(role.permissions).map(([section, actions]) => (
                <div key={section} className="grid gap-3 border border-stone-200/70 bg-[#f3efe8]/45 p-3 sm:grid-cols-[150px_1fr]">
                  <p className="text-sm font-medium text-stone-950">{sectionLabel(section as AdminSection)}</p>
                  <div className="flex flex-wrap gap-2">
                    {actions?.map((action) => (
                      <StatusPill key={action} value={action} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Reports() {
  const { orders, loading } = useAdminOrders();
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const marketplaceRevenue = orders.filter((order) => order.source !== "website").reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-7">
      <PageTitle eyebrow={adminTr.sections.reports} title="Operasyon raporları" description="Satış, kanal dağılımı, kârlılık, stok ve sevkiyat raporları için temel OMS raporlama alanı." />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Gelir" value={`${revenue.toLocaleString("tr-TR")} TL`} detail="Tüm kanallar" icon={CircleDollarSign} />
        <MetricCard title="Pazaryeri" value={`${marketplaceRevenue.toLocaleString("tr-TR")} TL`} detail="Trendyol / Amazon hazır" icon={Sparkles} />
        <MetricCard title="Sipariş" value={loading ? "..." : String(orders.length)} detail="Tek havuz" icon={ShoppingBag} />
        <MetricCard title="Fatura bekleyen" value={String(orders.filter((order) => order.invoice.status === "not_issued").length)} detail="Muhasebe kuyruğu" icon={FileText} />
      </div>
      <Panel title="Rapor kırılımları" action="export hazır">
        <div className="grid gap-3 md:grid-cols-3">
          {["Kanal bazlı satış", "Kargo performansı", "Fatura durumu", "Ödeme sağlayıcıları", "Düşük stok", "Kârlılık"].map((report) => (
            <div key={report} className="border border-stone-200/70 bg-[#f3efe8]/45 p-4">
              <p className="text-sm font-medium text-stone-950">{report}</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">CSV/PDF export katmanına bağlanmaya hazır.</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function SettingsPanel({ role }: { role: AdminRole }) {
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [logs, setLogs] = useState<IntegrationLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("API bilgileri admin panelden yönetilir; .env sadece fallback olarak kullanılır.");

  const loadIntegrations = useCallback(async () => {
    if (role !== "admin") {
      setLoading(false);
      setMessage("Bu ekrana sadece Admin rolü erişebilir.");
      setIntegrations([]);
      setLogs([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/integrations", { cache: "no-store", headers: { "x-admin-role": role } });
      if (!response.ok) {
        const errorData = await readApiJson<{ error?: string }>(response);
        throw new Error(errorData.error ?? "Entegrasyonlar alınamadı.");
      }
      const data = await readApiJson<{ integrations?: IntegrationRow[]; logs?: IntegrationLogRow[]; error?: string }>(response);
      setIntegrations(data.integrations ?? []);
      setLogs(data.logs ?? []);
      setMessage(data.error ?? "API bilgileri admin panelden yönetilir; .env sadece fallback olarak kullanılır.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Entegrasyonlar alınamadı.");
      setIntegrations([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void loadIntegrations();
  }, [loadIntegrations]);

  async function saveIntegration(integration: IntegrationRow, form: FormData) {
    const key = `${integration.category}:${integration.provider}`;
    setSavingKey(key);
    try {
      const secrets: Record<string, string> = {};
      for (const [field, value] of form.entries()) {
        if (String(field).startsWith("secret.")) {
          const secretKey = String(field).replace("secret.", "");
          const secretValue = String(value).trim();
          if (secretValue) secrets[secretKey] = secretValue;
        }
      }
      const config: Record<string, string | number | boolean | null> = {};
      for (const [field, value] of form.entries()) {
        if (String(field).startsWith("config.")) {
          const configKey = String(field).replace("config.", "");
          config[configKey] = String(value);
        }
      }
      const response = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-role": role },
        body: JSON.stringify({
          category: integration.category,
          provider: integration.provider,
          active: form.get("active") === "on",
          mode: form.get("mode"),
          isDefault: form.get("isDefault") === "on",
          syncInterval: form.get("syncInterval") ? Number(form.get("syncInterval")) : null,
          config,
          secrets
        })
      });
      if (!response.ok) {
        const errorData = await readApiJson<{ error?: string }>(response);
        throw new Error(errorData.error ?? "Entegrasyon kaydedilemedi.");
      }
      setMessage(`${integration.label} kaydedildi.`);
      await loadIntegrations();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Entegrasyon kaydedilemedi.");
    } finally {
      setSavingKey(null);
    }
  }

  async function testIntegration(integration: IntegrationRow) {
    const key = `${integration.category}:${integration.provider}`;
    setSavingKey(key);
    try {
      const response = await fetch(`/api/admin/integrations/${integration.category}/${integration.provider}/test`, {
        method: "POST",
        headers: { "x-admin-role": role }
      });
      const data = await readApiJson<{ ok?: boolean; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Bağlantı testi yapılamadı.");
      setMessage(data.ok ? `${integration.label} bağlantı testi başarılı.` : data.error ?? `${integration.label} bağlantı testi başarısız.`);
      await loadIntegrations();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bağlantı testi yapılamadı.");
    } finally {
      setSavingKey(null);
    }
  }

  async function syncIntegration(integration: IntegrationRow) {
    const key = `${integration.category}:${integration.provider}`;
    setSavingKey(key);
    try {
      const response = await fetch(`/api/admin/integrations/${integration.category}/${integration.provider}/sync`, {
        method: "POST",
        headers: { "x-admin-role": role }
      });
      const data = await readApiJson<{ ok?: boolean; message?: string; error?: string }>(response);
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Senkronizasyon başlatılamadı.");
      setMessage(data.message ?? `${integration.label} senkronizasyonu başlatıldı.`);
      await loadIntegrations();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Senkronizasyon başlatılamadı.");
    } finally {
      setSavingKey(null);
    }
  }

  const grouped = {
    payment: integrations.filter((item) => item.category === "payment"),
    marketplace: integrations.filter((item) => item.category === "marketplace"),
    shipping: integrations.filter((item) => item.category === "shipping")
  };

  return (
    <div className="space-y-7">
      <PageTitle eyebrow="Admin Only" title="Entegrasyon Ayarları" description="Kargo, ödeme, pazaryeri ve sanal POS API bilgileri şifreli olarak saklanır; .env sadece fallback/default için kullanılır." />
      {role !== "admin" ? (
        <Panel title="Yetkisiz erişim" action="403">
          <p className="text-sm leading-6 text-stone-600">Bu modül sadece Admin rolüyle kullanılabilir.</p>
        </Panel>
      ) : null}
      <Panel title="Güvenlik ve durum" action={loading ? "yükleniyor" : message}>
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Öncelik" value="Admin DB" detail=".env fallback" icon={ShieldCheck} />
          <MetricCard title="Secret" value="Şifreli" detail="Son 4 karakter görünür" icon={ShieldCheck} />
          <MetricCard title="Test" value="Hazır" detail="Durum ve hata loglanır" icon={Command} />
          <MetricCard title="Erişim" value="Admin" detail="API guard aktif" icon={Users} />
        </div>
      </Panel>
      <IntegrationGroup title="Ödeme Entegrasyonları" emptyText="Henüz ödeme sağlayıcısı eklenmedi." items={grouped.payment} savingKey={savingKey} onSave={saveIntegration} onTest={testIntegration} onSync={syncIntegration} disabled={role !== "admin"} />
      <IntegrationGroup title="Pazaryeri Entegrasyonları" emptyText="Henüz pazaryeri entegrasyonu eklenmedi." items={grouped.marketplace} savingKey={savingKey} onSave={saveIntegration} onTest={testIntegration} onSync={syncIntegration} disabled={role !== "admin"} />
      <IntegrationGroup title="Kargo Entegrasyonları" emptyText="Henüz kargo entegrasyonu eklenmedi." items={grouped.shipping} savingKey={savingKey} onSave={saveIntegration} onTest={testIntegration} onSync={syncIntegration} disabled={role !== "admin"} />
      <IntegrationLogsPanel logs={logs} />
    </div>
  );
}

function IntegrationGroup({
  title,
  emptyText,
  items,
  savingKey,
  onSave,
  onTest,
  onSync,
  disabled
}: {
  title: string;
  emptyText: string;
  items: IntegrationRow[];
  savingKey: string | null;
  onSave: (integration: IntegrationRow, form: FormData) => void;
  onTest: (integration: IntegrationRow) => void;
  onSync: (integration: IntegrationRow) => void;
  disabled: boolean;
}) {
  return (
    <Panel title={title} action={`${items.length} sağlayıcı`}>
      <div className="space-y-4">
        {!items.length ? (
          <div className="border border-dashed border-stone-300 bg-[#f3efe8]/45 p-5 text-sm text-stone-500">{emptyText}</div>
        ) : null}
        {items.map((integration) => (
          <IntegrationCard key={`${integration.category}:${integration.provider}`} integration={integration} saving={savingKey === `${integration.category}:${integration.provider}`} onSave={onSave} onTest={onTest} onSync={onSync} disabled={disabled} />
        ))}
      </div>
    </Panel>
  );
}

function IntegrationCard({
  integration,
  saving,
  onSave,
  onTest,
  onSync,
  disabled
}: {
  integration: IntegrationRow;
  saving: boolean;
  onSave: (integration: IntegrationRow, form: FormData) => void;
  onTest: (integration: IntegrationRow) => void;
  onSync: (integration: IntegrationRow) => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(!integration.id);
  const configFields = integrationFields(integration);
  const secretFields = secretFieldsFor(integration);
  const formDisabled = disabled || saving || !editing;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(integration, new FormData(event.currentTarget));
      }}
      className="border border-stone-200/70 bg-[#f3efe8]/40 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-medium text-stone-950">{integration.label}</p>
          <p className="mt-1 text-xs text-stone-500">
            Son test: {integration.lastTestedAt ? new Date(integration.lastTestedAt).toLocaleString("tr-TR") : "yok"} · {integration.lastTestStatus ?? "bekliyor"}
          </p>
          {integration.lastTestError ? <p className="mt-1 text-xs text-red-700">{integration.lastTestError}</p> : null}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-stone-700">
          <label className="inline-flex items-center gap-2">
            <input name="active" type="checkbox" defaultChecked={integration.active} disabled={formDisabled} />
            Aktif
          </label>
          <label className="inline-flex items-center gap-2">
            <input name="isDefault" type="checkbox" defaultChecked={integration.isDefault} disabled={formDisabled} />
            Varsayılan
          </label>
          <select name="mode" defaultValue={integration.mode} disabled={formDisabled} className="border border-stone-200 bg-[#fbfaf7] px-3 py-2 text-sm outline-none disabled:opacity-60">
            <option value="test">Test modu</option>
            <option value="live">Canlı mod</option>
          </select>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {configFields.map((field) => (
          <label key={field.name} className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-stone-400">{field.label}</span>
            <input name={`config.${field.name}`} defaultValue={String(integration.config[field.name] ?? "")} disabled={formDisabled} className="mt-2 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-2.5 text-sm outline-none disabled:opacity-60" />
          </label>
        ))}
        {integration.category !== "payment" ? (
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Sync interval</span>
            <input name="syncInterval" type="number" min="1" defaultValue={integration.syncInterval ?? ""} disabled={formDisabled} className="mt-2 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-2.5 text-sm outline-none disabled:opacity-60" />
          </label>
        ) : null}
        {secretFields.map((field) => (
          <label key={field.name} className="block">
            <span className="text-[10px] uppercase tracking-[0.16em] text-stone-400">{field.label}</span>
            <input name={`secret.${field.name}`} placeholder={integration.secretMasks[field.name] || "Yeni değer gir"} disabled={formDisabled} className="mt-2 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-2.5 text-sm outline-none disabled:opacity-60" />
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setEditing(true)} disabled={disabled || saving || editing} className="border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] disabled:opacity-50">
          Düzenle
        </button>
        <button disabled={disabled || saving || !editing} className="bg-stone-950 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7] disabled:opacity-50">
          Kaydet
        </button>
        <button type="button" onClick={() => onTest(integration)} disabled={disabled || saving} className="border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] disabled:opacity-50">
          Test Et
        </button>
        {integration.category === "marketplace" ? (
          <button type="button" onClick={() => onSync(integration)} disabled={disabled || saving} className="border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] disabled:opacity-50">
            Senkron Başlat
          </button>
        ) : null}
        {integration.lastSuccessfulAt ? <span className="text-xs text-emerald-700">Son başarılı: {new Date(integration.lastSuccessfulAt).toLocaleString("tr-TR")}</span> : null}
        {integration.lastSyncAt ? <span className="text-xs text-stone-500">Son senkron: {new Date(integration.lastSyncAt).toLocaleString("tr-TR")}</span> : null}
      </div>
      {integration.logs.length ? (
        <div className="mt-4 border-t border-stone-200/70 pt-3">
          {integration.logs.map((log) => (
            <p key={log.id} className="text-xs leading-6 text-stone-500">
              {new Date(log.createdAt).toLocaleString("tr-TR")} · {log.operation} · {log.success ? "başarılı" : "başarısız"} {log.error ? `· ${log.error}` : ""}
            </p>
          ))}
        </div>
      ) : null}
    </form>
  );
}

function IntegrationLogsPanel({ logs }: { logs: IntegrationLogRow[] }) {
  return (
    <Panel title="Entegrasyon Logları" action="son 50">
      {!logs.length ? (
        <div className="border border-dashed border-stone-300 bg-[#f3efe8]/45 p-5 text-sm text-stone-500">Henüz entegrasyon log kaydı yok.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-stone-200/80 text-[10px] uppercase tracking-[0.16em] text-stone-400">
              <tr>
                <th className="py-3 pr-4 font-medium">Tarih</th>
                <th className="py-3 pr-4 font-medium">Sağlayıcı</th>
                <th className="py-3 pr-4 font-medium">İşlem</th>
                <th className="py-3 pr-4 font-medium">Durum</th>
                <th className="py-3 pr-4 font-medium">Hata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 pr-4 text-stone-600">{new Date(log.createdAt).toLocaleString("tr-TR")}</td>
                  <td className="py-3 pr-4 font-medium text-stone-950">{log.provider}</td>
                  <td className="py-3 pr-4 text-stone-600">{log.operation}</td>
                  <td className={`py-3 pr-4 ${log.success ? "text-emerald-700" : "text-red-700"}`}>{log.success ? "Başarılı" : "Başarısız"}</td>
                  <td className="py-3 pr-4 text-stone-500">{log.error ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function integrationFields(integration: IntegrationRow) {
  if (integration.category === "payment") {
    return [
      { name: "merchantId", label: "Merchant ID" },
      { name: "callbackUrl", label: "Callback URL" },
      { name: "successUrl", label: "Success URL" },
      { name: "failUrl", label: "Fail URL" }
    ];
  }
  if (integration.category === "marketplace") {
    return [
      { name: integration.provider === "trendyol" ? "supplierId" : "merchantId", label: integration.provider === "trendyol" ? "Supplier ID" : "Merchant ID" }
    ];
  }
  return [
    { name: "customerCode", label: "Müşteri kodu" },
    { name: "apiUsername", label: "API kullanıcı adı" }
  ];
}

function secretFieldsFor(integration: IntegrationRow) {
  if (integration.category === "payment") {
    return [
      { name: "merchantKey", label: "Merchant Key" },
      { name: "merchantSalt", label: "Merchant Salt" }
    ];
  }
  if (integration.category === "marketplace") {
    return [
      { name: "apiKey", label: "API Key" },
      { name: "apiSecret", label: "API Secret" }
    ];
  }
  return [
    { name: "apiPassword", label: "API şifre" },
    { name: "apiKey", label: "API Key" },
    { name: "apiSecret", label: "API Secret" }
  ];
}

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("API geçerli JSON döndürmedi.");
  }
}

function sectionLabel(section: AdminSection) {
  const labels: Partial<Record<AdminSection, string>> = {
    dashboard: adminTr.nav.dashboard,
    products: adminTr.nav.products,
    inventory: adminTr.nav.inventory,
    orders: adminTr.nav.orders,
    payment_logs: "Payment Logs",
    customers: adminTr.nav.customers,
    shipping: adminTr.nav.shipping,
    marketplaces: adminTr.nav.marketplaces,
    campaigns: "Kampanyalar",
    roles: adminTr.nav.roles,
    reports: adminTr.nav.reports,
    settings: adminTr.nav.settings
  };
  return labels[section] ?? section;
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-5xl font-normal leading-none text-stone-950 md:text-6xl">{title}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function MetricCard({ title, value, detail, icon: Icon }: { title: string; value: string; detail: string; icon: React.ElementType }) {
  return (
    <article className="border border-stone-200/70 bg-[#fbfaf7] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{title}</p>
        <Icon size={17} strokeWidth={1.25} className="text-stone-400" />
      </div>
      <p className="mt-5 text-2xl font-medium text-stone-950">{value}</p>
      <p className="mt-2 text-xs text-stone-500">{detail}</p>
    </article>
  );
}

function Panel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <section className="border border-stone-200/70 bg-[#fbfaf7] p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium text-stone-950">{title}</h3>
        {action ? <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{action}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-stone-200/80 bg-[#fbfaf7] px-3 py-2.5 text-sm outline-none transition focus:border-stone-700" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-stone-200/80 bg-[#fbfaf7] px-3 py-3 text-sm text-stone-950 outline-none transition focus:border-stone-950"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusPill({ value }: { value: string }) {
  return <span className="inline-flex whitespace-nowrap border border-stone-200/80 bg-[#f3efe8]/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-stone-600">{adminStatusLabel(value)}</span>;
}

function PaymentResultBadge({ label, status, hasError }: { label: string; status?: string | null; hasError?: boolean }) {
  const tone =
    hasError || status === "failed" || status === "cancelled"
      ? "border-red-200 bg-red-50 text-red-700"
      : status === "paid"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-stone-200 bg-[#f3efe8]/70 text-stone-600";
  return <span className={`inline-flex whitespace-nowrap border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${tone}`}>{label}</span>;
}

function ChannelBadge({ source }: { source: AdminOrder["source"] }) {
  const badge = {
    website: { label: "WEB", className: "border-stone-300 bg-white text-stone-700" },
    trendyol: { label: "TRENDYOL", className: "border-orange-200 bg-orange-50 text-orange-700" },
    hepsiburada: { label: "HEPSIBURADA", className: "border-sky-200 bg-sky-50 text-sky-700" },
    amazon: { label: "AMAZON", className: "border-amber-200 bg-amber-50 text-amber-700" },
    n11: { label: "N11", className: "border-violet-200 bg-violet-50 text-violet-700" }
  }[source];

  return (
    <span className={`inline-flex whitespace-nowrap border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function SettingsGroup({ title, rows }: { title: string; rows: string[] }) {
  return (
    <Panel title={title} action={adminTr.actions.ready}>
      <div className="divide-y divide-stone-200/70">
        {rows.map((row) => (
          <button key={row} className="flex w-full items-center justify-between py-3 text-left text-sm text-stone-600 transition hover:text-stone-950">
            {row}
            <ChevronRight size={14} strokeWidth={1.25} />
          </button>
        ))}
      </div>
    </Panel>
  );
}
