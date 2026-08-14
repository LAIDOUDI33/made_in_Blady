import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Company review category definitions
export const REVIEW_CATEGORIES = [
  { key: 'quality', label: 'الجودة', labelFr: 'Qualité des produits' },
  { key: 'communication', label: 'التواصل', labelFr: 'Communication' },
  { key: 'delivery', label: 'وقت التسليم', labelFr: 'Délai de livraison' },
  { key: 'value', label: 'القيمة مقابل المال', labelFr: 'Rapport qualité-prix' },
  { key: 'afterSales', label: 'خدمة ما بعد البيع', labelFr: 'Service après-vente' },
] as const;

// Spam/profanity detection keywords
const SPAM_KEYWORDS = [
  'spam', 'scam', 'arnaque', 'escroquerie', 'fraude',
  'gratuit', 'free money', 'cliquez ici', 'click here',
];

function containsSpam(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return SPAM_KEYWORDS.some(keyword => lowerContent.includes(keyword));
}

// GET /api/companies/[slug]/reviews - List company reviews with category breakdowns
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest';

    // Find company by slug
    const company = await db.company.findUnique({
      where: { slug },
      select: { id: true, name: true, rating: true, reviewCount: true, responseRate: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    // Build where clause
    const where = {
      companyId: company.id,
      status: 'published',
    };

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
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Get reviews
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

    // Calculate category averages
    const allReviews = await db.review.findMany({
      where: {
        companyId: company.id,
        status: 'published',
        categoryRatings: { not: null },
      },
      select: { categoryRatings: true },
    });

    const categoryAverages = REVIEW_CATEGORIES.map(category => {
      const values = allReviews
        .map(r => {
          try {
            const ratings = JSON.parse(r.categoryRatings);
            return ratings[category.key];
          } catch {
            return null;
          }
        })
        .filter(v => v !== null && !isNaN(v));

      const average = values.length > 0
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : 0;

      return {
        ...category,
        average: Math.round(average * 10) / 10,
        count: values.length,
      };
    });

    // Calculate response stats
    const reviewsWithResponse = await db.review.count({
      where: {
        companyId: company.id,
        status: 'published',
        response: { not: null },
      },
    });

    // Calculate average response time (in days)
    const respondedReviews = await db.review.findMany({
      where: {
        companyId: company.id,
        status: 'published',
        respondedAt: { not: null },
      },
      select: { createdAt: true, respondedAt: true },
    });

    const avgResponseTime = respondedReviews.length > 0
      ? respondedReviews.reduce((sum, r) => {
          const created = new Date(r.createdAt).getTime();
          const responded = new Date(r.respondedAt!).getTime();
          return sum + (responded - created) / (1000 * 60 * 60 * 24);
        }, 0) / respondedReviews.length
      : 0;

    // Rating distribution
    const stats = await db.review.groupBy({
      by: ['rating'],
      where: {
        companyId: company.id,
        status: 'published',
      },
      _count: { rating: true },
    });

    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: stats.find(s => s.rating === rating)?._count.rating || 0,
    }));

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        overallRating: company.rating,
        totalReviews: company.reviewCount,
      },
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
        distribution: ratingDistribution,
        categories: categoryAverages,
        responseRate: total > 0 ? Math.round((reviewsWithResponse / total) * 100) : 0,
        avgResponseDays: Math.round(avgResponseTime * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Error fetching company reviews:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des avis' },
      { status: 500 }
    );
  }
}

// POST /api/companies/[slug]/reviews - Submit new company review
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
    const { 
      rating, 
      title, 
      comment, 
      pros, 
      cons, 
      categoryRatings, 
      isAnonymous 
    } = body;

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

    // Validate category ratings if provided
    if (categoryRatings) {
      for (const cat of REVIEW_CATEGORIES) {
        if (cat.key in categoryRatings) {
          const value = categoryRatings[cat.key];
          if (typeof value !== 'number' || value < 1 || value > 5) {
            return NextResponse.json(
              { error: `La note pour ${cat.labelFr} doit être entre 1 et 5` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Spam check
    const contentToCheck = `${title || ''} ${comment} ${pros?.join(' ') || ''} ${cons?.join(' ') || ''}`;
    if (containsSpam(contentToCheck)) {
      return NextResponse.json(
        { error: 'Votre avis contient du contenu non autorisé' },
        { status: 400 }
      );
    }

    // Find company
    const company = await db.company.findUnique({
      where: { slug },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    // Check if user already reviewed this company
    const existingReview = await db.review.findFirst({
      where: {
        companyId: company.id,
        reviewerId: session.user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Vous avez déjà donné un avis sur cette entreprise' },
        { status: 409 }
      );
    }

    // Check for verified purchase (has orders with this company)
    const verifiedOrder = await db.order.findFirst({
      where: {
        companyId: company.id,
        buyerId: session.user.id,
        status: 'DELIVERED',
      },
    });

    // Create review
    const review = await db.review.create({
      data: {
        companyId: company.id,
        reviewerId: session.user.id,
        orderId: verifiedOrder?.id || null,
        rating: Math.round(rating),
        title: title?.trim() || null,
        comment: comment.trim(),
        pros: pros && pros.length > 0 ? JSON.stringify(pros) : null,
        cons: cons && cons.length > 0 ? JSON.stringify(cons) : null,
        categoryRatings: categoryRatings ? JSON.stringify(categoryRatings) : null,
        isVerifiedPurchase: !!verifiedOrder,
        isAnonymous: isAnonymous || false,
        status: 'published',
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

    // Update company rating (simplified - in production use aggregation)
    const allCompanyReviews = await db.review.findMany({
      where: { companyId: company.id, status: 'published' },
      select: { rating: true },
    });
    
    const newAvgRating = allCompanyReviews.length > 0
      ? allCompanyReviews.reduce((sum, r) => sum + r.rating, 0) / allCompanyReviews.length
      : 0;

    await db.company.update({
      where: { id: company.id },
      data: {
        rating: Math.round(newAvgRating * 10) / 10,
        reviewCount: allCompanyReviews.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Avis publié avec succès',
      review: {
        ...review,
        images: review.images ? JSON.parse(review.images) : [],
        pros: review.pros ? JSON.parse(review.pros) : [],
        cons: review.cons ? JSON.parse(review.cons) : [],
        categoryRatings: review.categoryRatings ? JSON.parse(review.categoryRatings) : null,
        reviewerName: review.isAnonymous
          ? 'Anonyme'
          : `${review.reviewer.firstName} ${review.reviewer.lastName}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating company review:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'avis' },
      { status: 500 }
    );
  }
}
