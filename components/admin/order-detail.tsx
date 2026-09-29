"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, PackageCheck, Printer, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminOrder } from "@/lib/admin-data";
import { OrderDetailAccess } from "@/lib/admin-access";
import { orderWorkflow } from "@/lib/admin/order-workflow";
import { adminFieldLabel, adminStatusLabel, adminTr } from "@/lib/i18n/admin-tr";
import { InvoiceForm } from "@/components/admin/invoice-form";

const statusTone: Record<AdminOrder["orderStatus"], string> = {
  created: "border-stone-300 bg-stone-100 text-stone-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  processing: "border-emerald-200 bg-emerald-50 text-emerald-700",
  preparing: "border-amber-200 bg-amber-50 text-amber-700",
  shipped: "border-blue-200 bg-blue-50 text-blue-700",
  delivered: "border-olive/25 bg-olive/10 text-olive",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  returned: "border-red-200 bg-red-50 text-red-700"
};

export function OrderDetail({ order, access }: { order: AdminOrder; access: OrderDetailAccess }) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [assignedUserId, setAssignedUserId] = useState(order.assignedUserId ?? "shipper-001");
  const reachedIndex = orderWorkflow.indexOf(currentOrder.orderStatus);
  const labelUrl = currentOrder.shippingLabelUrl ?? `/api/admin/orders/${currentOrder.id}/shipping/label?role=${access.role}`;
  const isBusy = loadingAction !== null;
  const shippingUsers = useMemo(
    () => [
      { id: "shipper-001", name: "Sevkiyat Ekibi" },
      { id: "shipper-002", name: "Ayşe Paketleme" },
      { id: "shipper-003", name: "Mehmet Kargo" }
    ],
    []
  );

  function notify(type: "success" | "error", message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3800);
  }

  async function requestShippingAction<T>(action: string, request: () => Promise<T>) {
    setLoadingAction(action);
    try {
      return await request();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "İşlem tamamlanamadı.");
      return null;
    } finally {
      setLoadingAction(null);
    }
  }

  function printPdf(url: string) {
    const printUrl = `${url}${url.includes("?") ? "&" : "?"}print=${Date.now()}`;
    let iframe = document.getElementById("shipping-label-print-frame") as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "shipping-label-print-frame";
      iframe.title = "Kargo etiketi yazdırma";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "1px";
      iframe.style.height = "1px";
      iframe.style.border = "0";
      iframe.style.opacity = "0";
      document.body.appendChild(iframe);
    }
    iframe.onload = () => {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    };
    iframe.src = printUrl;
  }

  async function ensureLabel() {
    const response = await fetch(`/api/admin/orders/${currentOrder.id}/shipping/label`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: access.role })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Etiket oluşturulamadı.");
    if (data.order) setCurrentOrder(data.order);
    notify("success", data.message ?? "Kargo etiketi oluşturuldu.");
    return String(data.labelUrl ?? labelUrl);
  }

  async function previewLabel() {
    await requestShippingAction("preview", async () => {
      if (!currentOrder.shippingLabelUrl) throw new Error("Önce etiket oluşturulmalı.");
      window.open(labelUrl, "_blank", "noopener,noreferrer");
      notify("success", "PDF önizleme açıldı.");
    });
  }

  async function printExistingLabel() {
    await requestShippingAction("reprint", async () => {
      if (!currentOrder.shippingLabelUrl) throw new Error("Önce etiket oluşturulmalı.");
      printPdf(labelUrl);
      notify("success", "Etiket tekrar yazdırmaya gönderildi.");
    });
  }

  async function printLabel() {
    await requestShippingAction("print", async () => {
      const url = currentOrder.shippingLabelUrl ? labelUrl : await ensureLabel();
      printPdf(url);
      notify("success", "Etiket yazdırmaya gönderildi.");
    });
  }

  async function markShipped() {
    await requestShippingAction("shipped", async () => {
      const response = await fetch(`/api/admin/orders/${currentOrder.id}/shipping/mark-shipped`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: access.role })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Kargolandı işlemi tamamlanamadı.");
      if (data.order) setCurrentOrder(data.order);
      notify("success", data.message ?? "Sipariş kargolandı olarak işaretlendi.");
    });
  }

  async function assignShipment() {
    await requestShippingAction("assign", async () => {
      const response = await fetch(`/api/admin/orders/${currentOrder.id}/shipping/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: access.role, assignedUserId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Sevkiyat ataması yapılamadı.");
      if (data.order) setCurrentOrder(data.order);
      notify("success", data.message ?? "Sevkiyat ataması yapıldı.");
    });
  }

  if (!access.canAccessOrderDetail) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f4ef] px-5 text-center text-stone-950">
        <div className="max-w-md border border-stone-200/70 bg-[#fbfaf7] p-8">
          <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">403</p>
          <h1 className="mt-3 font-serif text-5xl font-normal">Erişim yok.</h1>
          <p className="mt-4 text-sm leading-7 text-stone-500">Bu rol sipariş işleme ekranına erişemez.</p>
          <Link href="/admin" className="mt-7 inline-flex bg-stone-950 px-6 py-4 text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7]">
            Admin panele dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef] px-5 py-6 text-stone-950 md:px-8">
      {toast ? (
        <div className={`fixed right-5 top-5 z-[100] max-w-sm border px-4 py-3 text-sm shadow-lg ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>
          {toast.message}
        </div>
      ) : null}
      <div className="mx-auto max-w-[1480px]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <Link href={`/admin?role=${access.role}`} className="inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-stone-950">
              <ArrowLeft size={15} strokeWidth={1.25} />
              Admin Studio
            </Link>
            <p className="mt-6 text-[10px] uppercase tracking-[0.24em] text-stone-400">{adminTr.sections.orderDetail}</p>
            <h1 className="mt-2 font-serif text-5xl font-normal leading-none md:text-6xl">{currentOrder.orderNumber}</h1>
            <p className="mt-4 text-sm text-stone-500">
              {currentOrder.customer.name} · {adminStatusLabel(currentOrder.source)} · {currentOrder.createdAt}
            </p>
            <p className="mt-2 text-xs text-stone-400">Rol: {access.label}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill value={currentOrder.source} />
            {access.canViewPaymentStatus ? <StatusPill value={currentOrder.paymentStatus} /> : null}
            {access.canViewInvoiceStatus ? <StatusPill value={currentOrder.invoice.status} /> : null}
            <StatusPill value={currentOrder.orderStatus} />
            {access.canViewShipping ? <StatusPill value={currentOrder.shipmentStatus} /> : null}
          </div>
        </div>

        <section className="mt-8">
          <Panel title={adminTr.sections.orderTimeline} action="oluşturuldu → teslim edildi">
            <div className="grid gap-4 md:grid-cols-5">
              {orderWorkflow.map((status, index) => {
                const event = currentOrder.timeline.find((item) => item.status === status);
                const active = index <= reachedIndex;
                return (
                  <div key={status} className={`relative border p-4 ${active ? statusTone[status] : "border-stone-200 bg-[#fbfaf7] text-stone-400"}`}>
                    <span className={`absolute -top-2 left-4 h-3 w-3 rounded-full border ${active ? "border-stone-950 bg-stone-950" : "border-stone-300 bg-[#fbfaf7]"}`} />
                    <p className="text-[10px] uppercase tracking-[0.18em] opacity-70">{adminTr.fields.step} {index + 1}</p>
                    <p className="mt-3 text-sm font-medium">{adminStatusLabel(status)}</p>
                    <p className="mt-2 min-h-5 text-xs opacity-75">{event?.timestamp ?? "Bekliyor"}</p>
                    <p className="mt-3 text-xs leading-5 opacity-80">{event?.note ?? "Bu adıma henüz geçilmedi."}</p>
                {index < orderWorkflow.length - 1 ? <span className="absolute -right-3 top-1/2 hidden h-px w-6 bg-stone-300 md:block" /> : null}
                  </div>
                );
              })}
            </div>
          </Panel>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            <Panel title="Sipariş özeti" action="tek havuz">
              <div className="grid gap-4 md:grid-cols-4">
                <Info label="Kanal" value={adminStatusLabel(currentOrder.source)} />
                {currentOrder.trendyolOrderNumber ? <Info label="Trendyol Order Number" value={currentOrder.trendyolOrderNumber} /> : null}
                {currentOrder.marketplaceOrderNumber ? <Info label="Marketplace Order Number" value={currentOrder.marketplaceOrderNumber} /> : null}
                <Info label="Sipariş No" value={currentOrder.orderNumber} />
                {access.canViewPaymentStatus ? <Info label="Ödeme Durumu" value={adminStatusLabel(currentOrder.paymentStatus)} /> : null}
                {access.canViewInvoiceStatus ? <Info label="Fatura Durumu" value={adminStatusLabel(currentOrder.invoice.status)} /> : null}
                {access.canViewShipping ? <Info label="Kargo Durumu" value={adminStatusLabel(currentOrder.shipmentStatus)} /> : null}
              </div>
            </Panel>

            {access.canViewProducts ? (
            <Panel title={adminTr.sections.orderedProducts} action={`${currentOrder.items.length} ürün`}>
              <div className="space-y-4">
                {currentOrder.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[82px_1fr_auto] gap-4 border-b border-stone-200/70 pb-4 last:border-b-0 last:pb-0">
                    <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
                      <Image src={item.image} alt={item.title} fill sizes="82px" className="object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-950">{item.title}</p>
                      <p className="mt-2 text-xs text-stone-500">Varyant / Ölçü: {item.size} / {item.color}</p>
                      <p className="mt-1 text-xs text-stone-500">{item.sku}</p>
                      <p className="mt-1 text-xs text-stone-400">{adminTr.fields.barcode}: {item.barcode ?? "Yok"}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{item.quantity} adet</p>
                      {access.canViewPrices ? <p className="mt-2 text-stone-950">{item.total.toLocaleString("tr-TR")} TL</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            ) : null}

            {access.canViewPaymentDetails ? (
            <Panel title={adminTr.sections.paymentInfo} action={adminStatusLabel(currentOrder.payment.provider)}>
              <div className="grid gap-4 md:grid-cols-3">
                <Info label={adminTr.fields.provider} value={adminStatusLabel(currentOrder.payment.provider)} />
                <Info label={adminTr.fields.reference} value={currentOrder.payment.reference} />
                <Info label={adminTr.fields.session} value={currentOrder.payment.sessionId ?? "Bekliyor"} />
                <Info label={adminTr.fields.installment} value={`${currentOrder.payment.installment ?? 1}`} />
                <Info label={adminTr.fields.gateway} value={adminStatusLabel(currentOrder.payment.gatewayStatus ?? currentOrder.paymentStatus)} />
                <Info label={adminTr.fields.fraudScore} value={currentOrder.payment.fraudScore != null ? `${currentOrder.payment.fraudScore}` : "Normal"} />
                <Info label={adminTr.fields.paidAt} value={currentOrder.payment.paidAt ?? "Bekliyor"} />
              </div>
              {currentOrder.payment.failureReason ? <p className="mt-4 text-sm leading-6 text-red-600">{currentOrder.payment.failureReason}</p> : null}
              <div className="mt-5 flex justify-between border-t border-stone-200/70 pt-4 text-sm">
                <span className="text-stone-500">{adminTr.fields.paymentAmount}</span>
                <span className="text-stone-950">{currentOrder.payment.amount.toLocaleString("tr-TR")} TL</span>
              </div>
            </Panel>
            ) : access.canViewPaymentStatus ? (
              <Panel title={adminTr.sections.paymentInfo}>
                <Info label={adminTr.fields.status} value={adminStatusLabel(currentOrder.paymentStatus)} />
              </Panel>
            ) : null}

            {access.canViewInvoiceDetails ? (
            <Panel title={adminTr.sections.invoiceInfo} action={adminStatusLabel(currentOrder.invoice.status)}>
              <div className="grid gap-4 md:grid-cols-3">
                <Info label={adminTr.fields.invoiceType} value={currentOrder.invoice.type === "corporate" ? "Kurumsal" : "Bireysel"} />
                <Info label={adminTr.fields.invoiceStatus} value={adminStatusLabel(currentOrder.invoice.status)} />
                <Info label={adminTr.fields.invoiceNumber} value={currentOrder.invoice.number ?? "Bekliyor"} />
                <Info label={adminTr.fields.billingName} value={currentOrder.invoice.billingName ?? "-"} />
                <Info label={adminTr.fields.billingCompany} value={currentOrder.invoice.billingCompany ?? "-"} />
                <Info label={adminTr.fields.billingTaxNumber} value={currentOrder.invoice.billingTaxNumber ?? "-"} />
                <Info label={adminTr.fields.billingTaxOffice} value={currentOrder.invoice.billingTaxOffice ?? "-"} />
                <Info label={adminTr.fields.billingAddress} value={currentOrder.invoice.billingAddress} />
                <Info label={adminTr.fields.invoiceUrl} value={currentOrder.invoice.url ?? "Yüklenmedi"} />
              </div>
              {currentOrder.invoice.url ? (
                <a href={currentOrder.invoice.url} target="_blank" className="mt-4 inline-flex items-center gap-2 text-sm text-stone-950 transition hover:text-stone-500">
                  Fatura PDF aç
                  <ExternalLink size={13} strokeWidth={1.25} />
                </a>
              ) : null}
              {access.canEditInvoice ? <InvoiceForm orderId={currentOrder.id} initialNumber={currentOrder.invoice.number} initialUrl={currentOrder.invoice.url} /> : null}
            </Panel>
            ) : access.canViewInvoiceStatus ? (
              <Panel title={adminTr.sections.invoiceInfo}>
                <Info label={adminTr.fields.invoiceStatus} value={adminStatusLabel(currentOrder.invoice.status)} />
              </Panel>
            ) : null}

            {access.canViewProfit ? (
            <Panel title={adminTr.sections.profitTracking} action="komisyon / ücret / net">
              <div className="grid gap-4 md:grid-cols-4">
                <Info label={adminTr.fields.commission} value={`${currentOrder.profit.commission.toLocaleString("tr-TR")} TL`} />
                <Info label={adminTr.fields.cargoCost} value={`${currentOrder.profit.cargoCost.toLocaleString("tr-TR")} TL`} />
                <Info label={adminTr.fields.marketplaceFee} value={`${currentOrder.profit.marketplaceFee.toLocaleString("tr-TR")} TL`} />
                <Info label={adminTr.fields.netProfit} value={`${currentOrder.profit.netProfit.toLocaleString("tr-TR")} TL`} strong />
              </div>
            </Panel>
            ) : null}

            {access.canViewReturns ? (
              <Panel title="İade talepleri" action="müşteri hizmetleri">
                <div className="grid gap-4 md:grid-cols-3">
                  <Info label="İade durumu" value={currentOrder.orderStatus === "returned" ? "İade sürecinde" : "Talep yok"} />
                  <Info label="Müşteri iletişimi" value={currentOrder.customer.phone} />
                  <Info label="Son işlem" value={currentOrder.notes[0]?.createdAt ?? "Bekliyor"} />
                </div>
              </Panel>
            ) : null}

            <Panel title={adminTr.sections.orderNotes} action={`${currentOrder.notes.length} not`}>
              {currentOrder.notes.length ? (
                <div className="space-y-3">
                  {currentOrder.notes.map((note) => (
                    <div key={note.id} className="border border-stone-200/70 bg-[#f3efe8]/45 p-4">
                      <p className="text-sm text-stone-950">{note.body}</p>
                      <p className="mt-2 text-xs text-stone-500">{note.author} · {note.createdAt}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500">{adminTr.descriptions.noOrderNotes}</p>
              )}
            </Panel>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Panel title={adminTr.sections.customerInfo}>
              <Info label={adminTr.fields.name} value={currentOrder.customer.name} />
              {access.canViewCustomerContact ? (
                <>
                  <Info label={adminTr.fields.email} value={currentOrder.customer.email} className="mt-4" />
                  <Info label={adminTr.fields.phone} value={currentOrder.customer.phone} className="mt-4" />
                </>
              ) : null}
            </Panel>

            {access.canViewCustomerContact || access.canViewShipping ? (
            <Panel title={adminTr.sections.shippingAddress}>
              <Info label={adminTr.fields.cityDistrict} value={`${currentOrder.address.city} / ${currentOrder.address.district}`} />
              <Info label={adminTr.fields.address} value={currentOrder.address.line1} className="mt-4" />
              {access.canViewInvoiceDetails ? <Info label={adminTr.fields.invoiceType} value={currentOrder.address.invoiceType} className="mt-4" /> : null}
            </Panel>
            ) : null}

            {access.canViewShipping ? (
            <Panel title={adminTr.sections.shipmentStructure}>
              <div className="mb-4 flex items-center gap-2 text-sm text-stone-600">
                <Truck size={16} strokeWidth={1.25} />
                Kargo entegrasyonuna hazır
              </div>
              <Info label={adminTr.fields.carrier} value={currentOrder.carrier ?? "Atanmadı"} />
              <Info label={adminTr.fields.provider} value={adminStatusLabel(currentOrder.carrierProvider ?? "manual")} className="mt-4" />
              <Info label={adminTr.fields.trackingCode} value={currentOrder.trackingCode ?? "Bekliyor"} className="mt-4" />
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{adminTr.fields.trackingUrl}</p>
                {currentOrder.trackingUrl ? (
                  <a href={currentOrder.trackingUrl} target="_blank" className="mt-2 inline-flex items-center gap-2 text-sm text-stone-950 transition hover:text-stone-500">
                    Takip sayfası
                    <ExternalLink size={13} strokeWidth={1.25} />
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-stone-500">Bekliyor</p>
                )}
              </div>
              <Info label={adminTr.fields.shipmentStatus} value={adminStatusLabel(currentOrder.shipmentStatus)} className="mt-4" />
              <Info label={adminTr.fields.serviceLevel} value={adminStatusLabel(currentOrder.shippingServiceLevel ?? "standard")} className="mt-4" />
              <Info label="Sevkiyat Ataması" value={currentOrder.assignedTo ?? "Atanmadı"} className="mt-4" />
              {currentOrder.shippedAt ? <Info label="Kargolandı Tarihi" value={currentOrder.shippedAt} className="mt-4" /> : null}
              {access.canViewPrices ? <Info label={adminTr.fields.shippingCost} value={`${(currentOrder.shippingCost ?? currentOrder.profit.cargoCost).toLocaleString("tr-TR")} TL`} className="mt-4" /> : null}
              {currentOrder.shippingRequiresReview ? <p className="mt-4 text-sm leading-6 text-amber-700">Büyük halı için özel kargo kontrolü gerekir.</p> : null}
              {access.canManageShipping ? (
                <div className="mt-5 space-y-3 border-t border-stone-200/70 pt-4">
                  {access.role === "admin" ? (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.18em] text-stone-400" htmlFor="assignedUserId">
                        Sevkiyat Personeli
                      </label>
                      <select
                        id="assignedUserId"
                        value={assignedUserId}
                        onChange={(event) => setAssignedUserId(event.target.value)}
                        disabled={isBusy}
                        className="w-full border border-stone-300 bg-[#fbfaf7] px-3 py-3 text-sm text-stone-800 outline-none transition focus:border-stone-950 disabled:opacity-50"
                      >
                        {shippingUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={assignShipment}
                        disabled={isBusy}
                        className="inline-flex w-full items-center justify-center gap-2 bg-stone-950 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7] transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingAction === "assign" ? "Atanıyor" : "Sevkiyat Ataması"}
                      </button>
                    </div>
                  ) : null}
                  {access.canPrintLabel ? (
                    <>
                    <button
                      type="button"
                      onClick={previewLabel}
                      disabled={isBusy}
                      className="inline-flex w-full items-center justify-center gap-2 border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-stone-800 transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingAction === "preview" ? "Açılıyor" : "PDF Önizle"}
                    </button>
                    <button
                      type="button"
                      onClick={printLabel}
                      disabled={isBusy}
                      className="inline-flex w-full items-center justify-center gap-2 border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-stone-800 transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Printer size={14} strokeWidth={1.25} />
                      {loadingAction === "print" ? "Hazırlanıyor" : "Etiket Yazdır"}
                    </button>
                    <button
                      type="button"
                      onClick={printExistingLabel}
                      disabled={isBusy}
                      className="inline-flex w-full items-center justify-center gap-2 border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-stone-800 transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Printer size={14} strokeWidth={1.25} />
                      {loadingAction === "reprint" ? "Yazdırılıyor" : "Tekrar Yazdır"}
                    </button>
                    </>
                  ) : null}
                  {access.canMarkShipped ? (
                    <button
                      type="button"
                      onClick={markShipped}
                      disabled={isBusy || currentOrder.orderStatus === "shipped"}
                      className="inline-flex w-full items-center justify-center gap-2 border border-stone-300 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-stone-800 transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingAction === "shipped" ? "İşleniyor" : currentOrder.orderStatus === "shipped" ? "Kargolandı" : "Kargolandı İşaretle"}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </Panel>
            ) : null}

            {access.role === "admin" ? (
            <Panel title={adminTr.sections.marketplaceSource}>
              <div className="flex items-center gap-2 text-sm text-stone-950">
                <PackageCheck size={16} strokeWidth={1.25} />
                {adminStatusLabel(currentOrder.source)}
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-500">
                {adminTr.descriptions.marketplaceSource}
              </p>
            </Panel>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Panel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <section className="border border-stone-200/70 bg-[#fbfaf7] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-stone-950">{title}</h2>
        {action ? <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{action}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Info({ label, value, strong = false, className = "" }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{label}</p>
      <p className={`mt-2 text-sm ${strong ? "font-medium text-stone-950" : "text-stone-600"}`}>{value}</p>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  return <span className="inline-flex whitespace-nowrap border border-stone-200/80 bg-[#f3efe8]/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-stone-600">{adminStatusLabel(value)}</span>;
}
