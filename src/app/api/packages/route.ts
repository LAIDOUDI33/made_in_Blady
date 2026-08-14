import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/packages - List all packages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;
    const companyId = searchParams.get('companyId');
    const isActive = searchParams.get('isActive');
    const categoryId = searchParams.get('categoryId');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    if (isActive !== null) where.isActive = isActive === 'true';

    // Fetch packages with pagination
    const [packages, total] = await Promise.all([
      db.productPackage.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              isVerified: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  currency: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                    select: { url: true, alt: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.productPackage.count({ where }),
    ]);

    // Calculate savings for each package
    const packagesWithSavings = packages.map((pkg) => {
      const itemsTotal = pkg.items.reduce(
        (sum, item) => sum + (item.product.price || 0) * item.quantity,
        0
      );
      const savingsAmount = itemsTotal - (pkg.totalPrice || 0);
      const savingsPercent =
        itemsTotal > 0 ? Math.round((savingsAmount / itemsTotal) * 100) : 0;

      return {
        ...pkg,
        calculatedSavings: {
          originalTotal: itemsTotal,
          packagePrice: pkg.totalPrice,
          savingsAmount,
          savingsPercent: pkg.discountPercent || savingsPercent,
        },
      };
    });

    // Filter by category if specified
    let filteredPackages = packagesWithSavings;
    if (categoryId) {
      filteredPackages = packagesWithSavings.filter((pkg) =>
        pkg.items.some((item) => {
          // This would need category info on product - simplified filter
          return true; // Would need to join with product category
        })
      );
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        packages: filteredPackages,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

// POST /api/packages - Create a package with items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      name,
      description,
      discountPercent,
      totalPrice,
      currency,
      imageUrl,
      products, // Array of { productId, quantity }
      validFrom,
      validUntil,
      maxQuantity,
      isActive,
    } = body;

    // Validate required fields
    if (!companyId || !name || !products || !Array.isArray(products)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: companyId, name, products',
        },
        { status: 400 }
      );
    }

    if (products.length < 2) {
      return NextResponse.json(
        { success: false, error: 'A package must contain at least 2 products' },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Validate all products exist and belong to the company
    const productIds = products.map((p: { productId: string }) => p.productId);
    const existingProducts = await db.product.findMany({
      where: {
        id: { in: productIds },
        companyId,
        isActive: true,
        status: 'published',
      },
      select: { id: true, name: true, price: true, currency: true },
    });

    if (existingProducts.length !== productIds.length) {
      const foundIds = existingProducts.map((p) => p.id);
      const missingIds = productIds.filter((id: string) => !foundIds.includes(id));
      return NextResponse.json(
        {
          success: false,
          error: `Products not found or not available: ${missingIds.join(', ')}`,
        },
        { status: 404 }
      );
    }

    // Calculate totals if not provided
    let finalTotalPrice = totalPrice;
    let finalDiscountPercent = discountPercent;

    if (!totalPrice && !discountPercent) {
      // Auto-calculate from product prices
      const itemsTotal = products.reduce(
        (sum: number, p: { productId: string; quantity: number }) => {
          const product = existingProducts.find((ep) => ep.id === p.productId);
          return sum + (product?.price || 0) * p.quantity;
        },
        0
      );
      finalTotalPrice = itemsTotal;
      finalDiscountPercent = 0;
    }

    // Create package and items in a transaction
    const pkg = await db.$transaction(async (tx) => {
      // Create the package
      const newPackage = await tx.productPackage.create({
        data: {
          companyId,
          name,
          description: description || null,
          discountPercent: finalDiscountPercent || 0,
          totalPrice: finalTotalPrice || 0,
          currency: currency || existingProducts[0]?.currency || 'DZD',
          imageUrl: imageUrl || null,
          validFrom: validFrom ? new Date(validFrom) : null,
          validUntil: validUntil ? new Date(validUntil) : null,
          maxQuantity: maxQuantity || null,
          isActive: isActive ?? true,
        },
      });

      // Create package items
      const packageItems = await Promise.all(
        products.map((p: { productId: string; quantity: number }) =>
          tx.packageItem.create({
            data: {
              packageId: newPackage.id,
              productId: p.productId,
              quantity: p.quantity,
            },
          })
        )
      );

      return {
        ...newPackage,
        items: packageItems,
      };
    });

    // Fetch full package with relations
    const fullPackage = await db.productPackage.findUnique({
      where: { id: pkg.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: fullPackage,
        message: 'Package created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create package' },
      { status: 500 }
    );
  }
}

// PUT /api/packages - Update a package
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, products, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    // Check if package exists
    const existingPackage = await db.productPackage.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
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

    // Update in transaction if products are being modified
    let updatedPackage;
    if (products && Array.isArray(products)) {
      updatedPackage = await db.$transaction(async (tx) => {
        // Update package
        const pkg = await tx.productPackage.update({
          where: { id },
          data: updateData,
        });

        // Remove old items
        await tx.packageItem.deleteMany({
          where: { packageId: id },
        });

        // Create new items
        const newItems = await Promise.all(
          products.map((p: { productId: string; quantity: number }) =>
            tx.packageItem.create({
              data: {
                packageId: id,
                productId: p.productId,
                quantity: p.quantity,
              },
            })
          )
        );

        return { ...pkg, items: newItems };
      });
    } else {
      updatedPackage = await db.productPackage.update({
        where: { id },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedPackage,
      message: 'Package updated successfully',
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

// DELETE /api/packages?id=xxx - Delete a package
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    // Check if package exists
    const existingPackage = await db.productPackage.findUnique({
      where: { id },
      include: {
        _count: { select: { orders: true } },
      },
    });

    if (!existingPackage) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    // Check if package has associated orders
    if (existingPackage._count.orders > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete package with ${existingPackage._count.orders} associated order(s). Consider deactivating it instead.`,
        },
        { status: 409 }
      );
    }

    // Delete package (cascade will delete items)
    await db.productPackage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}
