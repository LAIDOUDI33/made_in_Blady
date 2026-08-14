import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/SEO";

// ============================================
// Base URL
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://algeriatrade.dz";

// ============================================
// Login Page Metadata
// ============================================

export const metadata: Metadata = {
  title: "Connexion - Accédez à votre compte | AlgeriaTrade",
  description:
    "Connectez-vous à votre compte AlgeriaTrade pour accéder à vos devis, commandes, et gérer votre activité B2B en Algérie.",
  
  keywords: [
    "connexion AlgeriaTrade",
    "login B2B Algérie",
    "compte fournisseur",
    "compte acheteur",
    "accès marketplace",
  ],

  openGraph: {
    title: "Connexion - AlgeriaTrade",
    description: "Accédez à votre compte AlgeriaTrade",
    url: `${BASE_URL}/login`,
    type: "website",
  },

  twitter: {
    card: "summary",
    title: "Connexion - AlgeriaTrade",
    description: "Accédez à votre compte AlgeriaTrade",
  },

  alternates: {
    canonical: `${BASE_URL}/login`,
  },

  robots: {
    index: false,
    follow: true,
  },
};

// ============================================
// Login Layout
// ============================================

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Connexion", url: "/login" },
        ]}
      />
      {children}
    </>
  );
}
