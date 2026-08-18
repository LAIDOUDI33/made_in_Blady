// Single Contract API Route
// مسار API عقد واحد

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getContractById, signContract } from '@/lib/contracts';
import { 
  createSignature, 
  verifySignature,
  generateCertificateOfAuthenticity,
  getSigningStatusSummary 
} from '@/lib/contracts/e-signature';
import { generateContractHTML } from '@/lib/contracts/pdf-export';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/contracts/[id] - Get contract details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const includeSignatures = request.nextUrl.searchParams.get('signatures') === 'true';
    const format = request.nextUrl.searchParams.get('format'); // 'json' or 'html'

    const contract = await getContractById(id);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Return HTML format for PDF generation
    if (format === 'html') {
      const html = generateContractHTML(contract);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Build response with optional signature info
    const response: any = {
      success: true,
      data: contract,
    };

    if (includeSignatures) {
      const signingStatus = getSigningStatusSummary(id);
      response.signingStatus = signingStatus;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/[id] - Update contract
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingContract = await getContractById(id);
    if (!existingContract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Only allow updates on DRAFT contracts
    if (existingContract.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Can only update draft contracts' },
        { status: 400 }
      );
    }

    // Update the contract in database
    const updated = await db.contract.update({
      where: { id },
      data: {
        ...(body.subject && { subject: body.subject }),
        ...(body.subjectAr && { subjectAr: body.subjectAr }),
        ...(body.subjectFr && { subjectFr: body.subjectFr }),
        ...(body.totalValue !== undefined && { totalValue: body.totalValue }),
        ...(body.paymentTerms && { paymentTerms: body.paymentTerms }),
        ...(body.penaltyClause !== undefined && { penaltyClause: body.penaltyClause }),
        ...(body.warrantyTerms !== undefined && { warrantyTerms: body.warrantyTerms }),
        ...(body.clauses && { clauses: body.clauses }),
        ...(body.customClauses && { customClauses: body.customClauses }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/[id] - Delete contract (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingContract = await getContractById(id);
    if (!existingContract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of DRAFT contracts
    if (existingContract.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Can only delete draft contracts' },
        { status: 400 }
      );
    }

    await db.contract.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Contract deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}
