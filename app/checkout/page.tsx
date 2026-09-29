"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, CreditCard, ShieldCheck, X } from "lucide-react";
import { getCartLineKey, useCart } from "@/components/cart-provider";
import { trackEcommerceEvent } from "@/lib/analytics";
import { TURKEY_PROVINCES } from "@/lib/locations/turkey";
import { getProductFinalPrice } from "@/lib/products";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, shipping, grandTotal, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [billingType, setBillingType] = useState("individual");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [installment, setInstallment] = useState(1);
  const [paytrIframeUrl, setPaytrIframeUrl] = useState<string | null>(null);
  const checkoutTracked = useRef(false);
  const districtOptions = TURKEY_PROVINCES.find((province) => province.name === selectedCity)?.districts ?? [];

  useEffect(() => {
    if (!items.length || checkoutTracked.current) return;
    checkoutTracked.current = true;
    trackEcommerceEvent({
      eventName: "begin_checkout",
      value: grandTotal,
      items: items.map((line) => ({
        item_id: line.product.sku,
        item_name: line.product.title,
        item_category: line.product.category,
        item_variant: [line.size, line.color].filter(Boolean).join(" / ") || undefined,
        price: getProductFinalPrice(line.product),
        quantity: line.quantity
      }))
    });
  }, [grandTotal, items]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    setLoading(true);
    trackEcommerceEvent({
      eventName: "add_payment_info",
      value: grandTotal,
      items: items.map((line) => ({
        item_id: line.product.sku,
        item_name: line.product.title,
        item_category: line.product.category,
        item_variant: [line.size, line.color].filter(Boolean).join(" / ") || undefined,
        price: getProductFinalPrice(line.product),
        quantity: line.quantity
      }))
    });
    const form = new FormData(event.currentTarget);
    const shippingAddress = String(form.get("address") ?? "");
    const invoiceAddress = billingSameAsShipping ? shippingAddress : String(form.get("billingAddress") ?? "");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: {
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone")
        },
        address: {
          line1: shippingAddress,
          district: form.get("district"),
          city: form.get("city"),
          billingType
        },
        invoice: {
          type: billingType,
          billingSameAsShipping,
          billingName: form.get("billingName") || form.get("name"),
          billingCompany: form.get("billingCompany") || undefined,
          billingTaxNumber: billingType === "individual" ? form.get("billingTcNumber") : form.get("billingTaxNumber"),
          billingTaxOffice: form.get("billingTaxOffice") || undefined,
          billingAddress: invoiceAddress
        },
        paymentProvider: "paytr",
        installment,
        items: items.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
          color: line.color,
          size: line.size
        }))
      })
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error ?? "Güvenli ödeme başlatılamadı.");
      setLoading(false);
      return;
    }
    window.sessionStorage.setItem(
      "serenza-last-checkout",
      JSON.stringify({
        orderId: data.order.id,
        orderNumber: data.order.orderNumber,
        value: data.order.total ?? grandTotal,
        items: items.map((line) => ({
          item_id: line.product.sku,
          item_name: line.product.title,
          item_category: line.product.category,
          item_variant: [line.size, line.color].filter(Boolean).join(" / ") || undefined,
          price: getProductFinalPrice(line.product),
          quantity: line.quantity
        }))
      })
    );
    clear();
    if (data.payment.iframeUrl) {
      setPaytrIframeUrl(data.payment.iframeUrl);
      setLoading(false);
      return;
    }
    if (data.payment.htmlForm) {
      const formShell = document.createElement("div");
      formShell.innerHTML = data.payment.htmlForm;
      document.body.appendChild(formShell);
      (formShell.querySelector("form") as HTMLFormElement | null)?.submit();
      return;
    }
    const target = data.payment.redirectUrl ?? `/order-success?orderId=${data.order.id}&orderNumber=${data.order.orderNumber}`;
    if (target.startsWith("http")) window.location.href = target;
    else router.push(target);
  }

  if (!items.length) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#fbfaf7] px-5 py-16 text-center">
        <div className="max-w-md">
          <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Güvenli Ödeme</p>
          <h1 className="mt-4 font-serif text-5xl font-normal">Sepetiniz boş.</h1>
          <p className="mt-4 text-sm leading-7 text-stone-500">Ödeme adımına geçmeden önce koleksiyondan bir ürün seçin.</p>
          <Link href="/collections" className="mt-7 inline-flex bg-stone-950 px-7 py-4 text-[10px] uppercase tracking-[0.2em] text-[#f8f1e7]">
            Koleksiyonlara Dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#fbfaf7] px-5 py-12 text-stone-950 md:px-8 md:py-16">
      <form onSubmit={submit} className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
        <section>
          <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Misafir Alışveriş</p>
          <h1 className="mt-3 font-serif text-5xl font-normal leading-none md:text-7xl">Güvenli Ödeme</h1>

          <button
            type="button"
            onClick={() => setSummaryOpen((current) => !current)}
            className="mt-7 flex w-full items-center justify-between border-y border-stone-200/70 py-4 text-left lg:hidden"
          >
            <span className="text-sm text-stone-600">Sipariş özeti</span>
            <span className="inline-flex items-center gap-2 text-sm text-stone-950">
              {grandTotal.toLocaleString("tr-TR")} TL
              <ChevronDown size={15} strokeWidth={1.25} className={`transition ${summaryOpen ? "rotate-180" : ""}`} />
            </span>
          </button>
          {summaryOpen ? <div className="lg:hidden"><OrderSummary items={items} total={total} shipping={shipping} grandTotal={grandTotal} compact /></div> : null}

          <div className="mt-8 grid gap-9">
            <CheckoutBlock title="İletişim">
              <div className="grid gap-4 md:grid-cols-2">
                <Input required name="name" label="Ad Soyad" />
                <Input required type="tel" name="phone" label="Telefon" />
                <Input required type="email" name="email" label="E-posta" className="md:col-span-2" />
              </div>
            </CheckoutBlock>

            <CheckoutBlock title="Teslimat Adresi">
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  required
                  name="city"
                  label="Şehir"
                  value={selectedCity}
                  onChange={(event) => {
                    setSelectedCity(event.target.value);
                    setSelectedDistrict("");
                  }}
                >
                  <option value="">Şehir seçin</option>
                  {TURKEY_PROVINCES.map((province) => (
                    <option key={province.name} value={province.name}>
                      {province.name}
                    </option>
                  ))}
                </Select>
                {selectedCity ? (
                  <Select required name="district" label="İlçe" value={selectedDistrict} onChange={(event) => setSelectedDistrict(event.target.value)}>
                    <option value="">İlçe seçin</option>
                    {districtOptions.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <Textarea required name="address" label="Açık adres" className="md:col-span-2" />
              </div>
            </CheckoutBlock>

            <CheckoutBlock title="Fatura Bilgileri">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["individual", "Bireysel"],
                  ["corporate", "Kurumsal"]
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBillingType(value)}
                    className={`border px-4 py-4 text-left text-sm transition duration-500 ${
                      billingType === value ? "border-stone-900 bg-[#f3efe8] text-stone-950" : "border-stone-200/80 text-stone-500 hover:border-stone-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {billingType === "individual" ? (
                  <>
                    <Input required name="billingName" label="Fatura Ad Soyad" />
                    <Input required name="billingTcNumber" label="TC Kimlik No" inputMode="numeric" maxLength={11} />
                  </>
                ) : (
                  <>
                    <Input required name="billingCompany" label="Firma Adı" />
                    <Input required name="billingTaxNumber" label="Vergi No" inputMode="numeric" />
                    <Input required name="billingTaxOffice" label="Vergi Dairesi" className="md:col-span-2" />
                  </>
                )}
              </div>
              <label className="mt-4 flex items-center gap-3 border border-stone-200/70 bg-[#f3efe8]/40 px-4 py-3 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={billingSameAsShipping}
                  onChange={(event) => setBillingSameAsShipping(event.target.checked)}
                  className="h-4 w-4 accent-stone-950"
                />
                Fatura adresim teslimat adresimle aynı
              </label>
              {!billingSameAsShipping ? <Textarea required name="billingAddress" label="Fatura Adresi" className="mt-4" /> : null}
            </CheckoutBlock>

            <CheckoutBlock title="Ödeme">
              <div className="space-y-4">
                <div className="border border-stone-900 bg-stone-950 px-4 py-4 text-[#f8f1e7]">
                  <span className="flex items-center gap-2 text-sm">
                    <CreditCard size={15} strokeWidth={1.25} />
                    PayTR Güvenli Ödeme
                  </span>
                  <span className="mt-2 block text-xs text-[#f8f1e7]/65">3D Secure iFrame ile kart ve taksit ödeme</span>
                </div>

                <div className="border border-stone-200/80 bg-[#f3efe8]/45 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Taksit</p>
                      <p className="mt-2 text-sm text-stone-600">Taksit seçenekleri PayTR iFrame ödeme ekranında tamamlanır.</p>
                    </div>
                    <select
                      value={installment}
                      onChange={(event) => setInstallment(Number(event.target.value))}
                      className="border border-stone-200/80 bg-[#fbfaf7] px-4 py-3 text-sm outline-none transition focus:border-stone-700 disabled:opacity-45"
                    >
                      {[1, 2, 3, 6, 9].map((count) => (
                        <option key={count} value={count}>
                          {count === 1 ? "Tek çekim" : `${count} taksit`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-4 text-xs leading-6 text-stone-500">
                    Kart bilgileriniz Serenza Home Living sisteminde tutulmaz. PayTR iFrame ve 3D Secure adımları güvenli ödeme ekranında tamamlanır; doğrulama sonrası siparişiniz onaylanır.
                  </p>
                </div>

                <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-900">
                  <ShieldCheck size={18} strokeWidth={1.35} className="mt-0.5 shrink-0" />
                  <p>PayTR ödeme ekranı bu sayfada açılır. 3D Secure, kart doğrulaması ve güvenlik kontrolleri PayTR tarafından tamamlanır.</p>
                </div>
              </div>
            </CheckoutBlock>
          </div>
        </section>

        <aside className="hidden lg:block">
          <OrderSummary items={items} total={total} shipping={shipping} grandTotal={grandTotal} loading={loading} />
        </aside>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/70 bg-[#fbfaf7]/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-stone-950">{grandTotal.toLocaleString("tr-TR")} TL</p>
              <p className="text-xs text-stone-500">Kargo {shipping ? `${shipping.toLocaleString("tr-TR")} TL` : "ücretsiz"}</p>
            </div>
            <button disabled={loading} className="shrink-0 bg-stone-950 px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#f8f1e7] disabled:opacity-50 min-[380px]:px-5 min-[380px]:tracking-[0.18em]">
              {loading ? "İşleniyor" : "Siparişi Tamamla"}
            </button>
          </div>
        </div>
      </form>
      {paytrIframeUrl ? <PaytrIframeModal iframeUrl={paytrIframeUrl} onClose={() => setPaytrIframeUrl(null)} /> : null}
    </main>
  );
}

function PaytrIframeModal({ iframeUrl, onClose }: { iframeUrl: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] bg-stone-950/45 p-3 backdrop-blur-sm md:p-8">
      <div className="mx-auto flex h-full max-w-4xl flex-col overflow-hidden bg-[#fbfaf7] shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200/70 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">PayTR Güvenli Ödeme</p>
            <p className="mt-1 text-sm text-stone-600">3D Secure iFrame ödeme ekranı</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center border border-stone-200 text-stone-700 transition hover:border-stone-900">
            <X size={18} strokeWidth={1.3} />
          </button>
        </div>
        <iframe src={iframeUrl} title="PayTR Güvenli Ödeme" className="h-full min-h-[640px] w-full bg-white" />
      </div>
    </div>
  );
}

function CheckoutBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-stone-200/70 pt-6">
      <h2 className="font-serif text-3xl font-normal">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Input({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{label}</span>
      <input {...props} className="mt-2 w-full border border-stone-200/80 bg-[#fbfaf7] px-4 py-3 text-sm outline-none transition focus:border-stone-700" />
    </label>
  );
}

function Select({ label, className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{label}</span>
      <select {...props} className="mt-2 w-full border border-stone-200/80 bg-[#fbfaf7] px-4 py-3 text-sm outline-none transition focus:border-stone-700 disabled:cursor-not-allowed disabled:opacity-45">
        {children}
      </select>
    </label>
  );
}

function Textarea({ label, className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{label}</span>
      <textarea {...props} className="mt-2 min-h-28 w-full border border-stone-200/80 bg-[#fbfaf7] px-4 py-3 text-sm outline-none transition focus:border-stone-700" />
    </label>
  );
}

function OrderSummary({
  items,
  total,
  shipping,
  grandTotal,
  loading,
  compact = false
}: {
  items: ReturnType<typeof useCart>["items"];
  total: number;
  shipping: number;
  grandTotal: number;
  loading?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`${compact ? "py-5" : "sticky top-28 border border-stone-200/70 bg-[#f3efe8]/45 p-6"}`}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Sipariş Özeti</p>
      <div className="mt-5 space-y-4">
        {items.map((line) => (
          <div key={getCartLineKey(line)} className="grid grid-cols-[58px_1fr_auto] items-center gap-3">
            <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
              <Image src={line.product.images[0]} alt={line.product.title} fill sizes="58px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-stone-900">{line.product.title}</p>
              <p className="mt-1 text-xs text-stone-500">{line.size} / {line.color} / {line.quantity} adet</p>
            </div>
            <p className="text-sm text-stone-900">{(getProductFinalPrice(line.product) * line.quantity).toLocaleString("tr-TR")} TL</p>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3 border-t border-stone-200/70 pt-5 text-sm text-stone-600">
        <div className="flex justify-between">
          <span>Ara toplam</span>
          <span>{total.toLocaleString("tr-TR")} TL</span>
        </div>
        <div className="flex justify-between">
          <span>Kargo</span>
          <span>{shipping ? `${shipping.toLocaleString("tr-TR")} TL` : "Ücretsiz"}</span>
        </div>
        <div className="flex justify-between pt-2 text-lg text-stone-950">
          <span>Toplam</span>
          <span>{grandTotal.toLocaleString("tr-TR")} TL</span>
        </div>
      </div>
      {!compact ? (
        <button disabled={loading} className="mt-7 w-full bg-stone-950 px-6 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[#f8f1e7] transition hover:bg-stone-800 disabled:opacity-50">
          {loading ? "İşleniyor" : "Siparişi Tamamla"}
        </button>
      ) : null}
    </div>
  );
}
