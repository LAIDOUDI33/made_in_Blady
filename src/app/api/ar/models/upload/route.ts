import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'

// POST /api/ar/models/upload - Upload 3D model file (admin)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const productId = formData.get('productId') as string
    const name = formData.get('name') as string

    // Validate required fields
    if (!file || !productId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: file, productId, name' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedExtensions = ['.glb', '.gltf', '.fbx', '.usdz']
    const fileExtension = path.extname(file.name).toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      )
    }

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ar-models')
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 10)
    const fileName = `${timestamp}_${randomId}${fileExtension}`
    const filePath = path.join(uploadDir, fileName)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Determine format from extension
    const formatMap: Record<string, string> = {
      '.glb': 'GLB',
      '.gltf': 'GLTF',
      '.fbx': 'FBX',
      '.usdz': 'USDZ',
    }
    const format = formatMap[fileExtension] || 'GLB'

    // Generate thumbnail URL (would be generated server-side in production)
    const thumbnailUrl = `/uploads/ar-models/thumbnails/${fileName.replace(fileExtension, '.png')}`

    // Create or update AR model record
    const modelUrl = `/uploads/ar-models/${fileName}`
    
    try {
      const model = await db.aRProductModel.create({
        data: {
          productId,
          name,
          modelUrl,
          thumbnailUrl,
          format,
          scale: JSON.stringify({ x: 1, y: 1, z: 1 }),
          rotation: JSON.stringify({ x: 0, y: 0, z: 0 }),
          fileSize: Math.round(file.size / 1024), // KB
          polygonCount: 0, // Would be calculated from model
          optimizedForMobile: true,
          hotspots: JSON.stringify([]),
          animations: JSON.stringify([]),
          materialVariations: JSON.stringify([]),
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          ...model,
          hotspots: [],
          animations: [],
          materialVariations: [],
          scale: { x: 1, y: 1, z: 1 },
          rotation: { x: 0, y: 0, z: 0 },
          position: { x: 0, y: 0, z: 0 },
        },
        message: 'Model uploaded successfully',
      })
    } catch (dbError: any) {
      // If record creation fails, clean up uploaded file
      const fs = await import('fs/promises')
      await fs.unlink(filePath).catch(() => {})
      
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'AR model already exists for this product' },
          { status: 409 }
        )
      }
      
      throw dbError
    }
  } catch (error) {
    console.error('[AR Upload API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload model' },
      { status: 500 }
    )
  }
}
