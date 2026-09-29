import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { StructuredData } from "@/components/structured-data";
import { getSeoCollection, seoCollections } from "@/lib/collections";
import { breadcrumbJsonLd, buildMetadata, collectionJsonLd } from "@/lib/seo";
import { getPublishedProducts } from "@/lib/storefront-products";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const collection = getSeoCollection(params.slug);
  if (!collection) return {};
  return buildMetadata({
    title: collection.seoTitle,
    description: collection.seoDescription,
    path: `/collections/${collection.slug}`,
    image: collection.heroImage
  });
}

export default async function CollectionSlugPage({ params }: { params: { slug: string } }) {
  const collection = getSeoCollection(params.slug);
  if (!collection) notFound();
  const products = await getPublishedProducts({ slug: params.slug });

  return (
    <main className="bg-[#fbfaf7] text-stone-950">
      <StructuredData data={collectionJsonLd({ title: collection.title, description: collection.description, path: `/collections/${collection.slug}` }, products)} />
      <StructuredData data={breadcrumbJsonLd([{ name: "Ana Sayfa", path: "/" }, { name: "Koleksiyonlar", path: "/collections" }, { name: collection.title, path: `/collections/${collection.slug}` }])} />
      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-[1500px] gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Koleksiyon</p>
            <h1 className="mt-3 font-serif text-5xl font-normal leading-none md:text-7xl">{collection.title}</h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-stone-600">{collection.description}</p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
            <Image src={collection.heroImage} alt={collection.title} fill priority sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>
      <section className="px-5 pb-16 md:px-8 md:pb-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {(products.length ? products : []).map((product) => (
              <ProductCard key={product.id} product={product} quickAdd compact />
            ))}
          </div>
          <div className="mt-14 border-t border-stone-200/70 pt-8">
            <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">İlgili Koleksiyonlar</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {collection.relatedCollections.map((slug) => {
                const related = getSeoCollection(slug);
                return related ? (
                  <Link key={slug} href={`/collections/${slug}`} className="border border-stone-200/80 px-4 py-3 text-xs text-stone-600 transition hover:border-stone-900 hover:text-stone-950">
                    {related.title}
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
