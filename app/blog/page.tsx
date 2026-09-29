import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { articles } from "@/lib/content/articles";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Rehberler ve İlham",
  description: "Halı ölçüsü, bakım, malzeme ve oda ilhamı için Serenza Home Living rehberleri.",
  path: "/blog"
});

export default function BlogPage() {
  return (
    <main className="bg-[#fbfaf7] px-5 py-16 text-stone-950 md:px-8">
      <div className="mx-auto max-w-[1320px]">
        <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Serenza Home Living Journal</p>
        <h1 className="mt-3 font-serif text-5xl font-normal md:text-7xl">Rehberler ve ilham</h1>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {articles.map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`} className="group block">
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                <Image src={article.heroImage} alt={article.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
              </div>
              <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-stone-400">{article.category}</p>
              <h2 className="mt-2 font-serif text-4xl font-normal">{article.title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-500">{article.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
