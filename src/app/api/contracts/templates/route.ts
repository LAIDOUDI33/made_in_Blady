// Templates API Route
// مسار API القوالب

import { NextRequest, NextResponse } from 'next/server';
import { listAvailableTemplates, getContractTemplate } from '@/lib/contracts/templates';
import { CONTRACT_TYPES } from '@/lib/contracts/config';

// GET /api/contracts/templates - List available templates
export async function GET() {
  try {
    const templates = listAvailableTemplates();

    return NextResponse.json({
      success: true,
      data: templates,
      meta: {
        total: templates.length,
        categories: [...new Set(templates.map(t => t.category))],
        supportedLanguages: ['AR', 'FR', 'BILINGUAL'],
      },
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}
