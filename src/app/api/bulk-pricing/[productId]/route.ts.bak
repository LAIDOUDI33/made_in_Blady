import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ productId: string }>;
}

// GET /api/bulk-pricing/[productId] - Get bulk pricing tiers for a product
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { productId } = await context.params;

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, price: true, currency: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get all bulk pricing tiers for this product
    const tiers = await db.bulkPricingTier.findMany({
      where: {
        productId,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
      orderBy: { minQuantity: 'asc' },
    });

    // Filter out expired tiers and calculate effective prices
    const now = new Date();
    const activeTiers = tiers.filter(
      (tier) => !tier.validFrom || new Date(tier.validFrom) <= now
    );

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          basePrice: product.price,
          currency: product.currency,
        },
        tiers: activeTiers.map((tier) => ({
          ...tier,
          isCurrentlyActive:
            (!tier.validFrom || new Date(tier.validFrom) <= now) &&
            (!tier.validUntil || new Date(tier.validUntil) >= now),
        })),
        summary: {
          totalTiers: activeTiers.length,
          maxDiscount: activeTiers.length > 0
            ? Math.max(...activeTiers.map((t) => t.discountPercent || 0))
            : 0,
          minOrderForDiscount:
            activeTiers.length > 0 ? Math.min(...activeTiers.map((t) => t.minQuantity)) : null,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching bulk pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bulk pricing' },
      { status: 500 }
    );
  }
}

// POST /api/bulk-pricing/[productId] - Create a bulk pricing tier
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { productId } = await context.params;
    const body = await request.json();
    const {
      minQuantity,
      maxQuantity,
      unitPrice,
      discountPercent,
      currency,
      validFrom,
      validUntil,
      description,
    } = body;

    // Validate required fields
    if (minQuantity === undefined || minQuantity === null) {
      return NextResponse.json(
        { success: false, error: 'minQuantity is required' },
        { status: 400 }
      );
    }

    if (unitPrice === undefined && discountPercent === undefined) {
      return NextResponse.json(
        { success: false, error: 'Either unitPrice or discountPercent must be provided' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check for overlapping quantity ranges
    const existingTiers = await db.bulkPricingTier.findMany({
      where: { productId },
    });

    const hasOverlap = existingTiers.some((existing) => {
      // Check if new range overlaps with existing
      const newMax = maxQuantity || Infinity;
      const existingMax = existing.maxQuantity || Infinity;
      return (
        (minQuantity >= existing.minQuantity && minQuantity <= existingMax) ||
        (newMax >= existing.minQuantity && newMax <= existingMax) ||
        (minQuantity <= existing.minQuantity && newMax >= existingMax)
      );
    });

    if (hasOverlap) {
      return NextResponse.json(
        { success: false, error: 'Quantity range overlaps with an existing tier' },
        { status: 409 }
      );
    });

    // Create the bulk pricing tier
    const tier = await db.bulkPricingTier.create({
      data: {
        productId,
        minQuantity,
        maxQuantity: maxQuantity || null,
        unitPrice: unitPrice || null,
        discountPercent: discountPercent || null,
        currency: currency || product.currency,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        description: description || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: tier,
        message: 'Bulk pricing tier created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating bulk pricing tier:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bulk pricing tier' },
      { status: 500 }
    );
  }
}

// PUT /api/bulk-pricing/[productId] - Update multiple tiers or update by tierId in body
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { productId } = await context.params;
    const body = await request.json();
    const { tierId, ...updateData } = body;

    if (!tierId) {
      return NextResponse.json(
        { success: false, error: 'tierId is required for update' },
        { status: 400 }
      );
    }

    // Check if tier exists and belongs to this product
    const existingTier = await db.bulkPricingTier.findFirst({
      where: {
        id: tierId,
        productId,
      },
    });

    if (!existingTier) {
      return NextResponse.json(
        { success: false, error: 'Bulk pricing tier not found' },
        { status: 404 }
      );
    }

    // Convert date strings if present
    if (updateData.validFrom) {
      updateData.validFrom = new Date(updateData.validFrom);
    }
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }

    // Update the tier
    const updatedTier = await db.bulkPricingTier.update({
      where: { id: tierId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedTier,
      message: 'Bulk pricing tier updated successfully',
    });
  } catch (error) {
    console.error('Error updating bulk pricing tier:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bulk pricing tier' },
      { status: 500 }
    );
  }
}

// DELETE /api/bulk-pricing/[productId]?tierId=xxx - Delete a specific tier
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { productId } = await context.params;
    const { searchParams } = new URL(request.url);
    const tierId = searchParams.get('tierId');

    if (!tierId) {
      return NextResponse.json(
        { success: false, error: 'tierId query parameter is required' },
        { status: 400 }
      );
    }

    // Check if tier exists and belongs to this product
    const existingTier = await db.bulkPricingTier.findFirst({
      where: {
        id: tierId,
        productId,
      },
    });

    if (!existingTier) {
      return NextResponse.json(
        { success: false, error: 'Bulk pricing tier not found' },
        { status: 404 }
      );
    }

    // Delete the tier
    await db.bulkPricingTier.delete({
      where: { id: tierId },
    });

    return NextResponse.json({
      success: true,
      message: 'Bulk pricing tier deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting bulk pricing tier:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bulk pricing tier' },
      { status: 500 }
    );
  }
}
