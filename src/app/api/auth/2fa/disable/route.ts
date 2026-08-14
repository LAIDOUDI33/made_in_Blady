/**
 * POST /api/auth/2fa/disable
 * Disable 2FA (require password + current 2FA code)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { verifyTOTP } from '@/lib/auth/twoFactor';
import { checkRateLimit, getRateLimitHeaders, createRateLimitResponse, RATE_LIMITS } from '@/lib/security/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(ip, 'twoFactorVerify');
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitResponse(RATE_LIMITS.twoFactorVerify!, rateLimitResult),
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId, password, twoFactorCode } = body;

    if (!userId || !password || !twoFactorCode) {
      return NextResponse.json(
        { error: 'Mot de passe et code 2FA requis', code: 'MISSING_PARAMS' },
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // Log failed attempt
      try {
        const { auditLogger } = await import('@/lib/security/auditLog');
        await auditLogger.logSecurity('2fa_disable' as any, userId, {
          success: false,
          errorMessage: 'Invalid password during 2FA disable',
          ipAddress: ip,
        });
      } catch (logError) {
        console.error('Failed to log audit:', logError);
      }

      return NextResponse.json(
        { error: 'Mot de passe incorrect', code: 'INVALID_PASSWORD' },
        { 
          status: 401,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Verify 2FA code
    const isCodeValid = verifyTOTP(twoFactorCode, user.twoFactorSecret.secret);

    if (!isCodeValid) {
      // Log failed attempt
      try {
        const { auditLogger } = await import('@/lib/security/auditLog');
        await auditLogger.logSecurity('2fa_disable' as any, userId, {
          success: false,
          errorMessage: 'Invalid 2FA code during disable',
          ipAddress: ip,
        });
      } catch (logError) {
        console.error('Failed to log audit:', logError);
      }

      return NextResponse.json(
        { error: 'Code 2FA invalide', code: 'INVALID_2FA_CODE' },
        { 
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Disable 2FA - delete the secret entirely or set enabled to false
    // We'll keep the record but mark as disabled for potential re-enablement
    await db.twoFactorSecret.update({
      where: { userId },
      data: { 
        enabled: false,
        secret: '', // Clear the encrypted secret
        backupCodes: null, // Clear backup codes
      },
    });

    // Log successful disable
    try {
      const { auditLogger } = await import('@/lib/security/auditLog');
      await auditLogger.logSecurity('2fa_disable' as any, userId, {
        success: true,
        ipAddress: ip,
      });
    } catch (logError) {
      console.error('Failed to log audit:', logError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "La 2FA a été désactivée avec succès",
        enabled: false,
      },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );

  } catch (error) {
    console.error('Error in 2FA disable:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
