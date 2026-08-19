import { NextRequest, NextResponse } from 'next/server';
import { verifyProductAuthenticity, generateQRCodeImage } from '@/lib/blockchain/supply-chain';

// GET /api/blockchain/verify/[hash] - Verify product authenticity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash: identifier } = await params;
    
    if (!identifier || identifier.length < 3) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid identifier. Please provide a valid record ID, batch number, or hash.' 
        },
        { status: 400 }
      );
    }
    
    // Perform verification
    const verificationResult = verifyProductAuthenticity(identifier);
    
    // Check if QR code image is requested
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    
    if (format === 'qr' && verificationResult.record) {
      const qrDataUrl = await generateQRCodeImage(verificationResult.record.qrCodeData);
      return new Response(qrDataUrl.split(',')[1], {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `inline; filename="qr-${identifier}.png"`
        }
      });
    }
    
    // Return verification result
    return NextResponse.json({
      success: true,
      data: verificationResult,
      meta: {
        identifier,
        verifiedAt: verificationResult.timestamp,
        isValid: verificationResult.isValid
      }
    });
    
  } catch (error) {
    console.error('Error verifying product:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed due to server error' },
      { status: 500 }
    );
  }
}

// POST /api/blockchain/verify/[hash] - Verify with additional context
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash: identifier } = await params;
    const body = await request.json();
    
    // Perform base verification
    const verificationResult = verifyProductAuthenticity(identifier);
    
    // Additional verification options
    const deepVerify = body.deepVerify === true;
    const includeChain = body.includeChain !== false;
    
    if (deepVerify && verificationResult.record) {
      // Add deeper analysis for high-value verifications
      const record = verificationResult.record;
      
      // Check for anomalies in timestamps
      const events = record.events;
      const timeGaps: Array<{ from: number; to: number; gapHours: number }> = [];
      
      for (let i = 1; i < events.length; i++) {
        const prevTime = new Date(events[i - 1].timestamp).getTime();
        const currTime = new Date(events[i].timestamp).getTime();
        const gapHours = (currTime - prevTime) / (1000 * 60 * 60);
        
        if (gapHours > 72) { // More than 3 days gap
          timeGaps.push({ from: i - 1, to: i, gapHours });
        }
      }
      
      if (timeGaps.length > 0) {
        verificationResult.checks.push({
          checkName: 'Timeline Anomaly Detection',
          passed: timeGaps.length <= 2,
          details: `Found ${timeGaps.length} significant time gaps in supply chain`,
          metadata: timeGaps
        });
      }
      
      // Verify manufacturer registration pattern
      const regNumber = record.manufacturer.registrationNumber;
      const validAlgerianPattern = /^[A-Z]{2,4}-\d{2}-\d{4}-\d+$/;
      
      verificationResult.checks.push({
        checkName: 'Manufacturer Registration Format',
        passed: validAlgerianPattern.test(regNumber),
        details: validAlgerianPattern.test(regNumber)
          ? 'Registration number follows Algerian format'
          : 'Registration number format is unusual',
        expected: 'XX-NN-NNNN-NNNNN',
        actual: regNumber
      });
    }
    
    return NextResponse.json({
      success: true,
      data: verificationResult,
      options: {
        deepVerify,
        includeChain
      },
      meta: {
        identifier,
        verifiedAt: verificationResult.timestamp,
        isValid: verificationResult.isValid
      }
    });
    
  } catch (error) {
    console.error('Error in deep verification:', error);
    return NextResponse.json(
      { success: false, error: 'Deep verification failed' },
      { status: 500 }
    );
  }
}
