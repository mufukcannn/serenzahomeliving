import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteChrome } from "@/components/site-chrome";
import { StructuredData } from "@/components/structured-data";
import { MarketingPixels } from "@/components/marketing-pixels";
import { absoluteUrl, siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Serenza Home Living",
    template: "%s | Serenza Home Living"
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: "Serenza Home Living" }],
  creator: "Serenza Home Living",
  publisher: "Serenza Home Living",
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: "/brand-images/hali-koleksiyon.png", width: 1200, height: 1600, alt: "Serenza Home Living halı koleksiyonu" }]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/brand-images/hali-koleksiyon.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <MarketingPixels />
        <StructuredData
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteConfig.name,
            url: siteConfig.url,
            logo: absoluteUrl("/logo1.png"),
            sameAs: [siteConfig.instagram]
          }}
        />
        <StructuredData
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteConfig.name,
            url: siteConfig.url,
            potentialAction: {
              "@type": "SearchAction",
              target: `${siteConfig.url}/collections?search={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          }}
        />
        <CartProvider>
          <SiteChrome>{children}</SiteChrome>
        </CartProvider>
      </body>
    </html>
  );
}
