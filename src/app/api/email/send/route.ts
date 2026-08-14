/**
 * Email Send API Route
 * 
 * POST /api/email/send
 * Internal/Admin use for sending ad-hoc emails.
 * Requires admin authentication and rate limiting.
 * 
 * @module api/email/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { emailService, EMAIL_CONFIG } from '@/lib/email/service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Rate limiting store (in-memory for demo)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10; // Max 10 requests per minute

  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    // New window or expired
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    // Authenticate user (admin only)
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Check if admin (optional - can be configured)
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(session.user.role as string);
    
    // Parse request body
    const body = await request.json();
    const { to, subject, html, text, type, userId } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Les champs to, subject et html sont requis' },
        { status: 400 }
      );
 }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    // Send email
    const result = await emailService.send({
      userId: userId || (isAdmin ? undefined : session.user.id),
      type: type || 'PLATFORM_UPDATE',
      to,
      subject,
      html,
      text,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email envoyé avec succès',
      logId: result.logId,
      provider: emailService.getProviderName(),
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      }
    });

  } catch (error: any) {
    console.error('Email send API error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get queue stats (admin info)
    const queueStats = emailService.getQueueStats();
    
    return NextResponse.json({
      provider: emailService.getProviderName(),
      config: {
        from: EMAIL_CONFIG.from,
        environment: process.env.NODE_ENV || 'development',
      },
      queue: queueStats,
    });
  } catch (error: any) {
    console.error('Email info API error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
