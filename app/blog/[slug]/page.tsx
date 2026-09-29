import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/structured-data";
import { articles, getArticle } from "@/lib/content/articles";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, faqJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = getArticle(params.slug);
  if (!article) return {};
  return buildMetadata({
    title: article.seoTitle,
    description: article.seoDescription,
    path: `/blog/${article.slug}`,
    image: article.heroImage,
    type: "article"
  });
}

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug);
  if (!article) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: absoluteUrl(article.heroImage),
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: "Serenza Home Living" },
    publisher: { "@type": "Organization", name: "Serenza Home Living" },
    mainEntityOfPage: absoluteUrl(`/blog/${article.slug}`)
  };

  return (
    <main className="bg-[#fbfaf7] text-stone-950">
      <StructuredData data={articleJsonLd} />
      <StructuredData data={faqJsonLd(article.faq)} />
      <StructuredData data={breadcrumbJsonLd([{ name: "Ana Sayfa", path: "/" }, { name: "Rehberler", path: "/blog" }, { name: article.title, path: `/blog/${article.slug}` }])} />
      <article className="mx-auto max-w-4xl px-5 py-16 md:px-8">
        <Link href="/blog" className="text-sm text-stone-500 transition hover:text-stone-950">Rehberlere dön</Link>
        <p className="mt-10 text-[10px] uppercase tracking-[0.24em] text-stone-400">{article.category}</p>
        <h1 className="mt-4 font-serif text-5xl font-normal leading-none md:text-7xl">{article.title}</h1>
        <p className="mt-6 text-lg leading-8 text-stone-600">{article.excerpt}</p>
        <div className="relative mt-10 aspect-[16/10] overflow-hidden bg-stone-100">
          <Image src={article.heroImage} alt={article.title} fill priority sizes="(min-width: 768px) 900px, 100vw" className="object-cover" />
        </div>
        <div className="mt-12 space-y-10">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-4xl font-normal">{section.heading}</h2>
              <p className="mt-4 text-base leading-8 text-stone-600">{section.body}</p>
            </section>
          ))}
        </div>
        <section className="mt-12 border-t border-stone-200/70 pt-8">
          <h2 className="font-serif text-3xl font-normal">Sık sorulanlar</h2>
          <div className="mt-5 space-y-5">
            {article.faq.map((item) => (
              <div key={item.question}>
                <h3 className="text-sm font-medium">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-stone-500">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
