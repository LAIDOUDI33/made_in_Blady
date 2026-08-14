import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/exhibitions - List exhibitions with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const skip = (page - 1) * limit;
    
    // Filters
    const status = searchParams.get('status'); // upcoming, ongoing, past, all
    const type = searchParams.get('type'); // virtual, physical, hybrid
    const search = searchParams.get('search');
    const wilaya = searchParams.get('wilaya');
    const featured = searchParams.get('featured');

    // Build where clause
    const where: Record<string, unknown> = {};
    const now = new Date();

    // Status filter
    if (status === 'upcoming') {
      where.startDate = { gt: now };
      where.isActive = true;
    } else if (status === 'ongoing') {
      where.startDate = { lte: now };
      where.endDate = { gte: now };
      where.isActive = true;
    } else if (status === 'past') {
      where.endDate = { lt: now };
    } else if (status !== 'all') {
      where.isActive = true;
    }

    // Type filter
    if (type && ['virtual', 'physical', 'hybrid'].includes(type)) {
      where.type = type.toUpperCase();
    }

    // Featured filter
    if (featured === 'true') {
      where.isFeatured = true;
    }

    // Search filter
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Wilaya/Location filter
    if (wilaya) {
      where.wilaya = wilaya;
    }

    // Fetch exhibitions
    const [exhibitions, total] = await Promise.all([
      db.exhibition.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              logo: true,
              isVerified: true,
            },
          },
          exhibitors: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logo: true,
                },
              },
            },
            take: 10,
          },
          _count: {
            select: {
              exhibitors: true,
              registrations: true,
            },
          },
        },
        orderBy:
          status === 'past'
            ? { startDate: 'desc' }
            : [{ isFeatured: 'desc' }, { startDate: 'asc' }],
        skip,
        take: limit,
      }),
      db.exhibition.count({ where }),
    ]);

    // Calculate additional info for each exhibition
    const enrichedExhibitions = exhibitions.map((ex) => {
      const startDate = new Date(ex.startDate);
      const endDate = new Date(ex.endDate);
      const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let currentStatus: string;
      if (now < startDate) {
        currentStatus = 'upcoming';
      } else if (now >= startDate && now <= endDate) {
        currentStatus = 'ongoing';
      } else {
        currentStatus = 'ended';
      }

      return {
        ...ex,
        computedStatus: currentStatus,
        daysUntilStart: daysUntilStart > 0 ? daysUntilStart : 0,
        daysUntilEnd: daysUntilEnd > 0 ? daysUntilEnd : 0,
        durationDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        spotsRemaining: ex.maxRegistrations
          ? ex.maxRegistrations - ex._count.registrations
          : null,
        isSoldOut: ex.maxRegistrations ? ex._count.registrations >= ex.maxRegistrations : false,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        exhibitions: enrichedExhibitions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filters: {
          availableStatuses: ['upcoming', 'ongoing', 'past', 'all'],
          availableTypes: ['virtual', 'physical', 'hybrid'],
        },
      },
    });
  } catch (error) {
    console.error('Error fetching exhibitions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exhibitions' },
      { status: 500 }
    );
  }
}

// POST /api/exhibitions - Create exhibition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizerId,
      title,
      description,
      slug,
      type,
      startDate,
      endDate,
      venue,
      wilaya,
      address,
      isVirtual,
      virtualUrl,
      maxRegistrations,
      registrationFee,
      currency,
      coverImage,
      galleryImages,
      contactEmail,
      contactPhone,
      websiteUrl,
      categories,
      isFeatured,
      isActive,
    } = body;

    // Validate required fields
    if (!organizerId || !title || !startDate || !endDate || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: organizerId, title, startDate, endDate, type',
        },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    if (start < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Start date must be in the future' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['VIRTUAL', 'PHYSICAL', 'HYBRID'];
    const upperType = type.toUpperCase();
    if (!validTypes.includes(upperType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check if organizer exists
    const organizer = await db.company.findUnique({
      where: { id: organizerId },
    });

    if (!organizer) {
      return NextResponse.json(
        { success: false, error: 'Organizer company not found' },
        { status: 404 }
      );
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 80);
      
      // Ensure uniqueness
      const existingSlug = await db.exhibition.findUnique({
        where: { slug: finalSlug },
      });
      if (existingSlug) {
        finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
      }
    } else {
      // Check slug uniqueness
      const existingSlug = await db.exhibition.findUnique({
        where: { slug: finalSlug },
      });
      if (existingSlug) {
        return NextResponse.json(
          { success: false, error: 'An exhibition with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Determine if virtual based on type
    const shouldBeVirtual = upperType === 'VIRTUAL' || upperType === 'HYBRID';
    if (isVirtual !== undefined && isVirtual !== shouldBeVirtual) {
      return NextResponse.json(
        {
          success: false,
          error: `isVirtual must be ${shouldBeVirtual} for type ${upperType}`,
        },
        { status: 400 }
      );
    }

    // For physical/hybrid events, require venue
    if ((upperType === 'PHYSICAL' || upperType === 'HYBRID') && !venue) {
      return NextResponse.json(
        { success: false, error: 'Venue is required for physical/hybrid events' },
        { status: 400 }
      );
    }

    // For virtual/hybrid events, require virtualUrl
    if ((upperType === 'VIRTUAL' || upperType === 'HYBRID') && !virtualUrl) {
      return NextResponse.json(
        { success: false, error: 'Virtual URL is required for virtual/hybrid events' },
        { status: 400 }
      );
    }

    // Create exhibition
    const exhibition = await db.exhibition.create({
      data: {
        organizerId,
        title,
        description: description || null,
        slug: finalSlug,
        type: upperType as any,
        startDate: start,
        endDate: end,
        venue: venue || null,
        wilaya: wilaya || null,
        address: address || null,
        isVirtual: shouldBeVirtual,
        virtualUrl: virtualUrl || null,
        maxRegistrations: maxRegistrations || null,
        registrationFee: registrationFee || 0,
        currency: currency || 'DZD',
        coverImage: coverImage || null,
        galleryImages: galleryImages ? JSON.stringify(galleryImages) : null,
        contactEmail: contactEmail || organizer.contactEmail,
        contactPhone: contactPhone || organizer.contactPhone,
        websiteUrl: websiteUrl || null,
        categories: categories ? JSON.stringify(categories) : null,
        isFeatured: isFeatured ?? false,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: exhibition,
        message: 'Exhibition created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating exhibition:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create exhibition' },
      { status: 500 }
    );
  }
}

// PUT /api/exhibitions - Update exhibition
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Exhibition ID is required' },
        { status: 400 }
      );
    }

    // Check if exhibition exists
    const existingExhibition = await db.exhibition.findUnique({
      where: { id },
    });

    if (!existingExhibition) {
      return NextResponse.json(
        { success: false, error: 'Exhibition not found' },
        { status: 404 }
      );
    }

    // Convert date strings
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    // Stringify JSON fields
    if (updateData.galleryImages && typeof updateData.galleryImages !== 'string') {
      updateData.galleryImages = JSON.stringify(updateData.galleryImages);
    }
    if (updateData.categories && typeof updateData.categories !== 'string') {
      updateData.categories = JSON.stringify(updateData.categories);
    }

    // Update exhibition
    const updatedExhibition = await db.exhibition.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedExhibition,
      message: 'Exhibition updated successfully',
    });
  } catch (error) {
    console.error('Error updating exhibition:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update exhibition' },
      { status: 500 }
    );
  }
}

// DELETE /api/exhibitions?id=xxx - Delete exhibition
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Exhibition ID is required' },
        { status: 400 }
      );
    }

    // Check if exhibition exists
    const existingExhibition = await db.exhibition.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true, exhibitors: true },
        },
      },
    });

    if (!existingExhibition) {
      return NextResponse.json(
        { success: false, error: 'Exhibition not found' },
        { status: 404 }
      );
    }

    // Check if exhibition has registrations
    if (existingExhibition._count.registrations > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete exhibition with ${existingExhibition._count.registrations} registration(s). Consider cancelling it instead.`,
        },
        { status: 409 }
      );
    }

    // Delete exhibition
    await db.exhibition.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Exhibition deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting exhibition:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete exhibition' },
      { status: 500 }
    );
  }
}
