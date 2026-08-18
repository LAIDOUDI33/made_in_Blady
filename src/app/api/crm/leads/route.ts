import { NextRequest, NextResponse } from 'next/server'
import {
  createLead,
  getLeadsByPipeline,
  getCRMStats
} from '@/lib/crm'
import { db } from '@/lib/db'

// GET /api/crm/leads - List leads with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') as any
    const assignedTo = searchParams.get('assignedTo')
    const source = searchParams.get('source')
    const pipelineId = searchParams.get('pipelineId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const skip = (page - 1) * pageSize
    
    // Build where clause
    const where: any = {}
    
    if (status) where.status = status
    if (assignedTo) where.assignedTo = assignedTo
    if (source) where.source = source
    
    // Date filters
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      where.expectedCloseDate = {}
      if (dateFrom) where.expectedCloseDate.gte = new Date(dateFrom)
      if (dateTo) where.expectedCloseDate.lte = new Date(dateTo)
    }
    
    // If pipelineId is provided, use pipeline-specific query
    if (pipelineId) {
      const leads = await getLeadsByPipeline(pipelineId, {
        status,
        assignedTo: assignedTo || undefined,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
      })
      
      return NextResponse.json({
        data: leads,
        total: leads.length,
        page,
        pageSize,
        totalPages: Math.ceil(leads.length / pageSize),
      })
    }
    
    // Get total count and paginated results
    const [leads, total] = await Promise.all([
      db.cRMLead.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { probability: 'desc' },
          { expectedCloseDate: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          _count: { select: { interactions: true, tasks: true } },
        },
      }),
      db.cRMLead.count({ where }),
    ])
    
    // Format response
    const formattedLeads = leads.map(lead => ({
      id: lead.id,
      leadNumber: lead.leadNumber,
      source: lead.source,
      companyName: lead.companyName,
      industry: lead.industry,
      status: lead.status,
      pipelineStage: lead.pipelineStage,
      estimatedValue: parseFloat(String(lead.estimatedValue)),
      currency: lead.currency,
      probability: lead.probability,
      expectedCloseDate: lead.expectedCloseDate,
      assignedTo: lead.assignedTo,
      primaryContactId: lead.primaryContactId,
      leadScore: lead.leadScore,
      engagementScore: lead.engagementScore,
      interestedCategories: JSON.parse(lead.interestedCategories || '[]'),
      interestedProducts: JSON.parse(lead.interestedProducts || '[]'),
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      interactionCount: lead._count.interactions,
      taskCount: lead._count.tasks,
    }))
    
    return NextResponse.json({
      data: formattedLeads,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

// POST /api/crm/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['source', 'companyName', 'primaryContactId', 'pipelineStage', 'expectedCloseDate', 'assignedTo']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Validate date
    const expectedCloseDate = new Date(body.expectedCloseDate)
    if (isNaN(expectedCloseDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid expectedCloseDate format' },
        { status: 400 }
      )
    }
    
    const lead = await createLead({
      source: body.source,
      sourceDetails: body.sourceDetails,
      campaignId: body.campaignId,
      companyName: body.companyName,
      industry: body.industry,
      companySize: body.companySize,
      website: body.website,
      wilaya: body.wilaya,
      city: body.city,
      primaryContactId: body.primaryContactId,
      pipelineStage: body.pipelineStage,
      estimatedValue: parseFloat(body.estimatedValue) || 0,
      currency: body.currency || 'DZD',
      expectedCloseDate,
      assignedTo: body.assignedTo,
      teamId: body.teamId,
      interestedCategories: body.interestedCategories,
      interestedProducts: body.interestedProducts,
      specificRequirements: body.specificRequirements,
      companyId: body.companyId || body.assignedTo, // Fallback for companyId
    })
    
    return NextResponse.json(lead, { status: 201 })
  } catch (error: any) {
    console.error('Error creating lead:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A lead with similar details may already exist' },
        { status: 409 }
      )
    }
    
    if (error.message === 'Contact not found') {
      return NextResponse.json(
        { error: 'Primary contact not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
