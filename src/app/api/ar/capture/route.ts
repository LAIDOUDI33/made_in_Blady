import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// POST /api/ar/capture - Save AR snapshot
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const snapshot = formData.get('snapshot') as File | null
    const modelId = formData.get('modelId') as string
    const userId = formData.get('userId') as string
    const productName = formData.get('productName') as string | null
    const productId = formData.get('productId') as string | null

    // Validate required fields
    if (!snapshot || !modelId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: snapshot, modelId, userId' },
        { status: 400 }
      )
    }

    // Check if model exists
    const model = await db.aRProductModel.findUnique({
      where: { id: modelId },
    })

    if (!model) {
      return NextResponse.json(
        { error: 'AR model not found' },
        { status: 404 }
      )
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'ar', 'snapshots')
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const extension = snapshot.name.split('.').pop() || 'png'
    const filename = `snapshot-${timestamp}-${randomId}.${extension}`
    const filepath = path.join(uploadDir, filename)

    // Save file
    const bytes = await snapshot.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Generate thumbnail (simplified - just use same image)
    const thumbnailFilename = `thumb-${filename}`
    const thumbnailPath = path.join(uploadDir, thumbnailFilename)
    await writeFile(thumbnailPath, buffer)

    // Generate share token
    const shareToken = `${timestamp}-${randomId}`

    // Build metadata object
    const metadata: Record<string, any> = {}
    if (productName) metadata.productName = productName
    if (productId) metadata.productId = productId

    // Save to database
    const savedSnapshot = await db.aRSnapshot.create({
      data: {
        modelId,
        userId,
        imageUrl: `/ar/snapshots/${filename}`,
        thumbnailUrl: `/ar/snapshots/${thumbnailFilename}`,
        shareToken,
        metadata: JSON.stringify(metadata),
      },
    })

    // Update model's snapshot count implicitly through relation
    console.log(`[AR Capture] Snapshot saved: ${savedSnapshot.id}`)

    return NextResponse.json({
      success: true,
      data: {
        id: savedSnapshot.id,
        imageUrl: savedSnapshot.imageUrl,
        thumbnailUrl: savedSnapshot.thumbnailUrl,
        shareToken: savedSnapshot.shareToken,
        capturedAt: savedSnapshot.capturedAt,
      },
      message: 'Snapshot saved successfully',
    })
  } catch (error) {
    console.error('[AR Capture] Error saving snapshot:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save snapshot' },
      { status: 500 }
    )
  }
}

// GET /api/ar/capture - List snapshots for user or model
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const modelId = searchParams.get('modelId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build where clause
    const where: Record<string, any> = {}
    
    if (userId) where.userId = userId
    if (modelId) where.modelId = modelId

    // Get snapshots with pagination
    const [snapshots, total] = await Promise.all([
      db.aRSnapshot.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { capturedAt: 'desc' },
        include: {
          model: {
            select: {
              id: true,
              productId: true,
              name: true,
            },
          },
        },
      }),
      db.aRSnapshot.count({ where }),
    ])

    // Parse metadata for each snapshot
    const formattedSnapshots = snapshots.map(snapshot => ({
      ...snapshot,
      metadata: snapshot.metadata ? JSON.parse(snapshot.metadata) : {},
    }))

    return NextResponse.json({
      success: true,
      data: formattedSnapshots,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('[AR Capture] Error fetching snapshots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    )
  }
}
