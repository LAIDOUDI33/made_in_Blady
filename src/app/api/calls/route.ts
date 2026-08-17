import { NextRequest, NextResponse } from 'next/server'
import { initiateCall, getActiveCalls, type CallType, type MediaQuality } from '@/lib/webrtc/signaling-server'

// POST /api/calls - Initiate a new call
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      callerId,
      callerName,
      callerAvatar,
      calleeId,
      calleeName,
      calleeAvatar,
      callType,
      contextType,
      contextId,
      mediaQuality,
      isPremiumCall,
      transcriptionEnabled,
    } = body

    // Validate required fields
    if (!callerId || !calleeId || !callType || !callerName || !calleeName) {
      return NextResponse.json(
        { error: 'Missing required fields: callerId, calleeId, callType, callerName, calleeName' },
        { status: 400 }
      )
    }

    // Validate call type
    const validCallTypes: CallType[] = ['AUDIO', 'VIDEO', 'SCREEN_SHARE']
    if (!validCallTypes.includes(callType)) {
      return NextResponse.json(
        { error: `Invalid callType. Must be one of: ${validCallTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate media quality if provided
    if (mediaQuality) {
      const validQualities: MediaQuality[] = ['SD', 'HD', 'FHD', 'UHD']
      if (!validQualities.includes(mediaQuality)) {
        return NextResponse.json(
          { error: `Invalid mediaQuality. Must be one of: ${validQualities.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Initiate the call
    const call = await initiateCall({
      callerId,
      callerName,
      callerAvatar,
      calleeId,
      calleeName,
      calleeAvatar,
      callType,
      contextType,
      contextId,
      mediaQuality,
      isPremiumCall,
      transcriptionEnabled,
    })

    return NextResponse.json({
      success: true,
      data: call,
      message: 'Call initiated successfully',
    })
  } catch (error) {
    console.error('[API] Error initiating call:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate call' },
      { status: 500 }
    )
  }
}

// GET /api/calls/active - Get user's active calls
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    const activeCallsList = await getActiveCalls(userId)

    return NextResponse.json({
      success: true,
      data: activeCallsList,
      count: activeCallsList.length,
    })
  } catch (error) {
    console.error('[API] Error getting active calls:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get active calls' },
      { status: 500 }
    )
  }
}
