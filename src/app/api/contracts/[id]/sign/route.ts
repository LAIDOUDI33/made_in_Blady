// Sign Contract API Route
// مسار API توقيع العقد

import { NextRequest, NextResponse } from 'next/server';
import { getContractById, signContract } from '@/lib/contracts';
import {
  createSignature,
  verifySignature,
  generateCertificateOfAuthenticity,
} from '@/lib/contracts/e-signature';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/contracts/[id]/sign - Sign a contract
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { signerId, signerName, signerEmail, signerRole, signatureContent, signatureType } = body;

    // Validate required fields
    if (!signerId || !signerName || !signerEmail || !signerRole || !signatureContent) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: signerId, signerName, signerEmail, signerRole, signatureContent' },
        { status: 400 }
      );
    }

    // Get the contract
    const contract = await getContractById(id);
    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if contract can be signed
    if (!['DRAFT', 'REVIEW', 'PENDING_SIGNATURE'].includes(contract.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot sign contract in ${contract.status} status` },
        { status: 400 }
      );
    }

    // Determine party ID based on role
    const partyId = signerRole === 'PARTY_A' ? 'A' : 'B';

    // Create digital signature record
    const signature = createSignature({
      contractId: id,
      signerId,
      signerName,
      signerEmail,
      signerRole,
      signatureType: signatureType || 'DRAWN',
      signatureContent,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Update contract with signature
    const updatedContract = await signContract(id, signerId, signatureContent, partyId);

    // Check if fully signed now
    const isFullySigned = !!updatedContract.partyASignedAt && !!updatedContract.partyBSignedAt;

    let certificate = null;
    if (isFullySigned) {
      // Generate certificate of authenticity
      certificate = generateCertificateOfAuthenticity({
        contractId: id,
        contractNumber: contract.contractNumber,
        signatures: [signature], // Would include all signatures in production
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        contract: updatedContract,
        signature: {
          id: signature.id,
          signedAt: signature.signedAt,
          hash: signature.hash,
        },
        isFullySigned,
        certificate,
      },
    });
  } catch (error) {
    console.error('Error signing contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sign contract' },
      { status: 500 }
    );
  }
}

// GET /api/contracts/[id]/sign - Get signing status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const contract = await getContractById(id);
    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Return current signing status
    return NextResponse.json({
      success: true,
      data: {
        contractId: id,
        status: contract.status,
        partyA: {
          name: contract.partyA?.representativeName,
          signedAt: contract.partyASignedAt,
          hasSignature: !!contract.partyASignatureUrl,
        },
        partyB: {
          name: contract.partyB?.representativeName,
          signedAt: contract.partyBSignedAt,
          hasSignature: !!contract.partyBSignatureUrl,
        },
        isFullySigned: !!contract.partyASignedAt && !!contract.partyBSignedAt,
      },
    });
  } catch (error) {
    console.error('Error getting signing status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get signing status' },
      { status: 500 }
    );
  }
}
