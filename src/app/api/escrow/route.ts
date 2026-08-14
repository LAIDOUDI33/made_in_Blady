import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EscrowStatus, DisputeStatus, DisputeReason } from '@prisma/client';

// GET /api/escrow - List escrow accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const buyerId = searchParams.get('buyerId');
    const status = searchParams.get('status') as EscrowStatus | null;

    if (orderId) {
      const escrow = await db.escrowAccount.findUnique({
        where: { orderId },
        include: {
          dispute: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              currency: true,
              status: true,
              createdAt: true
            }
          }
        }
      });

      if (!escrow) {
        return NextResponse.json(
          { success: false, error: 'Escrow account not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: escrow });
    }

    // List escrows with filters
    const where: any = {};
    if (buyerId) where.buyerId = buyerId;
    if (status) where.status = status;

    const escrows = await db.escrowAccount.findMany({
      where,
      include: {
        dispute: {
          include: {
            messages: {
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            currency: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ success: true, data: escrows });

  } catch (error) {
    console.error('Error fetching escrow accounts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch escrow accounts' },
      { status: 500 }
    );
  }
}

// POST /api/escrow - Create escrow account for order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      buyerId,
      amount,
      paymentMethod,
      paymentReference
    } = body;

    if (!orderId || !buyerId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, buyerId, amount' },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to buyer
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { company: true }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.buyerId !== buyerId) {
      return NextResponse.json(
        { success: false, error: 'Order does not belong to this buyer' },
        { status: 403 }
      );
    }

    // Check if escrow already exists for this order
    const existingEscrow = await db.escrowAccount.findUnique({
      where: { orderId }
    });

    if (existingEscrow) {
      return NextResponse.json(
        { success: false, error: 'Escrow account already exists for this order' },
        { status: 409 }
      );
    }

    // Calculate platform fee (e.g., 2%)
    const feeRate = 0.02;
    const feeAmount = amount * feeRate;

    // Generate unique account ID
    const accountId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create escrow account
    const escrow = await db.escrowAccount.create({
      data: {
        accountId,
        orderId,
        buyerId,
        supplierCompanyId: order.companyId,
        amount,
        feeAmount,
        status: EscrowStatus.PENDING,
        paymentMethod,
        paymentReference,
        autoReleaseDays: 30 // Default 30 days
      }
    });

    return NextResponse.json({
      success: true,
      data: escrow,
      message: 'Escrow account created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating escrow account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create escrow account' },
      { status: 500 }
    );
  }
}
