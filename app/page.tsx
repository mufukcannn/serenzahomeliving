"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { demoProducts } from "@/lib/products";

const blurDataURL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAxNiAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMjAiIGZpbGw9IiNmYmZhZjciLz48L3N2Zz4=";

const categoryTiles = [
  ["Halı", "Vintage Koleksiyonu", "Zamansız desenler", "/brand-images/hali-koleksiyon.png", "/collections/hali"],
  ["Çocuk Halısı", "Mini Teaser Koleksiyonu", "Yumuşak oyun alanları", "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=1100&auto=format&fit=crop", "/collections/cocuk-halisi"],
  ["Kaymaz Taban Halı", "", "Günlük kullanıma sakin çözümler", "https://images.unsplash.com/photo-1600210491369-e753d80a41f3?q=80&w=1100&auto=format&fit=crop", "/collections/kaymaz-taban-hali"],
  ["Banyo Serisi", "", "Suya dayanıklı dokular", "/brand-images/uyelik.png", "/collections/banyo-serisi"],
  ["Paspas", "Kapı önü", "İlk temas için doğal yüzeyler", "/brand-images/paspas-kategori.jpg", "/collections/paspas"]
] satisfies CategoryTile[];

const collectionTiles = [
  ["Yeni Gelen Halılar", "/brand-images/hali-koleksiyon.png"],
  ["Çocuk Odası Seçkisi", "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=1200&auto=format&fit=crop"],
  ["Paspas ve Banyo Serisi", "/brand-images/paspas.jpg"]
];

const popularCollections = [
  ["Vintage Koleksiyonu", "/brand-images/hali-koleksiyon.png"],
  ["Mini Teaser Koleksiyonu", "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=900&auto=format&fit=crop"],
  ["Kaymaz Taban Halı", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=900&auto=format&fit=crop"],
  ["Banyo ve Paspas", "/brand-images/uyelik.png"]
];

export default function HomePage() {
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();
  const heroY = useTransform(scrollY, [0, 700], [0, reduceMotion ? 0 : 70]);
  const heroScale = useTransform(scrollY, [0, 700], [1, reduceMotion ? 1 : 1.045]);

  return (
    <main className="bg-[#fbfaf7]">
      <section className="relative min-h-[92vh] overflow-hidden bg-stone-950 text-white">
        <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
          <Image
            src="/brand-images/hali-koleksiyon.png"
            alt="Serenza Home Living halı koleksiyonu"
            fill
            priority
            sizes="100vw"
            placeholder="blur"
            blurDataURL={blurDataURL}
            className="object-cover opacity-[0.9]"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(38,29,21,0.52)_0%,rgba(38,29,21,0.20)_45%,rgba(38,29,21,0.06)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_28%,rgba(255,244,225,0.16),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.8)_1px,transparent_0)] [background-size:4px_4px]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(180deg,rgba(251,250,247,0)_0%,rgba(251,250,247,0.55)_58%,#fbfaf7_100%)]" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-[1500px] items-end px-5 pb-20 pt-32 md:px-8 md:pb-28">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-[620px] translate-y-8 md:translate-y-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/72">Serenza Home Living</p>
            <h1 className="mt-5 max-w-[560px] font-serif text-[3.6rem] font-normal leading-[0.86] text-white md:text-[6.4rem]">
              Evin karakterini dokuyla tamamla.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
              Vintage halılar, çocuk odası koleksiyonları, kaymaz taban modeller ve ev tekstilinde Serenza Home Living dokusunu keşfedin.
            </p>
            <Link
              href="/collections"
              className="mt-9 inline-flex bg-[#f5efe4]/92 px-7 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-stone-900 transition duration-300 hover:bg-white"
            >
              Dokuları Keşfet
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <Reveal className="mb-10 flex flex-col justify-between gap-6 md:mb-12 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-stone-400">Kategoriler</p>
              <h2 className="mt-3 font-serif text-4xl font-normal text-stone-950 md:text-5xl">Dokunun kullanım alanı.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-stone-500">
              Her kategori; ölçü, yüzey ve kullanım alışkanlığına göre sadeleştirilmiş bir seçki olarak kurgulandı.
            </p>
          </Reveal>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
            <div className="lg:w-[39%] lg:shrink-0">
              <CategoryEditorialCard item={categoryTiles[0]} index={0} featured />
            </div>
            <div className="grid min-w-0 flex-1 gap-8 sm:grid-cols-2">
              {categoryTiles.slice(1).map((item, index) => (
                <CategoryEditorialCard key={item[0]} item={item} index={index + 1} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 md:px-8 md:pb-24">
        <div className="mx-auto max-w-[1500px]">
          <Reveal className="mb-10 flex items-end justify-between gap-5">
            <h2 className="font-serif text-4xl font-normal text-stone-950">Her alan için seçki</h2>
            <Link href="/collections" className="hidden text-[11px] uppercase tracking-[0.22em] text-stone-500 transition hover:text-stone-950 md:block">
              Tüm seçkiler
            </Link>
          </Reveal>
          <div className="grid gap-9 md:grid-cols-3">
            {collectionTiles.map(([title, image], index) => (
              <Reveal key={title} delay={index * 0.06}>
              <Link href="/collections" className="group relative block h-[340px] overflow-hidden bg-stone-100 md:h-[480px]">
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  placeholder="blur"
                  blurDataURL={blurDataURL}
                  className="object-cover saturate-[0.92] transition duration-[1000ms] ease-out group-hover:scale-[1.035]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-7">
                  <p className="font-serif text-3xl font-normal text-white">{title}</p>
                </div>
              </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f3efe8] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <Reveal className="mb-12 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-stone-400">Öne Çıkanlar</p>
              <h2 className="mt-3 font-serif text-4xl font-normal text-stone-950">Seçili dokular</h2>
            </div>
            <Link href="/collections" className="text-[11px] uppercase tracking-[0.22em] text-stone-500 transition hover:text-stone-950">
              Tümünü Gör
            </Link>
          </Reveal>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {[...demoProducts, demoProducts[0]].map((product, index) => (
              <ProductCard key={`${product.id}-${index}`} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <Reveal>
            <h2 className="mb-10 text-center font-serif text-4xl font-normal text-stone-950">Popüler koleksiyonlar</h2>
          </Reveal>
          <div className="grid gap-9 md:grid-cols-4">
            {popularCollections.map(([title, image], index) => (
              <Reveal key={title} delay={index * 0.05}>
              <Link href="/collections" className="group block">
                <div className="aspect-[4/5] overflow-hidden bg-stone-100">
                  <Image
                    src={image}
                    alt={title}
                    width={900}
                    height={1125}
                    sizes="(min-width: 768px) 25vw, 100vw"
                    placeholder="blur"
                    blurDataURL={blurDataURL}
                    className="h-full w-full object-cover saturate-[0.92] transition duration-[1000ms] ease-out group-hover:scale-[1.035]"
                    loading="lazy"
                  />
                </div>
                <p className="mt-4 text-center text-sm uppercase tracking-[0.16em] text-stone-700">{title}</p>
              </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function CategoryEditorialCard({
  item,
  index,
  featured = false
}: {
  item: CategoryTile;
  index: number;
  featured?: boolean;
}) {
  const [title, subtitle, description, image, href] = item;

  return (
    <Reveal delay={index * 0.04}>
      <Link href={href} className="group block min-w-0">
        <div className={`relative overflow-hidden bg-stone-100 ${featured ? "aspect-[4/5]" : "aspect-[5/4]"}`}>
          <Image
            src={image}
            alt={title}
            fill
            sizes={featured ? "(min-width: 1024px) 36vw, 100vw" : "(min-width: 1024px) 30vw, 100vw"}
            placeholder="blur"
            blurDataURL={blurDataURL}
            className="object-cover saturate-[0.92] transition duration-[1000ms] ease-out group-hover:scale-[1.035]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-black/6 to-transparent transition duration-700 group-hover:from-black/54" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="font-serif text-2xl font-normal leading-tight">{title}</p>
            {subtitle ? <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/70">{subtitle}</p> : null}
          </div>
        </div>
        <p className={`mt-4 max-w-full text-wrap-balance text-sm leading-[1.55] text-stone-500 ${featured ? "max-w-sm" : ""}`}>{description}</p>
      </Link>
    </Reveal>
  );
}

type CategoryTile = [title: string, subtitle: string, description: string, image: string, href: string];
