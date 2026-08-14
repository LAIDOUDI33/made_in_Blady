import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper to check admin access
async function checkAdminAccess(session: any) {
  if (!session?.user?.id) {
    return { error: 'Authentification requise', status: 401 };
  }
  
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(session.user.role || '');
  if (!isAdmin) {
    return { error: 'Accès administrateur requis', status: 403 };
  }
  
  return null;
}

// GET /api/admin/reviews - List all reviews with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const accessError = await checkAdminAccess(session);
    if (accessError) {
      return NextResponse.json(accessError, { status: accessError.status });
    }

    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // published, pending, rejected, hidden, flagged
    const type = searchParams.get('type'); // product, company
    const search = searchParams.get('search');
    const reported = searchParams.get('reported') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type === 'product') {
      where.productId = { not: null };
    } else if (type === 'company') {
      where.companyId = { not: null };
    }

    if (reported) {
      where.reportedAt = { not: null };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { comment: { contains: search } },
        { reviewer: { firstName: { contains: search } } },
        { reviewer: { lastName: { contains: search } } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        orderBy: [
          { reportedAt: 'desc' }, // Flagged reviews first
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      db.review.count({ where }),
    ]);

    // Get stats for sidebar
    const [statusStats, totalFlagged] = await Promise.all([
      db.review.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      db.review.count({
        where: { reportedAt: { not: null } },
      }),
    ]);

    return NextResponse.json({
      reviews: reviews.map(review => ({
        ...review,
        images: review.images ? JSON.parse(review.images) : [],
        pros: review.pros ? JSON.parse(review.pros) : [],
        cons: review.cons ? JSON.parse(review.cons) : [],
        categoryRatings: review.categoryRatings ? JSON.parse(review.categoryRatings) : null,
        reportReason: review.reportReason ? JSON.parse(review.reportReason) : null,
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
        byStatus: statusStats.reduce((acc, s) => {
          acc[s.status] = s._count.status;
          return acc;
        }, {} as Record<string, number>),
        totalFlagged,
      },
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des avis' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reviews - Approve/reject/hide review(s)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const accessError = await checkAdminAccess(session);
    if (accessError) {
      return NextResponse.json(accessError, { status: accessError.status });
    }

    const body = await request.json();
    const { reviewIds, action, reason } = body;

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        { error: 'IDs des avis requis' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject', 'hide', 'publish', 'unflag'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide' },
        { status: 400 }
      );
    }

    // Build update data based on action
    let updateData: any = { moderatedBy: session.user.id, moderatedAt: new Date() };

    switch (action) {
      case 'approve':
      case 'publish':
        updateData.status = 'published';
        updateData.reportedAt = null;
        updateData.reportReason = null;
        break;
      case 'reject':
        updateData.status = 'rejected';
        break;
      case 'hide':
        updateData.status = 'hidden';
        break;
      case 'unflag':
        updateData.status = 'published';
        updateData.reportedAt = null;
        updateData.reportReason = null;
        break;
    }

    if (reason) {
      updateData.moderationNote = reason;
    }

    // Update all specified reviews
    const result = await db.review.updateMany({
      where: { id: { in: reviewIds } },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} avis ${action === 'approve' || action === 'publish' ? 'approuvé(s)' : action === 'reject' ? 'rejeté(s)' : action === 'hide' ? 'caché(s)' : 'mis à jour'}`,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('Error updating reviews:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des avis' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews - Remove review(s)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const accessError = await checkAdminAccess(session);
    if (accessError) {
      return NextResponse.json(accessError, { status: accessError.status });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'ID de l\'avis requis' },
        { status: 400 }
      );
    }

    // Delete associated votes first
    await db.reviewVote.deleteMany({
      where: { reviewId },
    });

    // Delete review
    await db.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({
      success: true,
      message: 'Avis supprimé avec succès',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'avis' },
      { status: 500 }
    );
  }
}
