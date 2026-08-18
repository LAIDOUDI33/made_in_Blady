import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFile, existsSync } from 'fs/promises'
import { join } from 'path'

// GET /api/calls/recordings/[callId]/download - Download a specific recording
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    // Get call session
    const callSession = await db.callSession.findUnique({
      where: { id: callId },
    })

    if (!callSession) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      )
    }

    // Verify user is part of this call
    if (callSession.callerId !== userId && callSession.calleeId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to access this recording' },
        { status: 403 }
      )
    }

    // Check if recording exists
    if (!callSession.recordingUrl || !callSession.isRecording) {
      return NextResponse.json(
        { error: 'No recording available for this call' },
        { status: 404 }
      )
    }

    // In production, you would:
    // 1. Generate a signed URL for cloud storage (S3, GCS, etc.)
    // 2. Or stream the file from local storage
    // For now, we'll check if file exists locally and serve it

    const recordingsDir = process.env.RECORDINGS_DIR || join(process.cwd(), 'recordings')
    
    // Try to find the file
    const possiblePaths = [
      join(recordingsDir, `${callId}.webm`),
      join(recordingsDir, `${callId}.mp4`),
      join(recordingsDir, `rec_${callId}.webm`),
    ]

    let filePath: string | null = null
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        filePath = path
        break
      }
    }

    if (filePath) {
      const fileBuffer = await readFile(filePath)
      const ext = filePath.split('.').pop() || 'webm'
      
      // Determine content type
      const contentTypes: Record<string, string> = {
        webm: 'video/webm',
        mp4: 'video/mp4',
        ogg: 'video/ogg',
      }

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentTypes[ext] || 'video/webm',
          'Content-Disposition': `attachment; filename="call-recording-${callId}.${ext}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'private, max-age=3600',
        },
      })
    }

    // If no local file found, redirect to the stored URL (if it's an external URL)
    if (callSession.recordingUrl.startsWith('http')) {
      return NextResponse.redirect(callSession.recordingUrl)
    }

    // Return metadata about the recording
    return NextResponse.json({
      success: true,
      data: {
        callId,
        recordingUrl: callSession.recordingUrl,
        durationSeconds: callSession.durationSeconds,
        startedAt: callSession.startedAt,
        endedAt: callSession.endedAt,
        participants: [
          { id: callSession.callerId, name: callSession.callerName },
          { id: callSession.calleeId, name: callSession.calleeName },
        ],
        message: 'Recording metadata - file may be in external storage',
      },
    })
  } catch (error) {
    console.error('[API] Error downloading recording:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download recording' },
      { status: 500 }
    )
  }
}
