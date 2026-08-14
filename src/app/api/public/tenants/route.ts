/**
 * Public Tenants API
 * GET /api/public/tenants - List all public tenants (for marketplace)
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all public tenants
export async function GET() {
  try {
    const tenants = await db.tenant.findMany({
      where: {
        isActive: true,
        isPublic: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
        countryName: true,
        countryCode: true,
        defaultLanguage: true,
        currency: true,
        currencySymbol: true,
        createdAt: true,
        // Include counts
        _count: {
          select: {
            users: true,
            companies: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Error fetching public tenants:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des plateformes' },
      { status: 500 }
    );
  }
}
