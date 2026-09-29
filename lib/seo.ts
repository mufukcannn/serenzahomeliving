import { Metadata } from "next";
import { Product, getProductFinalPrice } from "@/lib/products";

export const siteConfig = {
  name: "Serenza Home Living",
  url: process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "http://localhost:3000",
  description: "Vintage halı, çocuk halısı, kaymaz taban halı, banyo serisi ve kapı önü paspas koleksiyonları.",
  instagram: "https://www.instagram.com/serenzahomeliving"
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  type = "website"
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
}): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrl = image ? absoluteUrl(image) : absoluteUrl("/brand-images/hali-koleksiyon.png");
  const cleanTitle = title.replace(/\s*\|\s*Serenza Home Living\s*$/i, "");

  return {
    title: cleanTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: cleanTitle,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type,
      locale: "tr_TR",
      images: [{ url: imageUrl, width: 1200, height: 1600, alt: cleanTitle }]
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description,
      images: [imageUrl]
    }
  };
}

export function productJsonLd(product: Product) {
  const price = getProductFinalPrice(product);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.sku,
    gtin13: product.barcode,
    brand: { "@type": "Brand", name: siteConfig.name },
    category: product.category,
    image: product.images.map((image) => absoluteUrl(image)),
    color: product.colors,
    size: product.sizes,
    material: "Dokuma halı yüzeyi",
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "TRY",
      price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function collectionJsonLd(collection: { title: string; description: string; path: string }, products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.title,
    description: collection.description,
    url: absoluteUrl(collection.path),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/products/${product.slug}`),
        name: product.title
      }))
    }
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}
