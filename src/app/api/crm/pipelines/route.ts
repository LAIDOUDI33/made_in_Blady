import { NextRequest, NextResponse } from 'next/server'
import { getPipelines, createPipeline } from '@/lib/crm'
import { db } from '@/lib/db'

// GET /api/crm/pipelines - List all pipelines
export async function GET() {
  try {
    const pipelines = await getPipelines()
    return NextResponse.json({ data: pipelines })
  } catch (error) {
    console.error('Error fetching pipelines:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
      { status: 500 }
    )
  }
}

// POST /api/crm/pipelines - Create a new pipeline
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.stages || !Array.isArray(body.stages)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, stages (array)' },
        { status: 400 }
      )
    }
    
    // Validate stages structure
    for (const stage of body.stages) {
      if (!stage.name || !stage.order || stage.order < 0) {
        return NextResponse.json(
          { error: 'Each stage must have name and order (>= 0)' },
          { status: 400 }
        )
      }
    }
    
    const pipeline = await createPipeline({
      name: body.name,
      description: body.description,
      stages: body.stages,
      defaultLeadStatus: body.defaultLeadStatus,
      isPublic: body.isPublic,
      allowedRoles: body.allowedRoles,
      autoAdvanceRules: body.autoAdvanceRules,
    })
    
    return NextResponse.json(pipeline, { status: 201 })
  } catch (error) {
    console.error('Error creating pipeline:', error)
    return NextResponse.json(
      { error: 'Failed to create pipeline' },
      { status: 500 }
    )
  }
}
