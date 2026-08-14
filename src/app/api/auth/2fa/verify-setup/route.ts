/**
 * POST /api/auth/2fa/verify-setup
 * Verify user can generate valid codes
 * Enable 2FA on success
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyTOTP, hashVerificationCode } from '@/lib/auth/twoFactor';
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
    const { userId, code, secret } = body;

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'ID utilisateur et code requis', code: 'MISSING_PARAMS' },
        { status: 400 }
      );
    }

    if (code.length !== 6) {
      return NextResponse.json(
        { error: 'Le code doit contenir 6 chiffres', code: 'INVALID_CODE_LENGTH' },
        { status: 400 },
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

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Aucun secret 2FA trouvé. Veuillez d\'abord initialiser la 2FA.', code: 'NO_SECRET' },
        { status: 400 }
      );
    }

    if (user.twoFactorSecret.enabled) {
      return NextResponse.json(
        { error: 'La 2FA est déjà activée', code: 'ALREADY_ENABLED' },
        { status: 400 }
      );
    }

    // Verify the TOTP code
    const isValid = verifyTOTP(code, user.twoFactorSecret.secret);

    if (!isValid) {
      // Log failed attempt
      try {
        const { auditLogger } = await import('@/lib/security/auditLog');
        await auditLogger.logSecurity('2fa_verify' as any, userId, {
          success: false,
          errorMessage: 'Invalid TOTP during setup',
          ipAddress: ip,
        });
      } catch (logError) {
        console.error('Failed to log audit:', logError);
      }

      return NextResponse.json(
        { error: 'Code de vérification invalide', code: 'INVALID_CODE' },
        { 
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Enable 2FA
    await db.twoFactorSecret.update({
      where: { userId },
      data: { enabled: true },
    });

    // Create verification record
    await db.twoFactorVerification.create({
      data: {
        userId,
        code: hashVerificationCode(code),
        type: 'setup',
        expiresAt: new Date(Date.now() + 5 * 60_1000), // Expires in 5 minutes (for audit)
        ipAddress: ip,
      },
    });

    // Log successful setup
    try {
      const { auditLogger } = await import('@/lib/security/auditLog');
      await auditLogger.logSecurity('2fa_enable' as any, userId, {
        success: true,
        ipAddress: ip,
        metadata: { stage: 'completed' },
      });
    } catch (logError) {
      console.error('Failed to log audit:', logError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "L'authentification à deux facteurs a été activée avec succès",
        enabled: true,
      },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );

  } catch (error) {
    console.error('Error in 2FA verify-setup:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
