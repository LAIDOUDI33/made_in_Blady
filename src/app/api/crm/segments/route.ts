import { NextRequest, NextResponse } from 'next/server'
import { getSegments, createSegment } from '@/lib/crm'
import { db } from '@/lib/db'

// GET /api/crm/segments - List all segments
export async function GET() {
  try {
    const segments = await getSegments()
    return NextResponse.json({ data: segments })
  } catch (error) {
    console.error('Error fetching segments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch segments' },
      { status: 500 }
    )
  }
}

// POST /api/crm/segments - Create a new segment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.filters || !Array.isArray(body.filters)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, filters (array)' },
        { status: 400 }
      )
    }
    
    // Validate filters structure
    const validOperators = ['equals', 'contains', 'startsWith', 'endsWith', 'inRange', 'isEmpty', 'isNotEmpty']
    
    for (const filter of body.filters) {
      if (!filter.field || !filter.operator) {
        return NextResponse.json(
          { error: 'Each filter must have field and operator' },
          { status: 400 }
        )
      }
      
      if (!validOperators.includes(filter.operator)) {
        return NextResponse.json(
          { error: `Invalid operator. Must be one of: ${validOperators.join(', ')}` },
          { status: 400 }
        )
      }
    }
    
    const segment = await createSegment({
      name: body.name,
      description: body.description,
      filters: body.filters,
    })
    
    return NextResponse.json(segment, { status: 201 })
  } catch (error) {
    console.error('Error creating segment:', error)
    return NextResponse.json(
      { error: 'Failed to create segment' },
      { status: 500 }
    )
  }
}
