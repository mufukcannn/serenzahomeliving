import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ProductDetail } from "@/components/product-detail";
import { StructuredData } from "@/components/structured-data";
import { breadcrumbJsonLd, buildMetadata, faqJsonLd, productJsonLd } from "@/lib/seo";
import { getPublishedProduct } from "@/lib/storefront-products";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getPublishedProduct(params.slug);
  if (!product) return {};
  return buildMetadata({
    title: product.seoTitle || product.title,
    description: product.seoDescription || product.description,
    path: `/products/${product.slug}`,
    image: product.images[0]
  });
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getPublishedProduct(params.slug);
  if (!product) notFound();

  return (
    <>
      <StructuredData data={productJsonLd(product)} />
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Ana Sayfa", path: "/" },
          { name: "Koleksiyonlar", path: "/collections" },
          { name: product.collection, path: "/collections" },
          { name: product.title, path: `/products/${product.slug}` }
        ])}
      />
      <StructuredData
        data={faqJsonLd([
          {
            question: `${product.title} hangi alanlarda kullanılır?`,
            answer: `${product.category} kategorisindeki bu ürün, ölçü ve renk seçimine göre yaşam alanlarında kullanılmak üzere hazırlanmıştır.`
          },
          {
            question: "Ürün stokta mı?",
            answer: product.stock > 0 ? "Evet, ürün mevcut stok bilgisinde satışa açıktır." : "Ürün şu anda stokta görünmemektedir."
          }
        ])}
      />
      <ProductDetail product={product} />
    </>
  );
}
