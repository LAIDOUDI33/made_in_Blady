import { NextRequest, NextResponse } from 'next/server';
import {
  createProvenanceRecord,
  getProvenanceRecord,
  getProvenanceByProductId,
  getProvenanceByBatchNumber,
  getAllProvenanceRecords,
  sealProvenanceRecord,
  seedMockData,
  getSupplyChainStats
} from '@/lib/blockchain/supply-chain';
import type { ProductCategory, Location } from '@/lib/blockchain/types';

// GET /api/blockchain/provenance - List or retrieve provenance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');
    const productId = searchParams.get('productId');
    const batchNumber = searchParams.get('batchNumber');
    const category = searchParams.get('category') as ProductCategory | null;
    const status = searchParams.get('status');
    const seed = searchParams.get('seed');
    const stats = searchParams.get('stats');
    
    // Return statistics
    if (stats === 'true') {
      const supplyChainStats = getSupplyChainStats();
      return NextResponse.json({ success: true, data: supplyChainStats });
    }
    
    // Seed mock data if requested
    if (seed === 'true') {
      const result = seedMockData();
      return NextResponse.json({
        success: true,
        message: `Seeded ${result.count} mock records`,
        data: result.records.map(r => ({
          id: r.id,
          productId: r.productId,
          productName: r.productName,
          batchNumber: r.batchNumber,
          category: r.category
        }))
      });
    }
    
    // Get specific record by ID
    if (id) {
      const record = getProvenanceRecord(id);
      if (!record) {
        return NextResponse.json(
          { success: false, error: 'Provenance record not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: record });
    }
    
    // Get by product ID
    if (productId) {
      const record = getProvenanceByProductId(productId);
      if (!record) {
        return NextResponse.json(
          { success: false, error: 'No provenance record found for this product' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: record });
    }
    
    // Get by batch number
    if (batchNumber) {
      const record = getProvenanceByBatchNumber(batchNumber);
      if (!record) {
        return NextResponse.json(
          { success: false, error: 'No provenance record found for this batch number' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: record });
    }
    
    // List all records with optional filtering
    let records = getAllProvenanceRecords();
    
    // Filter by category
    if (category) {
      records = records.filter(r => r.category === category);
    }
    
    // Filter by status
    if (status) {
      records = records.filter(r => r.currentStatus === status);
    }
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const start = (page - 1) * limit;
    const paginatedRecords = records.slice(start, start + limit);
    
    return NextResponse.json({
      success: true,
      data: paginatedRecords,
      pagination: {
        total: records.length,
        page,
        limit,
        totalPages: Math.ceil(records.length / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching provenance records:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/blockchain/provenance - Create new provenance record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { productName, productSku, category, manufacturer, location } = body;
    
    // Validate required fields
    if (!productName || !category || !manufacturer || !location) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: productName, category, manufacturer, location' 
        },
        { status: 400 }
      );
    }
    
    // Generate a unique product ID
    const productId = body.productId || `PROD-${Date.now().toString(36).toUpperCase()}`;
    
    const record = createProvenanceRecord({
      productId,
      productName,
      productSku,
      category: category as ProductCategory,
      manufacturer: {
        name: manufacturer.name,
        registrationNumber: manufacturer.registrationNumber,
        location: manufacturer.location || location,
        contactEmail: manufacturer.contactEmail || '',
        contactPhone: manufacturer.contactPhone || '',
        verified: manufacturer.verified ?? true,
        taxId: manufacturer.taxId
      },
      initialLocation: location as Location
    });
    
    return NextResponse.json({
      success: true,
      message: 'Provenance record created successfully',
      data: record
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating provenance record:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
