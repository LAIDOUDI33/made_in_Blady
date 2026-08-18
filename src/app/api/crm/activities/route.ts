import { NextRequest, NextResponse } from 'next/server'
import { 
  logActivity, 
  searchActivities,
  getContactActivities,
  getLeadActivities,
  getRecentActivities,
  scheduleFollowUp,
  analyzeSentiment
} from '@/lib/crm/activities'

// GET /api/crm/activities - List activities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filter: any = {}
    const options: any = {}
    
    if (searchParams.get('companyId')) filter.companyId = searchParams.get('companyId')!
    if (searchParams.get('contactId')) filter.contactId = searchParams.get('contactId')!
    if (searchParams.get('leadId')) filter.leadId = searchParams.get('leadId')!
    if (searchParams.get('type')) filter.type = searchParams.get('type')!
    if (searchParams.get('direction')) filter.direction = searchParams.get('direction')!
    if (searchParams.get('sentiment')) filter.sentiment = searchParams.get('sentiment')!
    if (searchParams.get('createdBy')) filter.createdBy = searchParams.get('createdBy')!
    if (searchParams.get('search')) filter.search = searchParams.get('search')!
    if (searchParams.get('createdFrom')) filter.createdFrom = new Date(searchParams.get('createdFrom')!)
    if (searchParams.get('createdTo')) filter.createdTo = new Date(searchParams.get('createdTo')!)
    
    options.page = parseInt(searchParams.get('page') || '1')
    options.pageSize = parseInt(searchParams.get('pageSize') || '20')
    options.sortBy = (searchParams.get('sortBy') as any) || 'createdAt'
    options.sortOrder = (searchParams.get('sortOrder') as any) || 'desc'
    
    // Special case: recent activities for dashboard
    if (searchParams.get('recent') === 'true' && filter.companyId) {
      const limit = parseInt(searchParams.get('limit') || '10')
      const activities = await getRecentActivities(filter.companyId, limit)
      return NextResponse.json({ success: true, data: activities })
    }
    
    // Contact activities
    if (filter.contactId && !filter.leadId) {
      const limit = parseInt(searchParams.get('limit') || '50')
      const activities = await getContactActivities(filter.contactId, limit)
      return NextResponse.json({ success: true, data: activities })
    }
    
    // Lead activities
    if (filter.leadId) {
      const limit = parseInt(searchParams.get('limit') || '50')
      const activities = await getLeadActivities(filter.leadId, limit)
      return NextResponse.json({ success: true, data: activities })
    }
    
    const result = await searchActivities(filter, options)
    
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

// POST /api/crm/activities - Log a new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.contactId || !body.type || !body.subject || !body.companyId || !body.createdBy) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: contactId, type, subject, companyId, createdBy' 
        },
        { status: 400 }
      )
    }
    
    const activity = await logActivity({
      contactId: body.contactId,
      leadId: body.leadId,
      companyId: body.companyId,
      type: body.type,
      direction: body.direction || 'OUTBOUND',
      subject: body.subject,
      description: body.description,
      durationMinutes: body.durationMinutes,
      channel: body.channel,
      sentiment: body.sentiment,
      nextSteps: body.nextSteps,
      attachments: body.attachments,
      automated: body.automated || false,
      triggeredBy: body.triggeredBy,
      createdBy: body.createdBy,
    })
    
    // Auto-schedule follow-up if requested
    let followUpTask = null
    if (body.scheduleFollowUp) {
      followUpTask = await scheduleFollowUp(activity.id, {
        overrideDelayHours: body.followUpDelayHours,
        customTaskTitle: body.followUpTitle,
        customTaskDescription: body.followUpDescription,
        assignedTo: body.followUpAssignee || body.createdBy,
      })
    }
    
    // Auto-analyze sentiment if requested
    let sentimentResult = null
    if (body.analyzeSentiment) {
      sentimentResult = await analyzeSentiment(activity.id)
    }
    
    return NextResponse.json({ 
      success: true, 
      data: activity,
      ...(followUpTask && { followUpTask }),
      ...(sentimentResult && { sentimentResult }),
    }, { status: 201 })
  } catch (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to log activity' },
      { status: 500 }
    )
  }
}
