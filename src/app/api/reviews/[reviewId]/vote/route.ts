import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/reviews/[reviewId]/vote - Vote helpful/not-helpful (toggle)
export async function POST(
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
    const { type } = body; // "helpful" or "not_helpful"

    if (!type || !['helpful', 'not_helpful'].includes(type)) {
      return NextResponse.json(
        { error: 'Type de vote invalide' },
        { status: 400 }
      );
    }

    // Check if review exists
    const review = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      );
    }

    // Don't allow voting on own reviews
    if (review.reviewerId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas voter pour votre propre avis' },
        { status: 400 }
      );
    }

    // Check for existing vote of same type
    const existingVote = await db.reviewVote.findUnique({
      where: {
        reviewId_userId_type: {
          reviewId,
          userId: session.user.id,
          type,
        },
      },
    });

    if (existingVote) {
      // Toggle: remove existing vote
      await db.reviewVote.delete({
        where: { id: existingVote.id },
      });

      // Update counts
      const updateData = type === 'helpful'
        ? { decrement: { helpfulCount: 1 } }
        : { decrement: { notHelpfulCount: 1 } };

      await db.review.update({
        where: { id: reviewId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: 'Vote retiré',
        voted: false,
      });
    } else {
      // Remove opposite vote if exists
      const oppositeType = type === 'helpful' ? 'not_helpful' : 'helpful';
      const oppositeVote = await db.reviewVote.findUnique({
        where: {
          reviewId_userId_type: {
            reviewId,
            userId: session.user.id,
            type: oppositeType,
          },
        },
      });

      if (oppositeVote) {
        await db.reviewVote.delete({ where: { id: oppositeVote.id } });
        
        const decrementData = oppositeType === 'helpful'
          ? { decrement: { helpfulCount: 1 } }
          : { decrement: { notHelpfulCount: 1 } };
        
        await db.review.update({
          where: { id: reviewId },
          data: decrementData,
        });
      }

      // Create new vote
      await db.reviewVote.create({
        data: {
          reviewId,
          userId: session.user.id,
          type,
        },
      });

      // Update counts
      const incrementData = type === 'helpful'
        ? { increment: { helpfulCount: 1 } }
        : { increment: { notHelpfulCount: 1 } };

      const updatedReview = await db.review.update({
        where: { id: reviewId },
        data: incrementData,
        select: {
          helpfulCount: true,
          notHelpfulCount: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: type === 'helpful' ? 'Avis marqué comme utile' : 'Avis marqué comme non utile',
        voted: true,
        type,
        counts: updatedReview,
      });
    }
  } catch (error) {
    console.error('Error voting on review:', error);
    return NextResponse.json(
      { error: 'Erreur lors du vote' },
      { status: 500 }
    );
  }
}

// GET /api/reviews/[reviewId]/vote - Get user's vote status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { voted: false, type: null },
        { status: 200 }
      );
    }

    const { reviewId } = await params;

    const votes = await db.reviewVote.findMany({
      where: {
        reviewId,
        userId: session.user.id,
      },
      select: { type: true },
    });

    const userVote = votes.length > 0 ? votes[0].type : null;

    return NextResponse.json({
      voted: votes.length > 0,
      type: userVote,
    });
  } catch (error) {
    console.error('Error getting vote status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut de vote' },
      { status: 500 }
    );
  }
}
