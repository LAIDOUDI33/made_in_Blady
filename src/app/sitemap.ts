import { MetadataRoute } from "next";
import { db } from "@/lib/db";

// ============================================
// Base URL
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://algeriatrade.dz";

// ============================================
// Dynamic Sitemap Generation
// ============================================

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/suppliers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/rfqs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  try {
    // Fetch dynamic pages from database
    const [products, categories, companies] = await Promise.all([
      // Published products
      db.product.findMany({
        where: {
          isActive: true,
          status: "published",
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        take: 1000, // Limit to prevent huge sitemaps
      }),

      // Active categories
      db.category.findMany({
        where: {
          isActive: true,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      }),

      // Verified/Active companies
      db.company.findMany({
        where: {
          isActive: true,
          isVerified: true,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        take: 500,
      }),
    ]);

    // Product URLs
    const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${BASE_URL}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Category URLs
    const categoryUrls: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${BASE_URL}/categories/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // Company/Supplier URLs
    const companyUrls: MetadataRoute.Sitemap = companies.map((company) => ({
      url: `${BASE_URL}/suppliers/${company.slug}`,
      lastModified: company.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [
      ...staticPages,
      ...productUrls,
      ...categoryUrls,
      ...companyUrls,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    
    // Return static pages only if database fails
    return staticPages;
  }
}
