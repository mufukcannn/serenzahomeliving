import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200/60 bg-[#f3efe8] px-5 py-20 text-stone-700 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-[1500px] gap-10 md:grid-cols-[1.3fr_0.75fr_0.75fr_0.75fr]">
        <div>
          <div className="relative h-9 w-[170px]">
            <Image src="/logo1.png" alt="Serenza Home Living" fill sizes="170px" className="object-contain object-left" />
          </div>
          <p className="mt-6 max-w-sm text-sm leading-7 text-stone-500">
            Evin karakterini dokuyla tamamlayan halı ve ev tekstili seçkileri.
          </p>
        </div>
        <div className="text-sm leading-8 text-stone-500">
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-stone-900">Koleksiyonlar</p>
          <p>Vintage Koleksiyonu</p>
          <p>Mini Teaser</p>
          <p>Kaymaz Taban</p>
        </div>
        <div className="text-sm leading-8 text-stone-500">
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-stone-900">Destek</p>
          <p>Sipariş Takibi</p>
          <p>Kargo ve Teslimat</p>
          <p>Kolay İade</p>
        </div>
        <div className="text-sm leading-8 text-stone-500">
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-stone-900">Sosyal</p>
          <Link href="https://www.instagram.com/" target="_blank" className="transition hover:text-stone-950">
            Instagram
          </Link>
        </div>
      </div>
    </footer>
  );
}
