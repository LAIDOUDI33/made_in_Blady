import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EscrowStatus, DisputeStatus, DisputeReason } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Authentication helper for escrow endpoints
async function authenticateRequest(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { 
      error: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ), 
      user: null 
    };
  }
  
  return { error: null, user: session.user };
}

// GET /api/escrow - List escrow accounts (authenticated)
export async function GET(request: NextRequest) {
  // Authenticate
  const auth = await authenticateRequest(request);
  if (auth.error) return auth.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status') as EscrowStatus | null;

    // Regular users can only see their own escrows
    // Admins/SuperAdmins can see all
    const isAdmin = auth.user!.role === UserRole.ADMIN || auth.user!.role === UserRole.SUPER_ADMIN;
    
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
              buyerId: true,
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

      // Non-admin users can only view their own escrows
      if (!isAdmin && escrow.order.buyerId !== auth.user!.id && escrow.supplierCompanyId !== auth.user!.companyId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You can only view your own escrow accounts' },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, data: escrow });
    }

    // List escrows with filters - restrict to user's own for non-admin
    const where: any = {};
    
    if (!isAdmin) {
      // Users can see escrows where they are buyer or their company is supplier
      where.OR = [
        { buyerId: auth.user!.id },
        { supplierCompanyId: auth.user!.companyId || 'no-company' }
      ];
    }
    
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

// POST /api/escrow - Create escrow account for order (authenticated, buyer only)
export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await authenticateRequest(request);
  if (auth.error) return auth.error;
  
  try {
    const body = await request.json();
    const {
      orderId,
      amount,
      paymentMethod,
      paymentReference
    } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, amount' },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to authenticated buyer
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

    // Verify the authenticated user is the buyer
    if (order.buyerId !== auth.user!.id) {
      // Log unauthorized attempt
      await db.securityEvent.create({
        data: {
          eventType: 'UNAUTHORIZED_ESCROW_ACCESS',
          severity: 'HIGH',
          description: `User ${auth.user!.id} attempted to create escrow for order belonging to ${order.buyerId}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userId: auth.user!.id,
        }
      }).catch(() => {}); // Don't fail if logging fails
      
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only create escrow accounts for your own orders' },
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
        buyerId: auth.user!.id, // Use authenticated user's ID, not from request body
        supplierCompanyId: order.companyId,
        amount,
        feeAmount,
        status: EscrowStatus.PENDING,
        paymentMethod,
        paymentReference,
        autoReleaseDays: 30 // Default 30 days
      }
    });

    // Audit log for financial transaction
    await db.auditLog.create({
      data: {
        userId: auth.user!.id,
        action: 'CREATE_ESCROW',
        resource: 'escrow',
        resourceId: escrow.id,
        oldValue: null,
        newValue: JSON.stringify({ 
          orderId, 
          amount, 
          accountId,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
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
