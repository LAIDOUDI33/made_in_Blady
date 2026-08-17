import { NextRequest, NextResponse } from 'next/server';
import { getContractById, updateContract, terminateContract, extendContract, amendContract } from '@/lib/contracts';
import type { ContractChange } from '@/lib/contracts';

// GET /api/contracts/[id] - Get contract details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contract = await getContractById(id);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found - العقد غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/[id] - Update contract
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const contract = await updateContract(id, body);

    return NextResponse.json({
      success: true,
      data: contract,
      message: 'Contract updated successfully - تم تحديث العقد بنجاح',
    });
  } catch (error: any) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update contract' 
      },
      { status: 400 }
    );
  }
}

// POST /api/contracts/[id]/terminate - Terminate contract
// POST /api/contracts/[id]/extend - Extend contract
// POST /api/contracts/[id]/amend - Amend contract
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'terminate': {
        const contract = await terminateContract(id, body.reason, new Date(body.effectiveDate));
        return NextResponse.json({
          success: true,
          data: contract,
          message: 'Contract terminated - تم إنهاء العقد',
        });
      }

      case 'extend': {
        const contract = await extendContract(id, new Date(body.newEndDate), body.amendmentTerms || '');
        return NextResponse.json({
          success: true,
          data: contract,
          message: 'Contract extended - تم تمديد العقد',
        });
      }

      case 'amend': {
        const changes: ContractChange[] = body.changes || [];
        const contract = await amendContract(id, changes);
        return NextResponse.json({
          success: true,
          data: contract,
          message: 'Contract amended - تم تعديل العقد',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "terminate", "extend", or "amend"' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in contract action:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Action failed' },
      { status: 400 }
    );
  }
}
