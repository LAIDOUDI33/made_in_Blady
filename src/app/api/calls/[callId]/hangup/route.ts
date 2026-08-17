import { NextRequest, NextResponse } from 'next/server'
import { endCall, declineCall, getCallById } from '@/lib/webrtc/signaling-server'

// POST /api/calls/[callId]/hangup - End a call
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    const body = await request.json()
    const { endedBy, reason } = body

    // Validate required fields
    if (!endedBy) {
      return NextResponse.json(
        { error: 'Missing required field: endedBy' },
        { status: 400 }
      )
    }

    // Check if call exists
    const existingCall = await getCallById(callId)
    if (!existingCall) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    // If call is still ringing and the callee is ending it, treat as decline
    if (existingCall.status === 'RINGING' && endedBy === existingCall.calleeId) {
      await declineCall(callId, endedBy, reason || 'Declined by callee')
      
      return NextResponse.json({
        success: true,
        message: 'Call declined',
        status: 'DECLINED',
      })
    }

    // End the call normally
    const call = await endCall(callId, endedBy)

    return NextResponse.json({
      success: true,
      data: call,
      message: 'Call ended successfully',
    })
  } catch (error) {
    console.error('[API] Error hanging up call:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to hang up'
    const status = message.includes('not found') ? 404 : 500
    
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}

// GET /api/calls/[callId]/hangup - Check if call can be hung up (status check)
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

    const canHangup = ['RINGING', 'CONNECTED', 'ON_HOLD'].includes(call.status)

    return NextResponse.json({
      success: true,
      data: {
        callId,
        status: call.status,
        canHangup,
      },
    })
  } catch (error) {
    console.error('[API] Error checking hangup status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check hangup status' },
      { status: 500 }
    )
  }
}
