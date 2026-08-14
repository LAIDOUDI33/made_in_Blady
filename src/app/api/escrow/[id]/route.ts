import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EscrowStatus, DisputeStatus, DisputeReason } from '@prisma/client';

// POST /api/escrow/[id]/fund - Fund escrow account
export async function fundEscrow(escrowId: string) {
  const escrow = await db.escrowAccount.findUnique({
    where: { id: escrowId }
  });

  if (!escrow) {
    return { success: false, error: 'Escrow account not found', status: 404 };
  }

  if (escrow.status !== EscrowStatus.PENDING && escrow.status !== EscrowStatus.FUNDED) {
    return { success: false, error: 'Escrow cannot be funded in current status', status: 400 };
  }

  const updated = await db.escrowAccount.update({
    where: { id: escrowId },
    data: {
      status: EscrowStatus.FUNDED,
      fundedAt: new Date(),
      inEscrowAt: new Date()
    }
  });

  return { success: true, data: updated };
}

// POST /api/escrow/[id]/release - Release funds to supplier
export async function releaseEscrow(escrowId: string, releasedBy?: string) {
  const escrow = await db.escrowAccount.findUnique({
    where: { id: escrowId }
  });

  if (!escrow) {
    return { success: false, error: 'Escrow account not found', status: 404 };
  }

  if (escrow.status !== EscrowStatus.IN_ESCROW && escrow.status !== EscrowStatus.FUNDED) {
    return { success: false, error: 'Funds cannot be released in current status', status: 400 };
  }

  const updated = await db.escrowAccount.update({
    where: { id: escrowId },
    data: {
      status: EscrowStatus.RELEASED,
      releasedAmount: escrow.amount - escrow.feeAmount,
      releaseRequestedAt: new Date(),
      releasedAt: new Date()
    }
  });

  // Update order status to processing/completed
  await db.order.update({
    where: { id: escrow.orderId },
    data: { status: 'PROCESSING' as any }
  });

  return { success: true, data: updated };
}

// POST /api/escrow/[id]/refund - Initiate refund
export async function refundEscrow(
  escrowId: string, 
  type: 'full' | 'partial' = 'full',
  amount?: number
) {
  const escrow = await db.escrowAccount.findUnique({
    where: { id: escrowId }
  });

  if (!escrow) {
    return { success: false, error: 'Escrow account not found', status: 404 };
  }

  if (escrow.status === EscrowStatus.REFUNDED || escrow.status === EscrowStatus.RELEASED) {
    return { success: false, error: 'Cannot refund in current status', status: 400 };
  }

  const refundAmount = type === 'partial' ? (amount || 0) : escrow.amount;
  
  const updated = await db.escrowAccount.update({
    where: { id: escrowId },
    data: {
      status: type === 'partial' ? EscrowStatus.PARTIAL_REFUND : EscrowStatus.REFUNDED,
      refundedAmount: refundAmount,
      refundRequestedAt: new Date(),
      refundedAt: new Date()
    }
  });

  // If full refund, cancel order
  if (type === 'full') {
    await db.order.update({
      where: { id: escrow.orderId },
      data: { status: 'CANCELLED' as any }
    });
  }

  return { success: true, data: updated };
}

// POST /api/escrow/[id]/dispute - Open dispute
export async function openDispute(
  escrowId: string,
  disputeData: {
    title: string;
    description: string;
    reason: DisputeReason;
    openedBy: string;
    evidence?: any[];
    requestedAmount?: number;
  }
) {
  const escrow = await db.escrowAccount.findUnique({
    where: { id: escrowId }
  });

  if (!escrow) {
    return { success: false, error: 'Escrow account not found', status: 404 };
  }

  if (escrow.dispute) {
    return { success: false, error: 'Dispute already exists for this escrow', status: 409 };
  }

  // Update escrow status to disputed
  await db.escrowAccount.update({
    where: { id: escrowId },
    data: { status: EscrowStatus.DISPUTED }
  });

  // Create dispute
  const dispute = await db.dispute.create({
    data: {
      escrowId,
      title: disputeData.title,
      description: disputeData.description,
      reason: disputeData.reason,
      openedBy: disputeData.openedBy,
      buyerId: escrow.buyerId,
      supplierCompanyId: escrow.supplierCompanyId,
      requestedAmount: disputeData.requestedAmount,
      evidence: disputeData.evidence ? JSON.stringify(disputeData.evidence) : null,
      responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: DisputeStatus.OPEN
    }
  });

  return { success: true, data: dispute };
}

// Main handler for all escrow actions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'fund':
        result = await fundEscrow(id);
        break;
      
      case 'release':
        result = await releaseEscrow(id, body.releasedBy);
        break;
      
      case 'refund':
        result = await refundEscrow(id, body.refundType, body.amount);
        break;
      
      case 'dispute':
        result = await openDispute(id, body);
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result, { status: result.status || 200 });

  } catch (error) {
    console.error('Error performing escrow action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform escrow action' },
      { status: 500 }
    );
  }
}

// GET /api/escrow/[id] - Get escrow details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const escrow = await db.escrowAccount.findUnique({
      where: { id },
      include: {
        dispute: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        },
        order: {
          include: {
            items: true,
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true
              }
            }
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

  } catch (error) {
    console.error('Error fetching escrow details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch escrow details' },
      { status: 500 }
    );
  }
}
