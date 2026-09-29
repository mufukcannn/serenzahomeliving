export default function ContactPage() {
  return (
    <main className="bg-porcelain px-5 py-16 text-ink md:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/45">İletişim</p>
          <h1 className="mt-4 font-serif text-5xl leading-none md:text-6xl">Showroom ve proje talepleri.</h1>
          <p className="mt-6 text-lg leading-8 text-ink/65">Sipariş, kurumsal proje, kargo ve ürün sorularınız için bize ulaşabilirsiniz.</p>
        </div>
        <form className="grid gap-4 bg-white p-8">
          <input placeholder="Ad Soyad" className="border border-ink/10 px-4 py-3" />
          <input placeholder="E-posta" className="border border-ink/10 px-4 py-3" />
          <textarea placeholder="Mesaj" className="min-h-40 border border-ink/10 px-4 py-3" />
          <button className="bg-ink px-6 py-4 text-sm uppercase tracking-[0.16em] text-white">Gönder</button>
        </form>
      </div>
    </main>
  );
}
