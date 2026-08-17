import { NextRequest, NextResponse } from 'next/server';
import { amendContract } from '@/lib/contracts';

// POST /api/contracts/[id]/amend - Create amendment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const body = await request.json();

    if (!body.changes || !Array.isArray(body.changes)) {
      return NextResponse.json(
        { success: false, error: 'Changes array is required - مصفوفة التغييرات مطلوبة' },
        { status: 400 }
      );
    }

    // Validate each change object
    for (const change of body.changes) {
      if (!change.clauseId || !change.field || !change.newValue || !change.reason) {
        return NextResponse.json(
          { success: false, error: 'Each change must include clauseId, field, newValue, and reason' },
          { status: 400 }
        );
      }
    }

    const contract = await amendContract(contractId, body.changes);

    return NextResponse.json({
      success: true,
      data: contract,
      message: 'Contract amended successfully - تم تعديل العقد بنجاح',
      amendmentNumber: contract.version,
    });
  } catch (error: any) {
    console.error('Error amending contract:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to amend contract - فشل في تعديل العقد' 
      },
      { status: 400 }
    );
  }
}
