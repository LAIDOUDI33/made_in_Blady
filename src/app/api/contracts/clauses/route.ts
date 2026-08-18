// Clauses API Route
// مسار API البنود

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllClauses,
  getClausesByCategory,
  searchClauses,
  getRequiredClauses,
  getCategorySummary,
  getTemplatePlaceholders,
} from '@/lib/contracts/config';

// GET /api/contracts/clauses - List/search clauses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const keyword = searchParams.get('keyword');
    const requiredOnly = searchParams.get('requiredOnly') === 'true';
    const contractType = searchParams.get('contractType');

    let clauses;
    
    if (keyword) {
      clauses = searchClauses(keyword);
    } else if (category) {
      clauses = getClausesByCategory(category);
    } else if (contractType) {
      clauses = getRequiredClauses(contractType as any);
    } else if (requiredOnly) {
      clauses = getAllClauses().filter(c => c.isRequired);
    } else {
      clauses = getAllClauses();
    }

    return NextResponse.json({
      success: true,
      data: clauses,
      meta: {
        total: clauses.length,
        categories: getCategorySummary(),
        placeholders: getTemplatePlaceholders(),
      },
    });
  } catch (error) {
    console.error('Error fetching clauses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clauses' },
      { status: 500 }
    );
  }
}
