import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="bg-porcelain">
      <section className="grid md:grid-cols-2">
        <div className="relative h-[360px] md:h-[620px]">
          <Image
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1800&auto=format&fit=crop"
            alt="Serenza Home Living showroom detail"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex items-center px-8 py-16 md:px-16">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/45">Hakkımızda</p>
            <h1 className="mt-5 font-serif text-5xl leading-none md:text-6xl">Her zemin, evin ritmini belirler.</h1>
            <p className="mt-6 text-lg leading-8 text-ink/65">
              Serenza Home Living, halı, paspas ve ev tekstili seçkisini ölçü, doku ve kullanım alanına göre sadeleştirerek sıcak bir showroom deneyimine taşır.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
