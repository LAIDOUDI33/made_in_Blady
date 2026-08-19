import { NextRequest, NextResponse } from 'next/server';

// Types
interface PilotProgram {
  id: string;
  companyId: string;
  companyName: string;
  companyNameAr?: string;
  industry: string;
  status: 'setup' | 'active' | 'review' | 'completed' | 'extended' | 'cancelled';
  template: 'pharmaceutical' | 'agricultural' | 'industrial' | 'dates' | 'custom';
  
  // Timeline
  startDate: string;
  endDate: string;
  currentDay: number;
  totalDays: number;
  
  // Progress tracking
  progress: number;
  completedSteps: string[];
  
  // Configuration
  config: {
    integrationMethod: 'api' | 'manual' | 'erp';
    erpType?: string;
    requiresColdChain: boolean;
    requiresOrganicTracking: boolean;
    targetProducts: number;
    targetEventsPerDay: number;
  };
  
  // Statistics (computed)
  stats: {
    productsRegistered: number;
    eventsLogged: number;
    certificatesIssued: number;
    activeUsers: number;
    lastActivityAt: string;
  };
  
  // API credentials
  apiCredentials: {
    apiKey: string;
    webhookSecret: string;
    environment: 'pilot' | 'production';
  } | null;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// In-memory storage for demo (in production, use database)
const pilotsStore = new Map<string, PilotProgram>();

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Generate API key
function generateApiKey(): string {
  const prefix = 'at_pilot';
  const random = Math.random().toString(36).substring(2, 18);
  return `${prefix}_${random}`;
}

// Calculate pilot progress
function calculateProgress(pilot: PilotProgram): number {
  const totalWeight = 100;
  let earnedPoints = 0;
  
  // Account setup (10 points)
  if (pilot.apiCredentials) earnedPoints += 10;
  
  // Products registered (up to 25 points)
  const productProgress = Math.min((pilot.stats.productsRegistered / pilot.config.targetProducts) * 25, 25);
  earnedPoints += productProgress;
  
  // Events logged (up to 25 points)
  const expectedEvents = pilot.currentDay * pilot.config.targetEventsPerDay * pilot.stats.activeUsers || 1;
  const eventProgress = Math.min((pilot.stats.eventsLogged / expectedEvents) * 25, 25);
  earnedPoints += eventProgress;
  
  // Certificates issued (up to 20 points)
  const certProgress = Math.min((pilot.stats.certificatesIssued / Math.max(pilot.stats.productsRegistered * 0.5, 1)) * 20, 20);
  earnedPoints += certProgress;
  
  // User adoption (up to 20 points)
  earnedPoints += Math.min(pilot.stats.activeUsers * 4, 20); // Max 5 users = 20 points
  
  return Math.round((earnedPoints / totalWeight) * 100);
}

// Update current day based on dates
function updateCurrentDay(pilot: PilotProgram): PilotProgram {
  const start = new Date(pilot.startDate);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    ...pilot,
    currentDay: Math.max(0, Math.min(diffDays, pilot.totalDays))
  };
}

// GET /api/blockchain/pilot - List all pilots or get specific pilot
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const company = searchParams.get('company');
    
    if (id) {
      // Get specific pilot
      const pilot = pilotsStore.get(id);
      if (!pilot) {
        return NextResponse.json(
          { success: false, error: { code: 'not_found', message: 'Pilot program not found' } },
          { status: 404 }
        );
      }
      
      // Update progress and day
      const updatedPilot = updateCurrentDay(pilot);
      updatedPilot.progress = calculateProgress(updatedPilot);
      pilotsStore.set(id, updatedPilot);
      
      return NextResponse.json({
        success: true,
        data: updatedPilot
      });
    }
    
    // List pilots with optional filters
    let pilots = Array.from(pilotsStore.values());
    
    if (status) {
      pilots = pilots.filter(p => p.status === status);
    }
    
    if (company) {
      pilots = pilots.filter(p => 
        p.companyName.toLowerCase().includes(company.toLowerCase()) ||
        (p.companyNameAr && p.companyNameAr.includes(company))
      );
    }
    
    // Sort by creation date (newest first)
    pilots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json({
      success: true,
      data: {
        pilots,
        count: pilots.length,
        summary: {
          total: pilots.length,
          active: pilots.filter(p => p.status === 'active').length,
          completed: pilots.filter(p => p.status === 'completed').length,
          setup: pilots.filter(p => p.status === 'setup').length
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching pilots:', error);
    return NextResponse.json(
      { success: false, error: { code: 'internal_error', message: 'Failed to fetch pilot programs' } },
      { status: 500 }
    );
  }
}

// POST /api/blockchain/pilot - Create new pilot program
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['companyId', 'companyName', 'industry', 'template', 'startDate'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'validation_error', 
              message: `Missing required field: ${field}`,
              field 
            } 
          },
          { status: 400 }
        );
      }
    }
    
    // Check for existing pilot for this company
    const existingPilot = Array.from(pilotsStore.values()).find(p => p.companyId === body.companyId);
    if (existingPilot && existingPilot.status !== 'completed' && existingPilot.status !== 'cancelled') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'conflict', 
            message: 'Company already has an active pilot program',
            existingPilotId: existingPilot.id
          } 
        },
        { status: 409 }
      );
    }
    
    // Create pilot program
    const startDate = new Date(body.startDate);
    const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    
    const apiKey = generateApiKey();
    const webhookSecret = `whsec_${Math.random().toString(36).substring(2, 18)}`;
    
    const newPilot: PilotProgram = {
      id: generateId('pilot'),
      companyId: body.companyId,
      companyName: body.companyName,
      companyNameAr: body.companyNameAr,
      industry: body.industry,
      template: body.template,
      status: 'setup',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      currentDay: 0,
      totalDays: 14,
      progress: 0,
      completedSteps: [],
      config: {
        integrationMethod: body.integrationMethod || 'manual',
        erpType: body.erpType,
        requiresColdChain: body.requiresColdChain || false,
        requiresOrganicTracking: body.requiresOrganicTracking || false,
        targetProducts: body.targetProducts || 50,
        targetEventsPerDay: body.targetEventsPerDay || 50
      },
      stats: {
        productsRegistered: 0,
        eventsLogged: 0,
        certificatesIssued: 0,
        activeUsers: 0,
        lastActivityAt: new Date().toISOString()
      },
      apiCredentials: {
        apiKey,
        webhookSecret,
        environment: 'pilot'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store pilot
    pilotsStore.set(newPilot.id, newPilot);
    
    // Return created pilot (without sensitive data in production)
    return NextResponse.json({
      success: true,
      data: {
        ...newPilot,
        message: 'Pilot program created successfully. Use the onboarding endpoint to begin setup.'
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating pilot:', error);
    return NextResponse.json(
      { success: false, error: { code: 'internal_error', message: 'Failed to create pilot program' } },
      { status: 500 }
    );
  }
}

// PUT /api/blockchain/pilot - Update pilot program
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'validation_error', message: 'Pilot ID is required', field: 'id' } },
        { status: 400 }
      );
    }
    
    const existingPilot = pilotsStore.get(id);
    if (!existingPilot) {
      return NextResponse.json(
        { success: false, error: { code: 'not_found', message: 'Pilot program not found' } },
        { status: 404 }
      );
    }
    
    // Allowed updates
    const allowedUpdates = [
      'status', 'config', 'endDate', 'template', 'companyName', 'companyNameAr'
    ];
    
    const filteredUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = value;
      }
    }
    
    // Special handling for status transitions
    if (filteredUpdates.status === 'active' && existingPilot.status === 'setup') {
      filteredUpdates.startDate = new Date().toISOString();
      const newEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      filteredUpdates.endDate = newEndDate.toISOString();
    }
    
    if (filteredUpdates.status === 'completed') {
      filteredUpdates.completedAt = new Date().toISOString();
    }
    
    // Update pilot
    const updatedPilot: PilotProgram = {
      ...existingPilot,
      ...filteredUpdates,
      updatedAt: new Date().toISOString()
    };
    
    // Recalculate progress
    updatedPilot.progress = calculateProgress(updatedPilot);
    
    pilotsStore.set(id, updatedPilot);
    
    return NextResponse.json({
      success: true,
      data: updatedPilot,
      message: 'Pilot program updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating pilot:', error);
    return NextResponse.json(
      { success: false, error: { code: 'internal_error', message: 'Failed to update pilot program' } },
      { status: 500 }
    );
  }
}

// DELETE /api/blockchain/pilot - Cancel/delete pilot program
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'validation_error', message: 'Pilot ID is required' } },
        { status: 400 }
      );
    }
    
    const existingPilot = pilotsStore.get(id);
    if (!existingPilot) {
      return NextResponse.json(
        { success: false, error: { code: 'not_found', message: 'Pilot program not found' } },
        { status: 404 }
      );
    }
    
    // Soft delete - mark as cancelled
    existingPilot.status = 'cancelled';
    existingPilot.updatedAt = new Date().toISOString();
    pilotsStore.set(id, existingPilot);
    
    return NextResponse.json({
      success: true,
      message: 'Pilot programme cancelled successfully',
      data: { id, status: 'cancelled' }
    });
    
  } catch (error) {
    console.error('Error deleting pilot:', error);
    return NextResponse.json(
      { success: false, error: { code: 'internal_error', message: 'Failed to cancel pilot program' } },
      { status: 500 }
    );
  }
}
