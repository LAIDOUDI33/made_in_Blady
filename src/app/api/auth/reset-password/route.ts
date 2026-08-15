/**
 * Password Reset API Route
 * 
 * POST /api/auth/reset-password - Request password reset (send email)
 * PUT /api/auth/reset-password - Reset password with token
 * 
 * @module api/auth/reset-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';

// Simple token storage (in production, use Redis or database)
const resetTokens = new Map<string<{ 
  userId: string; 
  email: string; 
  expiresAt: Date; 
  used: boolean;
  requestIp?: string;
}>();

export function generateResetToken(userId: string, email: string, requestIp?: string): string {
  const token = randomBytes(32).toString('hex');
  resetTokens.set(token, {
    userId,
    email,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    used: false,
    requestIp,
  });
  
  // Clean up expired tokens periodically
  cleanExpiredTokens();
  
  return token;
}

function cleanExpiredTokens() {
  const now = new Date();
  for (const [token, data] of resetTokens.entries()) {
    if (now > data.expiresAt || data.used) {
      resetTokens.delete(token);
    }
  }
}

/**
 * POST - Request password reset
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

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'Si cet email est associé à un compte, un lien de réinitialisation sera envoyé.',
      });
    }

    // Generate reset token
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const token = generateResetToken(user.id, user.email, ip);

    // In production, send actual email here using emailService
    // SECURITY FIX: Removed token logging in production - only log non-sensitive info
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Password reset initiated for email: ${email}`);
      console.log(`[DEV] Reset URL would be sent via email`);
    }

    // Create notification about password reset request
    await db.notification.create({
      data: {
        userId: user.id,
        type: 'PASSWORD_RESET_REQUEST',
        category: 'AUTH',
        title: 'Demande de réinitialisation de mot de passe',
        message: 'Une demande de réinitialisation de mot de passe a été effectuée pour votre compte.',
        isRead: true,
      },
    });

    return NextResponse.json({
      message: 'Un email de réinitialisation a été envoyé si ce compte existe.',
      // SECURITY FIX: Removed devToken from response - token should never be exposed
      // In development, check server logs or use debugging tools instead
    });

  } catch (error: any) {
    console.error('Request password reset error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la demande de réinitialisation' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Reset password with token
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Le token et le nouveau mot de passe sont requis' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // Verify token
    const tokenData = resetTokens.get(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 400 }
      );
    }

    if (tokenData.used) {
      return NextResponse.json(
        { error: 'Ce token a déjà été utilisé' },
        { status: 400 }
      );
    }

    if (new Date() > tokenData.expiresAt) {
      return NextResponse.json(
        { error: 'Ce token a expiré. Veuillez faire une nouvelle demande.' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update user's password
    await db.user.update({
      where: { id: tokenData.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    tokenData.used = true;

    // Create notification for successful password change
    await db.notification.create({
      data: {
        userId: tokenData.userId,
        type: 'PASSWORD_RESET_SUCCESS',
        category: 'AUTH',
        title: 'Mot de passe modifié avec succès',
        message: 'Votre mot de passe a été changé avec succès. Si vous n\'avez pas effectué cette action, contactez-nous immédiatement.',
        isRead: false,
        actionUrl: '/dashboard/settings/security',
        actionText: 'Paramètres de sécurité',
      },
    });

    // Invalidate all existing sessions (in production, you'd want to do this properly)
    console.log(`[DEV] Password changed for user ${tokenData.email}. Sessions should be invalidated.`);

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter.',
    });

  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}

/**
 * GET - Validate token (for frontend check before showing reset form)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token manquant' },
        { status: 400 }
      );
    }

    const tokenData = resetTokens.get(token);

    if (!tokenData) {
      return NextResponse.json({
        valid: false,
        error: 'Token invalide ou expiré',
      });
    }

    if (tokenData.used) {
      return NextResponse.json({
        valid: false,
        error: 'Token déjà utilisé',
      });
    }

    if (new Date() > tokenData.expiresAt) {
      return NextResponse.json({
        valid: false,
        error: 'Token expiré',
      });
    }

    return NextResponse.json({
      valid: true,
      email: tokenData.email,
      expiresIn: Math.floor((tokenData.expiresAt.getTime() - Date.now()) / 1000 / 60), // minutes remaining
    });

  } catch (error: any) {
    console.error('Validate reset token error:', error);
    return NextResponse.json(
      { valid: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
