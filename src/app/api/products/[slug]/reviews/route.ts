import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Spam/profanity detection keywords (French & Arabic)
const SPAM_KEYWORDS = [
  'spam', 'scam', 'arnaque', 'escroquerie', 'fraude',
  'gratuit', 'free money', 'cliquez ici', 'click here',
  'http://', 'https://', 'www.', '.com', '.dz',
  'tel:', 'phone:', 'contactez', 'contactez-moi',
  'whatsapp', 'facebook', 'instagram',
  // Add more as needed
];

function containsSpam(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return SPAM_KEYWORDS.some(keyword => lowerContent.includes(keyword));
}

// GET /api/products/[slug]/reviews - List reviews for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest'; // newest, oldest, highest, lowest, helpful
    const hasPhotos = searchParams.get('hasPhotos') === 'true';
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const withResponse = searchParams.get('withResponse') === 'true';

    // Find product by slug
    const product = await db.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = {
      productId: product.id,
      status: 'published',
    };

    if (hasPhotos) {
      where.images = { not: null };
    }

    if (verifiedOnly) {
      where.isVerifiedPurchase = true;
    }

    if (withResponse) {
      where.response = { not: null };
    }

    // Build order by
    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'highest':
        orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'lowest':
        orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
        break;
      case 'helpful':
        orderBy = [{ helpfulCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      db.review.count({ where }),
    ]);

    // Calculate stats
    const stats = await db.review.groupBy({
      by: ['rating'],
      where: {
        productId: product.id,
        status: 'published',
      },
      _count: { rating: true },
    });

    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: stats.find(s => s.rating === rating)?._count.rating || 0,
    }));

    const totalRatingSum = stats.reduce((sum, s) => sum + s.rating * s._count.rating, 0);
    const totalReviewsCount = stats.reduce((sum, s) => sum + s._count.rating, 0);
    const averageRating = totalReviewsCount > 0 ? totalRatingSum / totalReviewsCount : 0;

    return NextResponse.json({
      reviews: reviews.map(review => ({
        ...review,
        images: review.images ? JSON.parse(review.images) : [],
        pros: review.pros ? JSON.parse(review.pros) : [],
        cons: review.cons ? JSON.parse(review.cons) : [],
        categoryRatings: review.categoryRatings ? JSON.parse(review.categoryRatings) : null,
        reviewerName: review.isAnonymous
          ? 'Anonyme'
          : `${review.reviewer.firstName} ${review.reviewer.lastName}`,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: totalReviewsCount,
        distribution: ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des avis' },
      { status: 500 }
    );
  }
}

// POST /api/products/[slug]/reviews - Submit new review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const { rating, title, comment, pros, cons, images, isAnonymous } = body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'La note doit être entre 1 et 5' },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Le commentaire doit contenir au moins 10 caractères' },
        { status: 400 }
      );
    }

    // Spam check
    const contentToCheck = `${title || ''} ${comment} ${pros?.join(' ') || ''} ${cons?.join(' ') || ''}`;
    if (containsSpam(contentToCheck)) {
      return NextResponse.json(
        { error: 'Votre avis contient du contenu non autorisé' },
        { status: 400 }
      );
    }

    // Find product
    const product = await db.product.findUnique({
      where: { slug },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Check if user already reviewed this product
    const existingReview = await db.review.findFirst({
      where: {
        productId: product.id,
        reviewerId: session.user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Vous avez déjà donné un avis sur ce produit' },
        { status: 409 }
      );
    }

    // Check for verified purchase
    const verifiedOrder = await db.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          buyerId: session.user.id,
          status: 'DELIVERED',
        },
      },
    });

    // Create review
    const review = await db.review.create({
      data: {
        productId: product.id,
        reviewerId: session.user.id,
        orderId: verifiedOrder?.orderId || null,
        rating: Math.round(rating),
        title: title?.trim() || null,
        comment: comment.trim(),
        pros: pros && pros.length > 0 ? JSON.stringify(pros) : null,
        cons: cons && cons.length > 0 ? JSON.stringify(cons) : null,
        images: images && images.length > 0 ? JSON.stringify(images) : null,
        isVerifiedPurchase: !!verifiedOrder,
        isAnonymous: isAnonymous || false,
        status: 'published', // Can be changed to 'pending' for moderation
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update product rating (would need to calculate average)
    // This could be done in a background job or trigger

    return NextResponse.json({
      success: true,
      message: 'Avis publié avec succès',
      review: {
        ...review,
        images: review.images ? JSON.parse(review.images) : [],
        pros: review.pros ? JSON.parse(review.pros) : [],
        cons: review.cons ? JSON.parse(review.cons) : [],
        reviewerName: review.isAnonymous
          ? 'Anonyme'
          : `${review.reviewer.firstName} ${review.reviewer.lastName}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'avis' },
      { status: 500 }
    );
  }
}
