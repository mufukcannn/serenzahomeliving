"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CartBadge } from "@/components/cart-badge";
import { useCart } from "@/components/cart-provider";

const categories = [
  { title: "Halı", href: "/collections/hali" },
  { title: "Çocuk Halısı", href: "/collections/cocuk-halisi" },
  { title: "Kaymaz Taban Halı", href: "/collections/kaymaz-taban-hali" },
  { title: "Banyo Serisi", href: "/collections/banyo-serisi" },
  { title: "Paspas", href: "/collections/paspas" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { openDrawer } = useCart();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const logoHeight = useTransform(scrollY, [0, 180], [36, 31]);
  const topPadding = useTransform(scrollY, [0, 180], [12, 9]);
  const bottomPadding = useTransform(scrollY, [0, 180], [12, 9]);
  const transparent = pathname === "/" && !scrolled;

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 120);
  });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setSearchValue(new URLSearchParams(window.location.search).get("search") ?? "");
  }, [pathname]);

  function goToSearch() {
    const query = searchValue.trim();
    setMenuOpen(false);
    router.push(query ? `/collections?search=${encodeURIComponent(query)}` : "/collections");
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToSearch();
  }

  function submitSearchFromInput(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    goToSearch();
  }

  return (
    <>
      <motion.header
        className={`top-0 z-[80] transition-colors duration-500 ${
          pathname === "/" ? "fixed inset-x-0" : "sticky"
        } ${
          transparent
            ? "border-b border-white/10 bg-transparent text-white"
            : "border-b border-stone-200/45 bg-[#fbfaf7]/86 text-stone-900 backdrop-blur-sm"
        }`}
        style={{ WebkitBackdropFilter: "blur(10px)" }}
      >
      <motion.div
        className="relative mx-auto flex max-w-[1500px] items-center gap-5 px-5 md:px-8"
        style={{ paddingTop: topPadding, paddingBottom: bottomPadding }}
      >
        <button
          aria-label={menuOpen ? "Menüyü kapat" : "Menü"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
          className="grid h-9 w-9 place-items-center transition-colors md:hidden"
        >
          <Menu size={19} strokeWidth={1.5} />
        </button>
        <Link href="/" className="absolute left-1/2 block w-[148px] shrink-0 -translate-x-1/2 md:static md:w-[170px] md:translate-x-0">
          <motion.div style={{ height: logoHeight }} className="relative w-full">
            <Image
              src="/logo1.png"
              alt="Serenza Home Living"
              fill
              sizes="170px"
              className={`object-contain object-center transition duration-500 md:object-left ${transparent ? "brightness-0 invert" : ""}`}
              priority
            />
          </motion.div>
        </Link>
        <form
          onSubmit={submitSearch}
          role="search"
          className={`mx-auto hidden h-8 max-w-[340px] flex-1 items-center gap-3 border-b px-1 text-[12px] transition-colors md:flex ${
            transparent ? "border-white/45 text-white/72 focus-within:border-white" : "border-stone-300/80 text-stone-500 focus-within:border-stone-700"
          }`}
        >
          <Search size={14} strokeWidth={1.25} />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={submitSearchFromInput}
            className={`w-full bg-transparent outline-none ${transparent ? "placeholder:text-white/60" : "placeholder:text-stone-400"}`}
            placeholder="Dokular, koleksiyonlar, ölçüler"
            aria-label="Ürün ara"
          />
        </form>
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <button aria-label="Favoriler" className="grid h-9 w-9 place-items-center transition duration-300 hover:opacity-70">
            <Heart size={17} strokeWidth={1.25} />
          </button>
          <button aria-label="Hesabım" className="hidden h-9 w-9 place-items-center transition duration-300 hover:opacity-70 sm:grid">
            <UserRound size={17} strokeWidth={1.25} />
          </button>
          <button onClick={openDrawer} aria-label="Sepet" className="relative grid h-9 w-9 place-items-center transition duration-300 hover:opacity-70">
            <ShoppingBag size={17} strokeWidth={1.25} />
            <CartBadge />
          </button>
        </div>
      </motion.div>
      <nav className={`hidden border-t transition-colors duration-500 md:block ${transparent ? "border-white/10" : "border-stone-200/45"}`}>
        <div className={`mx-auto flex max-w-[1500px] justify-center gap-10 overflow-x-auto px-8 py-2.5 text-[11px] font-normal uppercase tracking-[0.135em] transition-colors ${transparent ? "text-white/78" : "text-stone-600"}`}>
          {categories.map((category) => (
            <Link key={category.title} href={category.href} className="shrink-0 whitespace-nowrap transition duration-300 hover:opacity-70">
              {category.title}
            </Link>
          ))}
        </div>
      </nav>
      <div className="px-5 pb-3 md:hidden">
        <form
          onSubmit={submitSearch}
          role="search"
          className={`flex h-9 items-center gap-3 border-b text-[12px] transition-colors ${transparent ? "border-white/35 text-white/72" : "border-stone-300/80 text-stone-500"}`}
        >
          <Search size={15} strokeWidth={1.25} />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={submitSearchFromInput}
            className={`w-full bg-transparent outline-none ${transparent ? "placeholder:text-white/55" : "placeholder:text-stone-400"}`}
            placeholder="Koleksiyon ara"
            aria-label="Ürün ara"
          />
        </form>
      </div>
      </motion.header>
      {menuOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-[106px] z-[90] min-h-[calc(100dvh-106px)] overflow-y-auto bg-[#fbfaf7] px-5 py-5 text-stone-950 shadow-2xl md:hidden">
          <div className="mb-5 flex items-center justify-between border-b border-stone-200/70 pb-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Kategoriler</p>
            <button aria-label="Menüyü kapat" onClick={() => setMenuOpen(false)} className="grid h-9 w-9 place-items-center text-stone-600">
              <X size={18} strokeWidth={1.35} />
            </button>
          </div>
          <nav className="grid gap-2">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="flex items-center justify-between border-b border-stone-200/60 py-4 font-serif text-3xl text-stone-950"
              >
                {category.title}
                <span className="text-sm text-stone-400">Git</span>
              </Link>
            ))}
          </nav>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <Link href="/collections" className="bg-stone-950 px-4 py-4 text-center text-[10px] uppercase tracking-[0.18em] text-[#f8f1e7]">
              Tüm Ürünler
            </Link>
            <Link href="/contact" className="border border-stone-300 px-4 py-4 text-center text-[10px] uppercase tracking-[0.18em] text-stone-700">
              İletişim
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
