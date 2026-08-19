/**
 * Supplier Recommendations API Endpoint
 * GET /api/ai/recommendations/suppliers
 * 
 * Provides AI-powered supplier matching and recommendations based on:
 * - Buyer profile compatibility
 * - Category expertise matching
 * - Location proximity
 * - Price competitiveness
 * - Quality/reliability scores
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  findBestSuppliers,
  calculateSupplierCompatibility,
  MOCK_BUYER_PROFILES,
  MOCK_SUPPLIERS,
  type BuyerProfile,
  type SupplierProfile,
  type SupplierMatch,
} from '@/lib/ai/recommendations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const buyerId = searchParams.get('buyerId');
    const categoryId = searchParams.get('category');
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const minScore = parseInt(searchParams.get('minScore') || '0', 10);

    // Validate limit
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    let buyerProfile: BuyerProfile;
    let suppliers: SupplierProfile[];

    // Get or create buyer profile
    if (buyerId) {
      buyerProfile = MOCK_BUYER_PROFILES.find(b => b.id === buyerId);
      if (!buyerProfile) {
        return NextResponse.json(
          { error: `Buyer with ID ${buyerId} not found` },
          { status: 404 }
        );
      }
    } else {
      // Use default buyer profile or create from query params
      buyerProfile = {
        id: 'guest-buyer',
        companyName: 'Guest Company',
        segment: 'sme',
        industry: categoryId || 'General Trade',
        preferredCategories: categoryId ? [categoryId] : ['Construction Materials', 'Metal Products'],
        priceRange: { min: 10000, max: 1000000 },
        location: location 
          ? { wilayaCode: parseInt(location), wilayaName: `Wilaya ${location}` }
          : { wilayaCode: 16, wilayaName: 'Algiers' },
        orderHistory: [],
        browsingHistory: [],
        savedProducts: [],
        rfqHistory: [],
        createdAt: new Date(),
      };
    }

    // Filter suppliers by category if specified
    suppliers = MOCK_SUPPLIERS;
    if (categoryId) {
      suppliers = MOCK_SUPPLIERS.filter(s => 
        s.categories.some(c => 
          c.toLowerCase().includes(categoryId.toLowerCase()) ||
          categoryId.toLowerCase().includes(c.toLowerCase())
        )
      );
      
      // If no matches found, include all but note the filter
      if (suppliers.length === 0) {
        suppliers = MOCK_SUPPLIERS;
      }
    }

    // Filter by location if specified (within N wilayas)
    if (location && !buyerId) {
      const targetWilaya = parseInt(location);
      suppliers = suppliers.filter(s =>
        Math.abs(s.location.wilayaCode - targetWilaya) <= 20
      );
    }

    // Calculate compatibility scores
    const matches: SupplierMatch[] = findBestSuppliers(buyerProfile, suppliers, Math.min(limit, suppliers.length));

    // Apply minimum score filter
    const filteredMatches = matches.filter(m => m.compatibilityScore >= minScore);

    // Sort by score descending
    filteredMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return NextResponse.json({
      success: true,
      buyerInfo: {
        id: buyerProfile.id,
        company: buyerProfile.companyName,
        segment: buyerProfile.segment,
        location: buyerProfile.location.wilayaName,
        preferences: buyerProfile.preferredCategories,
      },
      totalMatches: filteredMatches.length,
      returnedMatches: filteredMatches.length,
      filters: {
        categoryId,
        location,
        minScore,
      },
      generatedAt: new Date().toISOString(),
      recommendations: filteredMatches.map(match => ({
        supplier: {
          id: match.supplier.id,
          name: match.supplier.companyName,
          categories: match.supplier.categories,
          location: match.supplier.location.wilayaName,
          rating: match.supplier.rating,
          verified: match.supplier.verified,
          yearsInBusiness: match.supplier.yearsInBusiness,
          responseTime: `${match.supplier.responseTime}h`,
          fulfillmentRate: `${Math.round(match.supplier.fulfillmentRate * 100)}%`,
        },
        compatibilityScore: match.compatibilityScore,
        priceCompetitiveness: match.priceCompetitiveness,
        estimatedResponseTime: `${match.estimatedResponseTime}h`,
        matchFactors: match.matchFactors.map(f => ({
          category: f.category,
          score: f.score,
          description: f.description,
        })),
        recommendedActions: match.recommendedActions,
      })),
      insights: {
        bestMatch: filteredMatches[0]?.supplier?.companyName || null,
        avgScore: filteredMatches.length > 0 
          ? Math.round(filteredMatches.reduce((sum, m) => sum + m.compatibilityScore, 0) / filteredMatches.length)
          : 0,
        topCategories: [...new Set(filteredMatches.flatMap(m => m.supplier.categories))].slice(0, 3),
      },
    });
  } catch (error) {
    console.error('Supplier Recommendations API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate supplier recommendations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint for detailed compatibility analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buyerProfile, supplierIds, requirements } = body;

    if (!buyerProfile) {
      return NextResponse.json(
        { error: 'buyerProfile is required' },
        { status: 400 }
      );
    }

    // Get specific suppliers or use all
    let targetSuppliers = MOCK_SUPPLIERS;
    if (supplierIds && Array.isArray(supplierIds)) {
      targetSuppliers = MOCK_SUPPLIERS.filter(s => supplierIds.includes(s.id));
    }

    // Detailed analysis for each supplier
    const detailedAnalysis = targetSuppliers.map(supplier => {
      const compatibility = calculateSupplierCompatibility(buyerProfile, supplier);
      
      return {
        supplier: {
          id: supplier.id,
          name: supplier.companyName,
          categories: supplier.categories,
        },
        overallScore: compatibility.compatibilityScore,
        breakdown: compatibility.matchFactors,
        strengths: compatibility.matchFactors
          .filter(f => f.score >= 7)
          .map(f => ({ factor: f.category, score: f.score })),
        weaknesses: compatibility.matchFactors
          .filter(f => f.score < 5)
          .map(f => ({ factor: f.category, score: f.score })),
        recommendations: compatibility.recommendedActions,
        pricingAssessment: compatibility.priceCompetitiveness,
        suitableForRequirements: requirements ? evaluateRequirementMatch(supplier, requirements) : null,
      };
    });

    // Sort by score
    detailedAnalysis.sort((a, b) => b.overallScore - a.overallScore);

    return NextResponse.json({
      success: true,
      analysisType: 'detailed-compatibility',
      buyerProfile: {
        company: buyerProfile.companyName,
        segment: buyerProfile.segment,
        industry: buyerProfile.industry,
      },
      analyzedSuppliers: detailedAnalysis.length,
      generatedAt: new Date().toISOString(),
      results: detailedAnalysis,
    });
  } catch (error) {
    console.error('Detailed Compatibility API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform detailed compatibility analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to evaluate if a supplier meets specific requirements
 */
function evaluateRequirementMatch(supplier: SupplierProfile, requirements: Record<string, unknown>): {
  meetsRequirements: boolean;
  gaps: string[];
  score: number;
} {
  const gaps: string[] = [];
  let score = 100;

  // Check minimum order value requirement
  if (requirements.minOrderValue && typeof requirements.minOrderValue === 'number') {
    if (supplier.minOrderValue > requirements.minOrderValue) {
      gaps.push(`Minimum order value (${supplier.minOrderValue}) exceeds budget`);
      score -= 15;
    }
  }

  // Check certification requirements
  if (requirements.certifications && Array.isArray(requirements.certifications)) {
    const missingCerts = (requirements.certifications as string[]).filter(
      cert => !supplier.certifications.includes(cert)
    );
    if (missingCerts.length > 0) {
      gaps.push(`Missing certifications: ${missingCerts.join(', ')}`);
      score -= missingCerts.length * 5;
    }
  }

  // Check rating requirement
  if (requirements.minRating && typeof requirements.minRating === 'number') {
    if (supplier.rating < requirements.minRating) {
      gaps.push(`Rating (${supplier.rating}) below required ${requirements.minRating}`);
      score -= 20;
    }
  }

  // Check location preference
  if (requirements.maxDistance && typeof requirements.maxDistance === 'number' && requirements.buyerLocation) {
    // Simplified distance check
    const distance = Math.abs(supplier.location.wilayaCode - (typeof requirements.buyerLocation === 'number' ? requirements.buyerLocation : 16));
    if (distance > (requirements.maxDistance as number)) {
      gaps.push(`Supplier too far (${distance} wilayas away)`);
      score -= 10;
    }
  }

  return {
    meetsRequirements: gaps.length === 0,
    gaps,
    score: Math.max(0, score),
  };
}
