import { NextRequest, NextResponse } from 'next/server'
import { toggleRecording, getCallById, generateCallRecordingURL } from '@/lib/webrtc/signaling-server'

// POST /api/calls/[callId]/recording - Toggle recording
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params
    const body = await request.json()
    const { userId, recording } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    if (typeof recording !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid field: recording (must be boolean)' },
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

    if (existingCall.status !== 'CONNECTED') {
      return NextResponse.json(
        { error: 'Can only record connected calls' },
        { status: 409 }
      )
    }

    // Toggle recording
    await toggleRecording(callId, userId, recording)

    // Get updated call
    const updatedCall = await getCallById(callId)

    let recordingUrl = undefined
    if (recording && updatedCall?.recordingUrl) {
      try {
        recordingUrl = await generateCallRecordingURL(callId)
      } catch (error) {
        console.error('[API] Error generating recording URL:', error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isRecording: updatedCall?.isRecording,
        recordingUrl,
      },
      message: `Recording ${recording ? 'started' : 'stopped'} successfully`,
    })
  } catch (error) {
    console.error('[API] Error toggling recording:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to toggle recording'
    const status = message.includes('not found') ? 404 
                 : message.includes('Unauthorized') ? 403
                 : message.includes('Can only record') ? 409
                 : 500
    
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}

// GET /api/calls/[callId]/recording - Get recording info and URL
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

    // Generate signed URL for recording access
    let recordingUrl = undefined
    if (call.isRecording && call.recordingUrl) {
      try {
        recordingUrl = await generateCallRecordingURL(callId)
      } catch (error) {
        console.error('[API] Error generating recording URL:', error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        callId,
        isRecording: call.isRecording,
        hasRecording: !!call.recordingUrl,
        recordingUrl,
        durationSeconds: call.durationSeconds,
      },
    })
  } catch (error) {
    console.error('[API] Error getting recording info:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to get recording info'
    const status = message.includes('not found') ? 404 
                 : message.includes('not recorded') ? 400
                 : 500
    
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}
