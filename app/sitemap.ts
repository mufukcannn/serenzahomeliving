import { MetadataRoute } from "next";
import { demoProducts } from "@/lib/products";
import { absoluteUrl } from "@/lib/seo";
import { articles } from "@/lib/content/articles";
import { seoCollections } from "@/lib/collections";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/collections"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...seoCollections.map((collection) => ({
      url: absoluteUrl(`/collections/${collection.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...demoProducts.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/blog/${article.slug}`),
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
