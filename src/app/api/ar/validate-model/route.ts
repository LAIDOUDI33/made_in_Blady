import { NextRequest, NextResponse } from 'next/server'
import { validateModelFile, getOptimizationEstimate } from '@/lib/ar/model-manager'

// POST /api/ar/validate-model - Validate uploaded model file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Run validation
    const validation = validateModelFile(file)

    // Get optimization suggestions
    const fileSizeKB = Math.round(file.size / 1024)
    const optimization = getOptimizationEstimate(fileSizeKB, validation.valid ? 50000 : 0)

    // Determine format
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    // Check if we can read magic bytes (basic check for GLB)
    let detectedFormat = null
    let isValidFormat = false
    
    try {
      const buffer = await file.slice(0, 12).arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // GLB detection (magic: glTF)
      if (
        bytes[0] === 0x67 && // g
        bytes[1] === 0x6c && // l
        bytes[2] === 0x54 && // T
        bytes[3] === 0x46    // F
      ) {
        detectedFormat = 'glb'
        isValidFormat = true
      }
      
      // Check for JSON start (GLTF)
      if (!isValidFormat) {
        const textDecoder = new TextDecoder()
        const header = textDecoder.decode(bytes.slice(0, 1))
        if (header === '{' || extension === '.gltf') {
          detectedFormat = 'gltf'
          isValidFormat = true
        }
      }

      // ZIP-based formats (USDZ)
      if (!isValidFormat && 
          bytes[0] === 0x50 && // P
          bytes[1] === 0x4b && // K
          bytes[2] === 0x03 &&
          bytes[3] === 0x04) {
        if (extension === '.usdz') {
          detectedFormat = 'usdz'
          isValidFormat = true
        }
      }
    } catch (error) {
      console.warn('[Validate Model] Could not detect format:', error)
    }

    // Build response
    const result = {
      success: validation.valid,
      fileName: file.name,
      fileSize: file.size,
      fileSizeFormatted: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      format: detectedFormat || extension?.replace('.', '') || 'unknown',
      isValidFormat,
      errors: validation.errors,
      warnings: validation.warnings,
      optimization: {
        canOptimize: optimization.canOptimize,
        estimatedReduction: optimization.estimatedReduction,
        recommendations: optimization.recommendations,
      },
      metadata: {
        lastModified: file.lastModified,
        type: file.type,
      },
    }

    // Return appropriate status code
    const statusCode = validation.valid ? 200 : 422

    return NextResponse.json({
      success: validation.valid,
      data: result,
      message: validation.valid 
        ? 'File is valid and ready for upload' 
        : 'File validation failed. Please fix the errors before uploading.',
    }, { status: statusCode })
  } catch (error) {
    console.error('[Validate Model] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Validation failed' },
      { status: 500 }
    )
  }
}

// GET /api/ar/validate-model - Get supported formats and limits
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      supportedFormats: ['glb', 'gltf', 'usdz'],
      maxFileSizeMB: 50,
      recommendedSettings: {
        maxPolygonCount: 50000,
        textureResolution: 1024,
        compression: 'draco',
      },
      tips: [
        'GLB format is recommended for best web performance',
        'Keep models under 10MB for optimal loading times',
        'Use Draco compression to reduce file size',
        'Target polygon count of 50,000 or less for mobile devices',
        'Texture resolution of 1024x1024 is usually sufficient',
      ],
    },
  })
}
