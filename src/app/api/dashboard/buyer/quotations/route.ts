import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { QuotationStatus } from '@prisma/client';

// GET /api/dashboard/buyer/quotations - Get buyer's received quotations
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (user.role !== 'BUYER') {
      return NextResponse.json({ error: 'Accès réservé aux acheteurs' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const rfqId = searchParams.get('rfqId');
    const isRead = searchParams.get('isRead');
    const sortBy = searchParams.get('sortBy') || 'date'; // price, date, rating
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause for RFQs belonging to this buyer
    const rfqWhere: any = { buyerId: user.id };
    
    // Get RFQ IDs for this buyer
    const buyerRFQs = await db.rFQ.findMany({
      where: rfqWhere,
      select: { id: true }
    });
    const buyerRFQIds = buyerRFQs.map(r => r.id);

    // Build quotation where clause
    const where: any = {
      rfqId: { in: buyerRFQIds }
    };

    if (status && status !== 'all') {
      where.status = status as QuotationStatus;
    }
    
    if (supplierId) {
      where.companyId = supplierId;
    }
    
    if (rfqId) {
      where.rfqId = rfqId;
    }

    // Build order by clause
    let orderBy: any = { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
    
    switch (sortBy) {
      case 'price':
        orderBy = { totalPrice: sortOrder === 'asc' ? 'asc' : 'desc' };
        break;
      case 'rating':
        orderBy = { company: { rating: sortOrder === 'asc' ? 'asc' : 'desc' } };
        break;
      default:
        orderBy = { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
    }

    // Get quotations with related data
    const [quotations, total] = await Promise.all([
      db.quotation.findMany({
        where,
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
          rfq: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          items: true
        },
        orderBy,
        skip,
        take: limit
      }),
      db.quotation.count({ where })
    ]);

    return NextResponse.json({
      quotations: quotations.map(q => ({
        id: q.id,
        rfqId: q.rfqId,
        rfqTitle: q.rfq.title,
        rfqStatus: q.rfq.status,
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
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total,
        unread: 0, // Would need a read tracking system
        pending: quotations.filter(q => ['SENT', 'VIEWED'].includes(q.status)).length,
        accepted: quotations.filter(q => q.status === 'ACCEPTED').length
      }
    });

  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des devis' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/buyer/quotations - Bulk actions on quotations
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { quotationIds, action } = body; // action: mark_read, archive

    if (!quotationIds || !Array.isArray(quotationIds)) {
      return NextResponse.json({ error: 'IDs des devis requis' }, { status: 400 });
    }

    switch (action) {
      case 'mark_read':
        // In a real app, you would have a QuotationView table to track reads
        console.log('Marking as read:', quotationIds);
        break;

      case 'archive':
        // In a real app, you would set an archived flag
        console.log('Archiving:', quotationIds);
        break;

      default:
        return NextResponse.json({ error: 'Action non valide' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${quotationIds.length} devis mis à jour`
    });

  } catch (error) {
    console.error('Error updating quotations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des devis' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/buyer/quotations/[id]/action - Single quotation actions
// This would be in a separate [id] route file, but we can handle it here too
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { quotationId, action } = body; // accept, reject, negotiate

    if (!quotationId) {
      return NextResponse.json({ error: 'ID du devis requis' }, { status: 400 });
    }

    // Verify quotation belongs to buyer's RFQ
    const quotation = await db.quotation.findFirst({
      where: { id: quotationId },
      include: {
        rfq: {
          select: { buyerId: true, status: true }
        }
      }
    });

    if (!quotation || quotation.rfq.buyerId !== user.id) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 });
    }

    switch (action) {
      case 'accept':
        await db.quotation.update({
          where: { id: quotationId },
          data: { status: 'ACCEPTED' }
        });
        
        // Optionally award the RFQ
        await db.rFQ.update({
          where: { id: quotation.rfqId },
          data: { status: 'AWARDED' }
        });
        
        return NextResponse.json({ success: true, message: 'Devis accepté' });

      case 'reject':
        await db.quotation.update({
          where: { id: quotationId },
          data: { status: 'REJECTED' }
        });
        return NextResponse.json({ success: true, message: 'Devis rejeté' });

      default:
        return NextResponse.json({ error: 'Action non valide' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error performing quotation action:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'action sur le devis' },
      { status: 500 }
    );
  }
}
