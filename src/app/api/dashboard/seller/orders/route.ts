import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/dashboard/seller/orders - List orders for current supplier
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    // In production, get company ID from auth session
    const companyId = 'mock-company-id';

    const where: Record<string, unknown> = { companyId };
    
    if (status && status !== 'all') {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    // Transform data for frontend
    const transformedOrders = orders.map((order) => ({
      ...order,
      buyerName: `${order.buyer.firstName} ${order.buyer.lastName}`,
      itemsCount: order.items.length,
    }));

    return NextResponse.json({
      success: true,
      data: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    );
  }
}

// PATCH /api/dashboard/seller/orders - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'ID et statut requis' },
        { status: 400 }
      );
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: ['COMPLETED'],
      CANCELLED: [],
      COMPLETED: [],
    };

    // Get current order
    const currentOrder = await db.order.findUnique({
      where: { id },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // Check if this supplier owns the order
    if (currentOrder.companyId !== 'mock-company-id') { // In production, use auth session
      return NextResponse.json(
        { success: false, error: 'Non autorisé à modifier cette commande' },
        { status: 403 }
      );
    }

    // Check valid transition
    const allowedTransitions = validTransitions[currentOrder.status] || [];
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Transition non autorisée de ${currentOrder.status} vers ${status}`,
          allowedTransitions 
        },
        { status: 400 }
      );
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `Statut de la commande mis à jour: ${status}`,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}
