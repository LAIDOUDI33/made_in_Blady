import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/calls/recordings - List available recordings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const callId = searchParams.get('callId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: Record<string, unknown> = {
      OR: [
        { callerId: userId },
        { calleeId: userId },
      ],
      isRecording: true,
      recordingUrl: { not: null },
      status: 'ENDED',
    }

    if (callId) {
      where.id = callId
    }

    // Get recordings with pagination
    const [recordings, total] = await Promise.all([
      db.callSession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          callerId: true,
          calleeId: true,
          callerName: true,
          calleeName: true,
          callType: true,
          startedAt: true,
          endedAt: true,
          durationSeconds: true,
          recordingUrl: true,
          hasScreenShare: true,
        },
      }),
      db.callSession.count({ where }),
    ])

    // Format response
    const formattedRecordings = recordings.map(recording => ({
      ...recording,
      canDownload: true, // In production, check permissions
      downloadUrl: recording.recordingUrl ? `/api/calls/recordings/${recording.id}/download` : null,
      fileSize: null, // Would be fetched from storage
    }))

    return NextResponse.json({
      success: true,
      data: formattedRecordings,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('[API] Error getting recordings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get recordings' },
      { status: 500 }
    )
  }
}

// POST /api/calls/recordings - Create recording metadata (called by signaling server)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { callId, recordingUrl, duration } = body

    if (!callId || !recordingUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: callId, recordingUrl' },
        { status: 400 }
      )
    }

    // Update call session with recording info
    const updatedCall = await db.callSession.update({
      where: { id: callId },
      data: {
        isRecording: true,
        recordingUrl,
        durationSeconds: duration,
      },
    })

    // Log recording event
    await db.callEvent.create({
      data: {
        callSessionId: callId,
        eventType: 'RECORDING_SAVED',
        metadata: JSON.stringify({ recordingUrl, duration }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedCall,
      message: 'Recording saved successfully',
    })
  } catch (error) {
    console.error('[API] Error saving recording:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save recording' },
      { status: 500 }
    )
  }
}
