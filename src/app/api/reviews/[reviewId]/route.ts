import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/reviews/[reviewId] - Get single review details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
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
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...review,
      images: review.images ? JSON.parse(review.images) : [],
      pros: review.pros ? JSON.parse(review.pros) : [],
      cons: review.cons ? JSON.parse(review.cons) : [],
      categoryRatings: review.categoryRatings ? JSON.parse(review.categoryRatings) : null,
      reviewerName: review.isAnonymous
        ? 'Anonyme'
        : `${review.reviewer.firstName} ${review.reviewer.lastName}`,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'avis' },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/[reviewId] - Update own review (within 24h only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { reviewId } = await params;
    const body = await request.json();
    const { rating, title, comment, pros, cons, images, isAnonymous } = body;

    // Find existing review
    const existingReview = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      );
    }

    // Check ownership or admin
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN' || session.user.role === 'MODERATOR';
    if (existingReview.reviewerId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Non autorisé à modifier cet avis' },
        { status: 403 }
      );
    }

    // Check 24-hour edit window (only for non-admin)
    if (!isAdmin) {
      const createdAt = new Date(existingReview.createdAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        return NextResponse.json(
          { error: 'La période de modification de 24 heures est expirée' },
          { status: 400 }
        );
      }
    }

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'La note doit être entre 1 et 5' },
        { status: 400 }
      );
    }

    if (comment && comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Le commentaire doit contenir au moins 10 caractères' },
        { status: 400 }
      );
    }

    // Update review
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        ...(rating !== undefined && { rating: Math.round(rating) }),
        ...(title !== undefined && { title: title?.trim() || null }),
        ...(comment !== undefined && { comment: comment?.trim() }),
        ...(pros !== undefined && { pros: pros && pros.length > 0 ? JSON.stringify(pros) : null }),
        ...(cons !== undefined && { cons: cons && cons.length > 0 ? JSON.stringify(cons) : null }),
        ...(images !== undefined && { images: images && images.length > 0 ? JSON.stringify(images) : null }),
        ...(isAnonymous !== undefined && { isAnonymous }),
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

    return NextResponse.json({
      success: true,
      message: 'Avis mis à jour avec succès',
      review: {
        ...updatedReview,
        images: updatedReview.images ? JSON.parse(updatedReview.images) : [],
        pros: updatedReview.pros ? JSON.parse(updatedReview.pros) : [],
        cons: updatedReview.cons ? JSON.parse(updatedReview.cons) : [],
        reviewerName: updatedReview.isAnonymous
          ? 'Anonyme'
          : `${updatedReview.reviewer.firstName} ${updatedReview.reviewer.lastName}`,
      },
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'avis' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[reviewId] - Delete own review (or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { reviewId } = await params;

    // Find existing review
    const existingReview = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      );
    }

    // Check ownership or admin
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN' || session.user.role === 'MODERATOR';
    if (existingReview.reviewerId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer cet avis' },
        { status: 403 }
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
