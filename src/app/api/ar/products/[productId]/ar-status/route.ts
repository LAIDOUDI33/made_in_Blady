import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ar/products/[productId]/ar-status - Check if product has AR model
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    // Find AR model for this product
    const arModel = await db.aRProductModel.findUnique({
      where: { productId },
    })

    if (!arModel) {
      return NextResponse.json({
        success: true,
        data: {
          hasARModel: false,
          model: null,
          message: 'No AR model available for this product',
        },
      })
    }

    // Parse JSON fields
    const modelData = {
      ...arModel,
      hotspots: JSON.parse(arModel.hotspots),
      animations: JSON.parse(arModel.animations),
      materialVariations: JSON.parse(arModel.materialVariations),
      scale: JSON.parse(arModel.scale as string),
      rotation: JSON.parse(arModel.rotation as string),
    }

    return NextResponse.json({
      success: true,
      data: {
        hasARModel: true,
        model: {
          id: arModel.id,
          modelUrl: arModel.modelUrl,
          thumbnailUrl: arModel.thumbnailUrl,
          format: arModel.format,
          scale: modelData.scale,
          rotation: modelData.rotation,
          polygonCount: arModel.polygonCount,
          optimizedForMobile: arModel.optimizedForMobile,
          isEnabled: arModel.isEnabled,
          viewsCount: arModel.viewsCount,
          hotspots: modelData.hotspots,
          animations: modelData.animations,
          materialVariations: modelData.materialVariations,
        },
        message: 'AR model available',
      },
    })
  } catch (error) {
    console.error('[AR Status] Error checking status:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check AR status' 
      },
      { status: 500 }
    )
  }
}
