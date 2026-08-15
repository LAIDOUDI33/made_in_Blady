import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/inspection - Handle different GET endpoints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'services';

    if (type === 'services') {
      return await getInspectionServices(searchParams);
    } else if (type === 'bookings') {
      return await getBookings(searchParams);
    } else if (type === 'inspectors') {
      return await getInspectors(searchParams);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type parameter. Use: services, bookings, or inspectors' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in inspection API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Get inspection services
async function getInspectionServices(searchParams: URLSearchParams) {
  const category = searchParams.get('category');
  const isActive = searchParams.get('isActive');

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (isActive !== null) where.isActive = isActive === 'true' || isActive === null;

  const services = await db.inspectionService.findMany({
    where,
    include: {
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Group by category
  const groupedByCategory = services.reduce(
    (acc, service) => {
      const cat = service.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    },
    {} as Record<string, typeof services>
  );

  return NextResponse.json({
    success: true,
    data: {
      services,
      groupedByCategory,
      categories: Object.keys(groupedByCategory),
      summary: {
        totalServices: services.length,
        activeServices: services.filter((s) => s.isActive).length,
      },
    },
  });
}

// Get inspection bookings
async function getBookings(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const skip = (page - 1) * limit;
  const buyerId = searchParams.get('buyerId');
  const supplierCompanyId = searchParams.get('supplierCompanyId');
  const status = searchParams.get('status');
  const serviceId = searchParams.get('serviceId');

  const where: Record<string, unknown> = {};
  if (buyerId) where.buyerId = buyerId;
  if (supplierCompanyId) where.supplierCompanyId = supplierCompanyId;
  if (status) where.status = status;
  if (serviceId) where.serviceId = serviceId;

  const [bookings, total] = await Promise.all([
    db.inspectionBooking.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            basePrice: true,
            durationHours: true,
          },
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        supplierCompany: {
          select: {
            id: true,
            name: true,
            slug: true,
            wilaya: true,
            address: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            certifications: true,
          },
        },
        report: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.inspectionBooking.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    success: true,
    data: {
      bookings,
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
        statusBreakdown: await getStatusBreakdown(where),
      },
    },
  });
}

// Get available inspectors
async function getInspectors(searchParams: URLSearchParams) {
  const wilaya = searchParams.get('wilaya');
  const certification = searchParams.get('certification');

  const where: Record<string, unknown> = { isActive: true };
  if (wilaya) where.wilaya = wilaya;

  const inspectors = await db.inspector.findMany({
    where,
    include: {
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { rating: 'desc' },
  });

  // Filter by certification if specified
  let filteredInspectors = inspectors;
  if (certification) {
    filteredInspectors = inspectors.filter((inspector) =>
      inspector.certifications?.includes(certification)
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      inspectors: filteredInspectors,
      summary: {
        totalAvailable: filteredInspectors.length,
        averageRating:
          filteredInspectors.length > 0
            ? filteredInspectors.reduce((sum, i) => sum + (i.rating || 0), 0) /
              filteredInspectors.length
            : 0,
      },
    },
  });
}

// Helper to get status breakdown
async function getStatusBreakdown(where: Record<string, unknown>) {
  const statuses = ['PENDING', 'CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const breakdown: Record<string, number> = {};

  for (const status of statuses) {
    breakdown[status] = await db.inspectionBooking.count({
      where: { ...where, status },
    });
  }

  return breakdown;
}

// POST /api/inspection - Create booking or service
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'booking';

    if (type === 'booking') {
      return await createBooking(request);
    } else if (type === 'service') {
      return await createService(request);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type parameter. Use: booking or service' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in inspection POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}

// Create inspection booking
async function createBooking(request: NextRequest) {
  const body = await request.json();
  const {
    serviceId,
    buyerId,
    supplierCompanyId,
    productId,
    orderId,
    preferredDate,
    preferredTimeSlot,
    address,
    wilaya,
    commune,
    contactName,
    contactPhone,
    contactEmail,
    specialInstructions,
    quantity,
    productImages,
  } = body;

  // Validate required fields
  if (!serviceId || !buyerId || !preferredDate || !address) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required fields: serviceId, buyerId, preferredDate, address',
      },
      { status: 400 }
    );
  }

  // Check if service exists
  const service = await db.inspectionService.findUnique({
    where: { id: serviceId },
  });

  if (!service || !service.isActive) {
    return NextResponse.json(
      { success: false, error: 'Inspection service not found or inactive' },
      { status: 404 }
    );
  }

  // Check if buyer exists
  const buyer = await db.user.findUnique({
    where: { id: buyerId },
  });

  if (!buyer) {
    return NextResponse.json(
      { success: false, error: 'Buyer not found' },
      { status: 404 }
    );
  }

  // Validate preferred date is in the future
  const bookingDate = new Date(preferredDate);
  if (bookingDate <= new Date()) {
    return NextResponse.json(
      { success: false, error: 'Preferred date must be in the future' },
      { status: 400 }
    );
  }

  // Generate booking reference
  const bookingReference = `INS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  // Calculate price based on service and any add-ons
  let totalPrice = service.basePrice;
  // Add logic for quantity-based pricing if applicable

  // Create the booking
  const booking = await db.inspectionBooking.create({
    data: {
      bookingReference,
      serviceId,
      buyerId,
      supplierCompanyId: supplierCompanyId || null,
      productId: productId || null,
      orderId: orderId || null,
      preferredDate: bookingDate,
      preferredTimeSlot: preferredTimeSlot || null,
      address,
      wilaya: wilaya || null,
      commune: commune || null,
      contactName: contactName || `${buyer.firstName} ${buyer.lastName}`,
      contactPhone: contactPhone || buyer.phone,
      contactEmail: contactEmail || buyer.email,
      specialInstructions: specialInstructions || null,
      quantity: quantity || 1,
      productImages: productImages ? JSON.stringify(productImages) : null,
      totalPrice,
      currency: service.currency || 'DZD',
      status: 'PENDING',
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          category: true,
          basePrice: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: booking,
      message: 'Inspection booking created successfully',
    },
    { status: 201 }
  );
}

// Create inspection service (admin only)
async function createService(request: NextRequest) {
  const body = await request.json();
  const {
    name,
    description,
    category,
    basePrice,
    currency,
    durationHours,
    requirements,
    includesItems,
    excludesItems,
    sortOrder,
    isActive,
  } = body;

  // Validate required fields
  if (!name || !basePrice) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required fields: name, basePrice',
      },
      { status: 400 }
    );
  }

  const service = await db.inspectionService.create({
    data: {
      name,
      description: description || null,
      category: category || 'General',
      basePrice,
      currency: currency || 'DZD',
      durationHours: durationHours || null,
      requirements: requirements ? JSON.stringify(requirements) : null,
      includesItems: includesItems ? JSON.stringify(includesItems) : null,
      excludesItems: excludesItems ? JSON.stringify(excludesItems) : null,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: service,
      message: 'Inspection service created successfully',
    },
    { status: 201 }
  );
}

// PUT /api/inspection - Update booking or service
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'booking';
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required for update' },
        { status: 400 }
      );
    }

    if (type === 'booking') {
      // Convert date if present
      if (updateData.preferredDate) {
        updateData.preferredDate = new Date(updateData.preferredDate);
      }
      if (updateData.scheduledDate) {
        updateData.scheduledDate = new Date(updateData.scheduledDate);
      }
      if (updateData.completedAt) {
        updateData.completedAt = new Date(updateData.completedAt);
      }

      const updatedBooking = await db.inspectionBooking.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        data: updatedBooking,
        message: 'Booking updated successfully',
      });
    } else if (type === 'service') {
      // Stringify JSON fields if needed
      if (updateData.requirements && typeof updateData.requirements !== 'string') {
        updateData.requirements = JSON.stringify(updateData.requirements);
      }
      if (updateData.includesItems && typeof updateData.includesItems !== 'string') {
        updateData.includesItems = JSON.stringify(updateData.includesItems);
      }
      if (updateData.excludesItems && typeof updateData.excludesItems !== 'string') {
        updateData.excludesItems = JSON.stringify(updateData.excludesItems);
      }

      const updatedService = await db.inspectionService.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        data: updatedService,
        message: 'Service updated successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating inspection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}
