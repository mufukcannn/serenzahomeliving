"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { getCartLineKey, useCart } from "@/components/cart-provider";
import { getProductComparePrice, getProductFinalPrice } from "@/lib/products";

export default function CartPage() {
  const { items, total, shipping, grandTotal, removeItem, updateQuantity } = useCart();

  return (
    <main className="min-h-[70vh] bg-[#fbfaf7] px-5 py-12 text-stone-950 md:px-8 md:py-16">
      <div className="mx-auto max-w-[1320px]">
        <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Serenza Home Living</p>
        <h1 className="mt-3 font-serif text-5xl font-normal leading-none md:text-7xl">Sepet</h1>

        {items.length === 0 ? (
          <section className="mt-10 grid min-h-[360px] place-items-center border border-stone-200/70 bg-[#f3efe8]/45 px-6 text-center">
            <div className="max-w-md">
              <h2 className="font-serif text-4xl font-normal">Sepetiniz boş.</h2>
              <p className="mt-4 text-sm leading-7 text-stone-500">Yaşam alanınıza uygun dokuları keşfedip, favori ölçü ve renk seçiminizle sepete ekleyebilirsiniz.</p>
              <Link href="/collections" className="mt-7 inline-flex bg-stone-950 px-7 py-4 text-[10px] uppercase tracking-[0.2em] text-[#f8f1e7] transition hover:bg-stone-800">
                Koleksiyonlara Dön
              </Link>
            </div>
          </section>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="space-y-4">
              {items.map((line) => {
                const lineKey = getCartLineKey(line);
                const unitPrice = getProductFinalPrice(line.product);
                const compareAtPrice = getProductComparePrice(line.product);
                return (
                  <article key={lineKey} className="grid grid-cols-[96px_1fr] gap-4 border-b border-stone-200/70 pb-5 md:grid-cols-[132px_1fr_auto] md:gap-6">
                    <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
                      <Image src={line.product.images[0]} alt={line.product.title} fill sizes="132px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">{line.product.collection}</p>
                      <h2 className="mt-2 max-w-xl font-serif text-3xl font-normal leading-[1.05] md:text-4xl">{line.product.title}</h2>
                      <p className="mt-3 text-sm text-stone-500">
                        {line.size ?? "Ölçü"} / {line.color ?? "Renk"}
                      </p>
                      <div className="mt-5 flex items-center gap-4">
                        <Quantity value={line.quantity} onChange={(quantity) => updateQuantity(lineKey, quantity)} />
                        <button onClick={() => removeItem(lineKey)} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-stone-400 transition hover:text-stone-950">
                          <Trash2 size={13} strokeWidth={1.25} />
                          Sil
                        </button>
                      </div>
                    </div>
                    <div className="col-span-2 text-right md:col-span-1 md:min-w-28">
                      <p className="text-sm text-stone-900">{(unitPrice * line.quantity).toLocaleString("tr-TR")} TL</p>
                      {compareAtPrice ? <p className="mt-1 text-xs text-stone-400 line-through">{(compareAtPrice * line.quantity).toLocaleString("tr-TR")} TL</p> : null}
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="h-fit border border-stone-200/70 bg-[#f3efe8]/45 p-6 lg:sticky lg:top-28">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Sipariş Özeti</p>
              <div className="mt-6 space-y-3 text-sm text-stone-600">
                <div className="flex justify-between">
                  <span>Ara toplam</span>
                  <span>{total.toLocaleString("tr-TR")} TL</span>
                </div>
                <div className="flex justify-between">
                  <span>Kargo</span>
                  <span>{shipping ? `${shipping.toLocaleString("tr-TR")} TL` : "Ücretsiz"}</span>
                </div>
              </div>
              <label className="mt-6 block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400">İndirim kodu</span>
                <input className="mt-3 w-full border border-stone-200/80 bg-[#fbfaf7] px-4 py-3 text-sm outline-none transition focus:border-stone-700" placeholder="Kodunuzu girin" />
              </label>
              <div className="mt-6 flex justify-between border-t border-stone-200/70 pt-5 text-lg text-stone-950">
                <span>Toplam</span>
                <span>{grandTotal.toLocaleString("tr-TR")} TL</span>
              </div>
              <Link href="/checkout" className="mt-7 block bg-stone-950 px-6 py-4 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[#f8f1e7] transition hover:bg-stone-800">
                Siparişi Tamamla
              </Link>
              <Link href="/collections" className="mt-3 block px-6 py-3 text-center text-[10px] uppercase tracking-[0.18em] text-stone-500 transition hover:text-stone-950">
                Alışverişe Devam Et
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function Quantity({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="inline-flex h-10 items-center border border-stone-200/80 text-sm">
      <button onClick={() => onChange(Math.max(1, value - 1))} className="grid h-10 w-10 place-items-center text-stone-500 transition hover:bg-[#f3efe8] hover:text-stone-950">
        <Minus size={14} strokeWidth={1.25} />
      </button>
      <span className="min-w-9 text-center">{value}</span>
      <button onClick={() => onChange(value + 1)} className="grid h-10 w-10 place-items-center text-stone-500 transition hover:bg-[#f3efe8] hover:text-stone-950">
        <Plus size={14} strokeWidth={1.25} />
      </button>
    </div>
  );
}
