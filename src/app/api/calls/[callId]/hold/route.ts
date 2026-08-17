import { NextRequest, NextResponse } from 'next/server'
import { toggleHold, getCallById } from '@/lib/webrtc/signaling-server'

// POST /api/calls/[callId]/hold - Toggle hold state
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    const body = await request.json()
    const { userId, onHold } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    if (typeof onHold !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid field: onHold (must be boolean)' },
        { status: 400 }
      )
    }

    // Check if call exists and is in valid state
    const existingCall = await getCallById(callId)
    if (!existingCall) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    // Toggle hold state
    await toggleHold(callId, userId, onHold)

    // Get updated call
    const updatedCall = await getCallById(callId)

    return NextResponse.json({
      success: true,
      data: updatedCall,
      message: `Call ${onHold ? 'placed on hold' : 'resumed'} successfully`,
    })
  } catch (error) {
    console.error('[API] Error toggling hold:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to toggle hold'
    const status = message.includes('not found') ? 404 
                 : message.includes('Unauthorized') ? 403
                 : message.includes('Cannot toggle') ? 409
                 : 500
    
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}

// GET /api/calls/[callId]/hold - Get current hold state
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
      data: {
        callId,
        isOnHold: call.status === 'ON_HOLD',
        status: call.status,
      },
    })
  } catch (error) {
    console.error('[API] Error getting hold state:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get hold state' },
      { status: 500 }
    )
  }
}
