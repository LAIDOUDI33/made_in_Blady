import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Algerian Wilayas data for validation
const ALGERIAN_WILAYAS = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
  '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
  '51', '52', '53', '54', '55', '56', '57', '58'
];

const WILAYA_NAMES: Record<string, string> = {
  '01': 'Adrar', '02': 'Chlef', '03': 'Laghouat', '04': "Oum El Bouaghi",
  '05': 'Batna', '06': 'Béjaïa', '07': 'Biskra', '08': 'Béchar',
  '09': 'Blida', '10': 'Bouira', '11': 'Tamanrasset', '12': 'Tébessa',
  '13': 'Tlemcen', '14': 'Tiaret', '15': 'Tizi Ouzou', '16': 'Alger',
  '17': 'Djelfa', '18': 'Jijel', '19': 'Sétif', '20': 'Saïda',
  '21': 'Skikda', '22': 'Sidi Bel Abbès', '23': 'Annaba', '24': 'Guelma',
  '25': 'Constantine', '26': 'Médéa', '27': 'Mostaganem', '28': "M'Sila",
  '29': 'Mascara', '30': 'Ouargla', '31': 'Oran', '32': 'El Bayadh',
  '33': 'Illizi', '34': 'Bordj Bou Arréridj', '35': 'Boumerdès',
  '36': 'El Tarf', '37': 'Tindouf', '38': 'Tissemsilt', '39': 'El Oued',
  '40': 'Khenchela', '41': 'Souk Ahras', '42': 'Tipaza', '43': 'Mila',
  '44': 'Aïn Defla', '45': 'Naâma', '46': 'Aïn Témouchent', '47': 'Ghardaïa',
  '48': 'Relizane', '49': 'El M\'Ghair', '50': 'El Meniaa',
  '51': 'Ouled Djellal', '52': 'Bordj Baji Mokhtar', '53': 'Béni Abbès',
  '54': 'Timimoun', '55': 'Tougourt', '56': 'Djanet', '57': 'In Salah',
  '58': 'In Guezzam'
};

// Valid shipping methods
const VALID_SHIPPING_METHODS = [
  'standard',
  'express',
  'same_day',
  'pickup',
  'freight',
  'economy',
];

// GET /api/shipping/rates?origin=xxx&destination=xxx - Calculate shipping rates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const originWilaya = searchParams.get('origin');
    const destinationWilaya = searchParams.get('destination');
    const method = searchParams.get('method');
    const weight = parseFloat(searchParams.get('weight') || '0'); // in kg
    const volume = parseFloat(searchParams.get('volume') || '0'); // in cubic meters
    const declaredValue = parseFloat(searchParams.get('declaredValue') || '0');

    // Validate required parameters
    if (!originWilaya || !destinationWilaya) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: origin, destination (wilaya codes)',
        },
        { status: 400 }
      );
    }

    // Normalize wilaya codes (pad with zero)
    const normalizeWilaya = (code: string) => code.padStart(2, '0');
    const origin = normalizeWilaya(originWilaya);
    const destination = normalizeWilaya(destinationWilaya);

    // Validate wilaya codes
    if (!ALGERIAN_WILAYAS.includes(origin)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid origin wilaya code: ${originWilaya}. Must be a valid Algerian wilaya code (01-58)`,
        },
        { status: 400 }
      );
    }

    if (!ALGERIAN_WILAYAS.includes(destination)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid destination wilaya code: ${destinationWilaya}. Must be a valid Algerian wilaya code (01-58)`,
        },
        { status: 400 }
      );
    }

    // Build where clause for rate lookup
    const where: Record<string, unknown> = {
      originWilaya: origin,
      destinationWilaya: destination,
      isActive: true,
    };

    // Add method filter if specified
    if (method && VALID_SHIPPING_METHODS.includes(method)) {
      where.method = method;
    }

    // Check for same-wilaya delivery
    const isSameWilaya = origin === destination;

    // Fetch applicable rates
    let rates = await db.shippingRate.findMany({
      where,
      orderBy: { estimatedDaysMin: 'asc' },
    });

    // If no exact route found, try to find general rates or default rates
    if (rates.length === 0) {
      // Try wildcard destination
      rates = await db.shippingRate.findMany({
        where: {
          originWilaya: origin,
          destinationWilaya: 'ALL',
          isActive: true,
          ...(method ? { method } : {}),
        },
        orderBy: { estimatedDaysMin: 'asc' },
      });
    }

    if (rates.length === 0) {
      // Try general rates
      rates = await db.shippingRate.findMany({
        where: {
          originWilaya: 'ALL',
          destinationWilaya: 'ALL',
          isActive: true,
          ...(method ? { method } : {}),
        },
        orderBy: { estimatedDaysMin: 'asc' },
      });
    }

    // Calculate prices for each rate based on weight and volume
    const calculatedRates = rates.map((rate) => {
      let totalPrice = rate.basePrice;

      // Add weight-based cost
      if (weight > 0 && rate.weightPrice > 0) {
        totalPrice += weight * rate.weightPrice;
      }

      // Add volume-based cost
      if (volume > 0 && rate.volumePrice > 0) {
        totalPrice += volume * rate.volumePrice;
      }

      // Apply same-wilaya discount if applicable
      if (isSameWilaya && rate.sameWilayaDiscount) {
        totalPrice = totalPrice * (1 - rate.sameWilayaDiscount / 100);
      }

      // Calculate insurance if value declared
      let insuranceCost = 0;
      if (declaredValue > 0 && rate.insuranceRate) {
        insuranceCost = declaredValue * (rate.insuranceRate / 100);
        totalPrice += insuranceCost;
      }

      // Round to 2 decimal places
      totalPrice = Math.round(totalPrice * 100) / 100;

      return {
        ...rate,
        calculatedPrice: totalPrice,
        originalBasePrice: rate.basePrice,
        weightCost: weight > 0 ? Math.round(weight * (rate.weightPrice || 0) * 100) / 100 : 0,
        volumeCost: volume > 0 ? Math.round(volume * (rate.volumePrice || 0) * 100) / 100 : 0,
        insuranceCost: Math.round(insuranceCost * 100) / 100,
        sameWilayaDiscountApplied: isSameWilaya ? rate.sameWilayaDiscount : 0,
        deliveryEstimate: {
          minDays: rate.estimatedDaysMin,
          maxDays: rate.estimatedDaysMax,
          sameWilayaBonus: isSameWilaya ? -1 : 0, // Faster delivery within same wilaya
        },
      };
    });

    // Sort by price (cheapest first) unless method was specified
    if (!method) {
      calculatedRates.sort((a, b) => a.calculatedPrice - b.calculatedPrice);
    }

    // Get location info
    return NextResponse.json({
      success: true,
      data: {
        query: {
          origin: {
            code: origin,
            name: WILAYA_NAMES[origin] || `Wilaya ${origin}`,
          },
          destination: {
            code: destination,
            name: WILAYA_NAMES[destination] || `Wilaya ${destination}`,
          },
          isSameWilaya,
          weight,
          volume,
          declaredValue,
        },
        rates: calculatedRates,
        summary: {
          availableOptions: calculatedRates.length,
          cheapestOption:
            calculatedRates.length > 0
              ? {
                  method: calculatedRates[0].method,
                  price: calculatedRates[0].calculatedPrice,
                  estimatedDays: `${calculatedRates[0].estimatedDaysMin}-${calculatedRates[0].estimatedDaysMax} days`,
                }
              : null,
          fastestOption:
            calculatedRates.length > 0
              ? [...calculatedRates].sort(
                  (a, b) => a.estimatedDaysMin - b.estimatedDaysMin
                )[0]
              : null,
        },
        currency: 'DZD',
      },
    });
  } catch (error) {
    console.error('Error calculating shipping rates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate shipping rates' },
      { status: 500 }
    );
  }
}

// POST /api/shipping/rates - Create shipping rate (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      originWilaya,
      destinationWilaya,
      method,
      basePrice,
      weightPrice,
      volumePrice,
      estimatedDaysMin,
      estimatedDaysMax,
      sameWilayaDiscount,
      insuranceRate,
      maxWeight,
      maxDimensions,
      description,
      carrierName,
      isActive,
      validFrom,
      validUntil,
    } = body;

    // Validate required fields
    if (!originWilaya || !destinationWilaya || !method || basePrice === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: originWilaya, destinationWilaya, method, basePrice',
        },
        { status: 400 }
      );
    }

    // Normalize wilaya codes
    const normalizeWilaya = (code: string) => code.padStart(2, '0').toUpperCase();
    const origin = normalizeWilaya(originWilaya);
    const dest = normalizeWilaya(destinationWilaya);

    // Validate wilaya codes (allow 'ALL' as wildcard)
    if (
      origin !== 'ALL' &&
      !ALGERIAN_WILAYAS.includes(origin)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid origin wilaya code: ${originWilaya}`,
        },
        { status: 400 }
      );
    }

    if (
      dest !== 'ALL' &&
      !ALGERIAN_WILAYAS.includes(dest)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid destination wilaya code: ${destinationWilaya}`,
        },
        { status: 400 }
      );
    }

    // Validate shipping method
    if (!VALID_SHIPPING_METHODS.includes(method)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid method. Must be one of: ${VALID_SHIPPING_METHODS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate price values
    if (basePrice < 0) {
      return NextResponse.json(
        { success: false, error: 'basePrice must be non-negative' },
        { status: 400 }
      );
    }

    if (weightPrice !== undefined && weightPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'weightPrice must be non-negative' },
        { status: 400 }
      );
    }

    if (volumePrice !== undefined && volumePrice < 0) {
      return NextResponse.json(
        { success: false, error: 'volumePrice must be non-negative' },
        { status: 400 }
      );
    }

    // Validate delivery days
    if (
      estimatedDaysMin !== undefined &&
      estimatedDaysMax !== undefined &&
      estimatedDaysMin > estimatedDaysMax
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'estimatedDaysMin must be less than or equal to estimatedDaysMax',
        },
        { status: 400 }
      );
    }

    // Check for duplicate rate
    const existingRate = await db.shippingRate.findFirst({
      where: {
        originWilaya: origin,
        destinationWilaya: dest,
        method,
        isActive: true,
      },
    });

    if (existingRate) {
      return NextResponse.json(
        {
          success: false,
          error: 'A shipping rate already exists for this route and method',
        },
        { status: 409 }
      );
    }

    // Create shipping rate
    const rate = await db.shippingRate.create({
      data: {
        originWilaya: origin,
        destinationWilaya: dest,
        method,
        basePrice,
        weightPrice: weightPrice ?? 0,
        volumePrice: volumePrice ?? 0,
        estimatedDaysMin: estimatedDaysMin ?? 1,
        estimatedDaysMax: estimatedDaysMax ?? estimatedDaysMin ?? 3,
        sameWilayaDiscount: sameWilayaDiscount ?? null,
        insuranceRate: insuranceRate ?? null,
        maxWeight: maxWeight ?? null,
        maxDimensions: maxDimensions ? JSON.stringify(maxDimensions) : null,
        description: description || null,
        carrierName: carrierName || null,
        isActive: isActive ?? true,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...rate,
          maxDimensions: rate.maxDimensions ? JSON.parse(rate.maxDimensions) : null,
        },
        message: 'Shipping rate created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating shipping rate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create shipping rate' },
      { status: 500 }
    );
  }
}

// PUT /api/shipping/rates - Update shipping rate
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Rate ID is required' },
        { status: 400 }
      );
    }

    // Check if rate exists
    const existingRate = await db.shippingRate.findUnique({
      where: { id },
    });

    if (!existingRate) {
      return NextResponse.json(
        { success: false, error: 'Shipping rate not found' },
        { status: 404 }
      );
    }

    // Stringify JSON fields if needed
    if (updateData.maxDimensions && typeof updateData.maxDimensions !== 'string') {
      updateData.maxDimensions = JSON.stringify(updateData.maxDimensions);
    }

    // Convert dates if present
    if (updateData.validFrom) {
      updateData.validFrom = new Date(updateData.validFrom);
    }
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil);
    }

    // Update rate
    const updatedRate = await db.shippingRate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedRate,
      message: 'Shipping rate updated successfully',
    });
  } catch (error) {
    console.error('Error updating shipping rate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update shipping rate' },
      { status: 500 }
    );
  }
}

// DELETE /api/shipping/rates?id=xxx - Delete shipping rate
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Rate ID is required' },
        { status: 400 }
      );
    }

    // Check if rate exists
    const existingRate = await db.shippingRate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { shipments: true },
        },
      },
    });

    if (!existingRate) {
      return NextResponse.json(
        { success: false, error: 'Shipping rate not found' },
        { status: 404 }
      );
    }

    // Check if rate has associated shipments
    if (existingRate._count.shipments > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete rate with ${existingRate._count.shipments} shipment(s). Consider deactivating it instead.`,
        },
        { status: 409 }
      );
    }

    // Delete rate
    await db.shippingRate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Shipping rate deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting shipping rate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete shipping rate' },
      { status: 500 }
    );
  }
}
