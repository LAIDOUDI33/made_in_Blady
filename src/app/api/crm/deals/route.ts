import { NextRequest, NextResponse } from 'next/server'
import { 
  createDeal, 
  searchDeals, 
  getDealsByStage,
  moveDealToStage,
  winDeal,
  loseDeal
} from '@/lib/crm/pipeline'

// GET /api/crm/deals - List deals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const filter: any = {}
    const options: any = {}
    
    if (searchParams.get('ownerId')) filter.ownerId = searchParams.get('ownerId')!
    if (searchParams.get('search')) filter.search = searchParams.get('search')!
    if (searchParams.get('stage')) filter.stage = searchParams.get('stage')!
    if (searchParams.get('contactId')) filter.contactId = searchParams.get('contactId')!
    if (searchParams.get('leadId')) filter.leadId = searchParams.get('leadId')!
    if (searchParams.get('valueMin')) filter.valueMin = parseFloat(searchParams.get('valueMin')!)
    if (searchParams.get('valueMax')) filter.valueMax = parseFloat(searchParams.get('valueMax')!)
    if (searchParams.get('expectedCloseFrom')) filter.expectedCloseFrom = new Date(searchParams.get('expectedCloseFrom')!)
    if (searchParams.get('expectedCloseTo')) filter.expectedCloseTo = new Date(searchParams.get('expectedCloseTo')!)
    if (searchParams.get('createdFrom')) filter.createdFrom = new Date(searchParams.get('createdFrom')!)
    if (searchParams.get('createdTo')) filter.createdTo = new Date(searchParams.get('createdTo')!)
    if (searchParams.get('isWon') === 'true') filter.isWon = true
    if (searchParams.get('isLost') === 'true') filter.isLost = true
    
    options.page = parseInt(searchParams.get('page') || '1')
    options.pageSize = parseInt(searchParams.get('pageSize') || '20')
    options.sortBy = (searchParams.get('sortBy') as any) || 'createdAt'
    options.sortOrder = (searchParams.get('sortOrder') as any) || 'desc'
    
    // If getting by stage
    if (filter.stage && !searchParams.get('search')) {
      const deals = await getDealsByStage(filter.stage)
      return NextResponse.json({ data: deals })
    }
    
    const result = await searchDeals(filter, options)
    
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
    console.error('Error fetching deals:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}

// POST /api/crm/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.value || !body.ownerId || !body.expectedCloseDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, value, ownerId, expectedCloseDate' },
        { status: 400 }
      )
    }
    
    const deal = await createDeal({
      ownerId: body.ownerId,
      contactId: body.contactId,
      leadId: body.leadId,
      title: body.title,
      description: body.description,
      value: parseFloat(body.value),
      currency: body.currency || 'DZD',
      expectedCloseDate: new Date(body.expectedCloseDate),
      stage: body.stage,
      probability: body.probability,
      notes: body.notes,
    })
    
    return NextResponse.json({ success: true, data: deal }, { status: 201 })
  } catch (error) {
    console.error('Error creating deal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create deal' },
      { status: 500 }
    )
  }
}
