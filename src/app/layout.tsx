import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import "@/styles/rtl.css";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { I18nProvider } from "@/lib/i18n";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/SEO";

// ============================================
// Fonts Configuration
// ============================================

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

// ============================================
// Base URL
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://algeriatrade.dz";

// ============================================
// SEO Metadata - Root Layout
// ============================================

export const metadata: Metadata = {
  // Primary Meta Tags
  title: {
    default: "AlgeriaTrade - Plateforme B2B Algérie | Fournisseurs, Fabricants, Grossistes",
    template: "%s | AlgeriaTrade - Marketplace B2B Algérie",
  },
  description:
    "Sourcez auprès de +2500 fournisseurs algériens vérifiés. Produits industriels, agricoles, technologiques. Postez vos appels d'offres et recevez des devis. Marketplace B2B #1 en Algérie.",
  
  // Keywords (Algerian SEO focus)
  keywords: [
    "B2B Algérie",
    "fournisseurs algériens",
    "marketplace Algérie",
    "produits algériens",
    "import export Algérie",
    "grossistes Algérie",
    "fabricants Algérie",
    "commerce B2B Algérie",
    "achat vente professionnel Algérie",
    "AlgeriaTrade",
    "devis en ligne Algérie",
    "appels d'offres Algérie",
    "produits industriels Algérie",
    "machines agricoles Algérie",
    "panneaux solaires Algérie",
    "matériaux construction Algérie",
  ],
  
  // Authors & Creator
  authors: [{ name: "AlgeriaTrade Team" }],
  creator: "AlgeriaTrade",
  publisher: "AlgeriaTrade",
  
  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Open Graph / Facebook
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    alternateLocale: ["ar_DZ", "en_US"],
    url: BASE_URL,
    siteName: "AlgeriaTrade",
    title: "AlgeriaTrade - Plateforme B2B Algérie | Fournisseurs Vérifiés",
    description:
      "Sourcez auprès de +2500 fournisseurs algériens vérifiés. Produits industriels, agricoles, technologiques. Postez vos appels d'offres.",
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "AlgeriaTrade - Marketplace B2B Algérie",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    site: "@algeriatrade",
    creator: "@algeriatrade",
    title: "AlgeriaTrade - Plateforme B2B Algérie",
    description:
      "Sourcez auprès de +2500 fournisseurs algériens vérifiés. Produits industriels, agricoles, technologiques.",
    images: [`${BASE_URL}/og-image.jpg`],
  },

  // Alternates / Hreflang for multilingual support
  alternates: {
    canonical: BASE_URL,
    languages: {
      "fr-DZ": `${BASE_URL}/fr`,
      "ar-DZ": `${BASE_URL}/ar`,
      "en-US": `${BASE_URL}/en`,
    },
  },

  // Additional Meta Tags
  other: {
    "geo.region": "DZ",
    "geo.placename": "Algeria",
    "geo.position": "36.7538;3.0588",
    "ICBM": "36.7538, 3.0588",
    "theme-color": "#16a34a",
  },

  // Verification tags (add your verification codes here)
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

// ============================================
// Root Layout Component
// ============================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Structured Data - Site-wide */}
        <WebsiteJsonLd />
        <OrganizationJsonLd />
        
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={`${inter.variable} ${cairo.variable} font-sans antialiased bg-background text-foreground`}>
        <I18nProvider defaultLanguage="fr">
          <div className="flex min-h-screen flex-col rtl-transition">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
