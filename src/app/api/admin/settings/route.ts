import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { UserRole } from '@prisma/client';

// In a real application, settings would be stored in a database table
// For now, we'll use a simple in-memory store (would be Redis or DB in production)
const platformSettings: Record<string, any> = {
  general: {
    platformName: 'AlgeriaTrade.dz',
    supportEmail: 'contact@algeriatrade.dz',
    defaultCurrency: 'DZD',
    enabledLanguages: ['fr', 'ar'],
  },
  registration: {
    requireEmailVerification: true,
    autoApproveBuyers: true,
    requireSupplierVerification: true,
    allowedDomains: '',
  },
  commissions: {
    commissionPercentage: 5,
    paymentMethods: ['bank_transfer', 'ccp', 'baridi_mob'],
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    orderNotifications: true,
    rfqNotifications: true,
    marketingEmails: false,
  },
  security: {
    passwordMinLength: 8,
    sessionTimeout: 30,
    require2FAForAdmins: false,
  },
  maintenance: {
    maintenanceMode: false,
    maintenanceMessage: 'Nous effectuons une mise à jour. Revenez bientôt !',
  }
};

// GET /api/admin/settings - Get all platform settings
export async function GET(request: NextRequest) {
  try {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    if (section && platformSettings[section]) {
      return NextResponse.json({
        success: true,
        data: {
          [section]: platformSettings[section]
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: platformSettings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update platform settings
export async function PUT(request: NextRequest) {
  try {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

    const body = await request.json();
    const { section, settings } = body;

    if (!section || !settings) {
      return NextResponse.json(
        { success: false, error: 'Section et paramètres requis' },
        { status: 400 }
      );
    }

    // Validate section exists
    if (!platformSettings[section]) {
      return NextResponse.json(
        { success: false, error: 'Section invalide' },
        { status: 400 }
      );
    }

    // Update settings (in real app, this would save to DB)
    platformSettings[section] = { ...platformSettings[section], ...settings };

    // Log audit action
    console.log(`[AUDIT] Admin updated settings section: ${section}`);

    return NextResponse.json({
      success: true,
      message: 'Paramètres sauvegardés avec succès',
      data: {
        [section]: platformSettings[section]
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur lors de la sauvegarde des paramètres' },
      { status: 500 }
    );
  }
}
