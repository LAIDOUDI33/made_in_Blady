import { MetadataRoute } from "next";

// ============================================
// Base URL
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://algeriatrade.dz";

// ============================================
// Robots.txt Generation
// ============================================

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow all crawlers to access main content
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Private/Authenticated pages
          "/dashboard/",
          "/admin/",
          "/api/",
          "/checkout/",
          "/orders/",
          
          // Authentication pages (prevent indexing of login forms)
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          
          // Internal/utility routes
          "/_next/",
          "/static/",
        ],
      },
      
      // Special rules for specific crawlers
      {
        userAgent: "Googlebot",
        allow: ["/products/", "/categories/", "/suppliers/", "/search"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      
      {
        userAgent: "Bingbot",
        allow: ["/", "/products/", "/categories/"],
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
    ],
    
    // Sitemap location
    sitemap: `${BASE_URL}/sitemap.xml`,
    
    // Additional directives
  };
}
