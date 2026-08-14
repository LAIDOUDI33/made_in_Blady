import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CategoryJsonLd, BreadcrumbJsonLd } from "@/components/SEO";

// ============================================
// Base URL
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://algeriatrade.dz";

// ============================================
// Generate Dynamic Metadata for Categories
// ============================================

interface CategoryLayoutProps {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: CategoryLayoutProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const category = await db.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
        parent: {
          select: { name: true, slug: true },
        },
      },
    });

    if (!category || !category.isActive) {
      return {
        title: "Catégorie non trouvée | AlgeriaTrade",
        robots: { index: false, follow: false },
      };
    }

    const productCount = category._count.products;
    const parentName = category.parent?.name;

    return {
      title: `${category.name} - ${productCount} Produits | AlgeriaTrade`,
      description:
        category.description ||
        `Découvrez ${productCount.toLocaleString("fr-FR")} produits dans la catégorie ${category.name}${
          parentName ? ` - ${parentName}` : ""
        } sur AlgeriaTrade. Fournisseurs algériens vérifiés, prix compétitifs.`,

      keywords: [
        category.name,
        "Algérie",
        "B2B",
        "fournisseurs",
        "produits",
        "prix DZD",
        ...(parentName ? [parentName] : []),
        `${category.name} Algérie`,
        `acheter ${category.name.toLowerCase()}`,
      ],

      openGraph: {
        title: `${category.name} - ${productCount} Produits`,
        description:
          category.description ||
          `${productCount} produits ${category.name} sur AlgeriaTrade`,
        url: `${BASE_URL}/categories/${slug}`,
        siteName: "AlgeriaTrade",
        type: "website",
        locale: "fr_DZ",
        images: [
          {
            url: category.image || `${BASE_URL}/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: `${category.name} - AlgeriaTrade`,
          },
        ],
      },

      twitter: {
        card: "summary_large_image",
        title: `${category.name} - ${productCount} Produits`,
        description:
          category.description ||
          `${productCount} produits ${category.name}`,
        images: [category.image || `${BASE_URL}/og-image.jpg`],
      },

      alternates: {
        canonical: `${BASE_URL}/categories/${slug}`,
      },
    };
  } catch (error) {
    console.error("Error generating category metadata:", error);
    return {
      title: "Catégorie | AlgeriaTrade",
    };
  }
}

// ============================================
// Category Layout with SEO Components
// ============================================

export default async function CategoryLayout({
  params,
  children,
}: CategoryLayoutProps) {
  const { slug } = await params;

  let categoryData = null;

  try {
    categoryData = await db.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
        parent: {
          select: { name: true, slug: true },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching category data for SEO:", error");
  }

  if (!categoryData) {
    return <>{children}</>;
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <CategoryJsonLd
        name={categoryData.name}
        slug={categoryData.slug}
        description={categoryData.description || undefined}
        productCount={categoryData._count.products}
        image={categoryData.image || undefined}
      />

      {/* Breadcrumb Schema */}
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Catégories", url: "/categories" },
          ...(categoryData.parent
            ? [{ name: categoryData.parent.name, url: `/categories/${categoryData.parent.slug}` }]
            : []),
          { name: categoryData.name, url: `/categories/${categoryData.slug}` },
        ]}
      />

      {/* Page Content */}
      {children}
    </>
  );
}
