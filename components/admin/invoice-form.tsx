"use client";

import { useState } from "react";

export function InvoiceForm({
  orderId,
  initialNumber = "",
  initialUrl = ""
}: {
  orderId: string;
  initialNumber?: string;
  initialUrl?: string;
}) {
  const [invoiceNumber, setInvoiceNumber] = useState(initialNumber);
  const [invoiceUrl, setInvoiceUrl] = useState(initialUrl);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    const response = await fetch(`/api/admin/orders/${orderId}/invoice`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceNumber, invoiceUrl })
    });
    setStatus(response.ok ? "saved" : "failed");
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-stone-200/70 pt-5 md:grid-cols-[1fr_1fr_auto]">
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Fatura numarası</span>
        <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} className="mt-2 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-2 text-sm outline-none focus:border-stone-700" />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">PDF linki</span>
        <input value={invoiceUrl} onChange={(event) => setInvoiceUrl(event.target.value)} type="url" className="mt-2 w-full border border-stone-200 bg-[#fbfaf7] px-3 py-2 text-sm outline-none focus:border-stone-700" />
      </label>
      <button disabled={status === "saving"} className="self-end bg-stone-950 px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7] disabled:opacity-50">
        {status === "saving" ? "Kaydediliyor" : "Kaydet"}
      </button>
      {status === "saved" ? <p className="text-xs text-emerald-700 md:col-span-3">Fatura kaydedildi, müşteri mail bildirimi kuyruğa alındı.</p> : null}
      {status === "failed" ? <p className="text-xs text-red-600 md:col-span-3">Fatura kaydedilemedi.</p> : null}
    </form>
  );
}
