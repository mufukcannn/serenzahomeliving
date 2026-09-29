import Link from "next/link";

export default function PaymentFailedPage({ searchParams }: { searchParams: { orderId?: string; provider?: string; reason?: string } }) {
  return (
    <main className="grid min-h-[72vh] place-items-center bg-[#fbfaf7] px-5 py-20 text-center text-stone-950">
      <section className="max-w-xl">
        <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Ödeme Tamamlanamadı</p>
        <h1 className="mt-4 font-serif text-5xl font-normal leading-none md:text-7xl">Ödeme başarısız.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-stone-500">
          Kartınızdan tahsilat alınmadı. Bilgileri kontrol edip tekrar deneyebilir veya farklı bir ödeme yöntemi seçebilirsiniz.
        </p>
        <div className="mx-auto mt-8 max-w-sm border border-stone-200/70 bg-[#f3efe8]/45 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Referans</p>
          <p className="mt-2 text-sm text-stone-800">{searchParams.orderId ?? searchParams.provider ?? "odeme_tamamlanamadi"}</p>
          {searchParams.reason ? <p className="mt-3 text-xs leading-6 text-stone-500">{searchParams.reason}</p> : null}
        </div>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/checkout" className="bg-stone-950 px-7 py-4 text-[10px] uppercase tracking-[0.2em] text-[#f8f1e7] transition hover:bg-stone-800">
            Tekrar Dene
          </Link>
          <Link href="/collections" className="border border-stone-300/80 px-7 py-4 text-[10px] uppercase tracking-[0.2em] text-stone-900 transition hover:border-stone-900 hover:bg-[#f3efe8]">
            Alışverişe Dön
          </Link>
        </div>
      </section>
    </main>
  );
}
