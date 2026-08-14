import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/SEO";
import { notFound } from "next/navigation";

// ============================================
// Base URL
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://algeriatrade.dz";

// ============================================
// Generate Dynamic Metadata for Products
// ============================================

interface ProductLayoutProps {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: ProductLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        company: {
          select: {
            name: true,
            slug: true,
            wilaya: true,
            isVerified: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!product || !product.isActive || product.status !== "published") {
      return {
        title: "Produit non trouvé | AlgeriaTrade",
        robots: { index: false, follow: false },
      };
    }

    const priceDisplay = product.price
      ? `${product.price.toLocaleString("fr-FR")} DZD`
      : "Sur devis";
    
    const primaryImage = product.images[0]?.url || `${BASE_URL}/og-image.jpg`;

    return {
      title: `${product.name} - ${priceDisplay} | ${product.company.name}`,
      description:
        product.shortDescription ||
        `${product.name} - Produit ${product.category.name} proposé par ${product.company.name}${
          product.wilaya ? ` en ${product.wilaya}` : ""
        }. ${priceDisplay}.`,
      
      keywords: [
        product.name,
        product.category?.name,
        product.company?.name,
        "Algérie",
        "B2B",
        "fournisseur",
        "prix DZD",
        ...(product.sku ? [product.sku] : []),
        ...(product.countryOfOrigin ? [product.countryOfOrigin] : []),
      ],

      openGraph: {
        title: `${product.name} - ${priceDisplay}`,
        description:
          product.shortDescription ||
          `${product.name} par ${product.company.name}`,
        url: `${BASE_URL}/products/${slug}`,
        siteName: "AlgeriaTrade",
        type: "website",
        locale: "fr_DZ",
        images: [
          {
            url: primaryImage,
            width: 800,
            height: 600,
            alt: product.name,
          },
        ],
      },

      twitter: {
        card: "summary_large_image",
        title: `${product.name} - ${priceDisplay}`,
        description:
          product.shortDescription ||
          `${product.name} par ${product.company.name}`,
        images: [primaryImage],
      },

      alternates: {
        canonical: `${BASE_URL}/products/${slug}`,
      },

      // Structured data will be added via component in the layout
    };
  } catch (error) {
    console.error("Error generating product metadata:", error);
    return {
      title: "Produit | AlgeriaTrade",
    };
  }
}

// ============================================
// Product Layout with SEO Components
// ============================================

export default async function ProductLayout({
  params,
  children,
}: ProductLayoutProps) {
  const { slug } = await params;

  let productData = null;

  try {
    productData = await db.product.findUnique({
      where: { slug },
      include: {
        company: {
          select: {
            name: true,
            slug: true,
            wilaya: true,
            isVerified: true,
            rating: true,
            reviewCount: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching product data for SEO:", error);
  }

  if (!productData) {
    return <>{children}</>;
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <ProductJsonLd
        name={productData.name}
        slug={productData.slug}
        shortDescription={productData.shortDescription || undefined}
        description={productData.description || undefined}
        price={productData.price ?? undefined}
        currency={productData.currency}
        availability={productData.availability as any}
        image={productData.images[0]?.url}
        images={productData.images}
        sku={productData.sku || undefined}
        company={{
          name: productData.company.name,
          slug: productData.company.slug,
          isVerified: productData.company.isVerified,
        }}
        category={{
          name: productData.category.name,
          slug: productData.category.slug,
        }}
        rating={productData.company.rating || undefined}
        reviewCount={productData.company.reviewCount || undefined}
      />

      {/* Breadcrumb Schema */}
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Produits", url: "/products" },
          { name: productData.category.name, url: `/categories/${productData.category.slug}` },
          { name: productData.name, url: `/products/${productData.slug}` },
        ]}
      />

      {/* Page Content */}
      {children}
    </>
  );
}
