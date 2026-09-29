"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getCartLineKey, useCart } from "@/components/cart-provider";
import { getProductFinalPrice } from "@/lib/products";

export function CartDrawer() {
  const { items, total, grandTotal, shipping, drawerOpen, closeDrawer, updateQuantity, removeItem } = useCart();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <AnimatePresence>
      {drawerOpen ? (
        <>
          <motion.button
            aria-label="Sepeti kapat"
            className="fixed inset-0 z-[60] bg-stone-950/22 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
          />
          <motion.aside
            className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[92vh] flex-col bg-[#fbfaf7] shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:h-full md:max-h-none md:w-full md:max-w-[440px]"
            initial={isDesktop ? { x: "100%" } : { y: "100%" }}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={isDesktop ? { x: "100%" } : { y: "100%" }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-stone-200/70 px-5 py-5 md:px-7">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Serenza Home Living Sepet</p>
                <p className="mt-1 text-sm text-stone-600">{items.length ? `${items.length} ürün seçildi` : "Sepetiniz boş"}</p>
              </div>
              <button onClick={closeDrawer} className="grid h-10 w-10 place-items-center text-stone-500 transition hover:bg-[#f3efe8] hover:text-stone-950">
                <X size={18} strokeWidth={1.25} />
              </button>
            </div>

            {items.length ? (
              <>
                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 md:px-7">
                  {items.map((line) => {
                    const lineKey = getCartLineKey(line);
                    const unitPrice = getProductFinalPrice(line.product);
                    return (
                      <div key={lineKey} className="grid grid-cols-[88px_1fr] gap-4">
                        <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
                          <Image src={line.product.images[0]} alt={line.product.title} fill sizes="88px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-serif text-[21px] leading-[1.05] text-stone-950">{line.product.title}</h3>
                              <p className="mt-2 text-xs leading-5 text-stone-500">
                                {line.size ?? "Ölçü"} / {line.color ?? "Renk"}
                              </p>
                            </div>
                            <button onClick={() => removeItem(lineKey)} className="text-[10px] uppercase tracking-[0.16em] text-stone-400 transition hover:text-stone-950">
                              Sil
                            </button>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-4">
                            <QuantityMini value={line.quantity} onChange={(quantity) => updateQuantity(lineKey, quantity)} />
                            <p className="text-sm text-stone-900">{(unitPrice * line.quantity).toLocaleString("tr-TR")} TL</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-stone-200/70 px-5 py-5 md:px-7">
                  <div className="space-y-2 text-sm text-stone-600">
                    <div className="flex justify-between">
                      <span>Ara toplam</span>
                      <span>{total.toLocaleString("tr-TR")} TL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kargo</span>
                      <span>{shipping ? `${shipping.toLocaleString("tr-TR")} TL` : "Ücretsiz"}</span>
                    </div>
                    <div className="flex justify-between border-t border-stone-200/70 pt-3 text-base text-stone-950">
                      <span>Toplam</span>
                      <span>{grandTotal.toLocaleString("tr-TR")} TL</span>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Link onClick={closeDrawer} href="/checkout" className="bg-stone-950 px-6 py-4 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[#f8f1e7] transition duration-500 hover:bg-stone-800">
                      Siparişi Tamamla
                    </Link>
                    <Link onClick={closeDrawer} href="/cart" className="border border-stone-300/80 px-6 py-4 text-center text-[10px] uppercase tracking-[0.2em] text-stone-900 transition duration-500 hover:border-stone-900 hover:bg-[#f3efe8]">
                      Sepete Git
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center px-7 py-14 text-center">
                <div>
                  <ShoppingBag className="mx-auto text-stone-300" size={34} strokeWidth={1.1} />
                  <h3 className="mt-5 font-serif text-4xl">Sepetiniz sakin.</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-500">Vintage dokular ve ev tekstili seçkisini keşfederek başlayabilirsiniz.</p>
                  <Link onClick={closeDrawer} href="/collections" className="mt-7 inline-flex bg-stone-950 px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-[#f8f1e7]">
                    Koleksiyona Git
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function QuantityMini({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="inline-flex h-9 items-center border border-stone-200/80 text-sm">
      <button onClick={() => onChange(Math.max(1, value - 1))} className="grid h-9 w-9 place-items-center text-stone-500 transition hover:bg-[#f3efe8] hover:text-stone-950">
        <Minus size={13} strokeWidth={1.25} />
      </button>
      <span className="min-w-8 text-center text-stone-900">{value}</span>
      <button onClick={() => onChange(value + 1)} className="grid h-9 w-9 place-items-center text-stone-500 transition hover:bg-[#f3efe8] hover:text-stone-950">
        <Plus size={13} strokeWidth={1.25} />
      </button>
    </div>
  );
}
