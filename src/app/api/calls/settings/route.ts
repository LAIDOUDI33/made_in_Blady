import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/calls/settings - Get user's call settings
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

    // Get or create default settings for user
    let settings = await db.callSettings.findUnique({
      where: { userId },
    })

    if (!settings) {
      settings = await db.callSettings.create({
        data: {
          userId,
          defaultCallType: 'VIDEO',
          defaultMediaQuality: 'HD',
          enableAutoAnswer: false,
          allowCallsFrom: 'EVERYONE',
          showOnlineStatus: true,
          enableNotifications: true,
          autoRecordCalls: false,
          recordVideo: true,
          storeRecordings: true,
          enableHDVideo: true,
          enableNoiseSuppression: true,
          enableEchoCancellation: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('[API] Error getting call settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get call settings' },
      { status: 500 }
    )
  }
}

// PUT /api/calls/settings - Update user's call settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...settingsData } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    // Validate allowed fields
    const allowedFields = [
      'defaultCallType',
      'defaultMediaQuality',
      'enableAutoAnswer',
      'autoAnswerDelay',
      'preferredCamera',
      'preferredMicrophone',
      'preferredSpeaker',
      'allowCallsFrom',
      'showOnlineStatus',
      'enableNotifications',
      'autoRecordCalls',
      'recordVideo',
      'storeRecordings',
      'enableHDVideo',
      'enableNoiseSuppression',
      'enableEchoCancellation',
      'metadata',
    ]

    const updateData: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(settingsData)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Upsert settings (create if not exists)
    const settings = await db.callSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...updateData,
      },
      update: updateData,
    })

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Call settings updated successfully',
    })
  } catch (error) {
    console.error('[API] Error updating call settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update call settings' },
      { status: 500 }
    )
  }
}
