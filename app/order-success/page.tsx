import Link from "next/link";
import { PurchaseTracker } from "@/components/purchase-tracker";

export default function OrderSuccessPage({ searchParams }: { searchParams: { orderId?: string; orderNumber?: string; value?: string } }) {
  const orderNumber = searchParams.orderNumber ?? searchParams.orderId ?? "WEB-DEMO";
  const value = searchParams.value ? Number(searchParams.value) : undefined;

  return (
    <main className="grid min-h-[70vh] place-items-center bg-[#fbfaf7] px-5 py-16 text-center text-stone-950">
      <PurchaseTracker orderId={searchParams.orderId} orderNumber={searchParams.orderNumber} value={value} />
      <div className="max-w-2xl">
        <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Sipariş Başarılı</p>
        <h1 className="mt-5 font-serif text-5xl font-normal leading-none md:text-7xl">Teşekkürler.</h1>
        <p className="mt-6 text-sm leading-7 text-stone-600 md:text-base md:leading-8">
          Siparişiniz alındı. Ödemeniz güvenli şekilde doğrulandıktan sonra hazırlık süreci başlar ve sipariş panelinde takip edilir.
        </p>
        <div className="mx-auto mt-8 max-w-sm border border-stone-200/70 bg-[#f3efe8]/45 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Sipariş No</p>
          <p className="mt-2 font-serif text-3xl text-stone-950">{orderNumber}</p>
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/collections" className="bg-stone-950 px-7 py-4 text-[10px] uppercase tracking-[0.2em] text-[#f8f1e7] transition hover:bg-stone-800">
            Alışverişe Devam Et
          </Link>
          <Link href={`/order-success?orderNumber=${orderNumber}`} className="border border-stone-300/80 px-7 py-4 text-[10px] uppercase tracking-[0.2em] text-stone-900 transition hover:border-stone-900 hover:bg-[#f3efe8]">
            Siparişimi Gör
          </Link>
        </div>
      </div>
    </main>
  );
}
