import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ar/models/[productId] - Get AR model for specific product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    const model = await db.aRProductModel.findUnique({
      where: { productId },
    })

    if (!model) {
      return NextResponse.json(
        { error: 'AR model not found for this product' },
        { status: 404 }
      )
    }

    // Increment view count
    await db.aRProductModel.update({
      where: { id: model.id },
      data: { viewsCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...model,
        hotspots: JSON.parse(model.hotspots),
        animations: JSON.parse(model.animations),
        materialVariations: JSON.parse(model.materialVariations),
        scale: JSON.parse(model.scale as string),
        rotation: JSON.parse(model.rotation as string),
        position: { x: 0, y: 0, z: 0 }, // Default position
      },
    })
  } catch (error) {
    console.error('[AR API] Error fetching model:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AR model' },
      { status: 500 }
    )
  }
}

// PUT /api/ar/models/[productId] - Update AR model configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const body = await request.json()

    // Check if model exists
    const existing = await db.aRProductModel.findUnique({
      where: { productId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'AR model not found' },
        { status: 404 }
      )
    }

    // Build update data - only update provided fields
    const updateData: any = {}
    
    const allowedFields = [
      'name', 'modelUrl', 'thumbnailUrl', 'format',
      'fileSize', 'polygonCount', 'optimizedForMobile', 'isEnabled'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Handle JSON fields
    if (body.scale !== undefined) {
      updateData.scale = JSON.stringify(body.scale)
    }
    if (body.rotation !== undefined) {
      updateData.rotation = JSON.stringify(body.rotation)
    }
    if (body.hotspots !== undefined) {
      updateData.hotspots = JSON.stringify(body.hotspots)
    }
    if (body.animations !== undefined) {
      updateData.animations = JSON.stringify(body.animations)
    }
    if (body.materialVariations !== undefined) {
      updateData.materialVariations = JSON.stringify(body.materialVariations)
    }

    // Update timestamp
    updateData.updatedAt = new Date()

    const updatedModel = await db.aRProductModel.update({
      where: { productId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedModel,
        hotspots: JSON.parse(updatedModel.hotspots),
        animations: JSON.parse(updatedModel.animations),
        materialVariations: JSON.parse(updatedModel.materialVariations),
        scale: JSON.parse(updatedModel.scale as string),
        rotation: JSON.parse(updatedModel.rotation as string),
      },
      message: 'AR model updated successfully',
    })
  } catch (error) {
    console.error('[AR API] Error updating model:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update AR model' },
      { status: 500 }
    )
  }
}

// DELETE /api/ar/models/[productId] - Remove AR model
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    // Check if model exists
    const existing = await db.aRProductModel.findUnique({
      where: { productId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'AR model not found' },
        { status: 404 }
      )
    }

    // Delete the model record
    await db.aRProductModel.delete({
      where: { productId },
    })

    return NextResponse.json({
      success: true,
      message: 'AR model deleted successfully',
    })
  } catch (error) {
    console.error('[AR API] Error deleting model:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete AR model' },
      { status: 500 }
    )
  }
}
