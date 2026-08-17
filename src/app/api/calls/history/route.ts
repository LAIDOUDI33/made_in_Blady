import { NextRequest, NextResponse } from 'next/server'
import { getCallHistory, type CallStatus, type CallType } from '@/lib/webrtc/signaling-server'

// GET /api/calls/history - Get call history with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Required parameter
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    // Optional filter parameters
    const status = searchParams.get('status') as CallStatus | null
    const callType = searchParams.get('callType') as CallType | null
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    // Validate status if provided
    if (status) {
      const validStatuses: CallStatus[] = ['RINGING', 'CONNECTED', 'ON_HOLD', 'ENDED', 'DECLINED', 'FAILED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate callType if provided
    if (callType) {
      const validTypes: CallType[] = ['AUDIO', 'VIDEO', 'SCREEN_SHARE']
      if (!validTypes.includes(callType)) {
        return NextResponse.json(
          { error: `Invalid callType. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate pagination
    if (page < 1 || isNaN(page)) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      )
    }

    if (pageSize < 1 || pageSize > 100 || isNaN(pageSize)) {
      return NextResponse.json(
        { error: 'pageSize must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Parse dates if provided
    let parsedDateFrom: Date | undefined
    let parsedDateTo: Date | undefined

    if (dateFrom) {
      parsedDateFrom = new Date(dateFrom)
      if (isNaN(parsedDateFrom.getTime())) {
        return NextResponse.json(
          { error: 'Invalid dateFrom format. Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)' },
          { status: 400 }
        )
      }
    }

    if (dateTo) {
      parsedDateTo = new Date(dateTo)
      if (isNaN(parsedDateTo.getTime())) {
        return NextResponse.json(
          { error: 'Invalid dateTo format. Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)' },
          { status: 400 }
        )
      }
    }

    // Get call history
    const result = await getCallHistory({
      userId,
      status: status || undefined,
      callType: callType || undefined,
      dateFrom: parsedDateFrom,
      dateTo: parsedDateTo,
      page,
      pageSize,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[API] Error getting call history:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get call history' },
      { status: 500 }
    )
  }
}
