import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/dashboard/seller/company - Get company profile
export async function GET() {
  try {
    // In production, get company ID from auth session
    const companyId = 'mock-company-id';

    // For demo, create or get mock company
    let company = await db.company.findUnique({
      where: { companyId },
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

// PUT /api/dashboard/seller/company - Update company profile
export async function PUT(request: NextRequest) {
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

    // In production, get company ID from auth session
    const companyId = 'mock-company-id';

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if company exists
    const existingCompany = await db.company.findFirst({
      where: { companyId }
    });

    let updatedCompany;

    if (existingCompany) {
      // Update existing company
      updatedCompany = await db.company.update({
        where: { id: existingCompany.id },
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
    } else {
      // Create new company (should not happen in normal flow)
      updatedCompany = await db.company.create({
        data: {
          companyId,
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
    }

    // Note: Certifications would need a separate table in a real implementation
    // For now, we can store them as JSON in a metadata field or create a separate table

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
