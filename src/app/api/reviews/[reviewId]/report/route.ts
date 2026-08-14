import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Valid report reasons
const VALID_REASONS = [
  'spam',
  'offensive_content',
  'false_information',
  'conflict_of_interest',
  'personal_info',
  'inappropriate_images',
  'other',
] as const;

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam ou contenu promotionnel',
  offensive_content: 'Contenu offensant ou injurieux',
  false_information: 'Fausse information',
  conflict_of_interest: 'Conflit d\'intérêts',
  personal_info: 'Informations personnelles',
  inappropriate_images: 'Images inappropriées',
  other: 'Autre raison',
};

// POST /api/reviews/[reviewId]/report - Report review as inappropriate
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
    const { reason, comment } = body;

    // Validate reason
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: 'Raison de signalement invalide' },
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

    // Don't allow reporting own reviews
    if (review.reviewerId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas signaler votre propre avis' },
        { status: 400 }
      );
    }

    // Check if already reported by this user
    // We'll use a simple approach - just update the report info
    // In production, you might want a separate Report model

    // Update review as flagged
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        status: 'flagged',
        reportedAt: new Date(),
        reportReason: JSON.stringify({
          reportedBy: session.user.id,
          reason,
          reasonLabel: REASON_LABELS[reason],
          comment: comment || null,
          reportedAt: new Date().toISOString(),
        }),
      },
    });

    // TODO: Send notification to admins about flagged review

    return NextResponse.json({
      success: true,
      message: 'Avis signalé avec succès. Notre équipe va l\'examiner.',
      review: updatedReview,
    });
  } catch (error) {
    console.error('Error reporting review:', error);
    return NextResponse.json(
      { error: 'Erreur lors du signalement de l\'avis' },
      { status: 500 }
    );
  }
}

// GET /api/reports - List valid report reasons (for UI)
export async function GET() {
  return NextResponse.json({
    reasons: VALID_REASONS.map(reason => ({
      value: reason,
      label: REASON_LABELS[reason],
    })),
  });
}
