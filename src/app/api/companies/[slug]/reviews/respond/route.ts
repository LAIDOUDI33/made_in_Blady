import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/companies/[slug]/reviews/respond - Respond to a review (supplier only)
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
    const { reviewId, response } = body;

    // Validation
    if (!reviewId) {
      return NextResponse.json(
        { error: 'ID de l\'avis requis' },
        { status: 400 }
      );
    }

    if (!response || response.trim().length < 10) {
      return NextResponse.json(
        { error: 'La réponse doit contenir au moins 10 caractères' },
        { status: 400 }
      );
    }

    // Find company and verify ownership
    const company = await db.company.findUnique({
      where: { slug },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    // Check if user is the company owner or admin
    if (company.userId !== session.user.id && 
        !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Seul le fournisseur peut répondre aux avis' },
        { status: 403 }
      );
    }

    // Find the review
    const review = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      );
    }

    // Verify review belongs to this company
    if (review.companyId !== company.id) {
      return NextResponse.json(
        { error: 'Cet avis n\'appartient pas à cette entreprise' },
        { status: 400 }
      );
    }

    // Update or create response
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        response: response.trim(),
        respondedAt: new Date(),
        respondedBy: session.user.id,
      },
    });

    // Update company response rate
    const totalReviews = await db.review.count({
      where: { companyId: company.id, status: 'published' },
    });
    
    const respondedReviews = await db.review.count({
      where: { 
        companyId: company.id, 
        status: 'published',
        response: { not: null },
      },
    });

    await db.company.update({
      where: { id: company.id },
      data: {
        responseRate: totalReviews > 0 ? (respondedReviews / totalReviews) * 100 : 0,
      },
    });

    // TODO: Send notification to reviewer about response

    return NextResponse.json({
      success: true,
      message: 'Réponse publiée avec succès',
      review: updatedReview,
    });
  } catch (error) {
    console.error('Error responding to review:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la publication de la réponse' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[slug]/reviews/respond - Remove response
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'ID de l\'avis requis' },
        { status: 400 }
      );
    }

    // Find company and verify ownership
    const company = await db.company.findUnique({
      where: { slug },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    if (company.userId !== session.user.id && 
        !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Remove response
    await db.review.update({
      where: { id: reviewId },
      data: {
        response: null,
        respondedAt: null,
        respondedBy: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Réponse supprimée avec succès',
    });
  } catch (error) {
    console.error('Error removing review response:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la réponse' },
      { status: 500 }
    );
  }
}
