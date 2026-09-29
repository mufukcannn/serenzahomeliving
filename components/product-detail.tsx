"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Heart,
  Home,
  Minus,
  Plus,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  WashingMachine,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, ProductVariant, getProductComparePrice, getProductFinalPrice, getVariantComparePrice, getVariantFinalPrice } from "@/lib/products";
import { useCart } from "@/components/cart-provider";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { productToAnalyticsItem, trackEcommerceEvent } from "@/lib/analytics";

const blurDataURL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAxNiAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMjAiIGZpbGw9IiNmYmZhZjciLz48L3N2Zz4=";

export function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id);
  const [manualSize, setManualSize] = useState(product.sizes[0] ?? "");
  const [manualColor, setManualColor] = useState(product.colors[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [specsOpen, setSpecsOpen] = useState(true);
  const [textureOpen, setTextureOpen] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const variants = product.variants ?? [];
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
  const activeVariant = selectedVariant ?? variants[0];
  const displayTitle = product.displayTitle?.trim() || product.title;
  const size = activeVariant?.size ?? manualSize;
  const color = activeVariant?.color ?? manualColor;
  const images = buildGallery(product, activeVariant);
  const related: Product[] = [];
  const unitPrice = activeVariant ? getVariantFinalPrice(activeVariant, product) : getProductFinalPrice(product);
  const oldPrice = getComparePrice(product, activeVariant, unitPrice);
  const stock = activeVariant?.stock ?? product.stock;
  const barcode = activeVariant?.barcode ?? product.barcode;

  useEffect(() => {
    setActiveImage(0);
  }, [activeVariant?.id]);

  useEffect(() => {
    trackEcommerceEvent({
      eventName: "view_item",
      value: unitPrice,
      items: [productToAnalyticsItem({ ...product, title: displayTitle, price: oldPrice ?? unitPrice, salePrice: oldPrice ? unitPrice : undefined }, { quantity: 1, size, color })]
    });
  }, [color, displayTitle, oldPrice, product, size, unitPrice]);

  function selectSize(nextSize: string) {
    setManualSize(nextSize);
    const nextVariant = variants.find((variant) => variant.size === nextSize && variant.color === color) ?? variants.find((variant) => variant.size === nextSize);
    if (nextVariant) setSelectedVariantId(nextVariant.id);
  }

  function selectColor(nextColor: string) {
    setManualColor(nextColor);
    const nextVariant = variants.find((variant) => variant.color === nextColor && variant.size === size) ?? variants.find((variant) => variant.color === nextColor);
    if (nextVariant) setSelectedVariantId(nextVariant.id);
  }

  function addSelectedToCart() {
    const cartProduct: Product = {
      ...product,
      title: displayTitle,
      price: oldPrice ?? unitPrice,
      finalPrice: unitPrice,
      salePrice: oldPrice ? unitPrice : undefined,
      compareAtPrice: oldPrice,
      stock,
      sku: activeVariant?.sku ?? product.sku,
      barcode: barcode ?? product.barcode,
      images
    };

    for (let index = 0; index < quantity; index += 1) {
      addItem(cartProduct, { color, size });
    }
  }

  return (
    <main className="bg-[#fbfaf7] pb-24 text-stone-950 md:pb-20">
      <motion.section
        className="px-5 pt-5 md:px-8 md:pt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-6 flex items-center gap-3 text-sm text-stone-600">
            <Link href="/" className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-stone-100 hover:text-stone-950" aria-label="Ana sayfa">
              <Home size={15} strokeWidth={1.45} />
            </Link>
            <Link href="/collections" className="transition hover:text-stone-950">Koleksiyonlar</Link>
            <ChevronRight size={14} strokeWidth={1.35} className="text-stone-300" />
            <Link href={`/collections/${slugify(product.collection)}`} className="transition hover:text-stone-950">{product.collection}</Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.58fr)_minmax(390px,0.42fr)] lg:items-start lg:gap-12">
            <Reveal>
              <ProductGallery
                images={images}
                productTitle={displayTitle}
                activeImage={activeImage}
                setActiveImage={setActiveImage}
                openLightbox={() => setLightboxOpen(true)}
              />
            </Reveal>

            <Reveal delay={0.06}>
              <aside className="mx-auto w-full max-w-[520px] lg:sticky lg:top-28 lg:self-start lg:pt-2">
                <p className="inline-flex rounded-full bg-[#f3efe8] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-stone-700">{product.collection}</p>
                <h1
                  className="mt-4 max-w-[520px] overflow-hidden font-serif font-normal"
                  style={{
                    fontSize: "clamp(2.15rem, 3.6vw, 3.85rem)",
                    lineHeight: 1.02,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical"
                  }}
                >
                  {displayTitle}
                </h1>
                <p
                  className="mt-5 max-w-[470px] overflow-hidden text-[15px] leading-7 text-stone-700"
                  style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
                >
                  {product.description}
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm text-stone-700">
                  <div className="flex text-stone-950">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={15} fill="currentColor" strokeWidth={1.2} />
                    ))}
                  </div>
                  <span>(128 değerlendirme)</span>
                </div>

                <div className="mt-7 flex items-baseline gap-4">
                  <p className="text-[28px] font-semibold tracking-[-0.02em] text-stone-950">{unitPrice.toLocaleString("tr-TR")} TL</p>
                  {oldPrice ? <p className="text-base text-stone-400 line-through">{oldPrice.toLocaleString("tr-TR")} TL</p> : null}
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#f1ede6] px-4 py-3 text-[13px] text-stone-800">
                  <Truck size={16} strokeWidth={1.4} />
                  <span>Ücretsiz kargo · 2-4 iş günü içinde teslim</span>
                </div>

                <div className="mt-8 space-y-6">
                  <VariantButtonSelector title="Ölçü" value={size} items={product.sizes} onChange={selectSize} />
                  <ColorSelector title="Renk" value={color} items={product.colors} onChange={selectColor} />
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-stone-200/70 pt-4">
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-800">Adet</span>
                  <Quantity value={quantity} onChange={setQuantity} />
                </div>

                <div className="mt-5 flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${stock > 0 ? "bg-emerald-600" : "bg-stone-400"}`} />
                  <span className={stock > 0 ? "text-emerald-700" : "text-stone-500"}>{stock > 0 ? "Stokta" : "Stokta yok"}</span>
                </div>
                {barcode ? (
                  <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
                    <span>Barkod</span>
                    <span>{barcode}</span>
                  </div>
                ) : null}

                <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
                  <motion.button
                    onClick={addSelectedToCart}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    className="inline-flex h-[64px] min-w-0 flex-1 items-center justify-center gap-3 rounded-md bg-stone-950 px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f8f1e7] shadow-[0_18px_45px_rgba(28,25,23,0.16)] transition duration-500 hover:bg-stone-800 sm:gap-4 sm:px-6 sm:text-[12px] sm:tracking-[0.22em]"
                  >
                    <ShoppingCart size={20} strokeWidth={1.45} />
                    Sepete Ekle
                  </motion.button>
                  <button aria-label="Favorilere ekle" className="grid h-[64px] w-full place-items-center rounded-md border border-stone-300/80 text-stone-900 transition duration-500 hover:border-stone-900 hover:bg-[#f3efe8] min-[420px]:w-[72px]">
                    <Heart size={24} strokeWidth={1.35} />
                  </button>
                </div>
              </aside>
            </Reveal>
          </div>
        </div>
      </motion.section>

      <ProductFeatureStrip />
      <ProductSpecs product={product} color={color} size={size} open={specsOpen} onToggle={() => setSpecsOpen((value) => !value)} />
      <CompactTextureStory images={images} open={textureOpen} onToggle={() => setTextureOpen((value) => !value)} />

      <section className="bg-[#f3efe8] px-5 py-14 md:px-8 md:py-16">
        <div className="mx-auto max-w-[1500px]">
          <Reveal className="mb-9 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Benzer Ürünler</p>
              <h2 className="mt-3 font-serif text-4xl font-normal">Aynı dokudan devam et</h2>
            </div>
            <Link href="/collections" className="hidden text-[11px] uppercase tracking-[0.2em] text-stone-500 md:block">Tüm ürünler</Link>
          </Reveal>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      </section>

      <MobileStickyBar price={unitPrice} size={size} onAdd={addSelectedToCart} />
      <Lightbox open={lightboxOpen} onClose={() => setLightboxOpen(false)} images={images} title={displayTitle} />
    </main>
  );
}

function ProductGallery({
  images,
  productTitle,
  activeImage,
  setActiveImage,
  openLightbox
}: {
  images: string[];
  productTitle: string;
  activeImage: number;
  setActiveImage: (index: number) => void;
  openLightbox: () => void;
}) {
  const previousImage = () => setActiveImage(activeImage === 0 ? images.length - 1 : activeImage - 1);
  const nextImage = () => setActiveImage(activeImage === images.length - 1 ? 0 : activeImage + 1);

  return (
    <div>
      <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-stone-100 text-left md:aspect-[5/5.7]">
        <button onClick={openLightbox} className="absolute inset-0 z-10" aria-label="Görselleri aç" />
        <Image
          src={images[activeImage]}
          alt={productTitle}
          fill
          priority
          sizes="(min-width: 1024px) 58vw, 100vw"
          placeholder="blur"
          blurDataURL={blurDataURL}
          className="object-cover transition duration-[1000ms] ease-out group-hover:scale-[1.035]"
        />
        <span className="absolute left-5 top-5 z-20 rounded-full bg-stone-950/55 px-4 py-2 text-sm text-white backdrop-blur">
          {activeImage + 1} / {images.length}
        </span>
        <button
          onClick={previousImage}
          className="absolute left-4 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-[#fbfaf7]/95 text-stone-950 shadow-sm transition duration-300 hover:scale-105"
          aria-label="Önceki görsel"
        >
          <ArrowLeft size={22} strokeWidth={1.45} />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-[#fbfaf7]/95 text-stone-950 shadow-sm transition duration-300 hover:scale-105"
          aria-label="Sonraki görsel"
        >
          <ArrowRight size={22} strokeWidth={1.45} />
        </button>
      </div>
      <div className="-mx-5 mt-4 flex gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:pb-0">
        {images.slice(0, 4).map((image, index) => (
          <button
            key={`${image}-${index}`}
            onClick={() => setActiveImage(index)}
            className={`group relative aspect-[1.25/1] w-28 shrink-0 overflow-hidden rounded-lg bg-stone-100 transition duration-300 md:w-auto ${
              activeImage === index ? "opacity-100 ring-1 ring-stone-800" : "opacity-60 hover:opacity-100"
            }`}
          >
            <Image src={image} alt={`${productTitle} ${index + 1}`} fill sizes="120px" className="object-cover transition duration-700 group-hover:scale-[1.04]" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductFeatureStrip() {
  const features = [
    { title: "Kaymaz taban", body: "Güvenli kullanım", icon: Truck },
    { title: "Yumuşak dokulu", body: "Konforlu yüzey", icon: Sparkles },
    { title: "Kolay temizlenir", body: "Pratik bakım", icon: Star },
    { title: "Makinede yıkanabilir", body: "30°C hassas program", icon: WashingMachine }
  ];
  return (
    <section className="px-5 pt-8 md:px-8 md:pt-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid overflow-hidden rounded-xl border border-stone-200/80 bg-[#fffdf9] shadow-[0_18px_55px_rgba(41,37,31,0.04)] md:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className={`flex items-center gap-4 px-6 py-5 ${index ? "border-t border-stone-200/70 md:border-l md:border-t-0" : ""}`}>
                <Icon size={27} strokeWidth={1.25} className="text-stone-950" />
                <div>
                  <p className="text-sm font-semibold text-stone-950">{feature.title}</p>
                  <p className="mt-1 text-xs text-stone-500">{feature.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductSpecs({
  product,
  color,
  size,
  open,
  onToggle
}: {
  product: Product;
  color: string;
  size: string;
  open: boolean;
  onToggle: () => void;
}) {
  const specs = [
    ["Malzeme", product.category.includes("Banyo") ? "%100 Polyester" : "Polyester dokuma"],
    ["Renk", color],
    ["Taban", product.category.includes("Banyo") || product.category.includes("Kaymaz") ? "Kaymaz TPR taban" : "Dokuma taban"],
    ["Kullanım alanı", usageArea(product)],
    ["Hav yüksekliği", product.category.includes("Banyo") ? "12 mm" : "Orta hav"],
    ["Paket içeriği", product.category.includes("Banyo") ? `2 adet (${size} + 50x60 cm)` : `1 adet (${size})`]
  ];

  return (
    <section className="px-5 pt-6 md:px-8">
      <div className="mx-auto max-w-[1500px] rounded-xl border border-stone-200/80 bg-[#fffdf9] px-5 py-5 shadow-[0_18px_55px_rgba(41,37,31,0.035)] md:px-8">
        <button onClick={onToggle} className="flex w-full items-center justify-between text-left">
          <h2 className="text-xl font-semibold text-stone-950">Ürün özellikleri</h2>
          <ChevronDown size={20} strokeWidth={1.35} className={`transition duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="grid gap-x-14 pt-6 md:grid-cols-2">
            {specs.map(([name, value]) => (
              <div key={name} className="grid grid-cols-[34px_1fr] gap-4 border-b border-stone-200/70 py-4 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0">
                <div className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 text-stone-800">
                  <Sparkles size={15} strokeWidth={1.25} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-950">{name}</p>
                  <p className="mt-1 text-sm text-stone-500">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CompactTextureStory({ images, open, onToggle }: { images: string[]; open: boolean; onToggle: () => void }) {
  return (
    <section className="px-5 pt-6 md:px-8">
      <div className="mx-auto max-w-[1500px] rounded-xl border border-stone-200/80 bg-[#fffdf9] px-5 py-5 shadow-[0_18px_55px_rgba(41,37,31,0.035)] md:px-8">
        <button onClick={onToggle} className="flex w-full items-center justify-between text-left">
          <h2 className="text-xl font-semibold text-stone-950">Doku ve bitiş</h2>
          <ChevronDown size={20} strokeWidth={1.35} className={`transition duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="grid gap-0 pt-6 md:grid-cols-[1fr_0.92fr_0.54fr]">
            <div className="relative min-h-52 overflow-hidden rounded-l-lg bg-stone-100 md:min-h-56">
              <Image src={images[2] ?? images[0]} alt="Yüzey dokusu" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
            </div>
            <div className="flex items-center bg-[#fbfaf7] p-8 text-sm leading-7 text-stone-700">
              Yumuşak dokusu, günlük kullanıma uygun yüzeyi ile banyonuza konfor sağlar. Seçilen iplik karakteri renk geçişlerini sakin ve doğal gösterir.
            </div>
            <div className="relative min-h-52 overflow-hidden rounded-r-lg bg-stone-100 md:min-h-56">
              <Image src={images[1] ?? images[0]} alt="Kenar bitiş detayı" fill sizes="(min-width: 768px) 22vw, 100vw" className="object-cover" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function buildGallery(product: Product, variant?: ProductVariant) {
  const fallback = [
    "/brand-images/hali-koleksiyon.png",
    "/brand-images/hali-kategori.jpg",
    "/brand-images/paspas.jpg",
    "/brand-images/uyelik.png"
  ];
  const merged = [...(variant?.images ?? []), ...product.images, ...fallback];
  return Array.from(new Set(merged)).slice(0, 4);
}

function getComparePrice(product: Product, variant: ProductVariant | undefined, _unitPrice: number) {
  if (variant) return getVariantComparePrice(variant, product);
  return getProductComparePrice(product);
}

function usageArea(product: Product) {
  if (product.category.includes("Banyo")) return "Banyo, lavabo önü, klozet önü";
  if (product.category.includes("Çocuk")) return "Çocuk odası, oyun alanı";
  if (product.category.includes("Paspas")) return "Kapı önü, giriş alanı";
  return "Salon, oturma odası, yatak odası";
}

function colorSwatch(color: string) {
  const key = color.toLocaleLowerCase("tr-TR");
  if (key.includes("gri")) return "#e8e5de";
  if (key.includes("bej")) return "#d9c6a8";
  if (key.includes("yeşil")) return "#7f8a6a";
  if (key.includes("siyah")) return "#171717";
  if (key.includes("beyaz") || key.includes("ekru") || key.includes("krem")) return "#f4efe5";
  if (key.includes("kahve") || key.includes("terra")) return "#9b6f4c";
  return "#e7dccb";
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function VariantButtonSelector({
  title,
  value,
  items,
  onChange
}: {
  title: string;
  value: string;
  items: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-800">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`h-14 rounded-md border px-4 text-sm font-medium transition duration-300 ${
              value === item
                ? "border-stone-950 bg-stone-950 text-[#f8f1e7]"
                : "border-stone-200 bg-[#fffdf9] text-stone-700 hover:border-stone-500 hover:bg-[#f7f3ed]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorSelector({
  title,
  value,
  items,
  onChange
}: {
  title: string;
  value: string;
  items: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-800">{title}</p>
      <div className="flex flex-wrap gap-4">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`inline-flex h-12 items-center gap-3 rounded-md px-3 pr-5 text-sm transition duration-300 ${
              value === item ? "bg-[#f3efe8] text-stone-950" : "text-stone-700 hover:bg-[#f7f3ed]"
            }`}
          >
            <span className={`grid h-8 w-8 place-items-center rounded-full border ${value === item ? "border-stone-950" : "border-stone-300"}`}>
              <span className="h-7 w-7 rounded-full border border-stone-200" style={{ background: colorSwatch(item) }} />
            </span>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function Quantity({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex h-12 items-center overflow-hidden rounded-md border border-stone-200 bg-[#fffdf9] text-sm">
      <button onClick={() => onChange(Math.max(1, value - 1))} className="grid h-12 w-12 place-items-center text-stone-500 transition hover:bg-[#f3efe8] hover:text-stone-950">
        <Minus size={14} strokeWidth={1.25} />
      </button>
      <span className="min-w-10 text-center font-medium">{value}</span>
      <button onClick={() => onChange(value + 1)} className="grid h-12 w-12 place-items-center text-stone-500 transition hover:bg-[#f3efe8] hover:text-stone-950">
        <Plus size={14} strokeWidth={1.25} />
      </button>
    </div>
  );
}

function MobileStickyBar({ price, size, onAdd }: { price: number; size: string; onAdd: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200/70 bg-[#fbfaf7]/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-stone-900">{price.toLocaleString("tr-TR")} TL</p>
          <p className="truncate text-xs text-stone-500">{size}</p>
        </div>
        <button onClick={onAdd} className="shrink-0 bg-stone-950 px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-[#f8f1e7] min-[380px]:px-5 min-[380px]:tracking-[0.18em]">
          Sepete Ekle
        </button>
      </div>
    </div>
  );
}

function Lightbox({ open, onClose, images, title }: { open: boolean; onClose: () => void; images: string[]; title: string }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[70] bg-[#fbfaf7] p-5 md:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button onClick={onClose} className="fixed right-5 top-5 z-[71] grid h-10 w-10 place-items-center bg-[#fbfaf7]/80 text-stone-800 backdrop-blur">
            <X size={20} strokeWidth={1.25} />
          </button>
          <div className="mx-auto grid h-full max-w-[1500px] gap-5 overflow-y-auto md:grid-cols-2">
            {images.map((image, index) => (
              <div key={`${image}-${index}`} className="relative min-h-[70vh] bg-stone-100">
                <Image src={image} alt={`${title} ${index + 1}`} fill sizes="50vw" className="object-cover" />
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
