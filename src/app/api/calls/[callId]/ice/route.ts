import { NextRequest, NextResponse } from 'next/server'
import { exchangeICECandidate, getCallById } from '@/lib/webrtc/signaling-server'

// POST /api/calls/[callId]/ice - Send ICE candidate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    const body = await request.json()
    const { userId, candidate, sdpMid, sdpMLineIndex } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    if (!candidate) {
      return NextResponse.json(
        { error: 'Missing required field: candidate' },
        { status: 400 }
      )
    }

    // Verify call exists and is in valid state
    const call = await getCallById(callId)
    if (!call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    // Exchange the ICE candidate
    await exchangeICECandidate(callId, userId, {
      candidate,
      sdpMid,
      sdpMLineIndex,
    })

    return NextResponse.json({
      success: true,
      message: 'ICE candidate exchanged successfully',
    })
  } catch (error) {
    console.error('[API] Error exchanging ICE candidate:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to exchange ICE candidate'
    const status = message.includes('not found') ? 404 
                 : message.includes('Unauthorized') ? 403
                 : message.includes('Cannot exchange') ? 409
                 : 500
    
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}

// GET /api/calls/[callId]/ice - Get all ICE candidates for a call (for debugging)
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
      data: call.iceCandidates,
      count: call.iceCandidates.length,
    })
  } catch (error) {
    console.error('[API] Error getting ICE candidates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get ICE candidates' },
      { status: 500 }
    )
  }
}
