import { NextRequest, NextResponse } from 'next/server';
import {
  addSupplyChainEvent,
  getProvenanceRecord,
  sealProvenanceRecord,
  verifyChainIntegrity,
  getAllProvenanceRecords
} from '@/lib/blockchain/supply-chain';
import type { SupplyChainEventType, Location } from '@/lib/blockchain/types';

// GET /api/blockchain/events - List events or get chain integrity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const recordId = searchParams.get('recordId');
    const eventType = searchParams.get('type') as SupplyChainEventType | null;
    const checkIntegrity = searchParams.get('integrity') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Check chain integrity for a specific record
    if (checkIntegrity && recordId) {
      const record = getProvenanceRecord(recordId);
      if (!record) {
        return NextResponse.json(
          { success: false, error: 'Record not found' },
          { status: 404 }
        );
      }
      
      // Convert events to blocks for verification
      const blocks = record.events.map((event) => ({
        index: event.blockIndex,
        timestamp: event.timestamp,
        data: event,
        previousHash: event.previousHash,
        hash: event.hash,
        nonce: 0
      }));
      
      const isValid = verifyChainIntegrity(blocks);
      
      return NextResponse.json({
        success: true,
        data: {
          isValid,
          totalBlocks: blocks.length,
          recordId,
          checkedAt: new Date().toISOString()
        }
      });
    }
    
    // Get all records and extract events
    let records = getAllProvenanceRecords();
    
    // Filter to specific record if provided
    if (recordId) {
      const record = getProvenanceRecord(recordId);
      if (!record) {
        return NextResponse.json(
          { success: false, error: 'Record not found' },
          { status: 404 }
        );
      }
      records = [record];
    }
    
    // Extract and flatten events
    let events = records.flatMap(record => 
      record.events.map(event => ({
        ...event,
        provenanceId: record.id,
        productId: record.productId,
        productName: record.productName,
        batchNumber: record.batchNumber
      }))
    );
    
    // Filter by event type
    if (eventType) {
      events = events.filter(e => e.eventType === eventType);
    }
    
    // Sort by timestamp descending (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply limit
    events = events.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: events,
      meta: {
        count: events.length,
        filteredBy: eventType || 'all',
        recordFilter: recordId || 'all'
      }
    });
    
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/blockchain/events - Add new supply chain event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      recordId,
      eventType,
      location,
      performedBy,
      performedByName,
      description,
      metadata,
      action
    } = body;
    
    // Handle seal action
    if (action === 'seal') {
      if (!recordId) {
        return NextResponse.json(
          { success: false, error: 'Record ID is required to seal' },
          { status: 400 }
        );
      }
      
      const sealed = sealProvenanceRecord(recordId);
      
      if (!sealed) {
        return NextResponse.json(
          { success: false, error: 'Failed to seal record. Not found or already sealed.' },
          { status: 400 }
        );
      }
      
      const updatedRecord = getProvenanceRecord(recordId);
      return NextResponse.json({
        success: true,
        message: 'Record sealed successfully. Chain is now immutable.',
        data: updatedRecord
      });
    }
    
    // Validate required fields for adding event
    if (!recordId || !eventType || !location || !performedBy || !description) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: recordId, eventType, location, performedBy, description' 
        },
        { status: 400 }
      );
    }
    
    // Check if record exists
    const existingRecord = getProvenanceRecord(recordId);
    if (!existingRecord) {
      return NextResponse.json(
        { success: false, error: 'Provenance record not found' },
        { status: 404 }
      );
    }
    
    // Check if record is sealed
    if (existingRecord.isSealed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot add event to sealed record. The chain is immutable.' 
        },
        { status: 403 }
      );
    }
    
    // Add the event
    const newEvent = addSupplyChainEvent(recordId, {
      eventType: eventType as SupplyChainEventType,
      location: location as Location,
      performedBy,
      performedByName,
      description,
      metadata
    });
    
    if (!newEvent) {
      return NextResponse.json(
        { success: false, error: 'Failed to add event' },
        { status: 500 }
      );
    }
    
    // Get updated record
    const updatedRecord = getProvenanceRecord(recordId);
    
    return NextResponse.json({
      success: true,
      message: 'Supply chain event added successfully',
      data: {
        event: newEvent,
        record: updatedRecord
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding supply chain event:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bulk event import endpoint
// PUT /api/blockchain/events - Import multiple events
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, action } = body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Events array is required' },
        { status: 400 }
      );
    }
    
    const results = [];
    const errors = [];
    
    for (const eventData of events) {
      try {
        const { recordId, eventType, location, performedBy, description, metadata } = eventData;
        
        if (!recordId || !eventType || !location || !performedBy || !description) {
          errors.push({ event: eventData, error: 'Missing required fields' });
          continue;
        }
        
        const newEvent = addSupplyChainEvent(recordId, {
          eventType,
          location,
          performedBy,
          performedByName: eventData.performedByName,
          description,
          metadata
        });
        
        if (newEvent) {
          results.push(newEvent);
        } else {
          errors.push({ event: eventData, error: 'Failed to add event' });
        }
      } catch (err) {
        errors.push({ event: eventData, error: String(err) });
      }
    }
    
    return NextResponse.json({
      success: errors.length === 0,
      message: `Processed ${events.length} events: ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results,
        failed: errors
      }
    });
    
  } catch (error) {
    console.error('Error in bulk event import:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
