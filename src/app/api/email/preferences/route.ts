/**
 * Email Preferences API Route
 * 
 * GET /api/email/preferences - Get user email preferences
 * PUT /api/email/preferences - Update user email preferences
 * 
 * @module api/email/preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const preferences = await emailService.getUserPreferences(session.user.id);

    return NextResponse.json({
      success: true,
      preferences: {
        emailEnabled: preferences.emailEnabled,
        marketingEmails: preferences.marketingEmails,
        authEmails: preferences.authEmails,
        rfqEmails: preferences.rfqEmails,
        orderEmails: preferences.orderEmails,
        messageEmails: preferences.messageEmails,
        systemEmails: preferences.systemEmails,
        digestFrequency: preferences.digestFrequency,
        unsubscribedAt: preferences.unsubscribedAt,
      },
      unsubscribeUrl: emailService.getUnsubscribeUrl(preferences.unsubscribeToken),
    });

  } catch (error: any) {
    console.error('Get email preferences error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des préférences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate allowed fields
    const allowedFields = [
      'emailEnabled',
      'marketingEmails',
      'authEmails',
      'rfqEmails',
      'orderEmails',
      'messageEmails',
      'systemEmails',
      'digestFrequency',
    ];

    const updates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Validate boolean fields
        if (['emailEnabled', 'marketingEmails', 'authEmails', 'rfqEmails', 
             'orderEmails', 'messageEmails', 'systemEmails'].includes(field)) {
          if (typeof body[field] !== 'boolean') {
            return NextResponse.json(
              { error: `Le champ ${field} doit être un booléen` },
              { status: 400 }
            );
          }
        }
        
        // Validate digest frequency
        if (field === 'digestFrequency') {
          const validFrequencies = ['immediate', 'daily', 'weekly', 'off'];
          if (!validFrequencies.includes(body[field])) {
            return NextResponse.json(
              { error: `Fréquence invalide. Valeurs acceptées : ${validFrequencies.join(', ')}` },
              { status: 400 }
            );
          }
        }
        
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Aucune mise à jour fournie' },
        { status: 400 }
      );
    }

    // If user is re-enabling emails after unsubscribe, clear the date
    if (updates.emailEnabled === true) {
      updates.unsubscribedAt = null;
    }

    const updatedPreferences = await emailService.updateUserPreferences(
      session.user.id,
      updates
    );

    return NextResponse.json({
      success: true,
      message: 'Préférences mises à jour avec succès',
      preferences: {
        emailEnabled: updatedPreferences.emailEnabled,
        marketingEmails: updatedPreferences.marketingEmails,
        authEmails: updatedPreferences.authEmails,
        rfqEmails: updatedPreferences.rfqEmails,
        orderEmails: updatedPreferences.orderEmails,
        messageEmails: updatedPreferences.messageEmails,
        systemEmails: updatedPreferences.systemEmails,
        digestFrequency: updatedPreferences.digestFrequency,
      },
    });

  } catch (error: any) {
    console.error('Update email preferences error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des préférences' },
      { status: 500 }
    );
  }
}
