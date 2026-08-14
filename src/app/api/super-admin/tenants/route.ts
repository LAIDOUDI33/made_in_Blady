/**
 * Super Admin Tenants API
 * GET /api/super-admin/tenants - List all tenants with stats
 * POST /api/super-admin/tenants - Create new tenant
 * 
 * SECURITY: Requires SUPER_ADMIN role authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Authentication helper for super-admin endpoints
async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    ), user: null };
  }
  
  if (session.user.role !== UserRole.SUPER_ADMIN) {
    return { error: NextResponse.json(
      { success: false, error: 'Forbidden: SUPER_ADMIN role required' },
      { status: 403 }
    ), user: null };
  }
  
  return { error: null, user: session.user };
}

// GET all tenants - SUPER_ADMIN only
export async function GET() {
  // Authenticate and authorize
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  
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

    return NextResponse.json({ success: true, data: tenants });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des locataires' },
      { status: 500 }
    );
  }
}

// POST create new tenant - SUPER_ADMIN only
export async function POST(request: NextRequest) {
  // Authenticate and authorize
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  
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
        { success: false, error: 'Le nom et le slug sont requis' },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingTenant = await db.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Ce slug est déjà utilisé' },
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
        
        // Audit log for security
        await db.auditLog.create({
          data: {
            userId: auth.user!.id,
            action: 'CREATE_TENANT_ADMIN',
            resource: 'tenant',
            resourceId: tenant.id,
            oldValue: null,
            newValue: JSON.stringify({ email: adminEmail, tenantId: tenant.id }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          }
        });
      } catch (userError) {
        console.error('Error creating admin user:', userError);
        // Don't fail the whole request if user creation fails
        // Tenant was created successfully
      }
    }

    // Audit log for tenant creation
    await db.auditLog.create({
      data: {
        userId: auth.user!.id,
        action: 'CREATE_TENANT',
        resource: 'tenant',
        resourceId: tenant.id,
        oldValue: null,
        newValue: JSON.stringify({ name, slug, planType }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      }
    });

    return NextResponse.json({ success: true, data: tenant }, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du locataire' },
      { status: 500 }
    );
  }
}
