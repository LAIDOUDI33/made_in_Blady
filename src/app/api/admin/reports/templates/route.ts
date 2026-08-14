// ============================================
// Advanced Reporting System - Report Templates API
// GET /api/admin/reports/templates
// Returns available report templates for quick generation
// ============================================

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-utils';
import { DEFAULT_REPORT_TEMPLATES, ReportTemplate } from '@/lib/reports/types';

/**
 * GET handler for report templates
 * Returns all available predefined report templates
 */
export async function GET() {
  try {
    // Optional: Check authentication for personalized templates
    const session = await auth();
    
    // Return all default templates
    // In a full implementation, this could also include:
    // - User's saved custom templates
    // - Tenant-specific templates (for multi-tenant)
    // - Recently used templates by user
    
    return NextResponse.json({
      success: true,
      data: {
        templates: DEFAULT_REPORT_TEMPLATES,
        categories: getTemplateCategories(),
        formats: ['pdf', 'csv', 'excel', 'json', 'html'],
        periods: [
          { value: 'today', label: "Aujourd'hui", description: "Données du jour" },
          { value: 'week', label: 'Cette Semaine', description: '7 derniers jours' },
          { value: 'month', label: 'Ce Mois', description: '30 derniers jours' },
          { value: 'quarter', label: 'Ce Trimestre', description: '3 derniers mois' },
          { value: 'year', label: 'Cette Année', description: '12 derniers mois' },
          { value: 'custom', label: 'Personnalisé', description: 'Choisir les dates' },
        ],
      },
      meta: {
        totalTemplates: DEFAULT_REPORT_TEMPLATES.length,
        isAuthenticated: !!session,
        userRole: session?.user?.role || null,
      }
    });
  } catch (error) {
    console.error('[Report Templates] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des modèles' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - create/save a custom template (future enhancement)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.config) {
      return NextResponse.json(
        { error: 'Nom et configuration requis' },
        { status: 400 }
      );
    }

    // In a full implementation, save to database
    // For now, just acknowledge
    
    return NextResponse.json({
      success: true,
      message: 'Modèle personnalisé créé avec succès',
      data: {
        id: `custom-${Date.now()}`,
        name: body.name,
        config: body.config,
        createdBy: session.user.id,
        createdAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('[Report Templates] Create error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du modèle' },
      { status: 500 }
    );
  }
}

/**
 * Get template categories for grouping
 */
function getTemplateCategories() {
  return [
    {
      id: 'sales',
      name: 'Ventes & Revenus',
      icon: '💰',
      description: 'Rapports sur les performances commerciales',
    },
    {
      id: 'products',
      name: 'Produits & Catalogue',
      icon: '📦',
      description: 'Analyse des produits et fournisseurs',
    },
    {
      id: 'users',
      name: 'Utilisateurs & Clients',
      icon: '👥',
      description: 'Statistiques sur les utilisateurs',
    },
    {
      id: 'financial',
      name: 'Financier & Paiements',
      icon: '💳',
      description: 'Rapports financiers et modes de paiement',
    },
    {
      id: 'operations',
      name: 'Opérations & Logistique',
      icon: '📋',
      description: 'RFQs, stocks et opérations quotidiennes',
    },
  ];
}
