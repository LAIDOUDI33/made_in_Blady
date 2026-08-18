import { NextRequest, NextResponse } from 'next/server'
import { 
  getDeal, 
  updateDeal, 
  deleteDeal,
  moveDealToStage,
  winDeal,
  loseDeal
} from '@/lib/crm/pipeline'

// GET /api/crm/deals/[id] - Get a single deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deal = await getDeal(id)
    
    if (!deal) {
      return NextResponse.json(
        { success: false, error: 'Deal not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: deal })
  } catch (error) {
    console.error('Error fetching deal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deal' },
      { status: 500 }
    )
  }
}

// PUT /api/crm/deals/[id] - Update a deal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.value !== undefined) updateData.value = parseFloat(body.value)
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.expectedCloseDate !== undefined) updateData.expectedCloseDate = new Date(body.expectedCloseDate)
    if (body.probability !== undefined) updateData.probability = body.probability
    if (body.lossReason !== undefined) updateData.lossReason = body.lossReason
    if (body.notes !== undefined) updateData.notes = body.notes
    
    const deal = await updateDeal(id, updateData)
    
    return NextResponse.json({ success: true, data: deal })
  } catch (error) {
    console.error('Error updating deal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update deal' },
      { status: 500 }
    )
  }
}

// DELETE /api/crm/deals/[id] - Delete a deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteDeal(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting deal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete deal' },
      { status: 500 }
    )
  }
}

// POST /api/crm/deals/[id]/stage - Move deal to new stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (!body.stage) {
      return NextResponse.json(
        { success: false, error: 'Stage is required' },
        { status: 400 }
      )
    }
    
    let deal
    
    switch (body.stage) {
      case 'closed_won':
        deal = await winDeal(id, { notes: body.notes })
        break
      case 'closed_lost':
        if (!body.reason) {
          return NextResponse.json(
            { success: false, error: 'Reason is required for losing a deal' },
            { status: 400 }
          )
        }
        deal = await loseDeal(id, body.reason, body.competitor)
        break
      default:
        deal = await moveDealToStage(id, body.stage, {
          notes: body.notes,
        })
    }
    
    return NextResponse.json({ success: true, data: deal })
  } catch (error) {
    console.error('Error updating deal stage:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update deal stage' },
      { status: 500 }
    )
  }
}
