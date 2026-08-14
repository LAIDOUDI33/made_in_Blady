import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/SEO";

// ============================================
// Base URL
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://algeriatrade.dz";

// ============================================
// Search Page Metadata
// ============================================

export const metadata: Metadata = {
  title: "Recherche - Trouvez produits et fournisseurs | AlgeriaTrade",
  description:
    "Recherchez parmi +50,000 produits de +2500 fournisseurs algériens vérifiés. Panneaux solaires, matériaux construction, machines agricoles, et plus.",
  
  keywords: [
    "recherche B2B Algérie",
    "trouver fournisseur Algérie",
    "rechercher produit Algérie",
    "marketplace recherche",
    "catalogue produits Algérie",
    "fournisseurs vérifiés",
  ],

  openGraph: {
    title: "Recherche - AlgeriaTrade Marketplace",
    description: "Trouvez les meilleurs produits et fournisseurs en Algérie",
    url: `${BASE_URL}/search`,
    type: "website",
  },

  twitter: {
    card: "summary",
    title: "Recherche - AlgeriaTrade",
    description: "Trouvez produits et fournisseurs en Algérie",
  },

  alternates: {
    canonical: `${BASE_URL}/search`,
  },
};

// ============================================
// Search Layout
// ============================================

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Recherche", url: "/search" },
        ]}
      />
      {children}
    </>
  );
}
