import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Valid customization option types
const VALID_OPTION_TYPES = ['select', 'radio', 'checkbox', 'text', 'number', 'file'];

interface RouteParams {
  params: Promise<{ productId: string }>;
}

// GET /api/customization/[productId] - Get customization options for a product
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { productId } = await context.params;
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        supportsCustomization: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Build where clause for options
    const where: Record<string, unknown> = { productId };
    if (!includeInactive) {
      where.isActive = true;
    }

    // Get customization options
    const options = await db.customizationOption.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    // Parse JSON options for each option
    const parsedOptions = options.map((option) => ({
      ...option,
      options: typeof option.options === 'string' ? JSON.parse(option.options) : option.options,
    }));

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          supportsCustomization: product.supportsCustomization,
        },
        options: parsedOptions,
        summary: {
          totalOptions: parsedOptions.length,
          requiredOptions: parsedOptions.filter((o) => o.isRequired).length,
          optionalOptions: parsedOptions.filter((o) => !o.isRequired).length,
          types: [...new Set(parsedOptions.map((o) => o.type))],
        },
      },
    });
  } catch (error) {
    console.error('Error fetching customization options:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customization options' },
      { status: 500 }
    );
  }
}

// POST /api/customization/[productId] - Create a customization option
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { productId } = await context.params;
    const body = await request.json();
    const {
      name,
      type,
      isRequired,
      options,
      placeholder,
      defaultValue,
      validationRules,
      sortOrder,
      isActive,
    } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, type' },
        { status: 400 }
      );
    }

    // Validate option type
    if (!VALID_OPTION_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${VALID_OPTION_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate that select/radio/checkbox have options
    if (['select', 'radio', 'checkbox'].includes(type)) {
      if (!options || !Array.isArray(options) || options.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Options array is required for type "${type}"`,
          },
          { status: 400 }
        );
      }
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

    // Get next sort order if not provided
    let finalSortOrder = sortOrder ?? 0;
    if (sortOrder === undefined || sortOrder === null) {
      const maxSortOrder = await db.customizationOption.aggregate({
        where: { productId },
        _max: { sortOrder: true },
      });
      finalSortOrder = (maxSortOrder._max.sortOrder ?? 0) + 1;
    }

    // Create customization option
    const option = await db.customizationOption.create({
      data: {
        productId,
        name,
        type,
        isRequired: isRequired ?? false,
        options: options ? JSON.stringify(options) : null,
        placeholder: placeholder || null,
        defaultValue: defaultValue || null,
        validationRules: validationRules ? JSON.stringify(validationRules) : null,
        sortOrder: finalSortOrder,
        isActive: isActive ?? true,
      },
    });

    // Return with parsed options
    const responseOption = {
      ...option,
      options: option.options ? JSON.parse(option.options) : null,
      validationRules: option.validationRules ? JSON.parse(option.validationRules) : null,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseOption,
        message: 'Customization option created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating customization option:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customization option' },
      { status: 500 }
    );
  }
}

// PUT /api/customization/[productId] - Update a customization option
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { productId } = await context.params;
    const body = await request.json();
    const { optionId, ...updateData } = body;

    if (!optionId) {
      return NextResponse.json(
        { success: false, error: 'optionId is required for update' },
        { status: 400 }
      );
    }

    // Validate option type if being updated
    if (updateData.type && !VALID_OPTION_TYPES.includes(updateData.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${VALID_OPTION_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check if option exists and belongs to this product
    const existingOption = await db.customizationOption.findFirst({
      where: {
        id: optionId,
        productId,
      },
    });

    if (!existingOption) {
      return NextResponse.json(
        { success: false, error: 'Customization option not found' },
        { status: 404 }
      );
    }

    // Stringify JSON fields if provided as objects
    if (updateData.options && typeof updateData.options !== 'string') {
      updateData.options = JSON.stringify(updateData.options);
    }
    if (updateData.validationRules && typeof updateData.validationRules !== 'string') {
      updateData.validationRules = JSON.stringify(updateData.validationRules);
    }

    // Update the option
    const updatedOption = await db.customizationOption.update({
      where: { id: optionId },
      data: updateData,
    });

    // Return with parsed options
    const responseOption = {
      ...updatedOption,
      options: updatedOption.options ? JSON.parse(updatedOption.options) : null,
      validationRules: updatedOption.validationRules
        ? JSON.parse(updatedOption.validationRules)
        : null,
    };

    return NextResponse.json({
      success: true,
      data: responseOption,
      message: 'Customization option updated successfully',
    });
  } catch (error) {
    console.error('Error updating customization option:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customization option' },
      { status: 500 }
    );
  }
}

// DELETE /api/customization/[productId]?optionId=xxx - Delete a customization option
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { productId } = await context.params;
    const { searchParams } = new URL(request.url);
    const optionId = searchParams.get('optionId');

    if (!optionId) {
      return NextResponse.json(
        { success: false, error: 'optionId query parameter is required' },
        { status: 400 }
      );
    }

    // Check if option exists and belongs to this product
    const existingOption = await db.customizationOption.findFirst({
      where: {
        id: optionId,
        productId,
      },
    });

    if (!existingOption) {
      return NextResponse.json(
        { success: false, error: 'Customization option not found' },
        { status: 404 }
      );
    }

    // Delete the option
    await db.customizationOption.delete({
      where: { id: optionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Customization option deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting customization option:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customization option' },
      { status: 500 }
    );
  }
}

// PATCH /api/customization/[productId]/reorder - Reorder customization options
export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { productId } = await context.params;
    const body = await request.json();
    const { orders } = body; // Array of { optionId, sortOrder }

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json(
        { success: false, error: 'orders array is required' },
        { status: 400 }
      );
    }

    // Update sort orders in a transaction
    await db.$transaction(
      orders.map(({ optionId, sortOrder }: { optionId: string; sortOrder: number }) =>
        db.customizationOption.updateMany({
          where: {
            id: optionId,
            productId,
          },
          data: { sortOrder },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Options reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering customization options:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder customization options' },
      { status: 500 }
    );
  }
}
