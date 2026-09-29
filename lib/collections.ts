import { demoProducts } from "@/lib/products";
import { catalogTaxonomy } from "@/lib/catalog-taxonomy";

export type SeoCollection = {
  title: string;
  slug: string;
  description: string;
  heroImage: string;
  seoTitle: string;
  seoDescription: string;
  relatedCollections: string[];
};

export const seoCollections: SeoCollection[] = [
  {
    title: "Halı",
    slug: "hali",
    description: "Serenza Home Living halı ana kategorisi; vintage koleksiyon ve yaşam alanı dokuları.",
    heroImage: "/brand-images/hali-koleksiyon.png",
    seoTitle: "Halı Modelleri",
    seoDescription: "Serenza Home Living halı modelleri; vintage koleksiyon, yumuşak dokular ve premium yaşam alanı seçkileri.",
    relatedCollections: ["vintage-koleksiyonu"]
  },
  {
    title: "Vintage Koleksiyonu",
    slug: "vintage-koleksiyonu",
    description: "Salon ve oturma alanları için yumuşak geçişli vintage halılar.",
    heroImage: "/brand-images/hali-koleksiyon.png",
    seoTitle: "Vintage Halı Koleksiyonu",
    seoDescription: "Serenza Home Living vintage halı koleksiyonu; sıcak tonlar, yumuşak geçişli desenler ve premium yaşam alanları için seçilmiş halılar.",
    relatedCollections: ["kaymaz-taban-hali", "paspas"]
  },
  {
    title: "Çocuk Halısı",
    slug: "cocuk-halisi",
    description: "Çocuk odaları için yumuşak, sakin ve dekoratif halı seçenekleri.",
    heroImage: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=1200&auto=format&fit=crop",
    seoTitle: "Çocuk Halısı Modelleri",
    seoDescription: "Çocuk odaları için yumuşak dokulu, sakin renkli Serenza Home Living çocuk halısı seçenekleri.",
    relatedCollections: ["mini-teaser-koleksiyonu"]
  },
  {
    title: "Mini Teaser Koleksiyonu",
    slug: "mini-teaser-koleksiyonu",
    description: "Çocuk odaları için sakin, yumuşak ve dekoratif oyun alanı dokuları.",
    heroImage: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=1200&auto=format&fit=crop",
    seoTitle: "Mini Teaser Çocuk Halısı Koleksiyonu",
    seoDescription: "Çocuk odaları için yumuşak dokulu, sakin renkli ve dekoratif Mini Teaser çocuk halısı koleksiyonu.",
    relatedCollections: ["vintage-koleksiyonu"]
  },
  {
    title: "Kaymaz Taban Halı",
    slug: "kaymaz-taban-hali",
    description: "Günlük kullanım alanları için pratik, kaymaz tabanlı ve kolay yerleşen halılar.",
    heroImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop",
    seoTitle: "Kaymaz Taban Halı Modelleri",
    seoDescription: "Günlük kullanım için kaymaz taban halı modelleri; sade renkler, pratik yüzeyler ve Serenza Home Living dokusu.",
    relatedCollections: ["vintage-koleksiyonu", "paspas"]
  },
  {
    title: "Banyo Serisi",
    slug: "banyo-serisi",
    description: "Banyo alanları için yumuşak dokulu, pratik ve dekoratif paspas setleri.",
    heroImage: "/brand-images/uyelik.png",
    seoTitle: "Banyo Serisi",
    seoDescription: "Banyo serisi paspas ve banyo halısı modelleri Serenza Home Living'de.",
    relatedCollections: ["paspas", "kapi-onu"]
  },
  {
    title: "Paspas",
    slug: "paspas",
    description: "Kapı önü kullanımı için dayanıklı ve dekoratif paspaslar.",
    heroImage: "/brand-images/paspas.jpg",
    seoTitle: "Kapı Önü Paspas Modelleri",
    seoDescription: "Kapı önü paspas modelleri; dayanıklı yüzeyler ve Serenza Home Living giriş alanı dokuları.",
    relatedCollections: ["banyo-serisi"]
  },
  {
    title: "Kapı Önü",
    slug: "kapi-onu",
    description: "Kapı önü kullanımı için dayanıklı, dekoratif ve kolay temizlenebilir paspaslar.",
    heroImage: "/brand-images/paspas.jpg",
    seoTitle: "Kapı Önü Paspas Modelleri",
    seoDescription: "Kapı önü paspas modelleri; giriş alanları için Serenza Home Living dokusu.",
    relatedCollections: ["paspas", "banyo-serisi"]
  }
];

for (const category of catalogTaxonomy) {
  for (const collection of category.collections) {
    if (!seoCollections.some((item) => item.slug === collection.slug)) {
      seoCollections.push({
        title: collection.title,
        slug: collection.slug,
        description: `${category.title} kategorisi altında ${collection.title} seçkisi.`,
        heroImage: "/brand-images/hali-koleksiyon.png",
        seoTitle: collection.title,
        seoDescription: `${collection.title} ürünleri Serenza Home Living'de.`,
        relatedCollections: [category.slug]
      });
    }
  }
}

export function getSeoCollection(slug: string) {
  return seoCollections.find((collection) => collection.slug === slug);
}

export function getCollectionProducts(slug: string) {
  const collection = getSeoCollection(slug);
  if (!collection) return [];
  return demoProducts.filter((product) => product.collection === collection.title || product.category === collection.title);
}
