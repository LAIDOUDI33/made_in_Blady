import { NextRequest, NextResponse } from 'next/server'
import { importContacts } from '@/lib/crm/contacts'

// POST /api/crm/import - Import contacts/leads
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.ownerId || !body.records || !Array.isArray(body.records)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: ownerId, records (array)' 
        },
        { status: 400 }
      )
    }
    
    // Validate records array is not empty
    if (body.records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Records array cannot be empty' },
        { status: 400 }
      )
    }
    
    // Limit batch size
    if (body.records.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Maximum 500 records per import' },
        { status: 400 }
      )
    }
    
    const result = await importContacts(body.ownerId, body.records, {
      skipDuplicates: body.skipDuplicates || false,
      mergeDuplicates: body.mergeDuplicates || false,
      defaultTags: body.defaultTags || [],
      defaultSource: body.defaultSource || 'import',
    })
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: `Imported ${result.imported} contacts. ${result.duplicates} duplicates found. ${result.errors.length} errors.`,
    }, { status: 201 })
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import data' },
      { status: 500 }
    )
  }
}
