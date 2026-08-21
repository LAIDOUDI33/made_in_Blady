import { NextRequest, NextResponse } from 'next/server';
import {
  issueCertificate,
  getCertificate,
  getAllCertificates,
  revokeCertificate,
  batchCertify
} from '@/lib/blockchain/supply-chain';
import type { CertificateType } from '@/lib/blockchain/types';

// GET /api/blockchain/certificates - List or retrieve certificates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');
    const certificateNumber = searchParams.get('certificateNumber');
    const type = searchParams.get('type') as CertificateType | null;
    const status = searchParams.get('status');
    const provenanceId = searchParams.get('provenanceId');
    
    // Get specific certificate by ID
    if (id) {
      const certificate = getCertificate(id);
      if (!certificate) {
        return NextResponse.json(
          { success: false, error: 'Certificate not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: certificate });
    }
    
    // Get all certificates with optional filtering
    let certificates = getAllCertificates();
    
    // Filter by certificate number
    if (certificateNumber) {
      certificates = certificates.filter(c => 
        c.certificateNumber.toLowerCase().includes(certificateNumber.toLowerCase())
      );
    }
    
    // Filter by type
    if (type) {
      certificates = certificates.filter(c => c.type === type);
    }
    
    // Filter by status
    if (status) {
      certificates = certificates.filter(c => c.status === status);
    }
    
    // Filter by provenance ID
    if (provenanceId) {
      certificates = certificates.filter(c => c.provenanceId === provenanceId);
    }
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const start = (page - 1) * limit;
    const paginatedCertificates = certificates.slice(start, start + limit);
    
    return NextResponse.json({
      success: true,
      data: paginatedCertificates,
      pagination: {
        total: certificates.length,
        page,
        limit,
        totalPages: Math.ceil(certificates.length / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/blockchain/certificates - Issue new certificate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      provenanceId, 
      type, 
      issuer, 
      expiryDate, 
      metadata,
      action 
    } = body;
    
    // Handle batch certification
    if (action === 'batch' && body.productIds) {
      const certificates = batchCertify({
        productIds: body.productIds,
        certificateType: type as CertificateType,
        issueDate: new Date().toISOString(),
        expiryDate,
        issuer: issuer || {
          name: 'AlgeriaTrade System',
          organization: 'AlgeriaTrade.dz',
          title: 'Automated Certification'
        },
        notes: metadata?.notes
      });
      
      return NextResponse.json({
        success: true,
        message: `Batch certification completed: ${certificates.length} certificates issued`,
        data: certificates
      }, { status: 201 });
    }
    
    // Validate required fields for single certificate
    if (!provenanceId || !type || !issuer?.name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: provenanceId, type, issuer.name' 
        },
        { status: 400 }
      );
    }
    
    const certificate = issueCertificate({
      provenanceId,
      type: type as CertificateType,
      issuer: {
        name: issuer.name,
        organization: issuer.organization || 'AlgeriaTrade.dz',
        title: issuer.title || 'Certification Officer'
      },
      expiryDate,
      metadata
    });
    
    if (!certificate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to issue certificate. Provenance record not found.' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Certificate issued successfully',
      data: certificate
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/blockchain/certificates - Revoke certificate
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, reason, action } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Certificate ID is required' },
        { status: 400 }
      );
    }
    
    if (action === 'revoke') {
      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Revocation reason is required' },
          { status: 400 }
        );
      }
      
      const success = revokeCertificate(id, reason);
      
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to revoke certificate. Not found or already revoked.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Certificate revoked successfully'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "revoke" to revoke a certificate.' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error updating certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
