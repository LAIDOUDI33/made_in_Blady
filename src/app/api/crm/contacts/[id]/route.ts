import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  updateContact,
  mergeContacts,
  getContactInteractions,
  enrichContact
} from '@/lib/crm'

// GET /api/crm/contacts/[id] - Get a single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    const contact = await db.cRMContact.findUnique({
      where: { id },
      include: {
        _count: { select: { interactions: true } },
      },
    })
    
    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    // Include interactions if requested
    const includeInteractions = searchParams.get('include') === 'interactions'
    
    const response: any = {
      id: contact.id,
      companyId: contact.companyId,
      userId: contact.userId || undefined,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      mobile: contact.mobile || undefined,
      jobTitle: contact.jobTitle,
      department: contact.department || undefined,
      role: contact.role,
      linkedinUrl: contact.linkedinUrl || undefined,
      avatarUrl: contact.avatarUrl || undefined,
      preferredLanguage: contact.preferredLanguage,
      preferredContactMethod: contact.preferredContactMethod,
      timezone: contact.timezone,
      tags: JSON.parse(contact.tags || '[]'),
      notes: contact.notes || '',
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
      lastInteractionAt: contact.lastInteractionAt || undefined,
      interactionCount: contact._count.interactions,
    }
    
    if (includeInteractions) {
      response.interactions = await getContactInteractions(id)
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

// PUT /api/crm/contacts/[id] - Update a contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Check if contact exists
    const existing = await db.cRMContact.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    const contact = await updateContact(id, body)
    
    return NextResponse.json(contact)
  } catch (error: any) {
    console.error('Error updating contact:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A contact with this email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

// PATCH /api/crm/contacts/[id] - Merge or enrich contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (body.action === 'merge' && body.secondaryIds) {
      const mergedContact = await mergeContacts(id, body.secondaryIds)
      return NextResponse.json(mergedContact)
    }
    
    if (body.action === 'enrich') {
      const enrichedContact = await enrichContact(id)
      return NextResponse.json(enrichedContact)
    }
    
    // Default to regular update
    const contact = await updateContact(id, body)
    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error in contact operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform operation on contact' },
      { status: 500 }
    )
  }
}

// DELETE /api/crm/contacts/[id] - Delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const existing = await db.cRMContact.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    await db.cRMContact.delete({ where: { id } })
    
    return NextResponse.json({ success: true, message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
