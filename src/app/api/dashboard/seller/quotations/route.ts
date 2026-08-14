import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper to get authenticated user's company
async function getAuthenticatedCompany() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { 
      error: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ), 
      company: null 
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { company: true }
  });

  if (!user?.company) {
    return { 
      error: NextResponse.json(
        { success: false, error: 'No company associated with this account' },
        { status: 403 }
      ), 
      company: null 
    };
  }

  return { error: null, company: user.company };
}

// GET /api/dashboard/seller/quotations - List quotations for current supplier (authenticated)
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedCompany();
  if (auth.error) return auth.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const companyId = auth.company!.id;
    const where: Record<string, unknown> = { companyId };
    
    if (status && status !== 'all') {
      where.status = status;
    }

    const [quotations, total] = await Promise.all([
      db.quotation.findMany({
        where,
        include: {
          rfq: {
            select: {
              id: true,
              title: true,
              quantity: true,
              unit: true,
              buyer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            },
          },
          items: true,
          _count: {
            select: {}
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.quotation.count({ where }),
    ]);

    // Transform data for frontend
    const transformedQuotations = quotations.map((q) => ({
      ...q,
      buyerName: q.rfq.buyer 
        ? `${q.rfq.buyer.firstName} ${q.rfq.buyer.lastName}` 
        : 'Acheteur inconnu',
      rfqTitle: q.rfq.title,
      itemsCount: q.items.length,
    }));

    return NextResponse.json({
      success: true,
      data: transformedQuotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des devis' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/seller/quotations - Create new quotation (authenticated)
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedCompany();
  if (auth.error) return auth.error;
  
  try {
    const body = await request.json();
    
    const {
      rfqId,
      items = [],
      notes,
      validUntil,
      taxRate = 19,
      currency = 'DZD',
      status = 'DRAFT',
    } = body;

    // Validate required fields
    if (!rfqId || !items.length) {
      return NextResponse.json(
        { success: false, error: "L'ID de l'appel d'offres et les articles sont obligatoires" },
        { status: 400 }
      );
    }

    // Validate RFQ exists
    const rfq = await db.rFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      return NextResponse.json(
        { success: false, error: "Appel d'offres introuvable" },
        { status: 404 }
      );
    }

    // Calculate total price
    const totalPrice = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const companyId = auth.company!.id;

    // Create quotation with items in transaction
    const quotation = await db.$transaction(async (tx) => {
      const newQuotation = await tx.quotation.create({
        data: {
          rfqId,
          companyId,
          totalPrice,
          currency,
          notes: notes || null,
          validUntil: validUntil ? new Date(validUntil) : null,
          status,
        },
      });

      // Create quotation items
      if (items.length > 0) {
        await tx.quotationItem.createMany({
          data: items.map((item: { productName: string; quantity: number; unitPrice: number; unit?: string }) => ({
            quotationId: newQuotation.id,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            unit: item.unit || null,
          })),
        });
      }

      return newQuotation;
    });

    // If status is SENT, update RFQ status
    if (status === 'SENT') {
      await db.rFQ.update({
        where: { id: rfqId },
        data: { status: 'QUOTATIONS_RECEIVED' },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.company!.userId,
        action: 'CREATE_QUOTATION',
        resource: 'quotation',
        resourceId: quotation.id,
        oldValue: null,
        newValue: JSON.stringify({ rfqId, companyId, totalPrice }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      }
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        data: quotation,
        message: status === 'SENT' ? 'Devis envoyé avec succès' : 'Devis sauvegardé en brouillon',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du devis' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/seller/quotations - Update quotation (authenticated)
export async function PUT(request: NextRequest) {
  const auth = await getAuthenticatedCompany();
  if (auth.error) return auth.error;
  
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID du devis requis' },
        { status: 400 }
      );
    }

    // Check if quotation belongs to this supplier's company
    const existingQuotation = await db.quotation.findFirst({
      where: { id, companyId: auth.company!.id },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { success: false, error: 'Devis introuvable ou non autorisé' },
        { status: 404 }
      );
    }

    // Only allow updates on DRAFT or SENT quotations
    if (!['DRAFT', 'SENT'].includes(existingQuotation.status)) {
      return NextResponse.json(
        { success: false, error: 'Ce devis ne peut plus être modifié' },
        { status: 400 }
      );
    }

    const updatedQuotation = await db.quotation.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.company!.userId,
        action: 'UPDATE_QUOTATION',
        resource: 'quotation',
        resourceId: id,
        oldValue: JSON.stringify(existingQuotation),
        newValue: JSON.stringify(updateData),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: updatedQuotation,
      message: 'Devis mis à jour avec succès',
    });
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du devis' },
      { status: 500 }
    );
  }
}
