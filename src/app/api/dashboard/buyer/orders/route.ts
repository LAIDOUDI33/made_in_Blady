import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

// GET /api/dashboard/buyer/orders - Get buyer's orders
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { buyerId: user.id };
    
    if (status && status !== 'all') {
      where.status = status as OrderStatus;
    }

    // Get orders with related data
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              isVerified: true,
              rating: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.order.count({ where })
    ]);

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        supplier: order.company.name,
        supplierId: order.company.id,
        supplierSlug: order.company.slug,
        supplierLogo: order.company.logo,
        isVerified: order.company.isVerified,
        supplierRating: order.company.rating,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          product: item.product ? {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            image: item.product.images?.[0]?.url || null
          } : null
        })),
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        shippingCost: order.shippingCost,
        totalAmount: order.totalAmount,
        currency: order.currency,
        notes: order.notes,
        deliveryName: order.deliveryName,
        deliveryPhone: order.deliveryPhone,
        deliveryAddress: order.deliveryAddress,
        deliveryWilaya: order.deliveryWilaya,
        status: order.status,
        trackingNumber: (order as any).trackingNumber || null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total,
        active: orders.filter(o => ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length,
        completed: orders.filter(o => o.status === 'COMPLETED').length,
        cancelled: orders.filter(o => o.status === 'CANCELLED').length,
        totalSpent: orders.reduce((sum, o) => sum + o.totalAmount, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/buyer/orders - Create new order or reorder
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { action, orderId } = body;

    switch (action) {
      case 'reorder':
        if (!orderId) {
          return NextResponse.json({ error: 'ID de commande requis pour récommander' }, { status: 400 });
        }

        // Get original order
        const originalOrder = await db.order.findFirst({
          where: { id: orderId, buyerId: user.id },
          include: { items: true }
        });

        if (!originalOrder) {
          return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
        }

        // Generate new order number
        const orderCount = await db.order.count();
        const newOrderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, '0')}`;

        // Create new order with same items
        const newOrder = await db.order.create({
          data: {
            orderNumber: newOrderNumber,
            buyerId: user.id,
            companyId: originalOrder.companyId,
            subtotal: originalOrder.subtotal,
            taxAmount: originalOrder.taxAmount,
            shippingCost: originalOrder.shippingCost,
            totalAmount: originalOrder.totalAmount,
            currency: originalOrder.currency,
            deliveryName: originalOrder.deliveryName,
            deliveryPhone: originalOrder.deliveryPhone,
            deliveryAddress: originalOrder.deliveryAddress,
            deliveryWilaya: originalOrder.deliveryWilaya,
            status: 'PENDING',
            items: {
              create: originalOrder.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice
              }))
            }
          }
        });

        return NextResponse.json({
          success: true,
          order: {
            id: newOrder.id,
            orderNumber: newOrder.orderNumber,
            message: 'Commande recréée avec succès'
          }
        }, { status: 201 });

      case 'cancel':
        if (!orderId) {
          return NextResponse.json({ error: 'ID de commande requis' }, { status: 400 });
        }

        const orderToCancel = await db.order.findFirst({
          where: { id: orderId, buyerId: user.id }
        });

        if (!orderToCancel) {
          return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
        }

        // Can only cancel PENDING or CONFIRMED orders
        if (!['PENDING', 'CONFIRMED'].includes(orderToCancel.status)) {
          return NextResponse.json(
            { error: 'Cette commande ne peut plus être annulée' },
            { status: 400 }
          );
        }

        await db.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' }
        });

        return NextResponse.json({
          success: true,
          message: 'Commande annulée avec succès'
        });

      case 'confirm_delivery':
        if (!orderId) {
          return NextResponse.json({ error: 'ID de commande requis' }, { status: 400 });
        }

        const deliveredOrder = await db.order.findFirst({
          where: { id: orderId, buyerId: user.id, status: 'DELIVERED' }
        });

        if (!deliveredOrder) {
          return NextResponse.json(
            { error: 'Seules les commandes livrées peuvent être confirmées' },
            { status: 400 }
          );
        }

        await db.order.update({
          where: { id: orderId },
          data: { status: 'COMPLETED' }
        });

        return NextResponse.json({
          success: true,
          message: 'Réception confirmée avec succès'
        });

      default:
        return NextResponse.json({ error: 'Action non valide' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error performing order action:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'action sur la commande' },
      { status: 500 }
    );
  }
}
