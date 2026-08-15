import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Valid shipment statuses
const VALID_STATUSES = [
  'PENDING',
  'PROCESSING',
  'READY_FOR_PICKUP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELIVERY_ATTEMPTED',
  'EXCEPTION',
  'RETURNED',
  'CANCELLED',
];

// Valid Incoterms
const VALID_INCOTERMS = [
  'EXW', // Ex Works
  'FCA', // Free Carrier
  'CPT', // Carriage Paid To
  'CIP', // Carriage and Insurance Paid
  'DAP', // Delivered at Place
  'DPU', // Delivered at Place Unloaded
  'DDP', // Delivered Duty Paid
  'FAS', // Free Alongside Ship
  'FOB', // Free on Board
  'CFR', // Cost and Freight
  'CIF', // Cost Insurance Freight
];

// Authentication helper for shipment endpoints
async function authenticateShipmentRequest(request: NextRequest) {
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

// GET /api/shipments?orderId=xxx - List shipments with filters (authenticated)
export async function GET(request: NextRequest) {
  // Authenticate
  const auth = await authenticateShipmentRequest(request);
  if (auth.error) return auth.error;
  
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;
    
    // Filters
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const trackingNumber = searchParams.get('trackingNumber');
    const shippingMethod = searchParams.get('shippingMethod');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause - restrict to user's shipments unless admin
    const isAdmin = auth.user!.role === UserRole.ADMIN || auth.user!.role === UserRole.SUPER_ADMIN;
    const where: Record<string, unknown> = {};

    if (!isAdmin) {
      // Non-admin users can only see their own shipments (as buyer or supplier)
      where.OR = [
        { buyerId: auth.user!.id },
        { supplierCompanyId: auth.user!.companyId || 'no-company' }
      ];
    }

    if (orderId) where.orderId = orderId;
    if (status && VALID_STATUSES.includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }
    if (trackingNumber) {
      where.trackingNumber = { contains: trackingNumber, mode: 'insensitive' };
    }
    if (shippingMethod) where.shippingMethod = shippingMethod;

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.createdAt as Record<string,unknown>).lte = new Date(dateTo);
      }
    }

    // Fetch shipments
    const [shipments, total] = await Promise.all([
      db.shipment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              currency: true,
              status: true,
              createdAt: true,
            },
          },
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          supplierCompany: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          shippingRate: {
            select: {
              id: true,
              method: true,
              carrierName: true,
              estimatedDaysMin: true,
              estimatedDaysMax: true,
            },
          },
          trackingEvents: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
          _count: {
            select: { trackingEvents: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.shipment.count({ where }),
    ]);

    // Enrich shipments with computed data
    const enrichedShipments = shipments.map((shipment) => {
      const now = new Date();
      const estimatedDelivery = shipment.estimatedDelivery
        ? new Date(shipment.estimatedDelivery)
        : null;

      return {
        ...shipment,
        computed: {
          daysInTransit: Math.floor(
            (now.getTime() - shipment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
          isOverdue:
            estimatedDelivery && now > estimatedDelivery && !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(shipment.status),
          estimatedDaysRemaining:
            estimatedDelivery && !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(shipment.status)
              ? Math.ceil((estimatedDelivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              : null,
          latestEvent: shipment.trackingEvents[0] || null,
        },
      };
    });

    // Get status breakdown for stats
    const statusBreakdown = await getStatusBreakdown(where);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        shipments: enrichedShipments,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        stats: {
          totalCount: total,
          statusBreakdown,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}

// POST /api/shipments - Create shipment (authenticated)
export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await authenticateShipmentRequest(request);
  if (auth.error) return auth.error;
  
  try {
    const body = await request.json();
    const {
      orderId,
      shippingMethod,
      shippingRateId,
      originAddress,
      destinationAddress,
      incoterm,
      weight,
      dimensions,
      packageCount,
      declaredValue,
      specialInstructions,
      pickupDate,
      preferredDeliveryDate,
      insuranceIncluded,
      signatureRequired,
    } = body;

    // Validate required fields
    if (!orderId || !shippingMethod || !originAddress || !destinationAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: orderId, shippingMethod, originAddress, destinationAddress',
        },
        { status: 400 }
      );
    }

    // Check if order exists and user has access
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        company: true,
        buyer: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify user is authorized (buyer or supplier company)
    const isAdmin = auth.user!.role === UserRole.ADMIN || auth.user!.role === UserRole.SUPER_ADMIN;
    const isBuyer = order.buyerId === auth.user!.id;
    const isSupplier = order.companyId === auth.user!.companyId;
    
    if (!isAdmin && !isBuyer && !isSupplier) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only create shipments for your own orders' },
        { status: 403 }
      );
    }

    // Check if shipment already exists for this order
    const existingShipment = await db.shipment.findUnique({
      where: { orderId },
    });

    if (existingShipment) {
      return NextResponse.json(
        { success: false, error: 'A shipment already exists for this order' },
        { status: 409 }
      );
    }

    // Validate incoterm if provided
    if (incoterm && !VALID_INCOTERMS.includes(incoterm)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid incoterm. Must be one of: ${VALID_INCOTERMS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Get shipping rate details if provided
    let rateDetails = null;
    let shippingCost = 0;

    if (shippingRateId) {
      rateDetails = await db.shippingRate.findUnique({
        where: { id: shippingRateId },
      });

      if (!rateDetails) {
        return NextResponse.json(
          { success: false, error: 'Shipping rate not found' },
          { status: 404 }
        );
      }

      // Calculate shipping cost based on rate
      shippingCost = rateDetails.basePrice;
      if (weight && rateDetails.weightPrice) {
        shippingCost += weight * rateDetails.weightPrice;
      }
    }

    // Generate tracking number
    const trackingNumber = generateTrackingNumber(shippingMethod);

    // Calculate estimated delivery date
    const estimatedDelivery = calculateEstimatedDelivery(
      rateDetails?.estimatedDaysMin ?? 3,
      rateDetails?.estimatedDaysMax ?? 7
    );

    // Create shipment in a transaction
    const shipment = await db.$transaction(async (tx) => {
      // Create the shipment
      const newShipment = await tx.shipment.create({
        data: {
          orderId,
          buyerId: order.buyerId, // Use order's buyer ID, not from request body
          supplierCompanyId: order.companyId, // Use order's company ID
          shippingMethod,
          shippingRateId: shippingRateId || null,
          trackingNumber,
          originAddress: typeof originAddress === 'string' ? originAddress : JSON.stringify(originAddress),
          destinationAddress: typeof destinationAddress === 'string' ? destinationAddress : JSON.stringify(destinationAddress),
          incoterm: incoterm || 'DAP',
          weight: weight || null,
          dimensions: dimensions ? JSON.stringify(dimensions) : null,
          packageCount: packageCount || 1,
          declaredValue: declaredValue || order.totalAmount,
          shippingCost,
          currency: order.currency || 'DZD',
          specialInstructions: specialInstructions || null,
          pickupDate: pickupDate ? new Date(pickupDate) : null,
          preferredDeliveryDate: preferredDeliveryDate ? new Date(preferredDeliveryDate) : null,
          estimatedDelivery,
          insuranceIncluded: insuranceIncluded ?? false,
          signatureRequired: signatureRequired ?? true,
          status: 'PENDING',
        },
      });

      // Create initial tracking event
      await tx.trackingEvent.create({
        data: {
          shipmentId: newShipment.id,
          status: 'PENDING',
          description: 'Shipment created. Awaiting processing.',
          location: typeof originAddress === 'string' ? originAddress : originAddress?.address || 'Origin facility',
          timestamp: new Date(),
        },
      });

      return newShipment;
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.user!.id,
        action: 'CREATE_SHIPMENT',
        resource: 'shipment',
        resourceId: shipment.id,
        oldValue: null,
        newValue: JSON.stringify({ 
          orderId, 
          trackingNumber,
          createdBy: auth.user!.id 
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      }
    }).catch(() => {}); // Don't fail if audit logging fails

    // Fetch full shipment with relations
    const fullShipment = await db.shipment.findUnique({
      where: { id: shipment.id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
          },
        },
        shippingRate: {
          select: {
            method: true,
            carrierName: true,
          },
        },
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: fullShipment,
        message: 'Shipment created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}

// PUT /api/shipments - Update shipment status or details (authenticated, admin/supplier only)
export async function PUT(request: NextRequest) {
  // Authenticate
  const auth = await authenticateShipmentRequest(request);
  if (auth.error) return auth.error;
  
  try {
    const body = await request.json();
    const { id, status, trackingInfo, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Shipment ID is required' },
        { status: 400 }
      );
    }

    // Check if shipment exists
    const existingShipment = await db.shipment.findUnique({
      where: { id },
    });

    if (!existingShipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Authorization check - only admin or supplier company can update
    const isAdmin = auth.user!.role === UserRole.ADMIN || auth.user!.role === UserRole.SUPER_ADMIN;
    const isSupplier = existingShipment.supplierCompanyId === auth.user!.companyId;
    
    if (!isAdmin && !isSupplier) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only suppliers or admins can update shipments' },
        { status: 403 }
      );
    }

    // If updating status, validate and add tracking event
    if (status) {
      const upperStatus = status.toUpperCase();
      if (!VALID_STATUSES.includes(upperStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          },
          { status: 400 }
        );
      }

      updateData.status = upperStatus;

      // Add timestamps based on status
      switch (upperStatus) {
        case 'IN_TRANSIT':
          updateData.shippedAt = new Date();
          break;
        case 'DELIVERED':
          updateData.deliveredAt = new Date();
          break;
        case 'RETURNED':
          updateData.returnedAt = new Date();
          break;
      }

      // Create tracking event if info provided
      if (trackingInfo) {
        await db.trackingEvent.create({
          data: {
            shipmentId: id,
            status: upperStatus,
            description: trackingInfo.description || `Status updated to ${upperStatus}`,
            location: trackingInfo.location || '',
            timestamp: new Date(),
            metadata: trackingInfo.metadata ? JSON.stringify(trackingInfo.metadata) : null,
          },
        });
      }
    }

    // Stringify JSON fields if needed
    if (updateData.originAddress && typeof updateData.originAddress !== 'string') {
      updateData.originAddress = JSON.stringify(updateData.originAddress);
    }
    if (updateData.destinationAddress && typeof updateData.destinationAddress !== 'string') {
      updateData.destinationAddress = JSON.stringify(updateData.destinationAddress);
    }
    if (updateData.dimensions && typeof updateData.dimensions !== 'string') {
      updateData.dimensions = JSON.stringify(updateData.dimensions);
    }

    // Convert dates if present
    const dateFields = ['pickupDate', 'preferredDeliveryDate', 'estimatedDelivery', 'shippedAt', 'deliveredAt', 'returnedAt'];
    for (const field of dateFields) {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    }

    // Update shipment
    const updatedShipment = await db.shipment.update({
      where: { id },
      data: updateData,
    });

    // Audit log for status changes
    if (status) {
      await db.auditLog.create({
        data: {
          userId: auth.user!.id,
          action: 'UPDATE_SHIPMENT_STATUS',
          resource: 'shipment',
          resourceId: id,
          oldValue: JSON.stringify({ status: existingShipment.status }),
          newValue: JSON.stringify({ status }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        }
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: updatedShipment,
      message: 'Shipment updated successfully',
    });
  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update shipment' },
      { status: 500 }
    );
  }
}

// Helper functions

function generateTrackingNumber(method: string): string {
  const prefix = method.substring(0, 2).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DZ${prefix}${timestamp}${random}`;
}

function calculateEstimatedDelivery(minDays: number, maxDays: number): Date {
  // Use average of min and max, plus buffer
  const avgDays = Math.round((minDays + maxDays) / 2);
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + avgDays);
  return deliveryDate;
}

async function getStatusBreakdown(where: Record<string, unknown>): Promise<Record<string, number>> {
  const breakdown: Record<string, number> = {};

  for (const status of VALID_STATUSES) {
    breakdown[status] = await db.shipment.count({
      where: { ...where, status },
    });
  }

  return breakdown;
}
