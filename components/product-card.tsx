"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Product, getProductComparePrice, getProductFinalPrice } from "@/lib/products";
import { useCart } from "@/components/cart-provider";

const blurDataURL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAxNiAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMjAiIGZpbGw9IiNmM2VmZTgiLz48L3N2Zz4=";

export function ProductCard({ product, quickAdd = false, compact = false }: { product: Product; quickAdd?: boolean; compact?: boolean }) {
  const secondImage = product.images[1] ?? product.images[0];
  const reduceMotion = useReducedMotion();
  const { addItem } = useCart();
  const displayTitle = product.displayTitle?.trim() || product.title;
  const finalPrice = getProductFinalPrice(product);
  const compareAtPrice = getProductComparePrice(product);

  function handleQuickAdd(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    addItem({ ...product, title: displayTitle }, { size: product.sizes[0], color: product.colors[0] });
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
      className="transition-shadow duration-500 hover:shadow-[0_22px_70px_rgba(41,37,31,0.08)]"
    >
      <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
        <Image
          src={product.images[0]}
          alt={displayTitle}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          placeholder="blur"
          blurDataURL={blurDataURL}
          className="object-cover transition duration-[900ms] ease-out group-hover:scale-[1.025] group-hover:opacity-0"
        />
        <Image
          src={secondImage}
          alt={`${displayTitle} detay`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          placeholder="blur"
          blurDataURL={blurDataURL}
          className="object-cover opacity-0 transition duration-[900ms] ease-out group-hover:scale-[1.025] group-hover:opacity-100"
        />
        <button
          aria-label="Favorilere ekle"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center bg-[#fbfaf7]/80 text-stone-700 opacity-100 backdrop-blur-sm transition duration-500 hover:scale-105 hover:bg-[#fbfaf7] hover:text-stone-950 md:opacity-0 md:group-hover:opacity-100"
        >
          <Heart size={15} strokeWidth={1.2} />
        </button>
        <div className="absolute inset-0 bg-stone-950/0 transition duration-500 group-hover:bg-stone-950/14" />
        <div className="absolute inset-x-0 bottom-0 translate-y-3 px-4 pb-4 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          {quickAdd ? (
            <button
              onClick={handleQuickAdd}
              className="hidden w-full items-center justify-center gap-2 bg-[#fbfaf7]/92 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-950 backdrop-blur-sm transition duration-500 hover:bg-white md:inline-flex"
            >
              <Plus size={13} strokeWidth={1.3} />
              Hızlı Ekle
            </button>
          ) : (
            <span className="inline-flex border border-white/70 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm">
              İncele
            </span>
          )}
        </div>
        {compareAtPrice ? (
          <span className="absolute left-3 top-3 bg-white/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-stone-700 backdrop-blur">
            %{product.discountPercent ? Math.round(product.discountPercent) : Math.round(((compareAtPrice - finalPrice) / compareAtPrice) * 100)} İndirim
          </span>
        ) : null}
      </div>
      <div className={compact ? "pt-3.5" : "pt-5"}>
        <div className="flex flex-col gap-2 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between min-[430px]:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">{product.collection}</p>
            <h3 className={`${compact ? "mt-1.5 min-h-9 text-[13px] leading-5" : "mt-2 min-h-10 text-[14px] leading-6"} line-clamp-2 font-normal text-stone-950`}>{displayTitle}</h3>
          </div>
          <p className="shrink-0 whitespace-nowrap text-[12px] font-normal text-stone-700">{finalPrice.toLocaleString("tr-TR")} TL</p>
        </div>
        <div className={`${compact ? "mt-2" : "mt-3"} flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-5 text-stone-500`}>
          <span>{product.sizes.slice(0, 2).join(" / ")}</span>
          <span className="h-1 w-1 rounded-full bg-stone-300" />
          <span>{product.colors.slice(0, 2).join(", ")}</span>
        </div>
        {compareAtPrice ? <p className="mt-1 text-xs text-stone-400 line-through">{compareAtPrice.toLocaleString("tr-TR")} TL</p> : null}
      </div>
      </Link>
    </motion.div>
  );
}
