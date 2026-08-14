/**
 * POST /api/auth/2fa/login-verify
 * Verify login 2FA code or backup code
 * Return session token on success
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyTOTP, verifyBackupCode, hashVerificationCode, generateSecureToken } from '@/lib/auth/twoFactor';
import { checkRateLimit, getRateLimitHeaders, createRateLimitResponse, RATE_LIMITS } from '@/lib/security/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    // Check rate limit (stricter for login verification)
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
    const { userId, code, backupCode, type = 'login', rememberDevice = false } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!code && !backupCode) {
      return NextResponse.json(
        { error: 'Code 2FA ou code de secours requis', code: 'MISSING_CODE' },
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

    let isValid = false;
    let isBackupCodeUsed = false;

    // Check if using backup code or TOTP
    if (backupCode) {
      // Verify backup code
      const result = verifyBackupCode(backupCode, user.twoFactorSecret.backupCodes || '');
      isValid = result.valid;
      
      if (isValid && result.remainingEncryptedCodes !== undefined) {
        // Update backup codes in database (remove used one)
        await db.twoFactorSecret.update({
          where: { userId },
          data: { backupCodes: result.remainingEncryptedCodes },
        });
        isBackupCodeUsed = true;
      }
    } else if (code) {
      // Verify TOTP code
      isValid = verifyTOTP(code, user.twoFactorSecret.secret);
    }

    if (!isValid) {
      // Log failed attempt
      try {
        const { auditLogger } = await import('@/lib/security/auditLog');
        await auditLogger.logSecurity('2fa_verify' as any, userId, {
          success: false,
          errorMessage: `Invalid ${isBackupCodeUsed ? 'backup' : 'TOTP'} code during login`,
          ipAddress: ip,
          metadata: { type },
        });
        
        // Also log to security events for potential brute force detection
        await db.securityEvent.create({
          data: {
            eventType: '2fa_failure',
            ipAddress: ip,
            userId,
            details: JSON.stringify({ type, attemptTime: new Date().toISOString() }),
            severity: 'medium',
          },
        });
      } catch (logError) {
        console.error('Failed to log audit:', logError);
      }

      return NextResponse.json(
        { 
          error: backupCode ? 'Code de secours invalide' : 'Code 2FA invalide',
          code: 'INVALID_CODE' 
        },
        { 
          status: 401,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Create verification record
    await db.twoFactorVerification.create({
      data: {
        userId,
        code: hashVerificationCode(code || backupCode),
        type: backupCode ? 'backup' : 'login',
        expiresAt: new Date(Date.now() + 5 * 60_1000), // Expires in 5 minutes
        ipAddress: ip,
        usedAt: new Date(),
      },
    });

    // Generate session token (in real app, this would be a JWT)
    const sessionToken = generateSecureToken(64);

    // Calculate session expiry (30 days if remember device, otherwise standard session)
    const sessionExpiry = rememberDevice
      ? new Date(Date.now() + 30 * 24 * 60 * 60_1000) // 30 days
      : new Date(Date.now() + 24 * 60 * 60_1000);     // 1 day

    // Create/update session record
    const userAgent = request.headers.get('user-agent') || undefined;
    
    // Detect device type from user agent
    let deviceType: string | undefined;
    if (userAgent) {
      if (/Mobile|Android|iPhone/i.test(userAgent) && !/iPad/i.test(userAgent)) {
        deviceType = 'mobile';
      } else if (/iPad|Tablet/i.test(userAgent)) {
        deviceType = 'tablet';
      } else {
        deviceType = 'desktop';
      }
    }

    await db.userSession.create({
      data: {
        userId,
        token: sessionToken,
        deviceType,
        deviceName: userAgent?.substring(0, 100), // Truncate for storage
        ipAddress: ip,
        userAgent,
        lastActiveAt: new Date(),
        expiresAt: sessionExpiry,
        isCurrent: true,
      },
    });

    // Update user's last login info
    await db.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    // Log successful authentication
    try {
      const { auditLogger } = await import('@/lib/security/auditLog');
      await auditLogger.logAuth('login', userId, {
        success: true,
        ipAddress: ip,
        userAgent,
        userRole: user.role,
      });
    } catch (logError) {
      console.error('Failed to log audit:', logError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Vérification 2FA réussie',
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        sessionExpiresAt: sessionExpiry.toISOString(),
        wasBackupCode: isBackupCodeUsed,
      },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );

  } catch (error) {
    console.error('Error in 2FA login-verify:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
