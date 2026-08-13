import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products - List products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const skip = (page - 1) * limit;

    // Filters
    const categorySlug = searchParams.get("category");
    const subcategorySlug = searchParams.get("subcategory");
    const searchQuery = searchParams.get("search");
    const wilaya = searchParams.get("wilaya");
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "100000000");
    const minMoq = parseInt(searchParams.get("minMoq") || "0");
    const maxMoq = parseInt(searchParams.get("maxMoq") || "10000000");
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const availability = searchParams.get("availability");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "newest";
    
    // Build where clause
    let where: Record<string, unknown> = {
      isActive: true,
      status: "published",
    };

    // Category filter
    if (categorySlug || subcategorySlug) {
      const categoryWhere: Record<string, unknown> = {};
      
      if (subcategorySlug) {
        categoryWhere.slug = subcategorySlug;
      } else if (categorySlug) {
        categoryWhere.slug = categorySlug;
      }
      
      where.category = categoryWhere;
    }

    // Search filter (name or description)
    if (searchQuery && searchQuery.trim()) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { shortDescription: { contains: searchQuery, mode: "insensitive" } },
        { sku: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Wilaya/Location filter
    if (wilaya) {
      where.company = {
        ...where.company as object,
        wilaya: wilaya,
      };
    }

    // Price range filter
    if (minPrice > 0 || maxPrice < 100000000) {
      where.AND = [
        ...(where.AND ? [where.AND] : []),
        {
          OR: [
            { price: { gte: minPrice, lte: maxPrice } },
            { priceRangeMin: { gte: minPrice }, priceRangeMax: { lte: maxPrice } },
            { priceRangeMin: null, price: { gte: minPrice, lte: maxPrice } },
          ],
        },
      ];
    }

    // MOQ range filter
    if (minMoq > 0 || maxMoq < 10000000) {
      where.moq = {
        gte: minMoq,
        lte: maxMoq,
      };
    }

    // Verified supplier filter
    if (verifiedOnly) {
      where.company = {
        ...where.company as object,
        isVerified: true,
      };
    }

    // Availability filter
    if (availability) {
      where.availability = availability;
    }

    // Build order by clause
    let orderBy: Record<string, string> | Array<Record<string, string>> = [];
    switch (sortBy) {
      case "price_asc":
        orderBy = [{ price: "asc" }, { priceRangeMin: "asc" }];
        break;
      case "price_desc":
        orderBy = [{ price: "desc" }, { priceRangeMax: "desc" }];
        break;
      case "most_viewed":
        orderBy = { viewCount: "desc" };
        break;
      case "rating":
        orderBy = { company: { rating: "desc" } };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    // Execute queries in parallel
    const [products, total, categories, wilayas] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              wilaya: true,
              commune: true,
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
            select: {
              id: true,
              url: true,
              alt: true,
              sortOrder: true,
              isPrimary: true,
            },
            orderBy: { sortOrder: "asc" },
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip,
      }),
      db.product.count({ where }),
      db.category.findMany({
        where: { isActive: true, parentId: null },
        include: {
          subcategories: {
            where: { isActive: true },
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { products: { where: { isActive: true, status: "published" } } },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      // Get unique wilayas with product counts
      db.product.groupBy({
        by: ["companyId"],
        where: { isActive: true, status: "published" },
        _count: { companyId: true },
      }),
    ]);

    // Fetch unique wilayas from companies that have products
    const companiesWithProducts = await db.company.findMany({
      where: {
        products: { some: { isActive: true, status: "published" } },
      },
      select: { wilaya: true },
      distinct: ["wilaya"],
    });

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filters: {
          categories: categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            subcategories: cat.subcategories,
            productCount: cat._count.products,
          })),
          wilayas: companiesWithProducts.map((c) => ({
            name: c.wilaya,
            code: "",
            count: 1, // Simplified count
          })),
          priceRange: { min: 0, max: 10000000 },
          moqRange: { min: 0, max: 100000 },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des produits" },
      { status: 500 }
    );
  }
}
