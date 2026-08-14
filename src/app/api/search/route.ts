import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================
// Fuzzy Search Utilities
// ============================================

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity ratio (0 to 1)
function similarityRatio(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Check if two strings are similar enough (fuzzy match)
function isFuzzyMatch(query: string, target: string, threshold: number = 0.7): boolean {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  
  // Exact contains check
  if (t.includes(q) || q.includes(t)) return true;
  
  // Fuzzy similarity check
  return similarityRatio(q, t) >= threshold;
}

// Generate spelling suggestions using common Algerian/French typos
const COMMON_TYPOS: Record<string, string[]> = {
  "panneau": ["panau", "panea", "panneaux"],
  "solaire": ["solair", "solare", "solaires"],
  "electrique": ["elektrique", "électrique", "elecrtique"],
  "acier": ["acir", "acierre", "assier"],
  "construction": ["construcion", "contruction", "constructon"],
  "pompe": ["pomp", "pompe", "pumpe"],
  "irrigation": ["irigation", "irrigtion", "irigacion"],
  "machine": ["machin", "mashine", "macine"],
  "agricole": ["agricol", "agrcole", "agricoles"],
  "huile": ["hile", "huil", "uile"],
  "olive": ["oliv", "olive", "olivee"],
  "date": ["dates", "dat", "dattes"],
  "fournisseur": ["fourniseur", "fourisseur", "fournisseurs"],
  "produit": ["prodit", "produit", "produits"],
  "algerie": ["algeria", "algérie", "dz"],
};

// Find "Did you mean?" suggestion
async function findDidYouMeanSuggestion(
  query: string,
  dbInstance: typeof db
): Promise<string | null> {
  const words = query.toLowerCase().split(/\s+/);
  let suggestion: string | null = null;

  // Check each word against common typos
  for (const word of words) {
    if (word.length < 3) continue;

    // Check common typo dictionary
    for (const [correct, typos] of Object.entries(COMMON_TYPOS)) {
      if (typos.includes(word) || word.includes(correct.slice(0, 3))) {
        suggestion = query.replace(new RegExp(word, "gi"), correct);
        break;
      }
    }

    if (suggestion) break;
  }

  // If no typo found, try finding similar product names
  if (!suggestion) {
    try {
      const similarProducts = await dbInstance.product.findMany({
        where: {
          isActive: true,
          status: "published",
        },
        select: { name: true },
        take: 50,
      });

      let bestMatch = "";
      let bestScore = 0;

      for (const product of similarProducts) {
        const score = similarityRatio(query.toLowerCase(), product.name.toLowerCase());
        if (score > bestScore && score >= 0.5 && score < 0.95) {
          bestScore = score;
          bestMatch = product.name;
        }
      }

      if (bestMatch) {
        suggestion = bestMatch;
      }
    } catch (error) {
      console.error("Error finding did you mean:", error);
    }
  }

  return suggestion;
}

// Highlight matched text in result
function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;

  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  let highlightedText = text;

  for (const word of words) {
    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
  }

  return highlightedText;
}

// ============================================
// Popular Searches Analytics (simulated)
// ============================================

const POPULAR_SEARCHES_DATA = [
  { term: "Panneaux solaires", count: 12500 },
  { term: "Câble électrique", count: 9800 },
  { term: "Acier construction", count: 8700 },
  { term: "Pompes irrigation", count: 7200 },
  { term: "Huile d'olive", count: 6500 },
  { term: "Dates deglet nour", count: 5900 },
  { term: "Machines agricoles", count: 5400 },
  { term: "Outils industriels", count: 4800 },
  { term: "Carrelage", count: 4200 },
  { term: "Peinture bâtiment", count: 3900 },
];

// ============================================
// Main Search API Handler
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    
    // Advanced filter parameters
    const categoryIds = searchParams.get("categories")?.split(",").filter(Boolean);
    const wilaya = searchParams.get("wilaya");
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "100000000");
    const minMoq = parseInt(searchParams.get("minMoq") || "0");
    const maxMoq = parseInt(searchParams.get("maxMoq") || "10000000");
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const availability = searchParams.get("availability")?.split(",").filter(Boolean);
    const countryOfOrigin = searchParams.get("countryOfOrigin");
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const sortBy = searchParams.get("sortBy") || "relevance";
    const datePosted = searchParams.get("datePosted"); // last24h, lastWeek, lastMonth
    const leadTime = searchParams.get("leadTime");
    const type = searchParams.get("type") || "all"; // products, suppliers, rfqs, all

    // Empty query - return popular searches
    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          suggestions: [],
          popularSearches: POPULAR_SEARCHES_DATA.map((item) => ({
            term: item.term,
            count: item.count,
          })),
          pagination: { page, limit, total: 0, totalPages: 0 },
          searchQuery: query,
        },
      });
    }

    // Build where clause with fuzzy search support
    const buildWhereClause = () => {
      const baseClause: any = {
        isActive: true,
        status: "published",
      };

      // Search conditions with fuzzy matching
      if (query.trim()) {
        const searchWords = query.split(/\s+/).filter((w) => w.length > 1);
        
        baseClause.OR = [
          // Exact/contains matches
          ...searchWords.flatMap((word) => [
            { name: { contains: word } },
            { shortDescription: { contains: word } },
            { sku: { contains: word } },
            { description: { contains: word } },
          ]),
        ];
      }

      // Category filter
      if (categoryIds && categoryIds.length > 0) {
        baseClause.categoryId = { in: categoryIds };
      }

      // Price range filter
      if (minPrice > 0 || maxPrice < 100000000) {
        baseClause.AND = [
          ...(baseClause.AND || []),
          {
            OR: [
              { price: { gte: minPrice, lte: maxPrice } },
              { priceRangeMin: { lte: maxPrice } },
              { priceRangeMax: { gte: minPrice } },
              { price: null }, // Include products without set prices
            ],
          },
        ];
      }

      // Wilaya filter (through company)
      if (wilaya) {
        baseClause.company = {
          ...baseClause.company,
          wilaya: wilaya,
        };
      }

      // Verified supplier filter
      if (verifiedOnly) {
        baseClause.company = {
          ...baseClause.company,
          isVerified: true,
        };
      }

      // Availability filter
      if (availability && availability.length > 0) {
        baseClause.availability = { in: availability };
      }

      // MOQ range filter
      if (minMoq > 0 || maxMoq < 10000000) {
        baseClause.moq = { gte: minMoq, lte: maxMoq };
      }

      // Country of origin filter
      if (countryOfOrigin) {
        baseClause.countryOfOrigin = countryOfOrigin;
      }

      // Lead time filter
      if (leadTime) {
        baseClause.leadTime = { contains: leadTime };
      }

      // Date posted filter
      if (datePosted) {
        const now = new Date();
        let dateFilter: Date;

        switch (datePosted) {
          case "last24h":
            dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "lastWeek":
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "lastMonth":
            dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateFilter = new Date(0);
        }

        baseClause.createdAt = { gte: dateFilter };
      }

      return baseClause;
    };

    // Build order by clause based on sort option
    const buildOrderBy = (): any[] => {
      switch (sortBy) {
        case "price_asc":
          return [{ price: "asc" }, { createdAt: "desc" }];
        case "price_desc":
          return [{ price: "desc" }, { createdAt: "desc" }];
        case "rating":
          return [{ reviews: { _count: "desc" } }, { viewCount: "desc" }];
        case "most_viewed":
          return [{ viewCount: "desc" }, { createdAt: "desc" }];
        case "newest":
        default:
          return [{ isFeatured: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }];
      }
    };

    // Execute parallel searches
    const [products, total, categorySuggestions, companySuggestions] = await Promise.all([
      // Main product search
      db.product.findMany({
        where: buildWhereClause(),
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              wilaya: true,
              isVerified: true,
              rating: true,
              reviewCount: true,
              responseRate: true,
              logo: true,
              legalForm: true,
              yearEstablished: true,
            },
          },
          category: {
            select: {
              id: true,
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
              favorites: true,
            },
          },
        },
        orderBy: buildOrderBy(),
        take: limit,
        skip,
      }),

      // Total count
      db.product.count({
        where: buildWhereClause(),
      }),

      // Category suggestions
      db.category.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ],
        },
        include: {
          _count: {
            select: { products: true },
          },
        },
        take: 5,
      }),

      // Company/supplier suggestions
      db.company.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ],
          ...(verifiedOnly ? [{ isVerified: true }] : []),
        },
        select: {
          id: true,
          name: true,
          slug: true,
          rating: true,
          reviewCount: true,
          wilaya: true,
          isVerified: true,
          logo: true,
          _count: {
            select: { products: true },
          },
        },
        take: 5,
      }),
    ]);

    // RFQ search if requested
    let rfqResults: any[] = [];
    if (type === "all" || type === "rfqs") {
      rfqResults = await db.rFQ.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              company: { select: { name: true, wilaya: true } },
            },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { quotations: true },
          },
        },
        take: type === "rfqs" ? limit : 5,
        orderBy: { createdAt: "desc" },
      });
    }

    // Process results with highlighting
    const processedProducts = products.map((product) => ({
      ...product,
      highlightedName: highlightText(product.name, query),
      highlightedDescription: highlightText(product.shortDescription || "", query),
    }));

    // Build suggestions array
    const suggestions = [
      ...categorySuggestions.map((cat) => ({
        id: `cat-${cat.id}`,
        text: cat.name,
        type: "category" as const,
        slug: cat.slug,
        count: cat._count.products,
      })),
      ...companySuggestions.map((company) => ({
        id: `comp-${company.id}`,
        text: company.name,
        type: "company" as const,
        slug: company.slug,
        count: company._count.products,
        rating: company.rating,
      })),
    ];

    // Generate "Did you mean?" suggestions
    let didYouMean: string | null = null;
    if (total === 0 && query.length > 2) {
      didYouMean = await findDidYouMeanSuggestion(query, db);
    }

    // Get related/popular searches
    const relatedSearches = POPULAR_SEARCHES_DATA
      .filter(
        (item) =>
          item.term !== query &&
          (query.split(" ").some((word) => item.term.toLowerCase().includes(word.toLowerCase())) ||
            total === 0)
      )
      .slice(0, 6);

    const totalPages = Math.ceil(total / limit);

    // Build response
    const response = {
      success: true,
      data: {
        results: processedProducts,
        suggestions,
        didYouMean,
        rfqResults: rfqResults.length > 0 ? rfqResults : undefined,
        popularSearches: POPULAR_SEARCHES_DATA.slice(0, 8).map((item) => ({
          term: item.term,
          count: item.count,
        })),
        relatedSearches,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        searchQuery: query,
        appliedFilters: {
          categories: categoryIds,
          wilaya,
          minPrice,
          maxPrice,
          minMoq,
          maxMoq,
          verifiedOnly,
          availability,
          countryOfOrigin,
          minRating,
          sortBy,
          datePosted,
          type,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}

// POST endpoint for saving searches (analytics)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, searchTerm, filters } = body;

    switch (action) {
      case "save_search":
        // In production, this would save to database for analytics
        // For now, we'll just acknowledge the save
        console.log("Search saved:", { searchTerm, filters });
        return NextResponse.json({
          success: true,
          message: "Recherche sauvegardée avec succès",
        });

      case "get_popular":
        return NextResponse.json({
          success: true,
          data: POPULAR_SEARCHES_DATA,
        });

      default:
        return NextResponse.json(
          { success: false, error: "Action non reconnue" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in search POST:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
