/**
 * GET /api/auth/sessions
 * List active sessions (device, IP, last active)
 *
 * DELETE /api/auth/sessions
 * Revoke specific session or all other sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, getRateLimitHeaders, createRateLimitResponse, RATE_LIMITS } from '@/lib/security/rateLimiter';

// GET: List active sessions
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

    // Get user's sessions
    const sessions = await db.userSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }, // Only non-expired sessions
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        token: session.token,
        deviceType: session.deviceType,
        deviceName: session.deviceName,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        lastActiveAt: session.lastActiveAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        isCurrent: session.isCurrent,
      })),
      totalSessions: sessions.length,
    });

  } catch (error) {
    console.error('Error getting sessions:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// DELETE: Revoke session(s)
export async function DELETE(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(ip, 'adminAction');
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitResponse(RATE_LIMITS.adminAction!, rateLimitResult),
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId, sessionId, revokeAll, keepCurrent = true } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    let revokedCount = 0;

    if (revokeAll) {
      // Revoke all other sessions (keep current by default)
      const whereClause: Record<string, unknown> = {
        userId,
        expiresAt: { gt: new Date() }, // Only active sessions
      };

      if (keepCurrent) {
        whereClause.isCurrent = false;
      }

      const result = await db.userSession.deleteMany({ where: whereClause });
      revokedCount = result.count;

      // Log the bulk revocation
      try {
        const { auditLogger } = await import('@/lib/security/auditLog');
        await auditLogger.logSecurity('session_revoke_all' as any, userId, {
          success: true,
          ipAddress: ip,
          metadata: { revokedCount, keptCurrent: keepCurrent },
        });
      } catch (logError) {
        console.error('Failed to log audit:', logError);
      }

    } else if (sessionId) {
      // Revoke specific session
      const session = await db.userSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return NextResponse.json(
          { error: 'Session non trouvée', code: 'SESSION_NOT_FOUND' },
          { status: 404 }
        );
      }

      if (session.userId !== userId) {
        return NextResponse.json(
          { error: 'Cette session n\'appartient pas à cet utilisateur', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      if (session.isCurrent) {
        return NextResponse.json(
          { error: 'Impossible de révoquer la session actuelle', code: 'CANNOT_REVOKE_CURRENT' },
          { status: 400 }
        );
      }

      await db.userSession.delete({
        where: { id: sessionId },
      });
      revokedCount = 1;

      // Log the revocation
      try {
        const { auditLogger } = await import('@/lib/security/auditLog');
        await auditLogger.logSecurity('session_revoke' as any, userId, {
          success: true,
          ipAddress: ip,
          metadata: { 
            revokedSessionId: sessionId,
            deviceType: session.deviceType,
            deviceName: session.deviceName,
            sessionIp: session.ipAddress,
          },
        });
      } catch (logError) {
        console.error('Failed to log audit:', logError);
      }
    } else {
      return NextResponse.json(
        { error: 'ID de session ou revokeAll requis', code: 'MISSING_PARAMS' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${revokedCount} session(s) révoquée(s) avec succès`,
        revokedCount,
      },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );

  } catch (error) {
    console.error('Error revoking sessions:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
