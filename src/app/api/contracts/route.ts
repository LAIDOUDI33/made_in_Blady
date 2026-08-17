import { NextRequest, NextResponse } from 'next/server';
import { createContract, listContracts } from '@/lib/contracts';
import type { CreateContractParams, ContractType, ContractStatus } from '@/lib/contracts';

// GET /api/contracts - List contracts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get('status') as ContractStatus || undefined,
      type: searchParams.get('type') as ContractType || undefined,
      createdBy: searchParams.get('createdBy') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    };

    const result = await listContracts(filters);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contracts - فشل في جلب العقود' },
      { status: 500 }
    );
  }
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const params: CreateContractParams = {
      type: body.type || 'SALES_AGREEMENT',
      language: body.language || 'BILINGUAL',
      partyA: body.partyA || {
        companyId: 'demo-supplier-id',
        companyName: 'Supplier Company',
        representativeName: 'Representative',
        representativeTitle: 'Manager',
        email: 'supplier@example.com',
        phone: '+213 XXX XXX XXX',
        address: 'Algeria',
        commercialRegister: '',
        taxId: '',
      },
      partyB: body.partyB || {
        companyId: 'demo-buyer-id',
        companyName: 'Buyer Company',
        representativeName: 'Representative',
        representativeTitle: 'Manager',
        email: 'buyer@example.com',
        phone: '+213 XXX XXX XXX',
        address: 'Algeria',
        commercialRegister: '',
        taxId: '',
      },
      subject: body.subject || 'Sales Agreement',
      subjectAr: body.subjectAr || 'اتفاقية البيع',
      subjectFr: body.subjectFr || 'Contrat de vente',
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : null,
      totalValue: body.totalValue || 0,
      currency: body.currency || 'DZD',
      paymentTerms: body.paymentTerms || 'Net 30',
      penaltyClause: body.penaltyClause,
      warrantyTerms: body.warrantyTerms,
      customClauses: body.customClauses,
      relatedNegotiationId: body.relatedNegotiationId,
      relatedOrderId: body.relatedOrderId,
      createdBy: body.createdBy || 'demo-user-id',
    };

    const contract = await createContract(params);

    return NextResponse.json({
      success: true,
      data: contract,
      message: 'Contract created successfully - تم إنشاء العقد بنجاح',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create contract - فشل في إنشاء العقد' 
      },
      { status: 400 }
    );
  }
}
