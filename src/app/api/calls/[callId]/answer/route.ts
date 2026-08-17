import { NextRequest, NextResponse } from 'next/server'
import { acceptCall, storeOffer, getOffer } from '@/lib/webrtc/signaling-server'

// POST /api/calls/[callId]/answer - Accept a call (send SDP answer)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    const body = await request.json()
    const { calleeId, sdpAnswer } = body

    // Validate required fields
    if (!calleeId) {
      return NextResponse.json(
        { error: 'Missing required field: calleeId' },
        { status: 400 }
      )
    }

    // Get the stored offer to return to the callee
    const offerSdp = await getOffer(callId)

    // Accept the call
    const call = await acceptCall(callId, calleeId, sdpAnswer)

    return NextResponse.json({
      success: true,
      data: call,
      offerSdp,
      message: 'Call accepted successfully',
    })
  } catch (error) {
    console.error('[API] Error accepting call:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to accept call'
    const status = message.includes('not found') ? 404 
                 : message.includes('Unauthorized') ? 403
                 : message.includes('cannot be accepted') ? 409
                 : 500
    
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}

// GET /api/calls/[callId]/answer - Get SDP offer for answering
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    const { searchParams } = new URL(request.url)
    const calleeId = searchParams.get('calleeId')

    if (!calleeId) {
      return NextResponse.json(
        { error: 'Missing required parameter: calleeId' },
        { status: 400 }
      )
    }

    // Get the stored offer
    const offerSdp = await getOffer(callId)

    if (!offerSdp) {
      return NextResponse.json(
        { error: 'No SDP offer found for this call' },
        { status: 404 }
      )
    }

    // Notify that we're handling the call request (for signaling)
    // This is handled separately in production via WebSocket

    return NextResponse.json({
      success: true,
      data: {
        callId,
        offerSdp,
      },
    })
  } catch (error) {
    console.error('[API] Error getting call offer:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get call offer' },
      { status: 500 }
    )
  }
}
