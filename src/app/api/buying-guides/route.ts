import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/buying-guides?categoryId=xxx - List buying guides
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const skip = (page - 1) * limit;
    
    // Filters
    const categoryId = searchParams.get('categoryId');
    const difficulty = searchParams.get('difficulty'); // beginner, intermediate, advanced
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

    if (difficulty && ['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      where.difficulty = difficulty;
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

    // Fetch buying guides
    const [guides, total] = await Promise.all([
      db.buyingGuide.findMany({
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
          { sortOrder: 'asc' },
          { publishedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.buyingGuide.count({ where }),
    ]);

    // Parse JSON fields and compute additional data
    const enrichedGuides = guides.map((guide) => ({
      ...guide,
      sections: guide.sections ? JSON.parse(guide.sections) : [],
      tips: guide.tips ? JSON.parse(guide.tips) : [],
      commonMistakes: guide.commonMistakes ? JSON.parse(guide.commonMistakes) : [],
      checklist: guide.checklist ? JSON.parse(guide.checklist) : [],
      tags: guide.tags ? JSON.parse(guide.tags) : [],
      readingTime: estimateReadingTime(guide.content),
      engagement: {
        likes: guide._count.likes,
        bookmarks: guide._count.bookmarks,
      },
    }));

    // Get available filters summary
    const [difficultiesCount, categoriesList] = await Promise.all([
      db.buyingGuide.groupBy({
        by: ['difficulty'],
        where: { isPublished: true },
        _count: { difficulty: true },
      }),
      categoryId
        ? null
        : db.category.findMany({
            where: {
              isActive: true,
              buyingGuides: { some: { isPublished: true } },
            },
            select: { id: true, name: true, slug: true },
            take: 20,
          }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        guides: enrichedGuides,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filters: {
          availableDifficulties: difficultiesCount.map((d) => ({
            difficulty: d.difficulty,
            count: d._count.difficulty,
          })),
          categories: categoriesList,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching buying guides:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch buying guides' },
      { status: 500 }
    );
  }
}

// GET /api/buying-guides/[slug] - Get single guide by slug (handled via query param here)
// This would typically be in a separate route file

// POST /api/buying-guides - Create guide (admin only)
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
      coverImage,
      difficulty,
      estimatedBudget,
      sections,
      tips,
      commonMistakes,
      checklist,
      tags,
      relatedProductIds,
      isFeatured,
      isPublished,
      publishedAt,
      sortOrder,
    } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: title, content',
        },
        { status: 400 }
      );
    }

    // Validate difficulty if provided
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    const finalDifficulty = difficulty || 'beginner';
    if (!validDifficulties.includes(finalDifficulty)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`,
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

    // Validate related products exist if provided
    if (relatedProductIds && Array.isArray(relatedProductIds) && relatedProductIds.length > 0) {
      const existingProducts = await db.product.findMany({
        where: {
          id: { in: relatedProductIds },
          isActive: true,
        },
        select: { id: true },
      });

      if (existingProducts.length !== relatedProductIds.length) {
        const foundIds = existingProducts.map((p) => p.id);
        const missingIds = relatedProductIds.filter((id: string) => !foundIds.includes(id));
        return NextResponse.json(
          {
            success: false,
            error: `Products not found: ${missingIds.join(', ')}`,
          },
          { status: 404 }
        );
      }
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = generateSlug(title);
      
      // Ensure uniqueness
      const existingSlug = await db.buyingGuide.findUnique({
        where: { slug: finalSlug },
      });
      if (existingSlug) {
        finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
      }
    } else {
      const existingSlug = await db.buyingGuide.findUnique({
        where: { slug: finalSlug },
      });
      if (existingSlug) {
        return NextResponse.json(
          { success: false, error: 'A guide with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Generate summary if not provided
    const finalSummary = summary || generateSummary(content);

    // Create the guide
    const guide = await db.buyingGuide.create({
      data: {
        authorId: authorId || null,
        title,
        slug: finalSlug,
        content,
        summary: finalSummary,
        categoryId: categoryId || null,
        coverImage: coverImage || null,
        difficulty: finalDifficulty,
        estimatedBudget: estimatedBudget || null,
        sections: sections ? JSON.stringify(sections) : null,
        tips: tips ? JSON.stringify(tips) : null,
        commonMistakes: commonMistakes ? JSON.stringify(commonMistakes) : null,
        checklist: checklist ? JSON.stringify(checklist) : null,
        tags: tags ? JSON.stringify(tags) : null,
        relatedProductIds: relatedProductIds ? JSON.stringify(relatedProductIds) : null,
        isFeatured: isFeatured ?? false,
        isPublished: isPublished ?? false,
        publishedAt: isPublished ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
        sortOrder: sortOrder ?? 0,
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
          ...guide,
          sections: guide.sections ? JSON.parse(guide.sections) : [],
          tips: guide.tips ? JSON.parse(guide.tips) : [],
          commonMistakes: guide.commonMistakes ? JSON.parse(guide.commonMistakes) : [],
          checklist: guide.checklist ? JSON.parse(guide.checklist) : [],
          tags: guide.tags ? JSON.parse(guide.tags) : [],
        },
        message: 'Buying guide created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating buying guide:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create buying guide' },
      { status: 500 }
    );
  }
}

// PUT /api/buying-guides - Update guide
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Guide ID is required' },
        { status: 400 }
      );
    }

    // Check if guide exists
    const existingGuide = await db.buyingGuide.findUnique({
      where: { id },
    });

    if (!existingGuide) {
      return NextResponse.json(
        { success: false, error: 'Buying guide not found' },
        { status: 404 }
      );
    }

    // Stringify JSON fields if needed
    const jsonFields = ['sections', 'tips', 'commonMistakes', 'checklist', 'tags', 'relatedProductIds'];
    for (const field of jsonFields) {
      if (updateData[field] && typeof updateData[field] !== 'string') {
        updateData[field] = JSON.stringify(updateData[field]);
      }
    }

    // Convert date if present
    if (updateData.publishedAt) {
      updateData.publishedAt = new Date(updateData.publishedAt);
    }

    // Update guide
    const updatedGuide = await db.buyingGuide.update({
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
      data: updatedGuide,
      message: 'Buying guide updated successfully',
    });
  } catch (error) {
    console.error('Error updating buying guide:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update buying guide' },
      { status: 500 }
    );
  }
}

// DELETE /api/buying-guides?id=xxx - Delete guide
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Guide ID is required' },
        { status: 400 }
      );
    }

    // Check if guide exists
    const existingGuide = await db.buyingGuide.findUnique({
      where: { id },
    });

    if (!existingGuide) {
      return NextResponse.json(
        { success: false, error: 'Buying guide not found' },
        { status: 404 }
      );
    }

    // Delete guide
    await db.buyingGuide.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Buying guide deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting buying guide:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete buying guide' },
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
  
  // Take first ~250 characters
  if (plainText.length <= 280) {
    return plainText;
  }
  
  const truncated = plainText.substring(0, 280);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return truncated.substring(0, lastSpace) + '...';
}

function estimateReadingTime(content: string): number {
  // Strip HTML tags
  const plainText = content.replace(/<[^>]*>/g, '');
  // Average reading speed: 200 words per minute for non-technical content
  const wordCount = plainText.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
