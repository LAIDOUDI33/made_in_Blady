import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { VerificationLevel, VerificationType, VerificationStatus } from '@prisma/client';

// GET /api/verification - List all verifications or get company verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const level = searchParams.get('level') as VerificationLevel | null;
    const status = searchParams.get('status') as VerificationStatus | null;
    const type = searchParams.get('type') as VerificationType | null;

    if (companyId) {
      // Get company's verification details with badges
      const verifications = await db.supplierVerification.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      });

      const badges = await db.companyBadge.findMany({
        where: { 
          companyId,
          isActive: true 
        },
        include: {
          badge: true
        }
      });

      const company = await db.company.findUnique({
        where: { id: companyId },
        select: {
          verificationLevel: true,
          verificationStatus: true,
          isVerified: true
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          verifications,
          badges: badges.map(b => ({ ...b.badge, awardedAt: b.awardedAt, expiresAt: b.expiresAt })),
          currentLevel: company?.verificationLevel,
          status: company?.verificationStatus,
          isVerified: company?.isVerified
        }
      });
    }

    // List verifications with filters
    const where: any = {};
    if (level) where.level = level;
    if (status) where.status = status;
    if (type) where.type = type;

    const verifications = await db.supplierVerification.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      success: true,
      data: verifications
    });

  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch verifications' },
      { status: 500 }
    );
  }
}

// POST /api/verification - Create new verification request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      type,
      documents,
      inspectorName,
      inspectionNotes
    } = body;

    if (!companyId || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: companyId, type' },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await db.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check for existing pending verification of same type
    const existingVerification = await db.supplierVerification.findFirst({
      where: {
        companyId,
        type: type as VerificationType,
        status: VerificationStatus.PENDING
      }
    });

    if (existingVerification) {
      return NextResponse.json(
        { success: false, error: 'A pending verification of this type already exists' },
        { status: 409 }
      );
    }

    // Determine verification level based on type
    let level: VerificationLevel = VerificationLevel.BASIC;
    switch (type) {
      case VerificationType.BUSINESS_LICENSE:
      case VerificationType.TAX_COMPLIANCE:
      case VerificationType.BANK_ACCOUNT:
        level = VerificationLevel.VERIFIED;
        break;
      case VerificationType.PRODUCT_QUALITY:
      case VerificationType.PRODUCTION_CAPACITY:
        level = VerificationLevel.CERTIFIED;
        break;
      case VerificationType.SGS_AUDIT:
      case VerificationType.ISO_CERTIFICATION:
        level = VerificationLevel.PREMIUM;
        break;
      default:
        level = VerificationLevel.BASIC;
    }

    const verification = await db.supplierVerification.create({
      data: {
        companyId,
        type: type as VerificationType,
        level,
        documents: documents ? JSON.stringify(documents) : null,
        inspectorName,
        inspectionNotes,
        status: VerificationStatus.PENDING
      }
    });

    return NextResponse.json({
      success: true,
      data: verification,
      message: 'Verification request submitted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create verification request' },
      { status: 500 }
    );
  }
}
