import { NextRequest, NextResponse } from "next/server";

// ============================================
// OG Image Generator
// ============================================

// Base URL for the application
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://algeriatrade.dz";

// Default colors (AlgeriaTrade brand)
const COLORS = {
  primary: "#16a34a", // Green-600
  secondary: "#15803d", // Green-700
  background: "#ffffff",
  text: "#1f2937", // Gray-800
  textLight: "#6b7280", // Gray-500
  accent: "#fbbf24", // Amber-400
};

interface OGImageParams {
  title: string;
  description?: string;
  image?: string;
  type?: "product" | "category" | "company" | "default" | "search";
  price?: string;
  rating?: string;
  location?: string;
}

/**
 * Generate SVG-based Open Graph image
 * This approach doesn't require external dependencies like @vercel/og
 */
function generateOGImageSVG(params: OGImageParams): string {
  const {
    title,
    description = "",
    image,
    type = "default",
    price,
    rating,
    location,
  } = params;

  const truncatedTitle = title.length > 60 ? `${title.slice(0, 57)}...` : title;
  const truncatedDescription = description.length > 120 ? `${description.slice(0, 117)}...` : description;

  // Type-specific configurations
  const typeConfig = {
    product: {
      label: "Produit",
      labelBg: "#dcfce7",
      labelColor: "#166534",
      icon: "📦",
    },
    category: {
      label: "Catégorie",
      labelBg: "#dbeafe",
      labelColor: "#1e40af",
      icon: "📁",
    },
    company: {
      label: "Fournisseur",
      labelBg: "#f3e8ff",
      labelColor: "#6b21a8",
      icon: "🏢",
    },
    search: {
      label: "Recherche",
      labelBg: "#fef3c7",
      labelColor: "#92400e",
      icon: "🔍",
    },
    default: {
      label: "AlgeriaTrade",
      labelBg: "#dcfce7",
      labelColor: "#166534",
      icon: "🇩🇿",
    },
  };

  const config = typeConfig[type] || typeConfig.default;

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f0fdf4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${COLORS.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${COLORS.secondary};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  
  <!-- Header Bar -->
  <rect width="1200" height="80" fill="url(#headerGradient)"/>
  
  <!-- Logo Area -->
  <text x="50" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white">AlgeriaTrade</text>
  <text x="230" y="48" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.9)">.dz</text>
  
  <!-- Tagline in header -->
  <text x="1180" y="50" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.9)" text-anchor="end">Marketplace B2B Algérie</text>
  
  <!-- Main Content Area -->
  ${image ? `
  <!-- Product Image Placeholder (left side) -->
  <rect x="50" y="110" width="400" height="420" rx="12" fill="#f3f4f6" stroke="#e5e7eb" stroke-width="2"/>
  <text x="250" y="330" font-family="Arial, sans-serif" font-size="80" text-anchor="middle">${config.icon}</text>
  ` : `
  <!-- Large Icon when no image -->
  <text x="150" y="380" font-family="Arial, sans-serif" font-size="200" text-anchor="middle" opacity="0.15">${config.icon}</text>
  `}
  
  <!-- Content (right of image or centered) -->
  <g transform="${image ? 'translate(500, 130)' : 'translate(70, 140)'}">
    <!-- Type Badge -->
    <rect x="0" y="0" width="${config.label.length * 10 + 30}" height="32" rx="16" fill="${config.labelBg}"/>
    <text x="${(config.label.length * 10 + 30) / 2}" y="22" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="${config.labelColor}" text-anchor="middle">${config.label}</text>
    
    <!-- Title -->
    <text x="0" y="75" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="${COLORS.text}">${truncatedTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
    
    ${price ? `
    <!-- Price Badge -->
    <rect x="0" y="95" width="${price.length * 18 + 40}" height="44" rx="8" fill="${COLORS.primary}"/>
    <text x="20" y="125" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white">${price}</text>
    ` : ''}
    
    ${rating ? `
    <!-- Rating Stars -->
    <text x="0" y="165" font-family="Arial, sans-serif" font-size="22" fill="#fbbf24">★★★★★</text>
    <text x="115" y="165" font-family="Arial, sans-serif" font-size="20" fill="${COLORS.textLight}">${rating}/5</text>
    ` : ''}
    
    ${location ? `
    <!-- Location -->
    <text x="0" y="${rating ? 205 : 170}" font-family="Arial, sans-serif" font-size="20" fill="${COLORS.textLight}">📍 ${location}</text>
    ` : ''}
    
    ${truncatedDescription ? `
    <!-- Description -->
    <text x="0" y="${location ? (rating ? 255 : 220) : (rating ? 215 : 180)}" font-family="Arial, sans-serif" font-size="19" fill="${COLORS.textLight}">${truncatedDescription.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
    ` : ''}
  </g>
  
  <!-- Footer -->
  <rect y="570" width="1200" height="60" fill="#f9fafb"/>
  <line x1="0" y1="570" x2="1200" y2="570" stroke="#e5e7eb" stroke-width="1"/>
  <text x="50" y="607" font-family="Arial, sans-serif" font-size="15" fill="${COLORS.textLight}">
    +2500 fournisseurs vérifiés • 50,000+ produits • Marketplace B2B #1 en Algérie
  </text>
  <text x="1180" y="607" font-family="Arial, sans-serif" font-size="14" fill="${COLORS.textLight}" text-anchor="end">${BASE_URL}</text>
</svg>`;
}

/**
 * Generate a simple fallback OG image (for errors)
 */
function generateFallbackImage(): string {
  return generateOGImageSVG({
    title: "AlgeriaTrade - Marketplace B2B Algérie",
    description: "Sourcez auprès de +2500 fournisseurs algériens vérifiés. Produits industriels, agricoles, technologiques.",
    type: "default",
  });
}

// ============================================
// API Route Handler
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: OGImageParams = {
      title: searchParams.get("title") || "AlgeriaTrade",
      description: searchParams.get("description") || "",
      image: searchParams.get("image") || undefined,
      type: (searchParams.get("type") as OGImageParams["type"]) || "default",
      price: searchParams.get("price") || undefined,
      rating: searchParams.get("rating") || undefined,
      location: searchParams.get("location") || undefined,
    };

    // Validate required parameters
    if (!params.title || params.title.trim() === "") {
      params.title = "AlgeriaTrade - Marketplace B2B Algérie";
    }

    // Generate SVG
    const svg = generateOGImageSVG(params);

    // Return as SVG image with proper headers
    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=86400", // Cache for 1 hour, CDN cache for 24 hours
        "Content-Disposition": `inline; filename="og-${params.type || 'default'}.svg"`,
      },
    });
  } catch (error) {
    console.error("Error generating OG image:", error);
    
    // Return fallback image on error
    const fallbackSvg = generateFallbackImage();
    
    return new NextResponse(fallbackSvg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
}
