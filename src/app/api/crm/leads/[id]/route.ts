import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  updateLeadStage,
  qualifyLead,
  assignLead,
  calculateLeadScore,
  predictConversionProbability
} from '@/lib/crm'

// GET /api/crm/leads/[id] - Get a single lead with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    const lead = await db.cRMLead.findUnique({
      where: { id },
      include: {
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: searchParams.get('includeInteractions') === 'true' ? 10 : 0,
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          take: searchParams.get('includeTasks') === 'true' ? 5 : 0,
        },
      },
    })
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }
    
    // Calculate predicted conversion if requested
    let predictedProbability: number | undefined
    if (searchParams.get('includePrediction') === 'true') {
      predictedProbability = await predictConversionProbability(id)
    }
    
    return NextResponse.json({
      id: lead.id,
      leadNumber: lead.leadNumber,
      source: lead.source,
      sourceDetails: lead.sourceDetails,
      campaignId: lead.campaignId,
      companyName: lead.companyName,
      industry: lead.industry,
      companySize: lead.companySize,
      website: lead.website,
      wilaya: lead.wilaya,
      city: lead.city,
      primaryContactId: lead.primaryContactId,
      status: lead.status,
      pipelineStage: lead.pipelineStage,
      estimatedValue: parseFloat(String(lead.estimatedValue)),
      currency: lead.currency,
      probability: lead.probability,
      expectedCloseDate: lead.expectedCloseDate,
      assignedTo: lead.assignedTo,
      teamId: lead.teamId,
      interestedCategories: JSON.parse(lead.interestedCategories || '[]'),
      interestedProducts: JSON.parse(lead.interestedProducts || '[]'),
      specificRequirements: lead.specificRequirements,
      leadScore: lead.leadScore,
      engagementScore: lead.engagementScore,
      convertedToCompanyId: lead.convertedToCompanyId,
      convertedToOrderId: lead.convertedToOrderId,
      convertedAt: lead.convertedAt,
      lostReason: lead.lostReason,
      lostToCompetitor: lead.lostToCompetitor,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      interactions: lead.interactions.map(i => ({
        id: i.id,
        type: i.type,
        direction: i.direction,
        subject: i.subject,
        createdAt: i.createdAt,
      })),
      tasks: lead.tasks.map(t => ({
        id: t.id,
        title: t.title,
        type: t.type,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
      })),
      predictedProbability,
    })
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

// PUT /api/crm/leads/[id] - Update a lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const existing = await db.cRMLead.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }
    
    // Handle stage change specifically
    if (body.pipelineStage && body.pipelineStage !== existing.pipelineStage) {
      const updated = await updateLeadStage(id, body.pipelineStage)
      return NextResponse.json(updated)
    }
    
    // General update
    const updateData: any = {}
    
    const allowedFields = [
      'companyName', 'industry', 'companySize', 'website', 'wilaya', 'city',
      'primaryContactId', 'estimatedValue', 'currency', 'expectedCloseDate',
      'teamId', 'specificRequirements', 'lostReason', 'lostToCompetitor',
    ]
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'interestedCategories' || field === 'interestedProducts') {
          updateData[field] = JSON.stringify(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }
    
    const updated = await db.cRMLead.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json({
      ...formatLead(updated),
    })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

// PATCH /api/crm/leads/[id] - Special operations on leads
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    switch (body.action) {
      case 'qualify': {
        const score = typeof body.score === 'number' ? body.score : undefined
        const lead = await qualifyLead(id, score)
        return NextResponse.json(lead)
      }
      
      case 'assign': {
        if (!body.userId) {
          return NextResponse.json(
            { error: 'userId is required for assignment' },
            { status: 400 }
          )
        }
        const lead = await assignLead(id, body.userId)
        return NextResponse.json(lead)
      }
      
      case 'recalculateScore': {
        const newScore = await calculateLeadScore(id)
        return NextResponse.json({ 
          success: true, 
          message: 'Score recalculated',
          newScore 
        })
      }
      
      case 'predictConversion': {
        const probability = await predictConversionProbability(id)
        return NextResponse.json({ probability })
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${body.action}` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Error in lead operation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform operation on lead' },
      { status: 500 }
    )
  }
}

// DELETE /api/crm/leads/[id] - Delete a lead (soft delete or archive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const existing = await db.cRMLead.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }
    
    await db.cRMLead.delete({ where: { id } })
    
    return NextResponse.json({ success: true, message: 'Lead deleted successfully' })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}

function formatLead(lead: any) {
  return {
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
    leadScore: lead.leadScore,
    engagementScore: lead.engagementScore,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  }
}
