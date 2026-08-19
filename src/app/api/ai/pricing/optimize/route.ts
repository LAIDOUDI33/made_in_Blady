/**
 * Pricing Optimization API Endpoint
 * GET /api/ai/pricing/optimize
 * 
 * Provides AI-powered price optimization suggestions based on:
 * - Competitor price analysis
 * - Demand elasticity modeling
 * - Market positioning
 * - Revenue maximization
 * - Seasonal adjustments
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generatePriceOptimization,
  batchPriceOptimization,
  type PriceOptimization,
} from '@/lib/ai/business-intelligence';
import {
  batchPricingSuggestions,
  MOCK_PRODUCTS,
  type PricingSuggestion,
} from '@/lib/ai/recommendations';

// Sample products for demonstration
const SAMPLE_PRODUCTS = [
  { id: 'prod-001', name: 'Industrial Steel Pipes API 5L Grade B', price: 12500, category: 'Metal Products' },
  { id: 'prod-002', name: 'Premium Dates Deglet Nour (10kg)', price: 4500, category: 'Agriculture & Food' },
  { id: 'prod-003', name: 'CNC Lathe Machine CK6140', price: 2850000, category: 'Machinery & Equipment' },
  { id: 'prod-004', name: 'Cotton Fabric Roll (100m)', price: 8500, category: 'Textiles & Apparel' },
  { id: 'prod-005', name: 'Solar Panel System 5kW Complete Kit', price: 185000, category: 'Energy & Fuel' },
  { id: 'prod-006', name: 'Pharmaceutical Grade Glycerin (25L)', price: 12500, category: 'Chemicals' },
  { id: 'prod-007', name: 'Automotive Brake Pads Set (Front)', price: 3200, category: 'Automotive Parts' },
  { id: 'prod-008', name: 'Portland Cement CEM I 52.5N (50kg)', price: 750, category: 'Construction Materials' },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const productId = searchParams.get('productId');
    const category = searchParams.get('category');
    const strategy = searchParams.get('strategy') || 'balanced'; // revenue | market-share | balanced

    if (productId) {
      // Single product optimization
      const product = SAMPLE_PRODUCTS.find(p => p.id === productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${productId} not found` },
          { status: 404 }
        );
      }

      const optimization = generatePriceOptimization(
        product.id,
        product.name,
        product.price,
        product.category
      );

      // Adjust suggestion based on strategy
      adjustForStrategy(optimization, strategy);

      return NextResponse.json({
        success: true,
        type: 'single-product',
        product: {
          id: optimization.productId,
          name: optimization.productName,
          category: product.category,
        },
        strategy,
        generatedAt: new Date().toISOString(),
        optimization: {
          currentPrice: {
            value: optimization.currentPrice,
            currency: optimization.currency,
          },
          suggestedPrice: {
            value: optimization.suggestedPrice,
            currency: optimization.currency,
          },
          priceRange: {
            minimum: optimization.minPrice,
            maximum: optimization.maxPrice,
            optimal: optimization.optimalPrice,
          },
          marketAnalysis: {
            competitorAverage: optimization.competitorAvgPrice,
            position: optimization.marketPosition,
            elasticity: optimization.priceElasticity,
            demandSensitivity: optimization.demandImpact,
          },
          revenueProjection: optimization.revenueProjection,
          reasoning: optimization.reasoning,
          urgency: getUrgencyLevel(optimization),
        },
        actionItems: generateActionItems(optimization),
      });
    } else {
      // Batch optimization
      let productsToOptimize = SAMPLE_PRODUCTS;
      
      if (category) {
        productsToOptimize = SAMPLE_PRODUCTS.filter(p =>
          p.category.toLowerCase().includes(category.toLowerCase())
        );
        
        if (productsToOptimize.length === 0) {
          return NextResponse.json(
            { error: `No products found in category: ${category}` },
            { status: 404 }
          );
        }
      }

      const optimizations = batchPriceOptimization(productsToOptimize);
      
      // Apply strategy adjustment
      optimizations.forEach(opt => adjustForStrategy(opt, strategy));

      // Also generate dynamic pricing suggestions
      const dynamicPricing = batchPricingSuggestions(MOCK_PRODUCTS, () => null as never);

      return NextResponse.json({
        success: true,
        type: 'batch-optimization',
        category: category || 'all',
        strategy,
        productsAnalyzed: optimizations.length,
        generatedAt: new Date().toISOString(),
        summary: {
          totalCurrentRevenue: optimizations.reduce((sum, o) => sum + o.revenueProjection.current, 0),
          totalOptimizedRevenue: optimizations.reduce((sum, o) => sum + o.revenueProjection.optimized, 0),
          totalImprovement: optimizations.reduce((sum, o) => sum + o.revenueProjection.changePercent, 0) / optimizations.length,
          productsRequiringIncrease: optimizations.filter(o => o.suggestedPrice > o.currentPrice).length,
          productsRequiringDecrease: optimizations.filter(o => o.suggestedPrice < o.currentPrice).length,
          underpricedProducts: optimizations.filter(o => o.marketPosition === 'underpriced').length,
          overpricedProducts: optimizations.filter(o => o.marketPosition === 'overpriced').length,
        },
        optimizations: optimizations.map(opt => ({
          productId: opt.productId,
          productName: opt.productName,
          category: opt.category || SAMPLE_PRODUCTS.find(p => p.id === opt.productId)?.category,
          currentPrice: opt.currentPrice,
          suggestedPrice: opt.suggestedPrice,
          changePercent: ((opt.suggestedPrice - opt.currentPrice) / opt.currentPrice * 100).toFixed(1),
          marketPosition: opt.marketPosition,
          revenueImpact: opt.revenueProjection.changePercent,
          confidence: Math.round(opt.priceElasticity * 50 + 50), // Mock confidence
        })),
        dynamicPricing: dynamicPricing.slice(0, 5).map(dp => ({
          productId: dp.productId,
          currentPrice: dp.currentPrice,
          suggestedPrice: dp.suggestedPrice,
          adjustmentPercent: dp.adjustmentPercent,
          urgency: dp.urgency,
          expectedImpact: dp.expectedImpact,
          competitorContext: dp.competitorContext,
        })),
        recommendations: generateBatchRecommendations(optimizations),
      });
    }
  } catch (error) {
    console.error('Pricing Optimization API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate pricing optimization',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint for custom pricing scenarios
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, constraints, scenario } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'products array is required' },
        { status: 400 }
      );
    }

    // Run optimizations with custom constraints
    const optimizations = batchPriceOptimization(products.map((p: {id: string; name: string; price: number; category: string}) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
    })));

    // Apply scenario-based adjustments
    if (scenario) {
      applyScenarioAdjustments(optimizations, scenario);
    }

    // Apply constraints
    if (constraints) {
      applyConstraints(optimizations, constraints);
    }

    return NextResponse.json({
      success: true,
      type: 'custom-scenario',
      scenario: scenario || 'default',
      constraints: constraints || {},
      generatedAt: new Date().toISOString(),
      results: optimizations.map(opt => ({
        product: opt.productId,
        originalPrice: opt.currentPrice,
        optimizedPrice: opt.suggestedPrice,
        reasoning: opt.reasoning,
        projectedRevenueChange: opt.revenueProjection,
      })),
    });
  } catch (error) {
    console.error('Custom Pricing Scenario API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run custom pricing scenario',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function adjustForStrategy(optimization: PriceOptimization, strategy: string): void {
  switch (strategy) {
    case 'revenue':
      // Aggressively push toward optimal/max prices
      optimization.suggestedPrice = Math.min(
        optimization.optimalPrice * 1.05,
        optimization.maxPrice
      );
      break;
    case 'market-share':
      // More competitive pricing
      optimization.suggestedPrice = Math.max(
        optimization.minPrice * 1.02,
        optimization.competitorAvgPrice * 0.97
      );
      break;
    case 'balanced':
    default:
      // Already calculated optimally
      break;
  }

  // Recalculate revenue projection
  const priceRatio = optimization.suggestedPrice / optimization.currentPrice;
  const quantityChange = Math.pow(priceRatio, optimization.priceElasticity);
  optimization.revenueProjection.optimized = Math.round(
    optimization.revenueProjection.current * priceRatio * quantityChange
  );
  optimization.revenueProjection.changePercent = Math.round(
    ((optimization.revenueProjection.optimized - optimization.revenueProjection.current) /
     optimization.revenueProjection.current) * 1000
  ) / 10;
}

function getUrgencyLevel(optimization: PriceOptimization): 'immediate' | 'soon' | 'monitor' | 'none' {
  const priceDiff = Math.abs(optimization.suggestedPrice - optimization.currentPrice) / optimization.currentPrice;
  
  if (priceDiff > 0.15) return 'immediate';
  if (priceDiff > 0.08) return 'soon';
  if (priceDiff > 0.03) return 'monitor';
  return 'none';
}

function generateActionItems(optimization: PriceOptimization): string[] {
  const actions: string[] = [];
  
  if (optimization.marketPosition === 'underpriced') {
    actions.push('Consider increasing price to capture more value');
    actions.push('Monitor competitor response to price changes');
  } else if (optimization.marketPosition === 'overpriced') {
    actions.push('Review pricing strategy - may be losing sales');
    actions.push('Consider promotional pricing to regain market share');
  }
  
  if (optimization.revenueProjection.changePercent > 10) {
    actions.push('High revenue potential - prioritize this optimization');
  }
  
  if (optimization.demandImpact === 'high') {
    actions.push('Price changes will significantly impact demand volume');
    actions.push('Consider gradual implementation');
  }
  
  if (actions.length === 0) {
    actions.push('Current pricing is near optimal');
    actions.push('Continue monitoring market conditions');
  }
  
  return actions;
}

function generateBatchRecommendations(optimizations: PriceOptimization[]): string[] {
  const recommendations: string[] = [];
  
  const avgChange = optimizations.reduce((sum, o) => 
    sum + o.revenueProjection.changePercent, 0) / optimizations.length;
  
  if (avgChange > 5) {
    recommendations.push(`Overall revenue improvement potential of +${avgChange.toFixed(1)}%`);
  }
  
  const underpricedCount = optimizations.filter(o => o.marketPosition === 'underpriced').length;
  if (underpricedCount > 0) {
    recommendations.push(`${underpricedCount} product(s) appear underpriced vs competition`);
  }
  
  const overpricedCount = optimizations.filter(o => o.marketPosition === 'overpriced').length;
  if (overpricedCount > 0) {
    recommendations.push(`${overpricedCount} product(s) may be priced above market tolerance`);
  }
  
  const highElasticity = optimizations.filter(o => Math.abs(o.priceElasticity) > 1.3).length;
  if (highElasticity > 0) {
    recommendations.push(`${highElasticity} product(s) show high price sensitivity - careful with increases`);
  }
  
  return recommendations;
}

function applyScenarioAdjustments(optimizations: PriceOptimization[], scenario: string): void {
  switch (scenario) {
    case 'aggressive-growth':
      optimizations.forEach(opt => {
        opt.suggestedPrice *= 1.08; // 8% premium
      });
      break;
    case 'market-penetration':
      optimizations.forEach(opt => {
        opt.suggestedPrice *= 0.92; // 8% discount
      });
      break;
    case 'premium-positioning':
      optimizations.forEach(opt => {
        opt.suggestedPrice = Math.max(opt.suggestedPrice * 1.12, opt.competitorAvgPrice * 1.1);
      });
      break;
    case 'cost-leadership':
      optimizations.forEach(opt => {
        opt.suggestedPrice = Math.max(opt.minPrice, opt.competitorAvgPrice * 0.95);
      });
      break;
  }
}

function applyConstraints(optimizations: PriceOptimization[], constraints: Record<string, unknown>): void {
  if (constraints.maxPriceChange && typeof constraints.maxPriceChange === 'number') {
    const maxChange = constraints.maxPriceChange / 100; // Convert to decimal
    optimizations.forEach(opt => {
      const maxAllowed = opt.currentPrice * (1 + maxChange);
      const minAllowed = opt.currentPrice * (1 - maxChange);
      opt.suggestedPrice = Math.max(minAllowed, Math.min(maxAllowed, opt.suggestedPrice));
    });
  }
  
  if (constraints.targetMargin && typeof constraints.targetMargin === 'number') {
    // Assume cost base of 60% of current price
    const targetMargin = constraints.targetMargin / 100;
    optimizations.forEach(opt => {
      const costBase = opt.currentPrice * 0.6;
      const marginBasedPrice = costBase / (1 - targetMargin);
      if (opt.suggestedPrice < marginBasedPrice) {
        opt.suggestedPrice = marginBasedPrice;
        opt.reasoning.push('Adjusted to meet target margin constraint');
      }
    });
  }
}
