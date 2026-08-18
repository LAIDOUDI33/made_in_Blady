import { NextRequest, NextResponse } from 'next/server'
import {
  createContact,
  searchContacts,
  getCRMStats
} from '@/lib/crm'

// GET /api/crm/contacts - List or search contacts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q') || ''
    const companyId = searchParams.get('companyId') || undefined
    const role = searchParams.get('role') as any || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    
    // If there's a search query, use searchContacts
    if (query || role || companyId) {
      const result = await searchContacts(query, {
        companyId,
        role,
        tags: searchParams.get('tags')?.split(',') || undefined,
      }, { page, pageSize })
      
      return NextResponse.json(result)
    }
    
    // Otherwise, get all contacts with pagination
    const result = await searchContacts('', {}, { page, pageSize })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

// POST /api/crm/contacts - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.companyId || !body.firstName || !body.lastName || !body.email || !body.phone || !body.jobTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, firstName, lastName, email, phone, jobTitle' },
        { status: 400 }
      )
    }
    
    const contact = await createContact({
      companyId: body.companyId,
      userId: body.userId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      mobile: body.mobile,
      jobTitle: body.jobTitle,
      department: body.department,
      role: body.role,
      linkedinUrl: body.linkedinUrl,
      avatarUrl: body.avatarUrl,
      preferredLanguage: body.preferredLanguage,
      preferredContactMethod: body.preferredContactMethod,
      timezone: body.timezone,
      tags: body.tags,
      notes: body.notes,
    })
    
    return NextResponse.json(contact, { status: 201 })
  } catch (error: any) {
    console.error('Error creating contact:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A contact with this email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}
