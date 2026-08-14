import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/videos - List videos (product or company)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type'); // product_demo, factory_tour, etc.
    const language = searchParams.get('language');

    if (productId) {
      // Get product videos
      const videos = await db.productVideo.findMany({
        where: {
          productId,
          ...(type && { type }),
          ...(language && { language }),
          status: 'ready'
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }]
      });

      return NextResponse.json({ success: true, data: videos });
    }

    if (companyId) {
      // Get company videos
      const videos = await db.companyVideo.findMany({
        where: {
          companyId,
          ...(type && { type }),
          ...(language && { language }),
          status: 'ready'
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
      });

      return NextResponse.json({ success: true, data: videos });
    }

    // List all videos with pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [productVideos, companyVideos] = await Promise.all([
      db.productVideo.findMany({
        where: {
          ...(type && { type }),
          ...(language && { language }),
          status: 'ready'
        },
        include: {
          product: {
            select: { id: true, name: true, slug: true }
          }
        },
        take: limit,
        skip,
        orderBy: { viewCount: 'desc' }
      }),
      db.companyVideo.findMany({
        where: {
          ...(type && { type }),
          ...(language && { language }),
          status: 'ready'
        },
        include: {
          company: {
            select: { id: true, name: true, slug: true }
          }
        },
        take: limit,
        skip,
        orderBy: { viewCount: 'desc' }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        productVideos,
        companyVideos,
        pagination: { page, limit, total: productVideos.length + companyVideos.length }
      }
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// POST /api/videos - Upload/create new video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      companyId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      type,
      language,
      isPrimary,
      isFeatured
    } = body;

    if (!title || !videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, videoUrl' },
        { status: 400 }
      );
    }

    if (!productId && !companyId) {
      return NextResponse.json(
        { success: false, error: 'Either productId or companyId is required' },
        { status: 400 }
      );
    }

    if (productId) {
      // Create product video
      if (isPrimary) {
        // Remove primary from other videos of this product
        await db.productVideo.updateMany({
          where: { productId },
          data: { isPrimary: false }
        });
      }

      const video = await db.productVideo.create({
        data: {
          productId,
          title,
          description,
          videoUrl,
          thumbnailUrl,
          duration,
          type: type || 'product_demo',
          language,
          isPrimary: isPrimary || false,
          status: 'processing'
        }
      });

      return NextResponse.json({ success: true, data: video }, { status: 201 });
    }

    if (companyId) {
      // Create company video
      const video = await db.companyVideo.create({
        data: {
          companyId,
          title,
          description,
          videoUrl,
          thumbnailUrl,
          duration,
          type: type || 'company_intro',
          language,
          isFeatured: isFeatured || false,
          status: 'processing'
        }
      });

      return NextResponse.json({ success: true, data: video }, { status: 201 });
    }

  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create video' },
      { status: 500 }
    );
  }
}
