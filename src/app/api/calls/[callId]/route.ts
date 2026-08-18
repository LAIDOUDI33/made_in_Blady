import { NextRequest, NextResponse } from 'next/server'
import { getCallById, endCall, type CallStatus } from '@/lib/webrtc/signaling-server'

// GET /api/calls/[callId] - Get call details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    
    const call = await getCallById(callId)
    
    if (!call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: call,
    })
  } catch (error) {
    console.error('[API] Error getting call:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get call' },
      { status: 500 }
    )
  }
}

// DELETE /api/calls/[callId] - End/decline a call (alternative to hangup)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    const { searchParams } = new URL(request.url)
    const endedBy = searchParams.get('endedBy') || 'unknown'
    
    const call = await endCall(callId, endedBy)

    return NextResponse.json({
      success: true,
      data: call,
      message: 'Call ended successfully',
    })
  } catch (error) {
    console.error('[API] Error ending call:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to end call' },
      { status: 500 }
    )
  }
}
