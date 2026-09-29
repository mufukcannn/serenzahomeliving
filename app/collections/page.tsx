import { Metadata } from "next";
import { CollectionListing } from "@/components/collection-listing";
import { StructuredData } from "@/components/structured-data";
import { breadcrumbJsonLd, buildMetadata, collectionJsonLd } from "@/lib/seo";
import { getPublishedProducts } from "@/lib/storefront-products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Tüm Koleksiyonlar",
  description: "Vintage halılar, çocuk odası koleksiyonları, kaymaz taban modeller ve Serenza Home Living dokularını keşfedin.",
  path: "/collections",
  image: "/brand-images/hali-koleksiyon.png"
});

export default async function CollectionsPage() {
  const products = await getPublishedProducts();

  return (
    <>
      <StructuredData
        data={collectionJsonLd(
          {
            title: "Tüm Koleksiyonlar",
            description: "Vintage halılar, çocuk odası koleksiyonları, kaymaz taban modeller ve Serenza Home Living dokuları.",
            path: "/collections"
          },
          products
        )}
      />
      <StructuredData data={breadcrumbJsonLd([{ name: "Ana Sayfa", path: "/" }, { name: "Koleksiyonlar", path: "/collections" }])} />
      <CollectionListing
        products={products}
        title="Tüm Koleksiyonlar"
        description="Halı, paspas ve banyo serisi ürünlerini ana kategori ve alt koleksiyonlarına göre keşfedin."
        grouped
      />
    </>
  );
}
