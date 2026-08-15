/**
 * POST /api/auth/2fa/setup
 * Generate new 2FA secret + backup codes
 * Returns QR code URI + secret (encrypted)
 * 
 * SECURITY: Requires authenticated session - userId extracted from session, not request body
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  generateSecret,
  generateBackupCodes,
  generateQRCodeURI,
  generateQRCodeDataURL,
} from '@/lib/auth/twoFactor';
import { checkRateLimit, getRateLimitHeaders, createRateLimitResponse, RATE_LIMITS } from '@/lib/security/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    // CRITICAL FIX: Authenticate user first - get userId from session, NOT request body
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous connecter.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    // Use userId from authenticated session (prevents IDOR attacks)
    const userId = session.user.id;
    
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    // Rate limit check (after auth to avoid bypass)
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

    // Note: userId is now from the authenticated session, not request body
    // This prevents attackers from setting up 2FA on other users' accounts

    // Get user
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

    // Check if 2FA is already enabled
    if (user.twoFactorSecret?.enabled) {
      return NextResponse.json(
        { error: 'La 2FA est déjà activée sur ce compte', code: 'ALREADY_ENABLED' },
        { status: 400,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      );
    }

    // Generate new 2FA secret
    const { secret, encryptedSecret } = generateSecret();
    
    // Generate backup codes
    const { codes: backupCodes, encryptedCodes: encryptedBackupCodes } = generateBackupCodes(10);

    // Generate QR Code URI
    const qrCodeUri = generateQRCodeURI(user.email, secret);
    
    // Generate QR Code as data URL
    const qrCodeDataUrl = await generateQRCodeDataURL(qrCodeUri);

    // Save to database (not enabled yet - will be enabled after verification)
    await db.twoFactorSecret.upsert({
      where: { userId },
      update: {
        secret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
        enabled: false,
      },
      create: {
        userId,
        secret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
        enabled: false,
      },
    });

    // Log the setup initiation
    try {
      const { auditLogger } = await import('@/lib/security/auditLog');
      await auditLogger.logSecurity('2fa_enable' as any, userId, {
        success: true,
        ipAddress: ip,
        metadata: { stage: 'initiated' },
      });
    } catch (logError) {
      console.error('Failed to log audit:', logError);
    }

    return NextResponse.json(
      {
        secret, // Plain text secret for QR code generation
        qrCodeUri,
        qrCodeDataUrl,
        backupCodes, // Show once during setup
        message: 'Secret 2FA généré avec succès. Veuillez le vérifier pour activer.',
      },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );

  } catch (error) {
    console.error('Error in 2FA setup:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
