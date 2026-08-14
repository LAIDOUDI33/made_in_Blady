import React from "react";

// ============================================
// Types
// ============================================

interface JsonLdProps {
  data: Record<string, any>;
}

// ============================================
// JSON-LD Schema Types
// ============================================

export interface WebsiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    "@type": "SearchAction";
    target: string;
    "query-input"?: string;
  };
  publisher?: OrganizationSchema;
}

export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description?: string;
  address?: {
    "@type": "PostalAddress";
    addressCountry: string;
    addressLocality?: string;
    addressRegion?: string;
    streetAddress?: string;
    postalCode?: string;
  };
  contactPoint?: {
    "@type": "ContactPoint";
    telephone: string;
    contactType: string;
    availableLanguage?: string[];
  };
  sameAs?: string[];
  foundingDate?: string;
  numberOfEmployees?: {
    "@type": "QuantitativeValue";
    minValue: number;
    maxValue: number;
  };
}

export interface ProductSchema {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  image: string | string[];
  description?: string;
  sku?: string;
  mpn?: string;
  brand?: {
    "@type": "Brand";
    name: string;
  };
  manufacturer?: {
    "@type": "Organization";
    name: string;
  };
  offers?: OfferSchema;
  aggregateRating?: AggregateRatingSchema;
  review?: ReviewSchema[];
};

export interface OfferSchema {
  "@type": "Offer";
  priceCurrency: string;
  price: number;
  availability?: string;
  url?: string;
  seller?: {
    "@type": "Organization";
    name: string;
  };
  validFrom?: string;
  itemCondition?: string;
  shippingDetails?: {
    "@type": "OfferShippingDetails";
    shippingDestination: {
      "@type": "DefinedRegion";
      addressCountry: string;
    };
    deliveryTime?: {
      "@type": "ShippingDeliveryTime";
      handlingTime: {
        "@type": "QuantitativeValue";
        minValue: number;
        maxValue: number;
        unitCode: string;
      };
      transitTime?: {
        "@type": "QuantitativeValue";
        minValue: number;
        maxValue: number;
        unitCode: string;
      };
    };
  };
}

export interface AggregateRatingSchema {
  "@type": "AggregateRating";
  ratingValue: number;
  bestRating: number;
  worstRating: number;
  reviewCount: number;
  ratingCount?: number;
}

export interface ReviewSchema {
  "@type": "Review";
  author: {
    "@type": "Person";
    name: string;
  };
  datePublished: string;
  reviewBody: string;
  name?: string;
  reviewRating: {
    "@type": "Rating";
    ratingValue: number;
    bestRating: number;
    worstRating: number;
  };
}

export interface BreadcrumbItemSchema {
  "@type": "ListItem";
  position: number;
  name: string;
  item?: string;
}

export interface BreadcrumbListSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbItemSchema[];
}

export interface FAQPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
}

// ============================================
// Base URL
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://algeriatrade.dz";

// ============================================
// JSON-LD Component
// ============================================

/**
 * JSON-LD Structured Data Renderer
 * 
 * Usage:
 * ```tsx
 * <JsonLd data={websiteSchema} />
 * ```
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ============================================
// Pre-built Schema Generators
// ============================================

/**
 * Generate Website schema for AlgeriaTrade homepage
 */
export function generateWebsiteSchema(): WebsiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AlgeriaTrade",
    url: BASE_URL,
    description:
      "Plateforme B2B leader en Algérie pour connecter acheteurs et fournisseurs. Trouvez des produits industriels, agricoles, technologiques auprès de fournisseurs vérifiés.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    publisher: generateOrganizationSchema(),
  };
}

/**
 * Generate Organization schema for AlgeriaTrade
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AlgeriaTrade",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      "La marketplace B2B N°1 en Algérie. Connectez-vous avec plus de 2500 fournisseurs vérifiés, postez vos appels d'offres et développez votre activité.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "DZ",
      addressLocality: "Alger",
      addressRegion: "Alger",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+213-555-010203",
      contactType: "customer service",
      availableLanguage: ["French", "Arabic", "English"],
    },
    sameAs: [
      "https://www.facebook.com/algeriatrade",
      "https://www.linkedin.com/company/algeriatrade",
      "https://twitter.com/algeriatrade",
      "https://www.instagram.com/algeriatrade",
    ],
    foundingDate: "2024-01-01",
  };
}

/**
 * Generate Product schema for a product page
 */
export function generateProductSchema(product: {
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  price?: number | null;
  currency?: string;
  availability?: string;
  image?: string;
  images?: { url: string; alt?: string }[];
  sku?: string;
  company?: {
    name: string;
    slug: string;
    isVerified?: boolean;
  };
  category?: {
    name: string;
    slug: string;
  };
  rating?: number;
  reviewCount?: number;
}): ProductSchema {
  const productUrl = `${BASE_URL}/products/${product.slug}`;
  const images = product.images?.length
    ? product.images.map((img) => img.url)
    : product.image
    ? [product.image]
    : [`${BASE_URL}/og-image.jpg`];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    description: product.shortDescription || product.description || "",
    sku: product.sku,
    brand: product.company
      ? {
          "@type": "Brand",
          name: product.company.name,
        }
      : undefined,
    manufacturer: product.company
      ? {
          "@type": "Organization",
          name: product.company.name,
          url: `${BASE_URL}/suppliers/${product.company.slug}`,
        }
      : undefined,
    offers: product.price
      ? {
          "@type": "Offer",
          priceCurrency: product.currency || "DZD",
          price: product.price,
          availability: `https://schema.org/${
            product.availability === "in_stock"
              ? "InStock"
              : product.availability === "pre_order"
              ? "PreOrder"
              : "OutOfStock"
          }`,
          url: productUrl,
          seller: product.company
            ? {
                "@type": "Organization",
                name: product.company.name,
              }
            : undefined,
          validFrom: new Date().toISOString(),
        }
      : undefined,
    aggregateRating:
      product.rating && product.reviewCount
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            bestRating: 5,
            worstRating: 1,
            reviewCount: product.reviewCount,
          }
        : undefined,
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items?: { name: string; url?: string }[] | null
): BreadcrumbListSchema {
  const safeItems = Array.isArray(items) ? items : [];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: safeItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: `${BASE_URL}${item.url}` } : {}),
    })),
  };
}

/**
 * Generate Category page schema (CollectionPage)
 */
export function generateCategorySchema(category: {
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description || `${category.name} - Produits sur AlgeriaTrade`,
    url: `${BASE_URL}/categories/${category.slug}`,
    image: category.image || `${BASE_URL}/og-image.jpg`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: category.productCount || 0,
      itemListElement: [], // Would be populated with actual products
    },
    provider: generateOrganizationSchema(),
  };
}

/**
 * Generate Company/Supplier schema
 */
export function generateCompanySchema(company: {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  wilaya?: string;
  legalForm?: string;
  yearEstablished?: number;
  rating?: number;
  reviewCount?: number;
  productCount?: number;
  website?: string;
  phone?: string;
  email?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": company.productCount && company.productCount > 10
      ? "Manufacturer"
      : ["SARL", "EURL", "SPA", "SNC"].includes(company.legalForm || "")
      ? "Business"
      : "LocalBusiness",
    name: company.name,
    url: `${BASE_URL}/suppliers/${company.slug}`,
    logo: company.logo || `${BASE_URL}/logo.png`,
    description: company.description,
    address: {
      "@type": "PostalAddress",
      addressCountry: "DZ",
      addressLocality: company.wilaya || "Algérie",
      addressRegion: company.wilaya || "Algérie",
    },
    telephone: company.phone,
    email: company.email,
    ...(company.website ? { sameAs: [company.website] } : {}),
    ...(company.yearEstablished
      ? { foundingDate: String(company.yearEstablished) }
      : {}),
    ...(company.rating && company.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: company.rating,
            bestRating: 5,
            worstRating: 1,
            reviewCount: company.reviewCount,
          },
        }
      : {}),
  };
}

/**
 * Generate FAQ Page schema
 */
export function generateFAQSchema(faqs: { question: string; answer: string }[]): FAQPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// ============================================
// Pre-built Components
// ============================================

/**
 * Website JSON-LD - Use on homepage
 */
export function WebsiteJsonLd() {
  return <JsonLd data={generateWebsiteSchema()} />;
}

/**
 * Organization JSON-LD - Can be used site-wide
 */
export function OrganizationJsonLd() {
  return <JsonLd data={generateOrganizationSchema()} />;
}

/**
 * Product JSON-LD - Use on product pages
 */
export function ProductJsonLd(props: Parameters<typeof generateProductSchema>[0]) {
  return <JsonLd data={generateProductSchema(props)} />;
}

/**
 * Breadcrumb JSON-LD - Use on all pages
 */
export function BreadcrumbJsonLd(props: Parameters<typeof generateBreadcrumbSchema>[0]) {
  return <JsonLd data={generateBreadcrumbSchema(props)} />;
}

/**
 * Category JSON-LD - Use on category pages
 */
export function CategoryJsonLd(props: Parameters<typeof generateCategorySchema>[0]) {
  return <JsonLd data={generateCategorySchema(props)} />;
}

/**
 * Company JSON-LD - Use on supplier pages
 */
export function CompanyJsonLd(props: Parameters<typeof generateCompanySchema>[0]) {
  return <JsonLd data={generateCompanySchema(props)} />;
}

/**
 * FAQ JSON-LD - Use on FAQ/help pages
 */
export function FAQJsonLd(props: Parameters<typeof generateFAQSchema>[0]) {
  return <JsonLd data={generateFAQSchema(props)} />;
}

export default JsonLd;
