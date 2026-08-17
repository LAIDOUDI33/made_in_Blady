import { NextRequest, NextResponse } from 'next/server'
import { convertLeadToCompany } from '@/lib/crm'

// POST /api/crm/leads/[id]/convert - Convert a lead to a company
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Attempt to convert the lead
    const result = await convertLeadToCompany(id)
    
    return NextResponse.json({
      success: true,
      message: 'Lead converted successfully',
      company: result.company,
      contact: result.contact,
    })
  } catch (error: any) {
    console.error('Error converting lead:', error)
    
    if (error.message === 'Lead not found') {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Lead already converted') {
      return NextResponse.json(
        { error: 'This lead has already been converted' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to convert lead' },
      { status: 500 }
    )
  }
}
