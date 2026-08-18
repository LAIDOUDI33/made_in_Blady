import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getFieldMappingSuggestions, ERPType, EntityType } from '@/lib/erp/integration-framework'

// GET /api/erp/field-mappings - Get field mapping suggestions for an ERP type and entity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const erpType = searchParams.get('erpType') as ERPType
    const entityType = searchParams.get('entityType') as EntityType
    
    if (!erpType) {
      return NextResponse.json(
        { error: 'Missing required parameter: erpType' },
        { status: 400 }
      )
    }
    
    if (!entityType) {
      // Return all entity types available for this ERP type
      const entityTypes = [
        'PRODUCTS', 'INVENTORY', 'ORDERS', 'CUSTOMERS', 
        'PRICES', 'CATEGORIES', 'SUPPLIERS', 'INVOICES', 'SHIPMENTS'
      ]
      
      return NextResponse.json({
        data: {
          erpType,
          supportedEntities: entityTypes,
          message: `Specify entityType parameter to get field mappings for ${erpType}`,
        },
      })
    }
    
    const suggestions = getFieldMappingSuggestions(erpType, entityType)
    
    return NextResponse.json({
      data: {
        erpType,
        entityType,
        suggestions,
      },
    })
  } catch (error) {
    console.error('Error getting field mapping suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to get field mapping suggestions' },
      { status: 500 }
    )
  }
}

// POST /api/erp/field-mappings - Save custom field mappings for an ERP config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { erpConfigId, entityType, mappings } = body
    
    if (!erpConfigId || !entityType || !mappings || !Array.isArray(mappings)) {
      return NextResponse.json(
        { error: 'Missing required fields: erpConfigId, entityType, mappings (array)' },
        { status: 400 }
      )
    }
    
    // Validate config exists
    const config = await db.eRPConfig.findUnique({ where: { id: erpConfigId } })
    if (!config) {
      return NextResponse.json(
        { error: 'ERP configuration not found' },
        { status: 404 }
      )
    }
    
    // Validate each mapping has required fields
    for (const mapping of mappings) {
      if (!mapping.localField || !mapping.erpField) {
        return NextResponse.json(
          { error: 'Each mapping must have localField and erpField' },
          { status: 400 }
        )
      }
    }
    
    // Update the config's fieldMappings
    await db.eRPConfig.update({
      where: { id: erpConfigId },
      data: {
        fieldMappings: JSON.stringify(mappings),
      },
    })
    
    return NextResponse.json({
      success: true,
      message: `Saved ${mappings.length} field mappings for ${entityType}`,
      erpConfigId,
      entityType,
      savedAt: new Date().toISOString(),
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error saving field mappings:', error)
    return NextResponse.json(
      { error: 'Failed to save field mappings' },
      { status: 500 }
    )
  }
}
