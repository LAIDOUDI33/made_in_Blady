import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories - Get categories tree structure
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeProductCounts = searchParams.get("counts") === "true";

    // Fetch all active categories
    const categories = await db.category.findMany({
      where: { isActive: true },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    // If product counts are needed, fetch them separately
    let productCounts: Record<string, number> = {};
    
    if (includeProductCounts) {
      const countResults = await db.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          products: {
            where: { isActive: true, status: "published" },
            select: { id: true },
          },
        },
      });
      
      for (const cat of countResults) {
        productCounts[cat.id] = cat.products.length;
      }
    }

    // Build tree structure (only top-level categories with their children)
    const categoryTree = categories
      .filter((cat) => !cat.parentId)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        icon: cat.icon,
        productCount: includeProductCounts ? (productCounts[cat.id] || 0) : undefined,
        subcategories: cat.subcategories.map((sub) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          productCount: includeProductCounts ? (productCounts[sub.id] || 0) : undefined,
        })),
      }));

    // Also return flat list for easier lookup
    const flatList = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      parentId: cat.parentId,
      image: cat.image,
      icon: cat.icon,
    }));

    // Featured categories (those with most products or manually marked)
    const featuredCategories = includeProductCounts
      ? categoryTree
          .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
          .slice(0, 6)
          .map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            productCount: cat.productCount,
          }))
      : categoryTree.slice(0, 6).map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
        }));

    return NextResponse.json({
      success: true,
      data: {
        categories: categoryTree,
        flatList,
        featuredCategories,
        totalCategories: categories.length,
        totalParentCategories: categoryTree.length,
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des catégories" },
      { status: 500 }
    );
  }
}
