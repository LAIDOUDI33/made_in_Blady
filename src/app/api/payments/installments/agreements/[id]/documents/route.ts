import { NextRequest, NextResponse } from 'next/server'
import {
  uploadDPADocument,
  getAgreementDocuments,
  verifyDocument,
} from '@/lib/payments/installments/manager'

// GET /api/payments/installments/agreements/[id]/documents
// List documents for an agreement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Agreement ID is required' },
        { status: 400 }
      )
    }

    const documents = await getAgreementDocuments(id)

    return NextResponse.json({
      success: true,
      data: documents
    })
  } catch (error) {
    console.error('Error fetching DPA documents:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// POST /api/payments/installments/agreements/[id]/documents
// Upload a document for an agreement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Parse form data for file upload
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    const uploadedBy = formData.get('uploadedBy') as string | undefined

    if (!id) {
      return NextResponse.json(
        { error: 'Agreement ID is required' },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: 'file is required' },
        { status: 400 }
      )
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'documentType is required' },
        { status: 400 }
      )
    }

    // Valid document types
    const validTypes = [
      'ID_CARD',
      'PASSPORT',
      'BUSINESS_REG',
      'BANK_STATEMENT',
      'TAX_RETURN',
      'FINANCIAL_STATEMENT',
      'BANK_GUARANTEE',
      'COMMERCIAL_REGISTER',
      'NIF_CERTIFICATE',
      'OTHER'
    ]

    if (!validTypes.includes(documentType.toUpperCase())) {
      return NextResponse.json(
        { 
          error: `Invalid document type. Must be one of: ${validTypes.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Validate file type
    const validMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ]

    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Only PDF, JPEG, and PNG files are allowed.' 
        },
        { status: 400 }
      )
    }

    // In production, you would upload to cloud storage (S3, GCS, etc.)
    // For now, we'll simulate with a placeholder URL
    const fileUrl = `/uploads/dpa-documents/${id}/${Date.now()}-${file.name}`
    
    // Upload document record to database
    const document = await uploadDPADocument(
      id,
      documentType.toUpperCase(),
      file.name,
      fileUrl,
      file.size,
      file.type,
      uploadedBy
    )

    return NextResponse.json({
      success: true,
      data: {
        document,
        message: 'Document uploaded successfully'
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading DPA document:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// PATCH /api/payments/installments/agreements/[id]/documents
// Verify/reject a document (admin action)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Note: This would typically be /documents/[documentId] but we're using query params here
    const body = await request.json()
    const { documentId, verifiedBy, approved, rejectionReason } = body

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      )
    }

    if (!verifiedBy) {
      return NextResponse.json(
        { error: 'verifiedBy is required - ID of admin verifying this document' },
        { status: 400 }
      )
    }

    // Verify the document
    const updatedDocument = await verifyDocument(
      documentId,
      verifiedBy,
      approved ?? true,
      rejectionReason
    )

    return NextResponse.json({
      success: true,
      data: {
        document: updatedDocument,
        message: approved ? 'Document verified successfully' : 'Document rejected'
      }
    })
  } catch (error) {
    console.error('Error verifying DPA document:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
