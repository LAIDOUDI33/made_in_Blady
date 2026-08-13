import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/search - Search products with suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          suggestions: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          searchQuery: query,
        },
      });
    }

    // Search products (SQLite is case-insensitive for contains)
    const [products, total] = await Promise.all([
      db.product.findMany({
        where: {
          isActive: true,
          status: "published",
          OR: [
            { name: { contains: query } },
            { shortDescription: { contains: query } },
            { sku: { contains: query } },
          ],
        },
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
        orderBy: [
          { isFeatured: "desc" },
          { viewCount: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
        skip,
      }),
      db.product.count({
        where: {
          isActive: true,
          status: "published",
          OR: [
            { name: { contains: query } },
            { shortDescription: { contains: query } },
            { sku: { contains: query } },
          ],
        },
      }),
    ]);

    // Search categories for suggestions
    const categorySuggestions = await db.category.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
      take: 5,
    });

    // Search companies for suggestions
    const companySuggestions = await db.company.findMany({
      where: {
        isActive: true,
        isVerified: true,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        rating: true,
      },
      take: 5,
    });

    // Build suggestions array
    const suggestions = [
      ...categorySuggestions.map((cat) => ({
        id: `cat-${cat.id}`,
        text: cat.name,
        type: "category" as const,
        slug: cat.slug,
      })),
      ...companySuggestions.map((company) => ({
        id: `comp-${company.id}`,
        text: company.name,
        type: "company" as const,
        slug: company.slug,
        count: undefined,
      })),
    ];

    // Generate "Did you mean?" suggestions (simple implementation)
    let didYouMean;
    if (total === 0 && query.length > 2) {
      // Try a broader search with first word only
      const firstWord = query.split(" ")[0];
      const broadResults = await db.product.findMany({
        where: {
          isActive: true,
          status: "published",
          OR: [
            { name: { contains: firstWord } },
          ],
        },
        select: { name: true },
        take: 3,
      });
      
      if (broadResults.length > 0) {
        didYouMean = broadResults[0].name;
      }
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        results: products,
        suggestions,
        didYouMean,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        searchQuery: query,
      },
    });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}
