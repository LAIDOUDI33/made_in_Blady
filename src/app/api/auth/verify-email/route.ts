/**
 * Email Verification API Route
 * 
 * GET /api/auth/verify-email?token=xxx
 * Verifies email from link and marks email as verified.
 * Redirects to dashboard with success message.
 * 
 * @module api/auth/verify-email
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

// Simple token storage (in production, use Redis or database)
const verificationTokens = new Map<string, { userId: string; email: string; expiresAt: Date; used: boolean }>();

export function generateVerificationToken(userId: string, email: string): string {
  const token = randomBytes(32).toString('hex');
  verificationTokens.set(token, {
    userId,
    email,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    used: false,
  });
  return token;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        `${process.env.APP_URL || 'https://algeriatrade.dz'}/login?error=missing_token`
      );
    }

    // Verify token
    const tokenData = verificationTokens.get(token);

    if (!tokenData) {
      return NextResponse.redirect(
        `${process.env.APP_URL || 'https://algeriatrade.dz'}/login?error=invalid_token`
      );
    }

    if (tokenData.used) {
      return NextResponse.redirect(
        `${process.env.APP_URL || 'https://algeriatrade.dz'}/login?error=token_used`
      );
    }

    if (new Date() > tokenData.expiresAt) {
      return NextResponse.redirect(
        `${process.env.APP_URL || 'https://algeriatrade.dz'}/login?error=token_expired`
      );
    }

    // Mark token as used
    tokenData.used = true;

    // Update user's email verified status
    await db.user.update({
      where: { id: tokenData.userId },
      data: { emailVerified: true },
    });

    // Create notification for successful verification
    await db.notification.create({
      data: {
        userId: tokenData.userId,
        type: 'EMAIL_VERIFIED',
        category: 'AUTH',
        title: 'Email vérifié avec succès',
        message: 'Votre adresse email a été vérifiée. Votre compte est maintenant entièrement activé.',
        actionUrl: '/dashboard',
        actionText: 'Aller au tableau de bord',
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.APP_URL || 'https://algeriatrade.dz'}/login?verified=true&email=${encodeURIComponent(tokenData.email)}`
    );

  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      `${process.env.APP_URL || 'https://algeriatrade.dz'}/login?error=verification_failed`
    );
  }
}

/**
 * POST /api/auth/verify-email/request
 * Request a new verification email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'L\'email est requis' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal that user doesn't exist
      return NextResponse.json({
        message: 'Si cet email est associé à un compte, un lien de vérification sera envoyé.',
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Cet email est déjà vérifié.',
        alreadyVerified: true,
      });
    }

    // Generate and store new token
    const token = generateVerificationToken(user.id, user.email);

    // In production, send actual email here using emailService
    console.log(`[DEV] Verification token for ${email}: ${token}`);
    console.log(`[DEV] Verification URL: ${process.env.APP_URL || 'https://algeriatrade.dz'}/api/auth/verify-email?token=${token}`);

    return NextResponse.json({
      message: 'Un email de vérification a été envoyé.',
      devToken: process.env.NODE_ENV === 'development' ? token : undefined,
    });

  } catch (error: any) {
    console.error('Request verification email error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email de vérification' },
      { status: 500 }
    );
  }
}
