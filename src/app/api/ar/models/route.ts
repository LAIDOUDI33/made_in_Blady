import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ar/models - List all products with AR models
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const enabledOnly = searchParams.get('enabled') !== 'false'

    // Build where clause
    const where: any = {}
    if (enabledOnly) {
      where.isEnabled = true
    }

    // Get models with pagination
    const [models, total] = await Promise.all([
      db.aRProductModel.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.aRProductModel.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: models.map(model => ({
        ...model,
        hotspots: JSON.parse(model.hotspots),
        animations: JSON.parse(model.animations),
        materialVariations: JSON.parse(model.materialVariations),
        scale: JSON.parse(model.scale as string),
        rotation: JSON.parse(model.rotation as string),
        position: { x: 0, y: 0, z: 0 }, // Default position
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('[AR API] Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AR models' },
      { status: 500 }
    )
  }
}

// POST /api/ar/models - Create new AR model entry (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productId,
      name,
      modelUrl,
      thumbnailUrl,
      format = 'GLB',
      scale = { x: 1, y: 1, z: 1 },
      rotation = { x: 0, y: 0, z: 0 },
      fileSize,
      polygonCount,
      optimizedForMobile = true,
      hotspots = [],
      animations = [],
      materialVariations = [],
    } = body

    // Validate required fields
    if (!productId || !name || !modelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, name, modelUrl' },
        { status: 400 }
      )
    }

    // Check if model already exists for this product
    const existing = await db.aRProductModel.findUnique({
      where: { productId },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'AR model already exists for this product' },
        { status: 409 }
      )
    }

    // Create AR model record
    const model = await db.aRProductModel.create({
      data: {
        productId,
        name,
        modelUrl,
        thumbnailUrl: thumbnailUrl || '',
        format,
        scale: JSON.stringify(scale),
        rotation: JSON.stringify(rotation),
        fileSize: fileSize || 0,
        polygonCount: polygonCount || 0,
        optimizedForMobile,
        hotspots: JSON.stringify(hotspots),
        animations: JSON.stringify(animations),
        materialVariations: JSON.stringify(materialVariations),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...model,
        hotspots,
        animations,
        materialVariations,
        scale,
        rotation,
        position: { x: 0, y: 0, z: 0 },
      },
      message: 'AR model created successfully',
    })
  } catch (error) {
    console.error('[AR API] Error creating model:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create AR model' },
      { status: 500 }
    )
  }
}
