import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products/:slug - Get single product details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch product with all relations
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            legalForm: true,
            description: true,
            logo: true,
            wilaya: true,
            commune: true,
            isVerified: true,
            rating: true,
            reviewCount: true,
            responseRate: true,
            yearEstablished: true,
          },
        },
        category: {
          include: {
            parent: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    // Increment view count
    await db.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    // Fetch reviews for this product
    const reviews = await db.review.findMany({
      where: {
        productId: product.id,
        status: "published",
      },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Fetch similar products (same category, different product)
    const similarProducts = await db.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
        status: "published",
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
      take: 8,
      orderBy: [
        { isFeatured: "desc" },
        { viewCount: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        reviews: reviews.map((review) => ({
          id: review.id,
          productId: review.productId || undefined,
          companyId: review.companyId || undefined,
          reviewerId: review.reviewerId,
          reviewerName: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
        })),
        similarProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du produit" },
      { status: 500 }
    );
  }
}
