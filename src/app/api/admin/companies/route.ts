import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { UserRole, VerificationStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/db';

// GET /api/admin/companies - List companies with filters
export async function GET(request: NextRequest) {
  try {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]);

    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search') || '';
    const wilaya = searchParams.get('wilaya') || 'ALL';

    // Build where clause
    const where: Prisma.CompanyWhereInput = {};

    if (status !== 'ALL' && status) {
      where.verificationStatus = status as VerificationStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rcNumber: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (wilaya !== 'ALL' && wilaya) {
      where.wilaya = wilaya;
    }

    // Fetch companies with pagination and product count
    const [companies, total] = await Promise.all([
      db.company.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        },
        orderBy: [
          { verificationStatus: 'asc' }, // PENDING first
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.company.count({ where }),
    ]);

    // Get product counts for each company
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const productCount = await db.product.count({
          where: { companyId: company.id }
        });

        return {
          id: company.id,
          name: company.name,
          slug: company.slug,
          legalForm: company.legalForm,
          rcNumber: company.rcNumber,
          nif: company.nif,
          nis: company.nis,
          wilaya: company.wilaya,
          commune: company.commune,
          address: company.address,
          contactEmail: company.contactEmail,
          contactPhone: company.contactPhone,
          description: company.description,
          logo: company.logo,
          verificationStatus: company.verificationStatus,
          isVerified: company.isVerified,
          isActive: company.isActive,
          rating: company.rating,
          reviewCount: company.reviewCount,
          responseRate: company.responseRate,
          productsCount: productCount,
          createdAt: company.createdAt.toISOString(),
          owner: company.user,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        companies: companiesWithCounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    
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
