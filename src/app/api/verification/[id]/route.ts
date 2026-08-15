import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { VerificationStatus, VerificationLevel } from '@prisma/client';

// PUT /api/verification/[id]/review - Admin review of verification
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      score,
      categoryScores,
      notes,
      rejectionReason,
      reviewedBy
    } = body;

    if (!status || !reviewedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: status, reviewedBy' },
        { status: 400 }
      );
    }

    // Get existing verification
    const existingVerification = await db.supplierVerification.findUnique({
      where: { id },
      include: { company: true }
    });

    if (!existingVerification) {
      return NextResponse.json(
        { success: false, error: 'Verification not found' },
        { status: 404 }
      );
    }

    if (existingVerification.status !== VerificationStatus.PENDING) {
      return NextResponse.json(
        { success: false, error: 'Only pending verifications can be reviewed' },
        { status: 400 }
      );
    }

    // Update verification
    const updateData: any = {
      status: status as VerificationStatus,
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: notes,
      rejectionReason: rejectionReason || null,
      score: score || null,
      categoryScores: categoryScores ? JSON.stringify(categoryScores) : null,
      issuedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
      isValid: status === VerificationStatus.VERIFIED
    };

    const verification = await db.supplierVerification.update({
      where: { id },
      data: updateData
    });

    // If approved, update company verification level and potentially award badge
    if (status === VerificationStatus.VERIFIED) {
      // Update company level if this verification is higher than current
      const levelHierarchy = {
        [VerificationLevel.BASIC]: 0,
        [VerificationLevel.VERIFIED]: 1,
        [VerificationLevel.CERTIFIED]: 2,
        [VerificationLevel.PREMIUM]: 3,
        [VerificationLevel.ENTERPRISE]: 4
      };

      const currentLevelValue = levelHierarchy[existingVerification.company.verificationLevel];
      const newLevelValue = levelHierarchy[verification.level];

      if (newLevelValue > currentLevelValue) {
        await db.company.update({
          where: { id: existingVerification.companyId },
          data: {
            verificationLevel: verification.level,
            isVerified: true,
            verificationStatus: VerificationStatus.VERIFIED
          }
        });
      } else if (newLevelValue === currentLevelValue) {
        await db.company.update({
          where: { id: existingVerification.companyId },
          data: {
            isVerified: true,
            verificationStatus: VerificationStatus.VERIFIED
          }
        });
      }

      // Check if company should get a badge for this verification type
      await awardBadgeIfNeeded(existingVerification.companyId, verification.level);
    }

    return NextResponse.json({
      success: true,
      data: verification,
      message: `Verification ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('Error reviewing verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to review verification' },
      { status: 500 }
    );
  }
}

// Helper function to award badges based on verification level
async function awardBadgeIfNeeded(companyId: string, level: VerificationLevel) {
  // Find matching badge for this level
  const badge = await db.verificationBadge.findFirst({
    where: {
      level: { lte: level }, // Badge requires this level or lower
      isDisplayed: true
    },
    orderBy: { level: 'desc' }
  });

  if (badge) {
    // Check if company already has this badge
    const existingBadge = await db.companyBadge.findUnique({
      where: {
        companyId_badgeId: {
          companyId,
          badgeId: badge.id
        }
      }
    });

    if (!existingBadge) {
      // Award the badge
      await db.companyBadge.create({
        data: {
          companyId,
          badgeId: badge.id
        }
      });
    }
  }
}

// GET /api/verification/[id] - Get single verification details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const verification = await db.supplierVerification.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            contactEmail: true,
            contactPhone: true,
            wilaya: true
          }
        }
      }
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, error: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Error fetching verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch verification' },
      { status: 500 }
    );
  }
}
