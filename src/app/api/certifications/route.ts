import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/certifications?productId=xxx - List product certifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const companyId = searchParams.get('companyId');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;
    if (companyId) where.companyId = companyId;

    const certifications = await db.productCertification.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            isVerified: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: certifications,
    });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch certifications' },
      { status: 500 }
    );
  }
}

// POST /api/certifications - Create certification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      companyId,
      name,
      issuingBody,
      certificateNumber,
      issueDate,
      expiryDate,
      certificateUrl,
      verificationStatus,
    } = body;

    // Validate required fields
    if (!name || !issuingBody || !certificateNumber || !issueDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, issuingBody, certificateNumber, issueDate',
        },
        { status: 400 }
      );
    }

    // Validate product or company exists if provided
    if (productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }
    }

    if (companyId) {
      const company = await db.company.findUnique({
        where: { id: companyId },
      });
      if (!company) {
        return NextResponse.json(
          { success: false, error: 'Company not found' },
          { status: 404 }
        );
      }
    }

    // Check for duplicate certificate number
    const existingCert = await db.productCertification.findFirst({
      where: { certificateNumber },
    });

    if (existingCert) {
      return NextResponse.json(
        { success: false, error: 'Certificate number already exists' },
        { status: 409 }
      );
    }

    // Create certification
    const certification = await db.productCertification.create({
      data: {
        productId,
        companyId,
        name,
        issuingBody,
        certificateNumber,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        certificateUrl,
        verificationStatus: verificationStatus || 'PENDING',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: certification,
        message: 'Certification created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating certification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create certification' },
      { status: 500 }
    );
  }
}

// PUT /api/certifications - Update certification
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Certification ID is required' },
        { status: 400 }
      );
    }

    // Check if certification exists
    const existingCert = await db.productCertification.findUnique({
      where: { id },
    });

    if (!existingCert) {
      return NextResponse.json(
        { success: false, error: 'Certification not found' },
        { status: 404 }
      );
    }

    // Convert date strings to Date objects
    if (updateData.issueDate) {
      updateData.issueDate = new Date(updateData.issueDate);
    }
    if (updateData.expiryDate) {
      updateData.expiryDate = new Date(updateData.expiryDate);
    }

    // Update certification
    const certification = await db.productCertification.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: certification,
      message: 'Certification updated successfully',
    });
  } catch (error) {
    console.error('Error updating certification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update certification' },
      { status: 500 }
    );
  }
}

// DELETE /api/certifications - Delete certification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Certification ID is required' },
        { status: 400 }
      );
    }

    // Check if certification exists
    const existingCert = await db.productCertification.findUnique({
      where: { id },
    });

    if (!existingCert) {
      return NextResponse.json(
        { success: false, error: 'Certification not found' },
        { status: 404 }
      );
    }

    // Delete certification
    await db.productCertification.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Certification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting certification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete certification' },
      { status: 500 }
    );
  }
}
