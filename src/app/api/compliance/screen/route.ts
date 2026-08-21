/**
 * POST /api/compliance/screen
 * 
 * Screen entities against international sanctions lists:
 * - OFAC SDN List (US Treasury)
 * - EU Consolidated Financial Sanctions List
 * - UN Security Council Consolidated List
 * - Algeria National Restricted Parties List
 * 
 * Returns screening results with risk scoring and match details
 */

import { NextRequest, NextResponse } from 'next/server';
import { performScreening, DEFAULT_RISK_CONFIG, MOCK_SANCTIONS_DATA, type ScreenedEntityInput, type ScreeningResult } from '@/lib/compliance/rules/sanctions-rules';

// POST - Perform sanctions screening
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.fullName) {
      return NextResponse.json(
        { error: 'Missing required field: fullName' },
        { status: 400 }
      );
    }

    // Build screened entity input
    const screenInput: ScreenedEntityInput = {
      fullName: body.fullName.trim(),
      entityType: body.entityType || 'individual',
      dateOfBirth: body.dateOfBirth,
      nationality: body.nationality,
      countryOfResidence: body.countryOfResidence || body.country,
      address: body.address,
      idNumber: body.idNumber,
      idType: body.idType,
      registrationNumber: body.registrationNumber,
    };

    // Check if using custom sanctions list or default mock data
    const useCustomList = body.useCustomSanctionsList === true;
    
    // Perform screening
    const result = performScreening(
      screenInput,
      useCustomList && body.sanctionsData ? body.sanctionsData : MOCK_SANCTIONS_DATA,
      body.riskConfig ? { ...DEFAULT_RISK_CONFIG, ...body.riskConfig } : DEFAULT_RISK_CONFIG
    );

    // Log the screening for audit trail
    logScreeningEvent(screenInput, result);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sanctions screening error:', error);
    return NextResponse.json(
      { error: 'Internal server error during screening' },
      { status: 500 }
    );
  }
}

// GET - Get screening history/stats
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'stats':
        return getScreeningStats();
      case 'history':
        return getScreeningHistory(searchParams);
      case 'lists':
        return getAvailableLists();
      case 'config':
        return getScreeningConfig();
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: stats, history, lists, config' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GET screening error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getScreeningStats() {
  // Mock statistics - in production, query database
  const stats = {
    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    periodEnd: new Date().toISOString(),
    totalScreenings: 1247,
    clearResults: 1189,
    pendingReview: 32,
    blocked: 18,
    falsePositive: 8,
    averageProcessingTime: 1.2, // seconds
    topMatchCountries: [
      { country: 'DZ', count: 892 },
      { country: 'AE', count: 156 },
      { country: 'TN', count: 98 },
      { country: 'FR', count: 67 },
      { country: 'OTHER', count: 34 },
    ],
    topSanctionTypes: [
      { type: 'asset_freeze', count: 28 },
      { type: 'trade_embargo', count: 12 },
      { type: 'travel_ban', count: 5 },
    ],
  };

  return NextResponse.json({ success: true, data: stats });
}

async function getScreeningHistory(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const decision = searchParams.get('decision');
  const riskLevel = searchParams.get('riskLevel');

  // Mock history data
  const mockHistory = Array.from({ length: 50 }, (_, i) => ({
    referenceId: `SCR-${Date.now().toString(36)}-${i.toString().padStart(4, '0')}`,
    entityName: i % 3 === 0 ? `Company ${i}` : `Person ${i}`,
    entityType: i % 3 === 0 ? 'organization' : 'individual',
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    riskLevel: i === 0 ? 'critical' : i < 5 ? 'high' : i < 15 ? 'medium' : 'none',
    decision: i === 0 ? 'BLOCKED' : i < 5 ? 'PENDING_REVIEW' : i < 15 ? 'FALSE_POSITIVE' : 'CLEAR',
    matchesCount: i < 5 ? 1 : 0,
  }));

  let filtered = mockHistory;
  if (decision) filtered = filtered.filter(h => h.decision === decision);
  if (riskLevel) filtered = filtered.filter(h => h.riskLevel === riskLevel);

  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return NextResponse.json({
    success: true,
    data: {
      items: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    },
  });
}

async function getAvailableLists() {
  const lists = [
    {
      id: 'ofac-sdn',
      name: 'OFAC SDN List',
      fullName: 'Specially Designated Nationals and Blocked Persons List',
      source: 'US Department of the Treasury',
      updateFrequency: 'Daily',
      lastUpdated: new Date().toISOString(),
      entryCount: '~12,000',
      isActive: true,
    },
    {
      id: 'eu-consolidated',
      name: 'EU Consolidated List',
      fullName: 'EU Consolidated Financial Sanctions List',
      source: 'European Council',
      updateFrequency: 'Daily',
      lastUpdated: new Date(Date.now() - 86400000).toISOString(),
      entryCount: '~900',
      isActive: true,
    },
    {
      id: 'un-consolidated',
      name: 'UN Consolidated List',
      fullName: 'UN Security Council Consolidated List',
      source: 'United Nations Security Council',
      updateFrequency: 'Weekly',
      lastUpdated: new Date(Date.now() - 3 * 86400000).toISOString(),
      entryCount: '~700',
      isActive: true,
    },
    {
      id: 'dz-national',
      name: 'Algeria National List',
      fullName: 'Algerian National Restricted Parties List',
      source: 'Bank of Algeria / Ministry of Finance',
      updateFrequency: 'Monthly',
      lastUpdated: new Date(Date.now() - 15 * 86400000).toISOString(),
      entryCount: '~150',
      isActive: true,
    },
  ];

  return NextResponse.json({ success: true, data: lists });
}

async function getScreeningConfig() {
  return NextResponse.json({
    success: true,
    data: {
      riskConfig: DEFAULT_RISK_CONFIG,
      features: {
        fuzzyMatching: true,
        phoneticMatching: true,
        transliterationSupport: true,
        batchScreening: false,
        webhookNotifications: true,
        apiAccess: true,
      },
      rateLimits: {
        perMinute: 60,
        perHour: 1000,
        perDay: 10000,
      },
    },
  });
}

// Audit logging helper
function logScreeningEvent(input: ScreenedEntityInput, result: ScreeningResult): void {
  // In production, this would write to audit log table/database
  const logEntry = {
    timestamp: new Date().toISOString(),
    input: {
      fullName: input.fullName,
      entityType: input.entityType,
      // Don't log sensitive PII in detail
    },
    output: {
      referenceId: result.referenceId,
      riskLevel: result.riskLevel,
      decision: result.decision,
      matchesCount: result.matches.length,
    },
    ipAddress: null, // Would be extracted from request
    userAgent: null,
  };

  console.log('[SANCTIONS_SCREENING]', JSON.stringify(logEntry));
}
