import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper to get authenticated user's company
async function getAuthenticatedCompany(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { 
      error: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ), 
      company: null 
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { company: true }
  });

  if (!user?.company) {
    return { 
      error: NextResponse.json(
        { success: false, error: 'No company associated with this account', needsSetup: true },
        { status: 403 }
      ), 
      company: null 
    };
  }

  return { error: null, company: user.company };
}

// GET /api/dashboard/seller/company - Get company profile (authenticated)
export async function GET() {
  const auth = await getAuthenticatedCompany({} as NextRequest);
  if (auth.error) return auth.error;

  try {
    const companyId = auth.company!.id;

    let company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            products: true,
            ordersReceived: true,
            quotations: true,
            companyReviews: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({
        success: false,
        error: 'Profil entreprise non trouvé',
        needsSetup: true,
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/seller/company - Update company profile (authenticated)
export async function PUT(request: NextRequest) {
  const auth = await getAuthenticatedCompany(request);
  if (auth.error) return auth.error;
  
  try {
    const body = await request.json();
    
    const {
      name,
      legalForm,
      rcNumber,
      nif,
      nis,
      website,
      description,
      logo,
      coverImage,
      yearEstablished,
      employeeCount,
      productionCapacity,
      exportCapability,
      wilaya,
      commune,
      address,
      contactEmail,
      contactPhone,
      certifications = [],
    } = body;

    // Validate required fields
    if (!name || !legalForm) {
      return NextResponse.json(
        { success: false, error: 'Le nom et la forme juridique sont obligatoires' },
        { status: 400 }
      );
    }

    const companyId = auth.company!.id;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if company exists
    const existingCompany = await db.company.findUnique({
      where: { id: companyId }
    });

    let updatedCompany;

    if (existingCompany) {
      // Update existing company
      updatedCompany = await db.company.update({
        where: { id: companyId },
        data: {
          name,
          slug,
          legalForm,
          rcNumber: rcNumber || null,
          nif: nif || null,
          nis: nis || null,
          website: website || null,
          description: description || null,
          logo: logo || null,
          coverImage: coverImage || null,
          yearEstablished: yearEstablished ? parseInt(yearEstablished) : null,
          employeeCount: employeeCount ? parseInt(employeeCount) : null,
          productionCapacity: productionCapacity || null,
          exportCapability: exportCapability || false,
          wilaya: wilaya || null,
          commune: commune || null,
          address: address || null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
        },
      });

      // Audit log for company update
      await db.auditLog.create({
        data: {
          userId: auth.company!.userId,
          action: 'UPDATE_COMPANY',
          resource: 'company',
          resourceId: companyId,
          oldValue: JSON.stringify(existingCompany),
          newValue: JSON.stringify(body),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        }
      }).catch(() => {});
    } else {
      // This should not happen normally
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCompany,
      message: 'Profil entreprise mis à jour avec succès',
    });
  } catch (error) {
    console.error('Error updating company profile:', error);
    
    // Handle unique constraint violation for slug
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { success: false, error: 'Une entreprise avec ce nom existe déjà' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
