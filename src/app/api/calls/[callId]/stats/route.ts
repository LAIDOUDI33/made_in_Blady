import { NextRequest, NextResponse } from 'next/server'
import { getCallStats, getCallById } from '@/lib/webrtc/signaling-server'

// GET /api/calls/[callId]/stats - Get call statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    
    // Check if call exists
    const call = await getCallById(callId)
    
    if (!call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    // Get call stats
    const stats = await getCallStats(callId)

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        callInfo: {
          id: call.id,
          status: call.status,
          durationSeconds: call.durationSeconds,
          mediaQuality: call.mediaQuality,
          isRecording: call.isRecording,
        },
      },
    })
  } catch (error) {
    console.error('[API] Error getting call stats:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to get call stats'
    const status = message.includes('not found') ? 404 : 500
    
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}
