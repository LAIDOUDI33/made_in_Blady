import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getCurrentUser } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { RFQStatus } from '@prisma/client';

// GET /api/dashboard/buyer/rfqs - Get buyer's RFQs
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user is a buyer
    if (user.role !== 'BUYER') {
      return NextResponse.json({ error: 'Accès réservé aux acheteurs' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { buyerId: user.id };
    
    if (status && status !== 'all') {
      where.status = status as RFQStatus;
    }

    // Get RFQs with counts
    const [rfqs, total] = await Promise.all([
      db.rFQ.findMany({
        where,
        include: {
          category: true,
          _count: {
            select: { quotations: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.rFQ.count({ where })
    ]);

    return NextResponse.json({
      rfqs: rfqs.map(rfq => ({
        id: rfq.id,
        title: rfq.title,
        description: rfq.description,
        quantity: rfq.quantity,
        unit: rfq.unit,
        targetPrice: rfq.targetPrice,
        targetCurrency: rfq.targetCurrency,
        category: rfq.category?.name,
        status: rfq.status,
        deliveryLocation: rfq.deliveryLocation,
        requiredDeliveryDate: rfq.requiredDeliveryDate?.toISOString(),
        expirationDate: rfq.expirationDate?.toISOString(),
        quotationsCount: rfq._count.quotations,
        createdAt: rfq.createdAt.toISOString(),
        updatedAt: rfq.updatedAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching RFQs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des appels d\'offre' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/buyer/rfqs - Create new RFQ
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (user.role !== 'BUYER') {
      return NextResponse.json({ error: 'Accès réservé aux acheteurs' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      categoryId,
      quantity,
      unit,
      targetPrice,
      targetCurrency = 'DZD',
      deliveryLocation,
      requiredDeliveryDate,
      expirationDays = 14,
      status = 'DRAFT'
    } = body;

    // Validate required fields
    if (!title || !description || !quantity || !unit || !deliveryLocation || !requiredDeliveryDate) {
      return NextResponse.json(
        { error: 'Les champs obligatoires sont manquants' },
        { status: 400 }
      );
    }

    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(expirationDays));

    // Create RFQ
    const rfq = await db.rFQ.create({
      data: {
        title,
        description,
        quantity: parseInt(quantity),
        unit,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        targetCurrency,
        deliveryLocation,
        requiredDeliveryDate: new Date(requiredDeliveryDate),
        expirationDate,
        status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        buyerId: user.id,
        categoryId: categoryId || null
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({
      success: true,
      rfq: {
        id: rfq.id,
        title: rfq.title,
        status: rfq.status,
        createdAt: rfq.createdAt.toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating RFQ:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'appel d\'offre' },
      { status: 500 }
    );
  }
}
