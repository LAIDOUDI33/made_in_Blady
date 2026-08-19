/**
 * AI Predictions Analytics API Endpoint
 * GET /api/ai/analytics/predictions
 * 
 * Comprehensive prediction analytics including:
 * - Buyer behavior predictions
 * - Churn risk assessment
 * - Supplier risk scoring
 * - Market trend analysis
 * - Revenue projections
 * - Opportunity identification
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  predictBuyerBehavior,
  identifyAtRiskBuyers,
  calculateSupplierRisk,
  analyzeMarketTrends,
  identifyMarketOpportunities,
  generateBIDashboard,
  type BuyerBehavior,
  type SupplierRiskScore,
  type MarketTrend,
  type BusinessIntelligenceDashboard,
} from '@/lib/ai/business-intelligence';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') || 'overview'; // overview | buyers | suppliers | trends | opportunities | full
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const riskThreshold = parseFloat(searchParams.get('riskThreshold') || '0.5');

    switch (type) {
      case 'buyers':
        return handleBuyerPredictions(limit, riskThreshold);
      
      case 'suppliers':
        return handleSupplierPredictions(limit, riskThreshold);
      
      case 'trends':
        return handleMarketTrends();
      
      case 'opportunities':
        return handleOpportunities();
      
      case 'full':
        return handleFullDashboard();
      
      case 'overview':
      default:
        return handleOverview(limit, riskThreshold);
    }
  } catch (error) {
    console.error('AI Predictions API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate predictions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleOverview(limit: number, riskThreshold: number): Promise<NextResponse> {
  // Generate comprehensive dashboard data
  const dashboard = generateBIDashboard();

  // Calculate key metrics
  const metrics = {
    demandForecasts: {
      totalCategories: dashboard.demandForecasts.length,
      avgGrowthRate: (
        dashboard.demandForecasts.reduce((sum, f) => 
          sum + ((f.forecast90Days - f.currentDemand) / f.currentDemand), 0
        ) / dashboard.demandForecasts.length * 100
      ).toFixed(1),
      increasingTrends: dashboard.demandForecasts.filter(f => f.trend === 'increasing').length,
      highConfidence: dashboard.demandForecasts.filter(f => f.confidence > 0.8).length,
    },
    pricing: {
      totalOptimizations: dashboard.priceOptimizations.length,
      potentialRevenueGain: dashboard.priceOptimizations.reduce((sum, p) => 
        sum + Math.max(0, p.revenueProjection.optimized - p.revenueProjection.current), 0
      ),
      underpricedProducts: dashboard.priceOptimizations.filter(p => p.marketPosition === 'underpriced').length,
    },
    buyers: {
      atRiskCount: dashboard.atRiskBuyers.length,
      highRiskCount: dashboard.atRiskBuyers.filter(b => b.churnRisk > riskThreshold).length,
      avgChurnRisk: (
        dashboard.atRiskBuyers.reduce((sum, b) => sum + b.churnRisk, 0) / 
        (dashboard.atRiskBuyers.length || 1) * 100
      ).toFixed(1),
    },
    suppliers: {
      totalAnalyzed: dashboard.supplierRisks.length,
      criticalRisk: dashboard.supplierRisks.filter(s => s.riskLevel === 'critical').length,
      avgRiskScore: (
        dashboard.supplierRisks.reduce((sum, s) => sum + s.overallRiskScore, 0) / 
        dashboard.supplierRisks.length
      ).toFixed(0),
    },
    trends: {
      activeTrends: dashboard.marketTrends.length,
      highImpact: dashboard.marketTrends.filter(t => t.impact === 'high').length,
      algeriaSpecific: dashboard.marketTrends.filter(t => t.region === 'algeria').length,
    },
  };

  // Top alerts
  const alerts = generateAlerts(dashboard);

  return NextResponse.json({
    success: true,
    type: 'overview',
    generatedAt: new Date().toISOString(),
    metrics,
    alerts: alerts.slice(0, 5),
    quickStats: {
      totalRevenueOpportunity: metrics.pricing.potentialRevenueGain,
      buyersNeedingAttention: metrics.buyers.highRiskCount,
      suppliersRequiringReview: metrics.suppliers.criticalRisk,
      trendingCategories: dashboard.demandForecasts
        .sort((a, b) => (b.forecast90Days / b.currentDemand) - (a.forecast90Days / a.currentDemand))
        .slice(0, 3)
        .map(f => ({ category: f.category, growth: ((f.forecast90Days - f.currentDemand) / f.currentDemand * 100).toFixed(1) })),
    },
  });
}

async function handleBuyerPredictions(limit: number, riskThreshold: number): Promise<NextResponse> {
  const atRiskBuyers = identifyAtRiskBuyers(riskThreshold).slice(0, limit);

  // Enrich with additional predictions
  const enrichedBuyers = atRiskBuyers.map(buyer => {
    const behavior = predictBuyerBehavior(buyer.buyerId);
    
    return {
      buyerId: buyer.buyerId,
      segment: buyer.segment,
      churnRisk: {
        score: buyer.churnRisk,
        level: buyer.churnRisk > 0.75 ? 'critical' : buyer.churnRisk > 0.5 ? 'high' : 'medium',
      },
      engagement: {
        score: buyer.engagementScore,
        level: buyer.engagementScore > 70 ? 'excellent' : buyer.engagementScore > 45 ? 'good' : 'needs-improvement',
      },
      predictedLifetimeValue: behavior.predictedLifetimeValue,
      nextPurchaseProbability: behavior.nextPurchaseProbability,
      priceSensitivity: buyer.priceSensitivity,
      preferredCategories: buyer.preferredCategories,
      averageOrderValue: buyer.averageOrderValue,
      paymentReliability: buyer.paymentReliability,
      recommendedActions: buyer.recommendedActions,
      retentionPriority: calculateRetentionPriority(buyer.churnRisk, buyer.predictedLifetimeValue),
    };
  });

  // Summary statistics
  const summary = {
    totalAnalyzed: enrichedBuyers.length,
    avgChurnRisk: (enrichedBuyers.reduce((sum, b) => sum + b.churnRisk.score, 0) / enrichedBuyers.length * 100).toFixed(1),
    highRiskCount: enrichedBuyers.filter(b => b.churnRisk.level === 'critical' || b.churnRisk.level === 'high').length,
    totalAtRiskRevenue: enrichedBuyers.reduce((sum, b) => sum + b.predictedLifetimeValue, 0),
    segments: {
      enterprise: enrichedBuyers.filter(b => b.segment === 'enterprise').length,
      sme: enrichedBuyers.filter(b => b.segment === 'sme').length,
      startup: enrichedBuyers.filter(b => b.segment === 'startup').length,
    },
  };

  return NextResponse.json({
    success: true,
    type: 'buyer-predictions',
    riskThreshold,
    generatedAt: new Date().toISOString(),
    summary,
    predictions: enrichedBuyers,
    recommendedActions: [
      'Implement targeted retention campaigns for high-risk buyers',
      'Offer personalized discounts to price-sensitive segments',
      'Schedule proactive outreach for inactive accounts',
      'Review payment terms for low-reliability buyers',
    ],
  });
}

async function handleSupplierPredictions(limit: number, riskThreshold: number): Promise<NextResponse> {
  const supplierIds = Array.from({ length: Math.min(limit, 10) }, (_, i) => `sup-${i + 1}`);
  const supplierRisks = supplierIds.map(id => calculateSupplierRisk(id))
    .sort((a, b) => b.overallRiskScore - a.overallRiskScore);

  // Enrich with additional analysis
  const enrichedSuppliers = supplierRisks.map(supplier => ({
    supplierId: supplier.supplierId,
    companyName: supplier.companyName,
    overallRiskScore: supplier.overallRiskScore,
    riskLevel: supplier.riskLevel,
    verificationStatus: supplier.verificationStatus,
    yearsInBusiness: supplier.yearsInBusiness,
    dimensions: {
      financialHealth: {
        score: supplier.financialHealth,
        level: supplier.financialHealth >= 70 ? 'good' : supplier.financialHealth >= 50 ? 'moderate' : 'poor',
      },
      deliveryReliability: {
        score: supplier.deliveryReliability,
        level: supplier.deliveryReliability >= 80 ? 'excellent' : supplier.deliveryReliability >= 60 ? 'acceptable' : 'concerning',
      },
      qualityScore: {
        score: supplier.qualityScore,
        level: supplier.qualityScore >= 80 ? 'high' : supplier.qualityScore >= 60 ? 'standard' : 'low',
      },
      complianceScore: {
        score: supplier.complianceScore,
        level: supplier.complianceScore >= 85 ? 'compliant' : 'review-needed',
      },
      marketReputation: {
        score: supplier.marketReputation,
        level: supplier.marketReputation >= 75 ? 'strong' : 'developing',
      },
    },
    riskFactors: supplier.riskFactors,
    recommendations: supplier.recommendations,
    actionRequired: supplier.riskLevel === 'critical' || supplier.riskLevel === 'high',
    reviewPriority: supplier.riskLevel === 'critical' ? 'immediate' : 
                   supplier.riskLevel === 'high' ? 'urgent' :
                   supplier.riskLevel === 'medium' ? 'scheduled' : 'routine',
  }));

  const summary = {
    totalAnalyzed: enrichedSuppliers.length,
    averageRiskScore: (enrichedSuppliers.reduce((sum, s) => sum + s.overallRiskScore, 0) / enrichedSuppliers.length).toFixed(0),
    criticalCount: enrichedSuppliers.filter(s => s.riskLevel === 'critical').length,
    highRiskCount: enrichedSuppliers.filter(s => s.riskLevel === 'high').length,
    unverifiedCount: enrichedSuppliers.filter(s => s.verificationStatus !== 'verified').length,
    immediateActionsRequired: enrichedSuppliers.filter(s => s.actionRequired).length,
  };

  return NextResponse.json({
    success: true,
    type: 'supplier-predictions',
    generatedAt: new Date().toISOString(),
    summary,
    predictions: enrichedSuppliers,
    riskDistribution: {
      critical: enrichedSuppliers.filter(s => s.riskLevel === 'critical').length,
      high: enrichedSuppliers.filter(s => s.riskLevel === 'high').length,
      medium: enrichedSuppliers.filter(s => s.riskLevel === 'medium').length,
      low: enrichedSuppliers.filter(s => s.riskLevel === 'low').length,
    },
    recommendedActions: [
      'Initiate verification process for unverified suppliers',
      'Request updated financial documentation from high-risk suppliers',
      'Develop backup supplier relationships for critical categories',
      'Schedule quarterly reviews for medium-risk suppliers',
    ],
  });
}

async function handleMarketTrends(): Promise<NextResponse> {
  const trends = analyzeMarketTrends();

  const enrichedTrends = trends.map(trend => ({
    ...trend,
    actionableInsights: generateTrendInsights(trend),
    relatedProducts: suggestRelatedProducts(trend.category),
    timeline: estimateTimeline(trend.timeframe),
  }));

  const summary = {
    totalTrends: enrichedTrends.length,
    byRegion: {
      algeria: enrichedTrends.filter(t => t.region === 'algeria').length,
      mena: enrichedTrends.filter(t => t.region === 'mena').length,
      africa: enrichedTrends.filter(t => t.region === 'africa').length,
      global: enrichedTrends.filter(t => t.region === 'global').length,
    },
    byImpact: {
      high: enrichedTrends.filter(t => t.impact === 'high').length,
      medium: enrichedTrends.filter(t => t.impact === 'medium').length,
      low: enrichedTrends.filter(t => t.impact === 'low').length,
    },
    byTimeframe: {
      shortTerm: enrichedTrends.filter(t => t.timeframe === 'short-term').length,
      midTerm: enrichedTrends.filter(t => t.timeframe === 'mid-term').length,
      longTerm: enrichedTrends.filter(t => t.timeframe === 'long-term').length,
    },
    avgGrowthRate: (enrichedTrends.reduce((sum, t) => sum + t.growthRate, 0) / enrichedTrends.length).toFixed(1),
    highestGrowthTrend: enrichedTrends.sort((a, b) => b.growthRate - a.growthRate)[0],
  };

  return NextResponse.json({
    success: true,
    type: 'market-trends',
    generatedAt: new Date().toISOString(),
    summary,
    trends: enrichedTrends,
    strategicRecommendations: [
      'Focus on digital transformation products for Q2-Q3 growth',
      'Expand local manufacturing partnerships to capitalize on Made in Algeria initiative',
      'Develop renewable energy supply chain capabilities',
      'Build pharmaceutical localization partnerships',
    ],
  });
}

async function handleOpportunities(): Promise<NextResponse> {
  const opportunities = identifyMarketOpportunities();

  const enrichedOpportunities = opportunities.map(opp => ({
    wilaya: opp.wilaya,
    opportunityType: opp.opportunityType,
    opportunityScore: opp.opportunityScore,
    suggestedCategories: opp.suggestedCategories,
    marketPotential: {
      demandIndex: opp.wilaya.demandIndex,
      growthIndex: opp.wilaya.growthIndex,
      businessDensity: opp.wilaya.businessDensity,
      population: opp.wilaya.population,
      gdpPerCapita: opp.wilaya.gdpPerCapita,
    },
    entryStrategy: suggestEntryStrategy(opp),
    estimatedInvestment: estimateInvestment(opp),
    timeToProfitability: estimateTimeToProfit(opp),
  }));

  return NextResponse.json({
    success: true,
    type: 'market-opportunities',
    generatedAt: new Date().toISOString(),
    totalOpportunities: enrichedOpportunities.length,
    opportunities: enrichedOpportunities,
    summary: {
      topRegion: enrichedOpportunities[0]?.wilaya?.wilayaName,
      avgOpportunityScore: (
        enrichedOpportunities.reduce((sum, o) => sum + o.opportunityScore, 0) / 
        enrichedOpportunities.length
      ).toFixed(0),
      underservedMarkets: enrichedOpportunities.filter(o => o.opportunityType === 'underserved').length,
      growingMarkets: enrichedOpportunities.filter(o => o.opportunityType === 'growing').length,
    },
  });
}

async function handleFullDashboard(): Promise<NextResponse> {
  const dashboard = generateBIDashboard();

  return NextResponse.json({
    success: true,
    type: 'full-dashboard',
    generatedAt: new Date().toISOString(),
    dashboard: {
      demandForecasts: dashboard.demandForecasts.map(f => ({
        category: f.category,
        region: f.region,
        currentDemand: f.currentDemand,
        forecast30Days: f.forecast30Days,
        forecast60Days: f.forecast60Days,
        forecast90Days: f.forecast90Days,
        confidence: f.confidence,
        trend: f.trend,
        growthRate: ((f.forecast90Days - f.currentDemand) / f.currentDemand * 100).toFixed(1),
      })),
      priceOptimizations: dashboard.priceOptimizations.map(p => ({
        productId: p.productId,
        productName: p.productName,
        currentPrice: p.currentPrice,
        suggestedPrice: p.suggestedPrice,
        marketPosition: p.marketPosition,
        revenueImpact: p.revenueProjection.changePercent,
      })),
      atRiskBuyers: dashboard.atRiskBuyers.map(b => ({
        buyerId: b.buyerId,
        segment: b.segment,
        churnRisk: b.churnRisk,
        predictedLifetimeValue: b.predictedLifetimeValue,
        engagementScore: b.engagementScore,
      })),
      supplierRisks: dashboard.supplierRisks.map(s => ({
        supplierId: s.supplierId,
        companyName: s.companyName,
        riskScore: s.overallRiskScore,
        riskLevel: s.riskLevel,
        verificationStatus: s.verificationStatus,
      })),
      marketTrends: dashboard.marketTrends.map(t => ({
        title: t.title,
        category: t.category,
        impact: t.impact,
        growthRate: t.growthRate,
        region: t.region,
      })),
      regionalOpportunities: dashboard.regionalOpportunities.map(o => ({
        wilaya: o.wilaya.wilayaName,
        opportunityType: o.opportunityType,
        score: o.opportunityScore,
        categories: o.suggestedCategories,
      })),
    },
    metadata: {
      modelVersion: '1.0.0',
      dataFreshness: 'real-time-generated',
      confidenceThreshold: 0.7,
    },
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateAlerts(dashboard: BusinessIntelligenceDashboard): Array<{
  type: 'warning' | 'info' | 'danger' | 'success';
  title: string;
  description: string;
}> {
  const alerts: Array<{ type: 'warning' | 'info' | 'danger' | 'success'; title: string; description: string }> = [];

  // High-risk supplier alerts
  const criticalSuppliers = dashboard.supplierRisks.filter(s => s.riskLevel === 'critical');
  if (criticalSuppliers.length > 0) {
    alerts.push({
      type: 'danger',
      title: 'Critical Supplier Risk Detected',
      description: `${criticalSuppliers.length} supplier(s) require immediate attention`,
    });
  }

  // High churn risk alerts
  const criticalChurn = dashboard.atRiskBuyers.filter(b => b.churnRisk > 0.75);
  if (criticalChurn.length > 0) {
    alerts.push({
      type: 'warning',
      title: 'High Buyer Churn Risk',
      description: `${criticalChurn.length} buyer(s) at critical churn risk (>75%)`,
    });
  }

  // Positive trend alerts
  const strongGrowth = dashboard.demandForecasts.filter(f => 
    f.trend === 'increasing' && f.confidence > 0.8
  );
  if (strongGrowth.length > 0) {
    alerts.push({
      type: 'success',
      title: 'Strong Growth Forecast',
      description: `${strongGrowth.length} category/categories showing confident upward trend`,
    });
  }

  // Pricing opportunity alerts
  const bigOpportunities = dashboard.priceOptimizations.filter(p => 
    p.revenueProjection.changePercent > 15
  );
  if (bigOpportunities.length > 0) {
    alerts.push({
      type: 'info',
      title: 'Significant Pricing Opportunities',
      description: `${bigOpportunities.length} product(s) with >15% revenue improvement potential`,
    });
  }

  return alerts;
}

function calculateRetentionPriority(churnRisk: number, lifetimeValue: number): 'critical' | 'high' | 'medium' | 'low' {
  const priorityScore = churnRisk * 100 + (lifetimeValue > 100000 ? 30 : lifetimeValue > 50000 ? 20 : 10);
  
  if (priorityScore > 80) return 'critical';
  if (priorityScore > 60) return 'high';
  if (priorityScore > 40) return 'medium';
  return 'low';
}

function generateTrendInsights(trend: MarketTrend): string[] {
  const insights: string[] = [];
  
  if (trend.growthRate > 30) {
    insights.push('Exceptional growth rate - consider early market entry');
  }
  
  if (trend.confidence > 0.9) {
    insights.push('High confidence prediction - reliable for planning');
  }
  
  if (trend.impact === 'high') {
    insights.push('High market impact expected - strategic importance');
  }
  
  if (trend.region === 'algeria') {
    insights.push('Algeria-specific trend - local advantages available');
  }
  
  return insights;
}

function suggestRelatedProducts(category: string): string[] {
  const productMap: Record<string, string[]> = {
    'Technology': ['Software solutions', 'IT consulting', 'Cloud services', 'Cybersecurity'],
    'Manufacturing': ['Industrial equipment', 'Raw materials', 'Quality control systems'],
    'Energy': ['Solar panels', 'Battery storage', 'Grid equipment', 'Installation services'],
    'Agriculture': ['Farming equipment', 'Processing machinery', 'Organic certification', 'Export logistics'],
    'Pharmaceuticals': ['Raw materials', 'Packaging', 'Cold storage', 'Quality testing'],
    'Logistics': ['Warehouse management', 'Fleet management', 'Last-mile delivery', 'Tracking systems'],
  };
  
  return productMap[category] || ['Related products available'];
}

function estimateTimeline(timeframe: string): { start: string; peak: string; duration: string } {
  const timelines: Record<string, { start: string; peak: string; duration: string }> = {
    'short-term': { start: 'Immediate', peak: '3-6 months', duration: '6-12 months' },
    'mid-term': { start: '6-12 months', peak: '12-24 months', duration: '2-3 years' },
    'long-term': { start: '12-24 months', peak: '3-5 years', duration: '5+ years' },
  };
  
  return timelines[timeframe] || timelines['mid-term'];
}

function suggestEntryStrategy(opportunity: {
  wilaya: { wilayaName: string; competitionLevel: string };
  opportunityType: string;
}): string {
  if (opportunity.opportunityType === 'underserved') {
    return `First-mover advantage possible in ${opportunity.wilaya.wilayaName}. Consider establishing local presence.`;
  }
  
  if (opportunity.wilaya.competitionLevel === 'low') {
    return `Low competition in ${opportunity.wilaya.wilayaName}. Partnership with local distributors recommended.`;
  }
  
  return `Standard market entry approach for ${opportunity.wilaya.wilayaName}. Focus on differentiation.`;
}

function estimateInvestment(opportunity: { wilaya: { gdpPerCapita: number }; opportunityType: string }): {
  range: string;
  paybackPeriod: string;
} {
  const baseMultiplier = opportunity.wilaya.gdpPerCapita > 6000 ? 1.5 : 1;
  const baseAmount = 2000000 * baseMultiplier; // Base investment in DZD
  
  return {
    range: `${(baseAmount * 0.5 / 1000000).toFixed(1)}M - ${(baseAmount * 2 / 1000000).toFixed(1)}M DZD`,
    paybackPeriod: opportunity.opportunityType === 'underserved' ? '12-18 months' : '24-36 months',
  };
}

function estimateTimeToProfit(opportunity: { opportunityType: string; opportunityScore: number }): string {
  if (opportunity.opportunityType === 'underserved' && opportunity.opportunityScore > 70) {
    return '6-12 months';
  }
  if (opportunity.opportunityScore > 60) {
    return '12-18 months';
  }
  return '18-24 months';
}
