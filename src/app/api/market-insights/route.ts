import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Valid insight types
const VALID_INSIGHT_TYPES = [
  'market_report',
  'price_analysis',
  'demand_forecast',
  'industry_trend',
  'supplier_guide',
  'buyer_guide',
  'regulatory_update',
];

// Valid target roles
const VALID_TARGET_ROLES = ['all', 'buyer', 'supplier', 'admin'];

// GET /api/market-insights?categoryId=xxx&type=xxx - List market insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const skip = (page - 1) * limit;
    
    // Filters
    const categoryId = searchParams.get('categoryId');
    const type = searchParams.get('type');
    const targetRole = searchParams.get('targetRole');
    const isFeatured = searchParams.get('featured');
    const searchQuery = searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {
      isPublished: true,
      publishedAt: { lte: new Date() },
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type && VALID_INSIGHT_TYPES.includes(type)) {
      where.type = type;
    }

    if (targetRole && VALID_TARGET_ROLES.includes(targetRole)) {
      where.targetRole = targetRole;
    } else if (targetRole && targetRole !== 'all') {
      // If not a valid role, don't filter
    }

    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    // Search filter
    if (searchQuery && searchQuery.trim()) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { summary: { contains: searchQuery, mode: 'insensitive' } },
        { content: { contains: searchQuery, mode: 'insensitive' } },
        { tags: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Fetch insights
    const [insights, total] = await Promise.all([
      db.marketInsight.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              likes: true,
              bookmarks: true,
            },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { publishedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.marketInsight.count({ where }),
    ]);

    // Parse JSON fields and compute additional data
    const enrichedInsights = insights.map((insight) => ({
      ...insight,
      tags: insight.tags ? JSON.parse(insight.tags) : [],
      data: insight.data ? JSON.parse(insight.data) : null,
      readingTime: estimateReadingTime(insight.content),
      engagement: {
        likes: insight._count.likes,
        bookmarks: insight._count.bookmarks,
      },
    }));

    // Get available filters summary
    const [typesCount, categoriesList] = await Promise.all([
      db.marketInsight.groupBy({
        by: ['type'],
        where: { isPublished: true },
        _count: { type: true },
      }),
      categoryId
        ? null
        : db.category.findMany({
            where: {
              isActive: true,
              marketInsights: { some: { isPublished: true } },
            },
            select: { id: true, name: true, slug: true },
            take: 20,
          }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        insights: enrichedInsights,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filters: {
          availableTypes: typesCount.map((t) => ({
            type: t.type,
            count: t._count.type,
          })),
          categories: categoriesList,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching market insights:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market insights' },
      { status: 500 }
    );
  }
}

// POST /api/market-insights - Create insight (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      authorId,
      title,
      slug,
      content,
      summary,
      categoryId,
      type,
      targetRole,
      coverImage,
      galleryImages,
      tags,
      data,
      isFeatured,
      isPublished,
      publishedAt,
    } = body;

    // Validate required fields
    if (!title || !content || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: title, content, type',
        },
        { status: 400 }
      );
    }

    // Validate type
    if (!VALID_INSIGHT_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${VALID_INSIGHT_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate target role
    const finalTargetRole = targetRole || 'all';
    if (!VALID_TARGET_ROLES.includes(finalTargetRole)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid targetRole. Must be one of: ${VALID_TARGET_ROLES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check if category exists if provided
    if (categoryId) {
      const category = await db.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Category not found' },
          { status: 404 }
        );
      }
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = generateSlug(title);
      
      // Ensure uniqueness
      const existingSlug = await db.marketInsight.findUnique({
        where: { slug: finalSlug },
      });
      if (existingSlug) {
        finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
      }
    } else {
      const existingSlug = await db.marketInsight.findUnique({
        where: { slug: finalSlug },
      });
      if (existingSlug) {
        return NextResponse.json(
          { success: false, error: 'An insight with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Generate summary if not provided
    const finalSummary = summary || generateSummary(content);

    // Create the insight
    const insight = await db.marketInsight.create({
      data: {
        authorId: authorId || null,
        title,
        slug: finalSlug,
        content,
        summary: finalSummary,
        categoryId: categoryId || null,
        type,
        targetRole: finalTargetRole,
        coverImage: coverImage || null,
        galleryImages: galleryImages ? JSON.stringify(galleryImages) : null,
        tags: tags ? JSON.stringify(tags) : null,
        data: data ? JSON.stringify(data) : null,
        isFeatured: isFeatured ?? false,
        isPublished: isPublished ?? false,
        publishedAt: isPublished ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...insight,
          tags: insight.tags ? JSON.parse(insight.tags) : [],
          data: insight.data ? JSON.parse(insight.data) : null,
        },
        message: 'Market insight created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating market insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create market insight' },
      { status: 500 }
    );
  }
}

// PUT /api/market-insights - Update insight
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Insight ID is required' },
        { status: 400 }
      );
    }

    // Check if insight exists
    const existingInsight = await db.marketInsight.findUnique({
      where: { id },
    });

    if (!existingInsight) {
      return NextResponse.json(
        { success: false, error: 'Market insight not found' },
        { status: 404 }
      );
    }

    // Stringify JSON fields if needed
    if (updateData.galleryImages && typeof updateData.galleryImages !== 'string') {
      updateData.galleryImages = JSON.stringify(updateData.galleryImages);
    }
    if (updateData.tags && typeof updateData.tags !== 'string') {
      updateData.tags = JSON.stringify(updateData.tags);
    }
    if (updateData.data && typeof updateData.data !== 'string') {
      updateData.data = JSON.stringify(updateData.data);
    }

    // Convert date if present
    if (updateData.publishedAt) {
      updateData.publishedAt = new Date(updateData.publishedAt);
    }

    // Update insight
    const updatedInsight = await db.marketInsight.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedInsight,
      message: 'Market insight updated successfully',
    });
  } catch (error) {
    console.error('Error updating market insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update market insight' },
      { status: 500 }
    );
  }
}

// DELETE /api/market-insights?id=xxx - Delete insight
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Insight ID is required' },
        { status: 400 }
      );
    }

    // Check if insight exists
    const existingInsight = await db.marketInsight.findUnique({
      where: { id },
    });

    if (!existingInsight) {
      return NextResponse.json(
        { success: false, error: 'Market insight not found' },
        { status: 404 }
      );
    }

    // Delete insight
    await db.marketInsight.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Market insight deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting market insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete market insight' },
      { status: 500 }
    );
  }
}

// Helper functions

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

function generateSummary(content: string): string {
  // Strip HTML tags if any
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // Take first ~200 characters
  if (plainText.length <= 250) {
    return plainText;
  }
  
  const truncated = plainText.substring(0, 250);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return truncated.substring(0, lastSpace) + '...';
}

function estimateReadingTime(content: string): number {
  // Strip HTML tags
  const plainText = content.replace(/<[^>]*>/g, '');
  // Average reading speed: 200 words per minute
  const wordCount = plainText.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
