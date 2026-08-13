import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { RFQStatus, QuotationStatus } from '@prisma/client';

// GET /api/dashboard/buyer/rfqs/[id] - Get single RFQ with quotations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    // Get RFQ with full details
    const rfq = await db.rFQ.findFirst({
      where: {
        id,
        buyerId: user.id
      },
      include: {
        category: true,
        quotations: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                isVerified: true,
                rating: true,
                responseRate: true,
                wilaya: true
              }
            },
            items: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!rfq) {
      return NextResponse.json({ error: 'Appel d\'offre non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      rfq: {
        id: rfq.id,
        title: rfq.title,
        description: rfq.description,
        quantity: rfq.quantity,
        unit: rfq.unit,
        targetPrice: rfq.targetPrice,
        targetCurrency: rfq.targetCurrency,
        category: rfq.category?.name,
        categoryId: rfq.categoryId,
        status: rfq.status,
        deliveryLocation: rfq.deliveryLocation,
        requiredDeliveryDate: rfq.requiredDeliveryDate?.toISOString(),
        expirationDate: rfq.expirationDate?.toISOString(),
        createdAt: rfq.createdAt.toISOString(),
        updatedAt: rfq.updatedAt.toISOString(),
        quotations: rfq.quotations.map(q => ({
          id: q.id,
          companyId: q.companyId,
          companyName: q.company.name,
          companySlug: q.company.slug,
          companyLogo: q.company.logo,
          isVerified: q.company.isVerified,
          rating: q.company.rating,
          responseRate: q.company.responseRate,
          totalPrice: q.totalPrice,
          currency: q.currency,
          notes: q.notes,
          validUntil: q.validUntil?.toISOString(),
          status: q.status,
          submittedAt: q.createdAt.toISOString(),
          items: q.items
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching RFQ:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'appel d\'offre' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/buyer/rfqs/[id] - Update RFQ
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check ownership
    const existingRFQ = await db.rFQ.findFirst({
      where: { id, buyerId: user.id }
    });

    if (!existingRFQ) {
      return NextResponse.json({ error: 'Appel d\'offre non trouvé' }, { status: 404 });
    }

    // Can only edit DRAFT or PUBLISHED RFQs
    if (!['DRAFT', 'PUBLISHED'].includes(existingRFQ.status)) {
      return NextResponse.json(
        { error: 'Cet appel d\'offre ne peut plus être modifié' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.quantity !== undefined) updateData.quantity = parseInt(body.quantity);
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.targetPrice !== undefined) updateData.targetPrice = parseFloat(body.targetPrice);
    if (body.deliveryLocation !== undefined) updateData.deliveryLocation = body.deliveryLocation;
    if (body.requiredDeliveryDate !== undefined) updateData.requiredDeliveryDate = new Date(body.requiredDeliveryDate);
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.status === 'PUBLISHED') updateData.status = 'PUBLISHED';

    const updatedRFQ = await db.rFQ.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      rfq: updatedRFQ
    });

  } catch (error) {
    console.error('Error updating RFQ:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'appel d\'offre' },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard/buyer/rfqs/[id] - Delete RFQ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existingRFQ = await db.rFQ.findFirst({
      where: { id, buyerId: user.id }
    });

    if (!existingRFQ) {
      return NextResponse.json({ error: 'Appel d\'offre non trouvé' }, { status: 404 });
    }

    // Can only delete DRAFT or CANCELLED RFQs
    if (!['DRAFT', 'CANCELLED'].includes(existingRFQ.status)) {
      return NextResponse.json(
        { error: 'Seuls les brouillons et les AO annulés peuvent être supprimés' },
        { status: 400 }
      );
    }

    await db.rFQ.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Appel d\'offre supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting RFQ:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'appel d\'offre' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/buyer/rfqs/[id]/award - Award RFQ to supplier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { quotationId, action } = body; // action can be 'award', 'close', 'cancel'

    // Check ownership
    const existingRFQ = await db.rFQ.findFirst({
      where: { id, buyerId: user.id }
    });

    if (!existingRFQ) {
      return NextResponse.json({ error: 'Appel d\'offre non trouvé' }, { status: 404 });
    }

    switch (action) {
      case 'award':
        if (!quotationId) {
          return NextResponse.json({ error: 'ID du devis requis pour attribution' }, { status: 400 });
        }

        // Verify quotation belongs to this RFQ
        const quotation = await db.quotation.findFirst({
          where: { id: quotationId, rfqId: id }
        });

        if (!quotation) {
          return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 });
        }

        // Update RFQ status to AWARDED
        await db.rFQ.update({
          where: { id },
          data: { status: 'AWARDED' }
        });

        // Update accepted quotation status
        await db.quotation.update({
          where: { id: quotationId },
          data: { status: 'ACCEPTED' }
        });

        // Reject other quotations
        await db.quotation.updateMany({
          where: {
            rfqId: id,
            id: { not: quotationId }
          },
          data: { status: 'REJECTED' }
        });

        return NextResponse.json({
          success: true,
          message: 'Appel d\'offre attribué avec succès'
        });

      case 'close':
        if (!['PUBLISHED', 'QUOTATIONS_RECEIVED', 'NEGOTIATION'].includes(existingRFQ.status)) {
          return NextResponse.json({ error: 'Cet AO ne peut pas être fermé' }, { status: 400 });
        }

        await db.rFQ.update({
          where: { id },
          data: { status: 'CLOSED' }
        });

        return NextResponse.json({
          success: true,
          message: 'Appel d\'offre fermé avec succès'
        });

      case 'cancel':
        if (!['DRAFT', 'PUBLISHED', 'QUOTATIONS_RECEIVED'].includes(existingRFQ.status)) {
          return NextResponse.json({ error: 'Cet AO ne peut pas être annulé' }, { status: 400 });
        }

        await db.rFQ.update({
          where: { id },
          data: { status: 'CANCELLED' }
        });

        return NextResponse.json({
          success: true,
          message: 'Appel d\'offre annulé avec succès'
        });

      default:
        return NextResponse.json({ error: 'Action non valide' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error performing RFQ action:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'action sur l\'appel d\'offre' },
      { status: 500 }
    );
  }
}
