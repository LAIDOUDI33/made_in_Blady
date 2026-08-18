// Contract API Routes
// مسارات API العقود
// Routes API Contrats

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  listContracts,
  getContractById,
  createContract,
} from '@/lib/contracts';
import { listAvailableTemplates, getContractTemplate } from '@/lib/contracts/templates';
import { getAllClauses, searchClauses, getCategorySummary } from '@/lib/contracts/config';

// GET /api/contracts - List user's contracts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;

    // In a real app, would filter by authenticated user
    // For now, return all contracts
    
    const result = await listContracts({
      page,
      pageSize,
      status: status as any,
      type: type as any,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('Error listing contracts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list contracts' },
      { status: 500 }
    );
  }
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const contract = await createContract({
      type: body.templateType,
      language: body.language || 'BILINGUAL',
      partyA: body.partyA,
      partyB: body.partyB,
      subject: body.subject,
      subjectAr: body.subjectAr,
      subjectFr: body.subjectFr,
      effectiveDate: new Date(body.effectiveDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      totalValue: parseFloat(body.totalValue) || 0,
      currency: body.currency || 'DZD',
      paymentTerms: body.paymentTerms,
      penaltyClause: body.penaltyClause,
      warrantyTerms: body.warrantyTerms,
      customClauses: body.customClauses,
      createdBy: body.createdBy || 'system',
    });

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
