"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { Product } from "@/lib/products";
import { catalogTaxonomy } from "@/lib/catalog-taxonomy";

const blurDataURL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAxNiAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMjAiIGZpbGw9IiNmYmZhZjciLz48L3N2Zz4=";

const filterGroups = [
  { title: "Ölçü", options: ["80x150", "120x180", "160x230", "200x300"] },
  { title: "Renk", options: ["Krem", "Terra", "Gri", "Natural"] },
  { title: "Fiyat", options: ["0-1.000 TL", "1.000-3.000 TL", "3.000 TL +"] }
];

export function CollectionListing({
  products,
  title = "Tüm Koleksiyonlar",
  description = "Serenza Home Living ana kategorileri ve koleksiyonlarından seçili dokuları keşfedin.",
  heroImage = "/brand-images/hali-koleksiyon.png",
  grouped = false
}: {
  products: Product[];
  title?: string;
  description?: string;
  heroImage?: string;
  grouped?: boolean;
}) {
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchQuery = searchParams.get("search")?.trim() ?? "";
  const listedProducts = searchQuery ? products.filter((product) => matchesSearch(product, searchQuery)) : products;
  const groups = grouped ? buildCategoryGroups(listedProducts) : [];
  const hasResults = listedProducts.length > 0;

  return (
    <main className="bg-[#fbfaf7] text-stone-950">
      <section className="px-5 pt-8 md:px-8 md:pt-10">
        <div className="mx-auto max-w-[1500px]">
          <Reveal>
            <div className="grid overflow-hidden bg-[#f3efe8] md:grid-cols-[1.15fr_0.85fr] md:items-stretch">
              <div className="px-6 py-12 md:px-10 md:py-16">
                <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Serenza Home Living</p>
                <h1 className="mt-4 font-serif text-5xl font-normal leading-[0.95] md:text-7xl">{title}</h1>
                <p className="mt-6 max-w-xl text-sm leading-8 text-stone-600">
                  {description}
                </p>
              </div>
              <div className="relative min-h-[260px] md:min-h-full">
                <Image
                  src={heroImage}
                  alt={title}
                  fill
                  priority
                  sizes="(min-width: 768px) 42vw, 100vw"
                  placeholder="blur"
                  blurDataURL={blurDataURL}
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sticky top-[102px] z-30 mt-8 border-y border-stone-200/60 bg-[#fbfaf7]/92 px-5 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 py-3">
          <div className="hidden items-center gap-8 md:flex">
            {filterGroups.map((group) => (
              <FilterDropdown key={group.title} group={group} />
            ))}
            <label className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-stone-500">
              Sıralama
              <select className="border-b border-stone-300 bg-transparent py-1 text-sm normal-case tracking-normal text-stone-700 outline-none">
                <option>Önerilen</option>
                <option>Fiyata Göre Artan</option>
                <option>Fiyata Göre Azalan</option>
              </select>
            </label>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-stone-700 md:hidden"
          >
            <SlidersHorizontal size={15} strokeWidth={1.25} />
            Filtrele
          </button>
          <p className="ml-auto text-sm text-stone-500">
            {searchQuery ? `"${searchQuery}" için ` : ""}
            {listedProducts.length} ürün
          </p>
        </div>
      </section>

      <section className="px-5 py-8 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1500px]">
          <ProductGridSkeleton />
          {!hasResults ? (
            <div className="grid min-h-[320px] place-items-center border border-stone-200/70 bg-[#f3efe8]/45 px-6 text-center">
              <div className="max-w-md">
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Arama</p>
                <h2 className="mt-3 font-serif text-4xl font-normal">Sonuç bulunamadı.</h2>
                <p className="mt-4 text-sm leading-7 text-stone-500">Farklı bir ürün, koleksiyon, renk veya ölçü aramayı deneyin.</p>
                <Link href="/collections" className="mt-7 inline-flex bg-stone-950 px-7 py-4 text-[10px] uppercase tracking-[0.2em] text-[#f8f1e7]">
                  Tüm Ürünlere Dön
                </Link>
              </div>
            </div>
          ) : grouped ? (
            <div className="space-y-16">
              {groups.map((group) => (
                <Reveal key={group.slug}>
                  <section id={group.slug} className="scroll-mt-40">
                    <div className="mb-7 flex flex-col justify-between gap-4 border-b border-stone-200/70 pb-5 md:flex-row md:items-end">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">{group.subtitle}</p>
                        <h2 className="mt-2 font-serif text-4xl font-normal leading-none md:text-5xl">{group.title}</h2>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-stone-500">{group.products.length} ürün</p>
                        <Link href={`/collections/${group.slug}`} className="text-[11px] uppercase tracking-[0.18em] text-stone-700 transition hover:text-stone-950">
                          Tümünü Gör
                        </Link>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14">
                      {group.products.map((product) => (
                        <ProductCard key={product.id} product={product} quickAdd compact />
                      ))}
                    </div>
                  </section>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14">
              {listedProducts.map((product) => (
                <ProductCard key={product.id} product={product} quickAdd compact />
              ))}
            </div>
          )}
        </div>
      </section>

      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </main>
  );
}

function buildCategoryGroups(products: Product[]) {
  return catalogTaxonomy
    .map((category) => {
      const categoryProducts = products.filter((product) => product.category === category.title);
      const collectionTitle = category.collections[0]?.title;
      return {
        title: category.title,
        slug: category.slug,
        subtitle: collectionTitle ? `${collectionTitle} alt kategorisi` : "Ana kategori",
        products: categoryProducts
      };
    })
    .filter((group) => group.products.length > 0);
}

function matchesSearch(product: Product, query: string) {
  const haystack = [
    product.title,
    product.displayTitle,
    product.collection,
    product.category,
    product.description,
    product.sku,
    product.barcode,
    ...product.sizes,
    ...product.colors
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeSearchText(haystack).includes(normalizeSearchText(query));
}

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function FilterDropdown({ group }: { group: { title: string; options: string[] } }) {
  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.16em] text-stone-600 transition hover:text-stone-950">
        {group.title}
      </summary>
      <div className="absolute left-0 top-8 min-w-48 border border-stone-200 bg-[#fbfaf7] p-4 shadow-sm">
        <div className="space-y-3">
          {group.options.map((option) => (
            <label key={option} className="flex items-center gap-3 text-sm text-stone-600">
              <input type="checkbox" className="h-3.5 w-3.5 accent-stone-950" />
              {option}
            </label>
          ))}
        </div>
      </div>
    </details>
  );
}

function FilterDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Filtreyi kapat"
            className="fixed inset-0 z-[60] bg-stone-950/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[61] w-full max-w-sm bg-[#fbfaf7] p-6"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Filtrele</p>
              <button onClick={onClose}>
                <X size={18} strokeWidth={1.25} />
              </button>
            </div>
            <div className="mt-8 space-y-8">
              {filterGroups.map((group) => (
                <div key={group.title}>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-900">{group.title}</p>
                  <div className="mt-4 space-y-3">
                    {group.options.map((option) => (
                      <label key={option} className="flex items-center gap-3 text-sm text-stone-600">
                        <input type="checkbox" className="h-3.5 w-3.5 accent-stone-950" />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={onClose} className="mt-10 w-full bg-stone-950 px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-[#f8f1e7]">
              Uygula
            </button>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="sr-only" aria-hidden="true">
      Loading product grid
    </div>
  );
}
