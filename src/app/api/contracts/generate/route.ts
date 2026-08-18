// Generate Contract API Route
// مسار API توليد العقد

import { NextRequest, NextResponse } from 'next/server';
import { generateContract, generatePreview, fillTemplate } from '@/lib/contracts/generator';
import { getContractTemplate } from '@/lib/contracts/templates';
import type { TemplateVariable } from '@/lib/contracts/generator';

// POST /api/contracts/generate - Generate contract preview or full contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, templateType, variables, partyA, partyB, options } = body;

    if (!templateType) {
      return NextResponse.json(
        { success: false, error: 'templateType is required' },
        { status: 400 }
      );
    }

    if (action === 'preview') {
      // Generate preview only (without saving)
      const previewData = generatePreview({
        templateType,
        language: options?.language || 'BILINGUAL',
        variables: variables || [],
        partyA,
        partyB,
        additionalClauses: options?.additionalClauses,
        removeClauses: options?.removeClauses,
      });

      return NextResponse.json({
        success: true,
        data: previewData,
      });
    }

    if (action === 'generate') {
      // Generate full contract object
      if (!partyA || !partyB) {
        return NextResponse.json(
          { success: false, error: 'partyA and partyB are required for generation' },
          { status: 400 }
        );
      }

      const contract = generateContract({
        templateType,
        language: options?.language || 'BILINGUAL',
        variables: variables || [],
        partyA,
        partyB,
        additionalClauses: options?.additionalClauses,
        removeClauses: options?.removeClauses,
        customClauses: options?.customClauses,
      });

      return NextResponse.json({
        success: true,
        data: contract,
      });
    }

    if (action === 'fill-template') {
      // Just fill a template with variables and return it
      const template = getContractTemplate(templateType, options?.language || 'BILINGUAL');
      const filledTemplate = fillTemplate(template, variables || []);

      return NextResponse.json({
        success: true,
        data: filledTemplate,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "preview", "generate", or "fill-template"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate contract' },
      { status: 500 }
    );
  }
}
