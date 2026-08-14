/**
 * Public Tenant by Slug API
 * GET /api/public/tenants/[slug] - Get public info for a specific tenant
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET public tenant info by slug
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    
    const tenant = await db.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        domain: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
        faviconUrl: true,
        backgroundImage: true,
        defaultLanguage: true,
        currency: true,
        currencySymbol: true,
        locale: true,
        timezone: true,
        countryName: true,
        countryCode: true,
        phonePrefix: true,
        features: true,
        isActive: true,
        isPublic: true,
        websiteUrl: true,
        facebookUrl: true,
        contactEmail: true,
        footerText: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { message: 'Plateforme non trouvée' },
        { status: 404 }
      );
    }

    // If tenant is not active or not public, only show basic info
    if (!tenant.isActive || !tenant.isPublic) {
      return NextResponse.json({
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        isActive: tenant.isActive,
        message: 'Cette plateforme n\'est pas actuellement disponible',
      }, { status: 200 });
    }

    // Parse features for easier consumption
    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = JSON.parse(tenant.features || '[]');
    } catch {
      parsedFeatures = [];
    }

    return NextResponse.json({
      ...tenant,
      features: parsedFeatures,
    });
  } catch (error) {
    console.error('Error fetching public tenant:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération de la plateforme' },
      { status: 500 }
    );
  }
}
