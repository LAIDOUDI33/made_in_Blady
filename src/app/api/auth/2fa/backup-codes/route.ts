/**
 * GET /api/auth/2fa/backup-codes
 * Show remaining backup codes (masked)
 *
 * POST /api/auth/2fa/backup-codes
 * Regenerate new backup codes (requires current 2FA code)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateBackupCodes, verifyTOTP, decrypt } from '@/lib/auth/twoFactor';
import { checkRateLimit, getRateLimitHeaders, createRateLimitResponse, RATE_LIMITS } from '@/lib/security/rateLimiter';

// GET: Show remaining backup codes count and masked codes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Get user with 2FA secret
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { twoFactorSecret: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!user.twoFactorSecret?.enabled) {
      return NextResponse.json(
        { error: 'La 2FA n\'est pas activée sur ce compte', code: 'NOT_ENABLED' },
        { status: 400 }
      );
    }

    // Decrypt and parse backup codes
    let remainingCodes: string[] = [];
    
    if (user.twoFactorSecret.backupCodes) {
      try {
        remainingCodes = JSON.parse(decrypt(user.twoFactorSecret.backupCodes));
      } catch {
        // If decryption fails, assume no valid codes
        remainingCodes = [];
      }
    }

    // Return masked codes for security (only show first 4 chars of each)
    const maskedCodes = remainingCodes.map(code => 
      code.substring(0, 4) + '-XXXX'
    );

    return NextResponse.json({
      success: true,
      totalCodes: 10,
      remainingCount: remainingCodes.length,
      codes: maskedCodes, // Masked version
      canRegenerate: true,
    });

  } catch (error) {
    console.error('Error getting backup codes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST: Regenerate new backup codes
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(ip, 'twoFactorSetup');
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitResponse(RATE_LIMITS.twoFactorSetup!, rateLimitResult),
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId, twoFactorCode } = body;

    if (!userId || !twoFactorCode) {
      return NextResponse.json(
        { error: 'ID utilisateur et code 2FA requis', code: 'MISSING_PARAMS' },
        { status: 400 }
      );
    }

    if (twoFactorCode.length !== 6) {
      return NextResponse.json(
        { error: 'Le code doit contenir 6 chiffres', code: 'INVALID_CODE_LENGTH' },
        { status: 400 }
      );
    }

    // Get user with 2FA secret
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { twoFactorSecret: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!user.twoFactorSecret?.enabled) {
      return NextResponse.json(
        { error: 'La 2FA n\'est pas activée sur ce compte', code: 'NOT_ENABLED' },
        { status: 400 }
      );
    }

    // Verify current 2FA code before allowing regeneration
    const isCodeValid = verifyTOTP(twoFactorCode, user.twoFactorSecret.secret);

    if (!isCodeValid) {
      return NextResponse.json(
        { error: 'Code 2FA invalide', code: 'INVALID_2FA_CODE' },
        { 
          status: 401,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Generate new backup codes
    const { codes: newBackupCodes, encryptedCodes: encryptedNewBackupCodes } = generateBackupCodes(10);

    // Update database with new backup codes
    await db.twoFactorSecret.update({
      where: { userId },
      data: { backupCodes: encryptedNewBackupCodes },
    });

    // Log the regeneration
    try {
      const { auditLogger } = await import('@/lib/security/auditLog');
      await auditLogger.logSecurity('2fa_enable' as any, userId, {
        success: true,
        ipAddress: ip,
        metadata: { action: 'backup_codes_regenerated' },
      });
    } catch (logError) {
      console.error('Failed to log audit:', logError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Nouveaux codes de secours générés avec succès',
        backupCodes: newBackupCodes, // Show full codes once during generation
        warning: 'Conservez ces codes en lieu sûr. Les anciens codes ne sont plus valides.',
      },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );

  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
