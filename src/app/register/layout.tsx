import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/SEO";

// ============================================
// Base URL
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://algeriatrade.dz";

// ============================================
// Register Page Metadata
// ============================================

export const metadata: Metadata = {
  title: "Inscription - Créez votre compte B2B | AlgeriaTrade",
  description:
    "Inscrivez-vous gratuitement sur AlgeriaTrade, la marketplace B2B #1 en Algérie. Acheteurs et fournisseurs, rejoignez +2500 entreprises.",
  
  keywords: [
    "inscription AlgeriaTrade",
    "créer compte B2B Algérie",
    "s'inscrire marketplace",
    "compte fournisseur Algérie",
    "compte acheteur Algérie",
    "inscription gratuite",
  ],

  openGraph: {
    title: "Inscription gratuite - AlgeriaTrade",
    description: "Créez votre compte B2B sur la marketplace algérienne #1",
    url: `${BASE_URL}/register`,
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Inscription gratuite - AlgeriaTrade",
    description: "Rejoignez la marketplace B2B #1 en Algérie",
  },

  alternates: {
    canonical: `${BASE_URL}/register`,
  },

  robots: {
    index: false,
    follow: true,
  },
};

// ============================================
// Register Layout
// ============================================

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Inscription", url: "/register" },
        ]}
      />
      {children}
    </>
  );
}
