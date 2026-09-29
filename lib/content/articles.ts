export type ArticleCategory = "buying-guide" | "room-inspiration" | "rug-care" | "material-education" | "size-guide";

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  heroImage: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
  relatedCollections: string[];
  faq: Array<{ question: string; answer: string }>;
  sections: Array<{ heading: string; body: string }>;
};

export const articles: Article[] = [
  {
    slug: "salon-icin-hali-olcusu-nasil-secilir",
    title: "Salon için halı ölçüsü nasıl seçilir?",
    excerpt: "Oturma alanını toparlayan, mobilya oranını sakinleştiren halı ölçüsü rehberi.",
    category: "size-guide",
    heroImage: "/brand-images/hali-kategori.jpg",
    seoTitle: "Salon Halı Ölçüsü Rehberi | Serenza Home Living",
    seoDescription: "Salon için doğru halı ölçüsü nasıl seçilir? 160x230, 200x300 ve oturma alanı yerleşimi için Serenza Home Living ölçü rehberi.",
    updatedAt: "2026-05-26",
    relatedCollections: ["Vintage Koleksiyonu", "Kaymaz Taban Halı"],
    faq: [
      {
        question: "Salon için en çok tercih edilen halı ölçüsü nedir?",
        answer: "Orta büyüklükte salonlarda 160x230, daha geniş oturma alanlarında 200x300 ölçü daha dengeli görünür."
      },
      {
        question: "Koltuk ayakları halının üstünde olmalı mı?",
        answer: "Editorial ve bütünlüklü bir görünüm için en az ön ayakların halı üzerinde konumlanması önerilir."
      }
    ],
    sections: [
      {
        heading: "Mobilya oranıyla başlayın",
        body: "Halı ölçüsü yalnızca zemin ölçüsüyle değil, koltuk ve orta sehpa yerleşimiyle birlikte değerlendirilmelidir."
      },
      {
        heading: "Boşluk payı bırakın",
        body: "Duvar ile halı arasında kalan nefes alan boşluk, yaşam alanını daha premium ve dengeli gösterir."
      }
    ]
  },
  {
    slug: "vintage-hali-bakimi",
    title: "Vintage halı bakımı",
    excerpt: "Yumuşak geçişli vintage dokuların günlük kullanımdaki bakım prensipleri.",
    category: "rug-care",
    heroImage: "/brand-images/hali-koleksiyon.png",
    seoTitle: "Vintage Halı Bakımı | Serenza Home Living",
    seoDescription: "Vintage halı temizliği, leke müdahalesi ve günlük bakım için pratik Serenza Home Living rehberi.",
    updatedAt: "2026-05-26",
    relatedCollections: ["Vintage Koleksiyonu"],
    faq: [
      {
        question: "Vintage halı ne sıklıkla süpürülmeli?",
        answer: "Günlük kullanım yoğunluğuna göre haftada 1-2 kez düşük emiş gücüyle süpürülmesi yeterlidir."
      }
    ],
    sections: [
      {
        heading: "Leke oluştuğunda ovalamayın",
        body: "Nemli bezle tampon uygulamak yüzey dokusunu korur ve lekenin yayılmasını azaltır."
      }
    ]
  }
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
