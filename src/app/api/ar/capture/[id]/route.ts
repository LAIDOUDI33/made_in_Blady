import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'
import path from 'path'

// DELETE /api/ar/capture/[id] - Delete a snapshot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find the snapshot
    const snapshot = await db.aRSnapshot.findUnique({
      where: { id },
    })

    if (!snapshot) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      )
    }

    // Delete physical files
    try {
      if (snapshot.imageUrl) {
        const imagePath = path.join(process.cwd(), 'public', snapshot.imageUrl)
        await unlink(imagePath).catch(() => {}) // Ignore if file doesn't exist
      }

      if (snapshot.thumbnailUrl) {
        const thumbPath = path.join(process.cwd(), 'public', snapshot.thumbnailUrl)
        await unlink(thumbPath).catch(() => {})
      }
    } catch (error) {
      console.warn('[AR Capture] Error deleting files:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete database record
    await db.aRSnapshot.delete({
      where: { id },
    })

    console.log(`[AR Capture] Snapshot deleted: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Snapshot deleted successfully',
    })
  } catch (error) {
    console.error('[AR Capture] Error deleting snapshot:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete snapshot' },
      { status: 500 }
    )
  }
}

// GET /api/ar/capture/[id] - Get single snapshot details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const snapshot = await db.aRSnapshot.findUnique({
      where: { id },
      include: {
        model: {
          select: {
            id: true,
            productId: true,
            name: true,
            modelUrl: true,
          },
        },
      },
    })

    if (!snapshot) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...snapshot,
        metadata: snapshot.metadata ? JSON.parse(snapshot.metadata) : {},
      },
    })
  } catch (error) {
    console.error('[AR Capture] Error fetching snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to fetch snapshot' },
      { status: 500 }
    )
  }
}
