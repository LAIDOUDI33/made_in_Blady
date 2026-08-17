import { NextRequest, NextResponse } from 'next/server';
import { signContract, requestSignature } from '@/lib/contracts';

// POST /api/contracts/[id]/sign - Sign contract
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const body = await request.json();
    const action = body.action; // 'sign' or 'request'

    switch (action) {
      case 'sign': {
        if (!body.signatureImage) {
          return NextResponse.json(
            { success: false, error: 'Signature image is required - صورة التوقيع مطلوبة' },
            { status: 400 }
          );
        }

        const partyId = body.partyId || (body.userId === 'partyA' ? 'A' : 'B');
        
        const contract = await signContract(
          contractId,
          body.userId || 'demo-user-id',
          body.signatureImage,
          partyId
        );

        return NextResponse.json({
          success: true,
          data: contract,
          message: 'Contract signed successfully - تم توقيع العقد بنجاح',
        });
      }

      case 'request': {
        const signatureRequest = await requestSignature(
          contractId,
          body.partyId || 'B', // Default to requesting Party B signature
          body.requestedToUserId || 'demo-user-id',
          body.expiresInDays || 7
        );

        return NextResponse.json({
          success: true,
          data: signatureRequest,
          message: 'Signature request sent - تم إرسال طلب التوقيع',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "sign" or "request"' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in sign operation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Sign operation failed - فشلت عملية التوقيع' 
      },
      { status: 400 }
    );
  }
}
