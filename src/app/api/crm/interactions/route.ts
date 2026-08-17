import { NextRequest, NextResponse } from 'next/server'
import { logInteraction, getInteractionTimeline, extractActionItems, sentimentAnalysis } from '@/lib/crm'
import { db } from '@/lib/db'

// GET /api/crm/interactions - List interactions with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const contactId = searchParams.get('contactId')
    const leadId = searchParams.get('leadId')
    const type = searchParams.get('type')
    const direction = searchParams.get('direction')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const skip = (page - 1) * pageSize
    
    // Build where clause
    const where: any = {}
    
    if (contactId) where.contactId = contactId
    if (leadId) where.leadId = leadId
    if (type) where.type = type
    if (direction) where.direction = direction
    
    // Date filters
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }
    
    // Get total count and paginated results
    const [interactions, total] = await Promise.all([
      db.cRMInteraction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          lead: { select: { id: true, companyName: true, leadNumber: true } },
        },
      }),
      db.cRMInteraction.count({ where }),
    ])
    
    const formattedInteractions = interactions.map(interaction => ({
      id: interaction.id,
      contactId: interaction.contactId,
      contact: interaction.contact,
      leadId: interaction.leadId,
      lead: interaction.lead,
      companyId: interaction.companyId,
      type: interaction.type,
      direction: interaction.direction,
      subject: interaction.subject,
      content: interaction.content.substring(0, 200) + (interaction.content.length > 200 ? '...' : ''),
      duration: interaction.duration,
      channel: interaction.channel,
      sentiment: interaction.sentiment,
      nextSteps: interaction.nextSteps,
      attachmentUrls: JSON.parse(interaction.attachmentUrls || '[]'),
      automated: interaction.automated,
      createdBy: interaction.createdBy,
      createdAt: interaction.createdAt,
    }))
    
    return NextResponse.json({
      data: formattedInteractions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching interactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    )
  }
}

// POST /api/crm/interactions - Log a new interaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.contactId || !body.companyId || !body.type || !body.direction || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: contactId, companyId, type, direction, createdBy' },
        { status: 400 }
      )
    }
    
    // Validate type and direction
    const validTypes = ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'SYSTEM', 'CHAT', 'QUOTE_SENT', 'ORDER_PLACED']
    const validDirections = ['INBOUND', 'OUTBOUND']
    
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }
    
    if (!validDirections.includes(body.direction)) {
      return NextResponse.json(
        { error: `Invalid direction. Must be one of: ${validDirections.join(', ')}` },
        { status: 400 }
      )
    }
    
    const interaction = await logInteraction({
      contactId: body.contactId,
      leadId: body.leadId,
      companyId: body.companyId,
      type: body.type,
      direction: body.direction,
      subject: body.subject || '',
      content: body.content || '',
      duration: body.duration,
      channel: body.channel,
      sentiment: body.sentiment,
      nextSteps: body.nextSteps,
      attachmentUrls: body.attachmentUrls,
      automated: body.automated || false,
      triggeredBy: body.triggeredBy,
      createdBy: body.createdBy,
    })
    
    return NextResponse.json(interaction, { status: 201 })
  } catch (error: any) {
    console.error('Error logging interaction:', error)
    
    if (error.message === 'Contact not found') {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to log interaction' },
      { status: 500 }
    )
  }
}
