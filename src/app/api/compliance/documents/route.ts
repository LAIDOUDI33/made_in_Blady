/**
 * /api/compliance/documents
 * 
 * CRUD operations for compliance documents
 * - GET: List documents for an entity
 * - POST: Upload/validate a document
 * - PUT: Update document metadata
 * - DELETE: Remove a document
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ComplianceDocument {
  id: string;
  entityId: string;
  documentType: string; // rcc, nif, ais, import_license, etc.
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath?: string;
  expiryDate?: string;
  uploadDate: string;
  verifiedAt?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  ocrData?: Record<string, unknown>;
  notes?: string;
  reminderSet: boolean;
  reminderDays?: number;
}

// Mock storage for demo purposes
const mockDocuments: Map<string, ComplianceDocument[]> = new Map([
  ['entity-001', [
    {
      id: 'doc-001',
      entityId: 'entity-001',
      documentType: 'rcc',
      fileName: 'RCC_2024.pdf',
      fileSize: 245000,
      mimeType: 'application/pdf',
      expiryDate: '2024-06-15T00:00:00Z',
      uploadDate: '2024-01-15T10:30:00Z',
      verifiedAt: '2024-01-15T10:31:00Z',
      verificationStatus: 'verified',
      ocrData: { rcc_number: '16B0001234567', company_name: 'ENTREPRISE EXAMPLE SPA' },
      reminderSet: true,
      reminderDays: 60,
    },
    {
      id: 'doc-002',
      entityId: 'entity-001',
      documentType: 'nif',
      fileName: 'Attestation_NIF.jpg',
      fileSize: 180000,
      mimeType: 'image/jpeg',
      uploadDate: '2024-01-10T14:20:00Z',
      verifiedAt: '2024-01-10T14:21:00Z',
      verificationStatus: 'verified',
      ocrData: { nif_number: '000016001234567' },
      reminderSet: false,
    },
  ]],
]);

// GET - List documents
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const entityId = searchParams.get('entityId');
  const documentType = searchParams.get('documentType');
  const status = searchParams.get('status');

  if (!entityId) {
    return NextResponse.json(
      { error: 'Missing required parameter: entityId' },
      { status: 400 }
    );
  }

  try {
    let documents = mockDocuments.get(entityId) || [];

    // Apply filters
    if (documentType) {
      documents = documents.filter(d => d.documentType === documentType);
    }
    if (status) {
      documents = documents.filter(d => d.verificationStatus === status);
    }

    // Calculate summary stats
    const stats = {
      total: documents.length,
      valid: documents.filter(d => d.verificationStatus === 'verified' && (!d.expiryDate || new Date(d.expiryDate) > new Date())).length,
      expiringSoon: documents.filter(d => {
        if (!d.expiryDate) return false;
        const daysUntil = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 90;
      }).length,
      expired: documents.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date()).length,
      pending: documents.filter(d => d.verificationStatus === 'pending').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        documents,
        stats,
      },
    });
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Upload/validate document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityId = formData.get('entityId') as string;
    const documentType = formData.get('documentType') as string;
    const expiryDate = formData.get('expiryDate') as string;

    if (!file || !entityId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, entityId, documentType' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed` },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Create document record
    const newDoc: ComplianceDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityId,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      expiryDate: expiryDate || undefined,
      uploadDate: new Date().toISOString(),
      verificationStatus: 'pending',
      reminderSet: false,
    };

    // Simulate OCR processing for PDFs/images
    let ocrData: Record<string, unknown> | undefined;
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      // Mock OCR result based on document type
      ocrData = simulateOCR(documentType);
      newDoc.ocrData = ocrData;
      newDoc.verificationStatus = 'verified';
      newDoc.verifiedAt = new Date().toISOString();
    }

    // Store in mock storage
    const existingDocs = mockDocuments.get(entityId) || [];
    existingDocs.push(newDoc);
    mockDocuments.set(entityId, existingDocs);

    return NextResponse.json({
      success: true,
      data: newDoc,
      message: 'Document uploaded successfully',
      ocrProcessed: !!ocrData,
    }, { status: 201 });
  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json(
      { error: 'Internal server error during upload' },
      { status: 500 }
    );
  }
}

// PUT - Update document metadata
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, ...updates } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing required field: documentId' },
        { status: 400 }
      );
    }

    // Find and update document in mock storage
    for (const [, docs] of mockDocuments.entries()) {
      const docIndex = docs.findIndex(d => d.id === documentId);
      if (docIndex !== -1) {
        docs[docIndex] = { ...docs[docIndex], ...updates };
        
        return NextResponse.json({
          success: true,
          data: docs[docIndex],
          message: 'Document updated successfully',
        });
      }
    }

    return NextResponse.json(
      { error: 'Document not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove document
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return NextResponse.json(
      { error: 'Missing required parameter: documentId' },
      { status: 400 }
    );
  }

  try {
    for (const [entityId, docs] of mockDocuments.entries()) {
      const docIndex = docs.findIndex(d => d.id === documentId);
      if (docIndex !== -1) {
        const deleted = docs.splice(docIndex, 1)[0];
        
        return NextResponse.json({
          success: true,
          data: deleted,
          message: 'Document deleted successfully',
        });
      }
    }

    return NextResponse.json(
      { error: 'Document not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to simulate OCR extraction
function simulateOCR(documentType: string): Record<string, unknown> {
  const ocrTemplates: Record<string, Record<string, unknown>> = {
    rcc: {
      rcc_number: '16B' + Math.random().toString().substr(2, 8),
      company_name: 'EXTRACTED COMPANY NAME',
      legal_form: 'SARL',
      activity: 'Commerce général',
      capital: '1000000 DZD',
      confidence: 95,
    },
    nif: {
      nif_number: '000016' + Math.random().toString().substr(2, 9),
      entity_name: 'EXTRACTED ENTITY NAME',
      address: 'EXTRACTED ADDRESS',
      confidence: 98,
    },
    cin: {
      cin_number: Math.random().toString().substr(2, 12).toUpperCase(),
      full_name: 'EXTRACTED FULL NAME',
      date_of_birth: '15/06/1985',
      place_of_birth: 'ALGER',
      confidence: 97,
    },
    default: {
      extracted_text: '[Document content would be OCR processed here]',
      confidence: 85,
    },
  };

  return ocrTemplates[documentType] || ocrTemplates.default;
}
