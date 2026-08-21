/**
 * POST /api/compliance/check
 * 
 * Check entity compliance against Algerian regulations
 * Returns comprehensive compliance report with scores, violations, and recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { complianceEngine, type EntityProfile } from '@/lib/compliance/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.entityId || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: entityId, name' },
        { status: 400 }
      );
    }

    // Build entity profile from request
    const entityProfile: EntityProfile = {
      id: body.entityId,
      name: body.name,
      entityType: body.entityType || 'organization',
      
      // Commercial registration
      rccNumber: body.rccNumber,
      rccExpiryDate: body.rccExpiryDate,
      nifNumber: body.nifNumber,
      aisNumber: body.aisNumber,
      
      // Location
      address: body.address,
      city: body.city,
      wilayaCode: body.wilayaCode,
      country: body.country || 'DZ',
      nationality: body.nationality || 'DZ',
      
      // Business details
      activitySector: body.activitySector,
      commercialActivity: body.commercialActivity,
      annualRevenue: body.annualRevenue ? Number(body.annualRevenue) : undefined,
      employeeCount: body.employeeCount ? Number(body.employeeCount) : undefined,
      
      // Personal (for individuals)
      dateOfBirth: body.dateOfBirth,
      idType: body.idType,
      idNumber: body.idNumber,
      
      // Tax
      tvaRegime: body.tvaRegime,
      lastTVADeclaration: body.lastTVADeclaration,
      ibcFilingCurrent: body.ibcFilingCurrent,
      
      // Trade
      importLicense: body.importLicense,
      exportLicense: body.exportLicense,
      licenseExpiryDate: body.licenseExpiryDate,
      
      // Privacy
      dataProcessingDeclared: body.dataProcessingDeclared,
      dpoAppointed: body.dpoAppointed,
      
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Run full compliance check
    const report = await complianceEngine.runFullComplianceCheck(entityProfile);

    return NextResponse.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Compliance check error:', error);
    return NextResponse.json(
      { error: 'Internal server error during compliance check' },
      { status: 500 }
    );
  }
}

// GET endpoint for quick status check
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const entityId = searchParams.get('entityId');

  if (!entityId) {
    return NextResponse.json(
      { error: 'Missing required parameter: entityId' },
      { status: 400 }
    );
  }

  try {
    // In production, fetch from database/cache
    // For now, return a mock response structure
    return NextResponse.json({
      success: true,
      data: {
        entityId,
        lastCheck: new Date().toISOString(),
        overallScore: 72,
        status: 'needs_attention',
        quickSummary: {
          commercial: { score: 85, issues: 1 },
          tax: { score: 90, issues: 0 },
          trade: { score: 60, issues: 2 },
          privacy: { score: 75, issues: 1 },
          sanctions: { score: 100, issues: 0 },
        },
      },
    });
  } catch (error) {
    console.error('Get compliance status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
