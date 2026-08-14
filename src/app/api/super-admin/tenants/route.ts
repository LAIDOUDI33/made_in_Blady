/**
 * Super Admin Tenants API
 * GET /api/super-admin/tenants - List all tenants with stats
 * POST /api/super-admin/tenants - Create new tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

// GET all tenants
export async function GET() {
  try {
    const tenants = await db.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            companies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des locataires' },
      { status: 500 }
    );
  }
}

// POST create new tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      slug,
      domain,
      primaryColor,
      secondaryColor,
      defaultLanguage,
      currency,
      currencySymbol,
      locale,
      timezone,
      countryName,
      countryCode,
      phonePrefix,
      planType,
      contactEmail,
      contactPhone,
      features,
      // Admin user data
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
    } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { message: 'Le nom et le slug sont requis' },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingTenant = await db.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { message: 'Ce slug est déjà utilisé' },
        { status: 409 }
      );
    }

    // Create tenant
    const tenant = await db.tenant.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        domain: domain || null,
        primaryColor: primaryColor || '#006233',
        secondaryColor: secondaryColor || '#D52B1E',
        defaultLanguage: defaultLanguage || 'fr',
        currency: currency || 'DZD',
        currencySymbol: currencySymbol || 'د.ج',
        locale: locale || 'fr-DZ',
        timezone: timezone || 'Africa/Algiers',
        countryName: countryName || 'Algérie',
        countryCode: countryCode || 'DZ',
        phonePrefix: phonePrefix || '+213',
        planType: planType || 'free',
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        features: JSON.stringify(features || ['catalog', 'rfq', 'messaging']),
      },
    });

    // Create admin user if provided
    if (adminEmail && adminPassword && adminFirstName && adminLastName) {
      try {
        const hashedPassword = await hash(adminPassword, 12);
        
        await db.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            firstName: adminFirstName,
            lastName: adminLastName,
            role: 'ADMIN',
            tenantId: tenant.id,
            isActive: true,
            emailVerified: true, // Auto-verify admin users
          },
        });
      } catch (userError) {
        console.error('Error creating admin user:', userError);
        // Don't fail the whole request if user creation fails
        // Tenant was created successfully
      }
    }

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la création du locataire' },
      { status: 500 }
    );
  }
}
