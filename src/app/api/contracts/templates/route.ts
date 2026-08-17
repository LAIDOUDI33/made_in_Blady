import { NextResponse } from 'next/server';
import { getContractTemplate, getAvailableContractTypes } from '@/lib/contracts/templates';

// GET /api/contracts/templates - List available contract templates
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const language = (searchParams.get('language') || 'BILINGUAL') as any;

    if (type) {
      // Return specific template
      const template = getContractTemplate(type, language);
      return NextResponse.json({
        success: true,
        data: template,
      });
    }

    // Return list of all available types
    const types = getAvailableContractTypes();
    
    return NextResponse.json({
      success: true,
      data: types,
      message: 'Available contract templates - قوالب العقود المتاحة',
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch templates - فشل في جلب القوالب' 
      },
      { status: 500 }
    );
  }
}
