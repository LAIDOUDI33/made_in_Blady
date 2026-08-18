import { NextRequest, NextResponse } from 'next/server'
import { exportContacts } from '@/lib/crm/contacts'

// GET /api/crm/export - Export contacts/leads data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const ownerId = searchParams.get('ownerId')
    const type = searchParams.get('type') || 'contacts' // 'contacts' or 'leads'
    const format = (searchParams.get('format') || 'json') as 'csv' | 'excel' | 'json'
    
    if (!ownerId) {
      return NextResponse.json(
        { success: false, error: 'ownerId is required' },
        { status: 400 }
      )
    }
    
    // Parse fields to export
    let fields: string[] | undefined
    if (searchParams.get('fields')) {
      fields = searchParams.get('fields')!.split(',')
    }
    
    // Parse filters
    const filter: any = { ownerId }
    
    if (searchParams.get('search')) filter.search = searchParams.get('search')
    if (searchParams.get('status')) filter.status = searchParams.get('status')
    if (searchParams.get('tags')) filter.tags = searchParams.get('tags')!.split(',')
    if (searchParams.get('createdFrom')) filter.createdFrom = new Date(searchParams.get('createdFrom')!)
    if (searchParams.get('createdTo')) filter.createdTo = new Date(searchParams.get('createdTo')!)
    
    // Export based on type
    let data: Record<string, any>[]
    
    switch (type) {
      case 'contacts':
        data = await exportContacts(filter, fields)
        break
      case 'leads':
        // Would implement lead export here
        data = []
        break
      default:
        return NextResponse.json(
          { success: false, error: `Invalid export type: ${type}` },
          { status: 400 }
        )
    }
    
    // Format response based on requested format
    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        return new NextResponse('', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${type}_export.csv"`,
          },
        })
      }
      
      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(h => {
            const value = row[h]
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value || '')
            return `"${stringValue.replace(/"/g, '""')}"`
          }).join(',')
        ),
      ]
      
      const csvContent = csvRows.join('\n')
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}_${new Date().toISOString().slice(0,10)}.csv"`,
        },
      })
    }
    
    // Default JSON response
    return NextResponse.json({
      success: true,
      type,
      format,
      count: data.length,
      data,
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
