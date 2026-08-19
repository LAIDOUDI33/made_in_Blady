/**
 * AI Business Intelligence Engine for AlgeriaTrade.dz
 * Comprehensive analytics and prediction system for Algerian B2B marketplace
 * 
 * Features:
 * - Demand forecasting using time-series analysis
 * - Price optimization recommendations
 * - Buyer behavior prediction
 * - Supplier risk scoring
 * - Market trend analysis for Algeria/MENA region
 * - Smart product matching algorithm
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  category?: string;
  region?: string;
}

export interface DemandForecast {
  productId?: string;
  category: string;
  region: string;
  currentDemand: number;
  forecast30Days: number;
  forecast60Days: number;
  forecast90Days: number;
  confidence: number; // 0-1
  seasonalityFactor: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  historicalData: TimeSeriesDataPoint[];
  forecastData: TimeSeriesDataPoint[];
}

export interface PriceOptimization {
  productId: string;
  productName: string;
  currentPrice: number;
  currency: string;
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  optimalPrice: number;
  priceElasticity: number;
  demandImpact: 'high' | 'medium' | 'low';
  competitorAvgPrice: number;
  marketPosition: 'underpriced' | 'competitive' | 'premium' | 'overpriced';
  revenueProjection: {
    current: number;
    optimized: number;
    changePercent: number;
  };
  reasoning: string[];
}

export interface BuyerBehavior {
  buyerId: string;
  segment: 'enterprise' | 'sme' | 'startup' | 'government';
  predictedLifetimeValue: number;
  churnRisk: number; // 0-1
  preferredCategories: string[];
  averageOrderValue: number;
  orderFrequency: number; // orders per month
  paymentReliability: number; // 0-1
  priceSensitivity: 'high' | 'medium' | 'low';
  nextPurchaseProbability: number;
  recommendedActions: string[];
  engagementScore: number; // 0-100
}

export interface SupplierRiskScore {
  supplierId: string;
  companyName: string;
  overallRiskScore: number; // 0-100, higher = riskier
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  financialHealth: number; // 0-100
  deliveryReliability: number; // 0-100
  qualityScore: number; // 0-100
  complianceScore: number; // 0-100
  marketReputation: number; // 0-100
  yearsInBusiness: number;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  riskFactors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  category: 'financial' | 'operational' | 'compliance' | 'reputation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number; // 0-10
}

export interface MarketTrend {
  id: string;
  title: string;
  description: string;
  category: string;
  region: 'algeria' | 'mena' | 'africa' | 'global';
  impact: 'high' | 'medium' | 'low';
  timeframe: 'short-term' | 'mid-term' | 'long-term';
  growthRate: number; // percentage
  confidence: number; // 0-1
  relatedCategories: string[];
  keyDrivers: string[];
  dataPoints: TrendDataPoint[];
}

export interface TrendDataPoint {
  period: string;
  value: number;
  changePercent: number;
}

export interface ProductMatch {
  productA: { id: string; name: string; category: string };
  productB: { id: string; name: string; category: string };
  matchScore: number; // 0-1
  matchType: 'complementary' | 'substitute' | 'bundle' | 'upsell';
  coOccurrenceRate: number;
  avgTimeBetweenPurchases: number; // days
  revenuePotential: number;
}

export interface RegionalMarketData {
  wilayaCode: number;
  wilayaName: string;
  population: number;
  gdpPerCapita: number;
  businessDensity: number;
  topCategories: string[];
  demandIndex: number; // 0-100
  growthIndex: number; // 0-100
  competitionLevel: 'low' | 'medium' | 'high';
}

// ============================================================================
// Mock Data for Development
// ============================================================================

const ALGERIAN_WILAYAS: RegionalMarketData[] = [
  { wilayaCode: 16, wilayaName: 'Alger', population: 2749000, gdpPerCapita: 8500, businessDensity: 145.2, topCategories: ['Technology', 'Services', 'Construction'], demandIndex: 95, growthIndex: 88, competitionLevel: 'high' },
  { wilayaCode: 31, wilayaName: 'Oran', population: 1780000, gdpPerCapita: 6200, businessDensity: 98.5, topCategories: ['Manufacturing', 'Logistics', 'Food'], demandIndex: 87, growthIndex: 82, competitionLevel: 'high' },
  { wilayaCode: 43, wilayaName: 'Constantine', population: 980000, gdpPerCapita: 4800, businessDensity: 72.3, topCategories: ['Textile', 'Education', 'Retail'], demandIndex: 78, growthIndex: 75, competitionLevel: 'medium' },
  { wilayaCode: 23, wilayaName: 'Annaba', population: 650000, gdpPerCapita: 5200, businessDensity: 65.8, topCategories: ['Steel', 'Industrial', 'Port Services'], demandIndex: 72, growthIndex: 70, competitionLevel: 'medium' },
  { wilayaCode: 29, wilayaName: 'Biskra', population: 320000, gdpPerCapita: 3800, businessDensity: 42.1, topCategories: ['Agriculture', 'Date Processing', 'Tourism'], demandIndex: 65, growthIndex: 85, competitionLevel: 'low' },
  { wilayaCode: 19, wilayaName: 'Setif', population: 1550000, gdpPerCapita: 4200, businessDensity: 58.7, topCategories: ['Agriculture', 'Cereal', 'Consumer Goods'], demandIndex: 76, growthIndex: 78, competitionLevel: 'medium' },
  { wilayaCode: 44, wilayaName: 'Batna', population: 620000, gdpPerCapita: 3500, businessDensity: 48.3, topCategories: ['Pharmaceutical', 'Agriculture', 'Trade'], demandIndex: 68, growthIndex: 72, competitionLevel: 'low' },
  { wilayaCode: 28, wilayaName: 'Bejaia', population: 580000, gdpPerCapita: 4000, businessDensity: 52.6, topCategories: ['Fishing', 'Tourism', 'Transport'], demandIndex: 70, growthIndex: 74, competitionLevel: 'medium' },
  { wilayaCode: 13, wilayaName: 'Tlemcen', population: 520000, gdpPerCapita: 3600, businessDensity: 45.2, topCategories: ['Tourism', 'Handicraft', 'Trade'], demandIndex: 66, growthIndex: 80, competitionLevel: 'low' },
  { wilayaCode: 40, wilayaName: 'Tizi Ouzou', population: 1120000, gdpPerCapita: 4500, businessDensity: 68.9, topCategories: ['Light Industry', 'Services', 'Retail'], demandIndex: 74, growthIndex: 76, competitionLevel: 'medium' },
];

const PRODUCT_CATEGORIES = [
  'Agriculture & Food',
  'Construction Materials',
  'Electronics & Technology',
  'Textiles & Apparel',
  'Machinery & Equipment',
  'Chemicals',
  'Automotive Parts',
  'Pharmaceuticals',
  'Metal Products',
  'Packaging & Printing',
  'Energy & Fuel',
  'Furniture & Home',
];

// ============================================================================
// Demand Forecasting Engine
// ============================================================================

/**
 * Generates time-series based demand forecast using exponential smoothing
 * with seasonal adjustment for Algerian market patterns
 */
export function generateDemandForecast(
  category: string,
  region: string,
  historicalDays: number = 90
): DemandForecast {
  // Generate mock historical data with realistic patterns
  const today = new Date();
  const historicalData: TimeSeriesDataPoint[] = [];
  
  let baseDemand = Math.random() * 500 + 200; // Base demand level
  
  for (let i = historicalDays; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Add seasonal components (weekend effect, monthly patterns)
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    const month = date.getMonth();
    
    // Weekend reduction (Friday/Saturday in Algeria)
    const weekendFactor = (dayOfWeek === 5 || dayOfWeek === 6) ? 0.7 : 1.0;
    
    // Monthly pattern (end of month spike)
    const monthEndFactor = dayOfMonth > 25 ? 1.15 : 1.0;
    
    // Seasonal factor (summer slowdown in Algeria)
    const summerFactor = (month >= 6 && month <= 8) ? 0.85 : 1.0;
    
    // Ramadan effect (approximate - varies by year)
    const ramadanFactor = (month === 2 || month === 3) ? 1.25 : 1.0;
    
    // Random noise
    const noise = (Math.random() - 0.5) * 0.2;
    
    // Calculate final value
    const trend = 1 + (historicalDays - i) * 0.001; // Slight upward trend
    const value = baseDemand * weekendFactor * monthEndFactor * summerFactor * ramadanFactor * trend * (1 + noise);
    
    historicalData.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value),
      category,
      region,
    });
    
    baseDemand += (Math.random() - 0.45) * 10;
  }
  
  // Apply exponential smoothing for forecast
  const alpha = 0.3; // Smoothing factor
  const beta = 0.1; // Trend smoothing
  const gamma = 0.15; // Seasonal smoothing
  const seasonLength = 7; // Weekly seasonality
  
  const forecastData: TimeSeriesDataPoint[] = [];
  const forecastDays = 90;
  
  // Simple Holt-Winters implementation
  let level = historicalData[historicalData.length - 1].value;
  let trend = (historicalData[historicalData.length - 1].value - historicalData[Math.max(0, historicalData.length - 7)].value) / 7;
  
  // Calculate seasonal indices from historical data
  const seasonalIndices: number[] = Array(seasonLength).fill(0);
  for (let s = 0; s < seasonLength; s++) {
    let sum = 0;
    let count = 0;
    for (let i = historicalData.length - 1 - s; i >= 0; i -= seasonLength) {
      sum += historicalData[i].value;
      count++;
    }
    if (count > 0) {
      seasonalIndices[s] = sum / count / (level || 1);
    } else {
      seasonalIndices[s] = 1;
    }
  }
  
  // Generate forecasts
  for (let i = 1; i <= forecastDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const seasonIdx = ((today.getDay() + i) % seasonLength + seasonLength) % seasonLength;
    const seasonal = seasonalIndices[seasonIdx] || 1;
    
    // Forecast with trend and seasonality
    const forecast = (level + i * trend) * seasonal;
    
    // Add uncertainty that grows with distance
    const uncertainty = i * 0.02 * level;
    const noisyForecast = forecast + (Math.random() - 0.5) * uncertainty;
    
    forecastData.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, Math.round(noisyForecast)),
      category,
      region,
    });
  }
  
  // Determine overall metrics
  const currentDemand = historicalData[historicalData.length - 1].value;
  const forecast30 = forecastData[29]?.value || currentDemand;
  const forecast60 = forecastData[59]?.value || currentDemand;
  const forecast90 = forecastData[89]?.value || currentDemand;
  
  const trendDirection = forecast90 > currentDemand * 1.05 
    ? 'increasing' 
    : forecast90 < currentDemand * 0.95 
      ? 'decreasing' 
      : 'stable';
  
  // Confidence decreases with forecast horizon
  const confidence = Math.max(0.5, 1 - (forecastDays / 365));
  
  return {
    category,
    region,
    currentDemand,
    forecast30Days: forecast30,
    forecast60Days: forecast60,
    forecast90Days: forecast90,
    confidence,
    seasonalityFactor: Math.max(...seasonalIndices) - Math.min(...seasonalIndices),
    trend: trendDirection,
    historicalData,
    forecastData,
  };
}

/**
 * Generate demand forecasts for multiple categories
 */
export function generateMultiCategoryForecast(
  categories: string[],
  region: string
): Map<string, DemandForecast> {
  const forecasts = new Map<string, DemandForecast>();
  
  for (const category of categories) {
    forecasts.set(category, generateDemandForecast(category, region));
  }
  
  return forecasts;
}

// ============================================================================
// Price Optimization Engine
// ============================================================================

/**
 * Analyzes pricing data and generates optimization recommendations
 * Considers:
 * - Competitor pricing in Algeria/MENA
 * - Price elasticity of demand
 * - Market positioning
 * - Seasonal factors
 */
export function generatePriceOptimization(
  productId: string,
  productName: string,
  currentPrice: number,
  category: string,
  costBase: number = currentPrice * 0.6
): PriceOptimization {
  // Generate competitor prices (mock data)
  const competitorCount = Math.floor(Math.random() * 10) + 3;
  const competitorPrices: number[] = [];
  
  for (let i = 0; i < competitorCount; i++) {
    const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
    competitorPrices.push(currentPrice * (1 + variation));
  }
  
  const competitorAvg = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
  const competitorMin = Math.min(...competitorPrices);
  const competitorMax = Math.max(...competitorPrices);
  
  // Calculate price elasticity (category-specific defaults)
  const elasticityMap: Record<string, number> = {
    'Electronics & Technology': -1.8,
    'Textiles & Apparel': -1.5,
    'Agriculture & Food': -0.8,
    'Construction Materials': -1.2,
    'Machinery & Equipment': -1.0,
    'Chemicals': -1.3,
    'Automotive Parts': -1.4,
    'Pharmaceuticals': -0.6,
    'Metal Products': -1.1,
    'Packaging & Printing': -1.2,
    'Energy & Fuel': -0.4,
    'Furniture & Home': -1.6,
  };
  
  const elasticity = elasticityMap[category] || -1.2;
  
  // Determine optimal price using margin analysis
  const minMargin = 0.15; // 15% minimum margin
  const targetMargin = 0.30; // 30% target margin
  
  const minPrice = costBase * (1 + minMargin);
  const maxPrice = competitorMax * 1.05; // Don't exceed max competitor by much
  
  // Optimal price calculation
  let optimalPrice: number;
  
  if (currentPrice < competitorAvg * 0.9) {
    // Underpriced - can increase
    optimalPrice = Math.min(competitorAvg, currentPrice * 1.1);
  } else if (currentPrice > competitorMax) {
    // Overpriced - should decrease
    optimalPrice = Math.max(competitorAvg, currentPrice * 0.95);
  } else {
    // Competitive - small adjustment toward optimal margin
    optimalPrice = costBase * (1 + targetMargin);
    optimalPrice = Math.max(minPrice, Math.min(maxPrice, optimalPrice));
  }
  
  // Round to reasonable precision
  optimalPrice = Math.round(optimalPrice * 100) / 100;
  
  // Calculate revenue projections
  const currentDailySales = Math.floor(Math.random() * 50) + 10;
  const priceChangeRatio = optimalPrice / currentPrice;
  const quantityChange = Math.pow(priceChangeRatio, elasticity);
  const projectedSales = Math.floor(currentDailySales * quantityChange);
  
  const currentRevenue = currentDailySales * currentPrice * 30; // Monthly
  const projectedRevenue = projectedSales * optimalPrice * 30;
  const revenueChange = ((projectedRevenue - currentRevenue) / currentRevenue) * 100;
  
  // Determine market position
  let marketPosition: PriceOptimization['marketPosition'];
  if (currentPrice < competitorMin * 0.95) {
    marketPosition = 'underpriced';
  } else if (currentPrice > competitorMax * 1.05) {
    marketPosition = 'overpriced';
  } else if (currentPrice <= competitorAvg * 1.05 && currentPrice >= competitorAvg * 0.95) {
    marketPosition = 'competitive';
  } else if (currentPrice > competitorAvg) {
    marketPosition = 'premium';
  } else {
    marketPosition = 'underpriced';
  }
  
  // Generate reasoning
  const reasoning: string[] = [];
  if (optimalPrice > currentPrice) {
    reasoning.push(`Market analysis suggests room for ${((optimalPrice / currentPrice - 1) * 100).toFixed(1)}% price increase`);
  } else if (optimalPrice < currentPrice) {
    reasoning.push(`Competitive pressure suggests ${((1 - optimalPrice / currentPrice) * 100).toFixed(1)}% price adjustment`);
  }
  reasoning.push(`${competitorCount} competitors analyzed in ${category} category`);
  reasoning.push(`Price elasticity estimated at ${elasticity.toFixed(2)} for this category`);
  
  return {
    productId,
    productName,
    currentPrice,
    currency: 'DZD',
    suggestedPrice: optimalPrice,
    minPrice: Math.round(minPrice * 100) / 100,
    maxPrice: Math.round(maxPrice * 100) / 100,
    optimalPrice,
    priceElasticity: elasticity,
    demandImpact: Math.abs(elasticity) > 1.3 ? 'high' : Math.abs(elasticity) > 0.9 ? 'medium' : 'low',
    competitorAvgPrice: Math.round(competitorAvg * 100) / 100,
    marketPosition,
    revenueProjection: {
      current: Math.round(currentRevenue),
      optimized: Math.round(projectedRevenue),
      changePercent: Math.round(revenueChange * 10) / 10,
    },
    reasoning,
  };
}

/**
 * Batch price optimization for multiple products
 */
export function batchPriceOptimization(
  products: Array<{ id: string; name: string; price: number; category: string }>
): PriceOptimization[] {
  return products.map(p => generatePriceOptimization(p.id, p.name, p.price, p.category));
}

// ============================================================================
// Buyer Behavior Prediction
// ============================================================================

/**
 * Predicts buyer behavior including churn risk, lifetime value, and preferences
 */
export function predictBuyerBehavior(buyerId: string): BuyerBehavior {
  // Generate behavioral features (mock)
  const totalOrders = Math.floor(Math.random() * 100) + 5;
  const totalSpent = totalOrders * (Math.random() * 50000 + 5000);
  const avgOrderValue = totalSpent / totalOrders;
  const daysSinceFirstOrder = Math.floor(Math.random() * 730) + 30; // 30 days to 2 years
  const daysSinceLastOrder = Math.floor(Math.random() * 60); // 0-60 days ago
  
  // Calculate order frequency
  const orderFrequency = (totalOrders / daysSinceFirstOrder) * 30; // Orders per month
  
  // Segment determination
  let segment: BuyerBehavior['segment'];
  if (avgOrderValue > 50000) {
    segment = 'enterprise';
  } else if (avgOrderValue > 15000) {
    segment = 'sme';
  } else if (totalOrders > 20) {
    segment = 'startup';
  } else {
    segment = 'sme'; // Default
  }
  
  // Churn risk calculation
  const recencyScore = Math.max(0, 1 - daysSinceLastOrder / 90);
  const frequencyScore = Math.min(1, orderFrequency / 10);
  const monetaryScore = Math.min(1, avgOrderValue / 50000);
  
  const rfmScore = (recencyScore * 0.4 + frequencyScore * 0.3 + monetaryScore * 0.3);
  const churnRisk = Math.max(0, Math.min(1, 1 - rfmScore + (Math.random() - 0.5) * 0.2));
  
  // Predict lifetime value (simple projection)
  const monthsActive = daysSinceFirstOrder / 30;
  const monthlyValue = monthsActive > 0 ? totalSpent / monthsActive : avgOrderValue;
  const predictedMonthsRemaining = (1 - churnRisk) * 24; // Up to 24 months
  const predictedLifetimeValue = monthlyValue * predictedMonthsRemaining;
  
  // Payment reliability (mock)
  const onTimePaymentRate = 0.85 + Math.random() * 0.15;
  const paymentReliability = onTimePaymentRate;
  
  // Price sensitivity based on segment and behavior
  let priceSensitivity: BuyerBehavior['priceSensitivity'];
  if (segment === 'enterprise') {
    priceSensitivity = 'low';
  } else if (segment === 'sme' && avgOrderValue < 10000) {
    priceSensitivity = 'high';
  } else {
    priceSensitivity = 'medium';
  }
  
  // Next purchase probability
  const nextPurchaseProbability = Math.max(0.1, Math.min(0.95, 
    recencyScore * 0.5 + frequencyScore * 0.3 + (1 - churnRisk) * 0.2
  ));
  
  // Preferred categories (random selection)
  const numPreferences = Math.floor(Math.random() * 4) + 1;
  const shuffled = [...PRODUCT_CATEGORIES].sort(() => Math.random() - 0.5);
  const preferredCategories = shuffled.slice(0, numPreferences);
  
  // Engagement score (composite metric)
  const engagementScore = Math.round((
    recencyScore * 30 + 
    frequencyScore * 25 + 
    (1 - churnRisk) * 25 +
    (onTimePaymentRate - 0.85) * 200
  ));
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (churnRisk > 0.6) {
    recommendations.push('High churn risk - consider retention campaign');
    recommendations.push('Offer personalized discount or loyalty benefits');
  }
  if (daysSinceLastOrder > 30) {
    recommendations.push('Inactive buyer - send re-engagement email');
  }
  if (nextPurchaseProbability > 0.7) {
    recommendations.push('Ready to purchase - show relevant products');
  }
  if (priceSensitivity === 'high') {
    recommendations.push('Price-sensitive - highlight discounts and value');
  }
  if (recommendations.length === 0) {
    recommendations.push('Maintain regular engagement');
  }
  
  return {
    buyerId,
    segment,
    predictedLifetimeValue: Math.round(predictedLifetimeValue),
    churnRisk: Math.round(churnRisk * 100) / 100,
    preferredCategories,
    averageOrderValue: Math.round(avgOrderValue),
    orderFrequency: Math.round(orderFrequency * 10) / 10,
    paymentReliability: Math.round(paymentReliability * 100) / 100,
    priceSensitivity,
    nextPurchaseProbability: Math.round(nextPurchaseProbability * 100) / 100,
    recommendedActions: recommendations,
    engagementScore: Math.max(0, Math.min(100, engagementScore)),
  };
}

/**
 * Identify buyers at risk of churning
 */
export function identifyAtRiskBuyers(threshold: number = 0.6): BuyerBehavior[] {
  // In production, this would query actual buyer data
  const atRiskBuyers: BuyerBehavior[] = [];
  const numBuyers = Math.floor(Math.random() * 20) + 5;
  
  for (let i = 0; i < numBuyers; i++) {
    const behavior = predictBuyerBehavior(`buyer-${i}`);
    if (behavior.churnRisk >= threshold) {
      atRiskBuyers.push(behavior);
    }
  }
  
  return atRiskBuyers.sort((a, b) => b.churnRisk - a.churnRisk);
}

// ============================================================================
// Supplier Risk Scoring
// ============================================================================

/**
 * Calculates comprehensive supplier risk score
 */
export function calculateSupplierRisk(supplierId: string): SupplierRiskScore {
  // Generate supplier characteristics (mock)
  const yearsInBusiness = Math.floor(Math.random() * 25) + 1;
  const isVerified = Math.random() > 0.3;
  
  // Financial health factors
  const revenueStability = 0.6 + Math.random() * 0.4;
  const profitMargin = 0.05 + Math.random() * 0.2;
  const debtRatio = Math.random() * 0.5;
  const financialHealth = Math.round((
    revenueStability * 40 + 
    profitMargin * 200 + 
    (1 - debtRatio) * 40
  ));
  
  // Delivery reliability
  const onTimeDeliveryRate = 0.75 + Math.random() * 0.25;
  const orderFulfillmentRate = 0.9 + Math.random() * 0.1;
  const averageLeadTime = Math.floor(Math.random() * 14) + 2;
  const deliveryReliability = Math.round((
    onTimeDeliveryRate * 50 + 
    orderFulfillmentRate * 30 + 
    Math.max(0, (14 - averageLeadTime)) * 1.5
  ));
  
  // Quality score
  const defectRate = Math.random() * 0.08;
  const customerComplaints = Math.floor(Math.random() * 10);
  const certificationLevel = Math.floor(Math.random() * 4); // 0-3 certifications
  const qualityScore = Math.round((
    (1 - defectRate) * 60 + 
    Math.max(0, (10 - customerComplaints)) * 3 + 
    certificationLevel * 7
  ));
  
  // Compliance score
  const regulatoryCompliance = 0.8 + Math.random() * 0.2;
  const documentationComplete = Math.random() > 0.2;
  const auditHistory = Math.random() > 0.15; // No major issues
  const complianceScore = Math.round((
    regulatoryCompliance * 50 + 
    (documentationComplete ? 25 : 0) + 
    (auditHistory ? 25 : 0)
  ));
  
  // Market reputation
  const reviewRating = 3 + Math.random() * 2; // 3-5 stars
  const marketPresence = Math.random(); // Brand recognition
  const referralRate = Math.random() * 0.3;
  const marketReputation = Math.round((
    reviewRating * 18 + 
    marketPresence * 35 + 
    referralRate * 80
  ));
  
  // Calculate overall risk score (weighted average of inverse scores)
  const overallRiskScore = Math.round((
    (100 - financialHealth) * 0.25 +
    (100 - deliveryReliability) * 0.25 +
    (100 - qualityScore) * 0.25 +
    (100 - complianceScore) * 0.15 +
    (100 - marketReputation) * 0.10
  ));
  
  // Determine risk level
  let riskLevel: SupplierRiskScore['riskLevel'];
  if (overallRiskScore >= 70) {
    riskLevel = 'critical';
  } else if (overallRiskScore >= 50) {
    riskLevel = 'high';
  } else if (overallRiskScore >= 30) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }
  
  // Generate risk factors
  const riskFactors: RiskFactor[] = [];
  
  if (financialHealth < 60) {
    riskFactors.push({
      category: 'financial',
      severity: financialHealth < 40 ? 'high' : 'medium',
      description: 'Financial health indicators below threshold',
      impact: Math.round((60 - financialHealth) / 4),
    });
  }
  
  if (deliveryReliability < 65) {
    riskFactors.push({
      category: 'operational',
      severity: deliveryReliability < 50 ? 'high' : 'medium',
      description: `Delivery reliability at ${deliveryReliability}%`,
      impact: Math.round((65 - deliveryReliability) / 3),
    });
  }
  
  if (qualityScore < 55) {
    riskFactors.push({
      category: 'operational',
      severity: qualityScore < 40 ? 'critical' : 'medium',
      description: `Quality score below acceptable levels`,
      impact: Math.round((55 - qualityScore) / 3),
    });
  }
  
  if (!isVerified) {
    riskFactors.push({
      category: 'compliance',
      severity: 'medium',
      description: 'Supplier verification pending or incomplete',
      impact: 5,
    });
  }
  
  if (yearsInBusiness < 2) {
    riskFactors.push({
      category: 'reputation',
      severity: 'low',
      description: `New supplier (${yearsInBusiness} year${yearsInBusiness > 1 ? 's' : ''} in business)`,
      impact: 3,
    });
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (riskLevel === 'critical') {
    recommendations.push('Consider alternative suppliers immediately');
    recommendations.push('Require escrow or guarantee for orders');
  } else if (riskLevel === 'high') {
    recommendations.push('Increase monitoring frequency');
    recommendations.push('Request updated financial documentation');
  }
  
  if (deliveryReliability < 70) {
    recommendations.push('Negotiate stricter delivery terms');
  }
  
  if (!isVerified) {
    recommendations.push('Initiate verification process');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue standard monitoring');
    recommendations.push('Consider for preferred supplier program');
  }
  
  // Generate company name
  const companyNames = [
    'Sonatrach Supplies', 'Algerie Telecom Trading', 'CEVITAL Industrial',
    'Condor Manufacturing', 'Nassim Group', 'Setifalis', 'Ifri Industries',
    'Plastique Algérie', 'Simod', 'Biopharm SA', 'Génial Solutions',
  ];
  const companyName = companyNames[Math.floor(Math.random() * companyNames.length)];
  
  return {
    supplierId,
    companyName,
    overallRiskScore: Math.max(0, Math.min(100, overallRiskScore)),
    riskLevel,
    financialHealth: Math.max(0, Math.min(100, financialHealth)),
    deliveryReliability: Math.max(0, Math.min(100, deliveryReliability)),
    qualityScore: Math.max(0, Math.min(100, qualityScore)),
    complianceScore: Math.max(0, Math.min(100, complianceScore)),
    marketReputation: Math.max(0, Math.min(100, marketReputation)),
    yearsInBusiness,
    verificationStatus: isVerified ? 'verified' : 'pending',
    riskFactors,
    recommendations,
  };
}

/**
 * Get risk scores for multiple suppliers
 */
export function batchSupplierRiskScoring(supplierIds: string[]): SupplierRiskScore[] {
  return supplierIds.map(id => calculateSupplierRisk(id))
    .sort((a, b) => a.overallRiskScore - b.overallRiskScore);
}

// ============================================================================
// Market Trend Analysis
// ============================================================================

/**
 * Analyzes market trends for Algeria and MENA region
 */
export function analyzeMarketTrends(category?: string): MarketTrend[] {
  const trends: MarketTrend[] = [
    {
      id: 'trend-1',
      title: 'Digital Transformation Acceleration',
      description: 'Algerian businesses rapidly adopting digital B2B platforms post-2020 regulations',
      category: 'Technology',
      region: 'algeria',
      impact: 'high',
      timeframe: 'long-term',
      growthRate: 34.5,
      confidence: 0.92,
      relatedCategories: ['Electronics & Technology', 'Services'],
      keyDrivers: ['Government digitalization initiatives', 'Young tech-savvy workforce', 'Infrastructure investment'],
      dataPoints: [
        { period: '2023 Q1', value: 100, changePercent: 0 },
        { period: '2023 Q2', value: 115, changePercent: 15 },
        { period: '2023 Q3', value: 132, changePercent: 14.8 },
        { period: '2023 Q4', value: 151, changePercent: 14.4 },
        { period: '2024 Q1', value: 168, changePercent: 11.3 },
        { period: '2024 Q2', value: 189, changePercent: 12.5 },
      ],
    },
    {
      id: 'trend-2',
      title: 'Local Manufacturing Growth',
      description: 'Made in Algeria initiative driving domestic production across sectors',
      category: 'Manufacturing',
      region: 'algeria',
      impact: 'high',
      timeframe: 'mid-term',
      growthRate: 22.3,
      confidence: 0.88,
      relatedCategories: ['Construction Materials', 'Machinery & Equipment', 'Textiles & Apparel'],
      keyDrivers: ['Import substitution policy', 'Local content requirements', 'Investment incentives'],
      dataPoints: [
        { period: '2023 Q1', value: 100, changePercent: 0 },
        { period: '2023 Q2', value: 108, changePercent: 8 },
        { period: '2023 Q3', value: 118, changePercent: 9.3 },
        { period: '2023 Q4', value: 129, changePercent: 9.3 },
        { period: '2024 Q1', value: 140, changePercent: 8.5 },
        { period: '2024 Q2', value: 152, changePercent: 8.6 },
      ],
    },
    {
      id: 'trend-3',
      title: 'Renewable Energy Investment Surge',
      description: 'Solar and wind energy projects creating supply chain opportunities',
      category: 'Energy',
      region: 'mena',
      impact: 'high',
      timeframe: 'long-term',
      growthRate: 45.2,
      confidence: 0.85,
      relatedCategories: ['Energy & Fuel', 'Machinery & Equipment', 'Construction Materials'],
      keyDrivers: ['Hassi R\'Mel solar project', 'Green hydrogen initiative', 'International partnerships'],
      dataPoints: [
        { period: '2023 Q1', value: 100, changePercent: 0 },
        { period: '2023 Q2', value: 122, changePercent: 22 },
        { period: '2023 Q3', value: 148, changePercent: 21.3 },
        { period: '2023 Q4', value: 178, changePercent: 20.3 },
        { period: '2024 Q1', value: 210, changePercent: 18 },
        { period: '2024 Q2', value: 245, changePercent: 16.7 },
      ],
    },
    {
      id: 'trend-4',
      title: 'Agricultural Modernization',
      description: 'Smart farming technology adoption and processing industry expansion',
      category: 'Agriculture',
      region: 'algeria',
      impact: 'medium',
      timeframe: 'mid-term',
      growthRate: 18.7,
      confidence: 0.79,
      relatedCategories: ['Agriculture & Food', 'Machinery & Equipment', 'Chemicals'],
      keyDrivers: ['Food security focus', 'Export potential to EU', 'Government subsidies'],
      dataPoints: [
        { period: '2023 Q1', value: 100, changePercent: 0 },
        { period: '2023 Q2', value: 105, changePercent: 5 },
        { period: '2023 Q3', value: 112, changePercent: 6.7 },
        { period: '2023 Q4', value: 119, changePercent: 6.3 },
        { period: '2024 Q1', value: 127, changePercent: 6.7 },
        { period: '2024 Q2', value: 136, changePercent: 7.1 },
      ],
    },
    {
      id: 'trend-5',
      title: 'E-commerce Logistics Expansion',
      description: 'Last-mile delivery and warehousing infrastructure development',
      category: 'Logistics',
      region: 'mena',
      impact: 'medium',
      timeframe: 'short-term',
      growthRate: 28.9,
      confidence: 0.86,
      relatedCategories: ['Packaging & Printing', 'Automotive Parts', 'Technology'],
      keyDrivers: ['Consumer e-commerce growth', 'Cross-border trade facilitation', 'Cold chain investments'],
      dataPoints: [
        { period: '2023 Q1', value: 100, changePercent: 0 },
        { period: '2023 Q2', value: 118, changePercent: 18 },
        { period: '2023 Q3', value: 138, changePercent: 16.9 },
        { period: '2023 Q4', value: 159, changePercent: 15.2 },
        { period: '2024 Q1', value: 182, changePercent: 14.5 },
        { period: '2024 Q2', value: 207, changePercent: 13.7 },
      ],
    },
    {
      id: 'trend-6',
      title: 'Pharmaceutical Localization',
      description: 'Local drug manufacturing increasing to reduce import dependency',
      category: 'Pharmaceuticals',
      region: 'algeria',
      impact: 'high',
      timeframe: 'long-term',
      growthRate: 31.4,
      confidence: 0.91,
      relatedCategories: ['Pharmaceuticals', 'Chemicals', 'Packaging & Printing'],
      keyDrivers: ['Healthcare spending increase', 'Technology transfer agreements', 'Regulatory support'],
      dataPoints: [
        { period: '2023 Q1', value: 100, changePercent: 0 },
        { period: '2023 Q2', value: 115, changePercent: 15 },
        { period: '2023 Q3', value: 132, changePercent: 14.8 },
        { period: '2023 Q4', value: 151, changePercent: 14.4 },
        { period: '2024 Q1', value: 172, changePercent: 13.9 },
        { period: '2024 Q2', value: 195, changePercent: 13.4 },
      ],
    },
  ];
  
  if (category) {
    return trends.filter(t => 
      t.category.toLowerCase().includes(category.toLowerCase()) ||
      t.relatedCategories.some(c => c.toLowerCase().includes(category.toLowerCase()))
    );
  }
  
  return trends;
}

// ============================================================================
// Smart Product Matching Algorithm
// ============================================================================

/**
 * Finds product matches based on complementary, substitute, bundle, and upsell relationships
 */
export function findProductMatches(productId: string, allProducts: Array<{id: string; name: string; category: string}>): ProductMatch[] {
  const sourceProduct = allProducts.find(p => p.id === productId);
  if (!sourceProduct) {
    throw new Error(`Product ${productId} not found`);
  }
  
  const matches: ProductMatch[] = [];
  
  for (const product of allProducts) {
    if (product.id === productId) continue;
    
    // Calculate match score based on various factors
    let matchScore = 0;
    let matchType: ProductMatch['matchType'] = 'complementary';
    
    // Category-based scoring
    if (product.category === sourceProduct.category) {
      // Same category - could be substitute or upsell
      matchScore += 0.3;
      matchType = Math.random() > 0.5 ? 'substitute' : 'upsell';
    } else {
      // Different category - check for known complementarities
      const complementaryPairs: Record<string, string[]> = {
        'Electronics & Technology': ['Accessories', 'Software', 'Components'],
        'Construction Materials': ['Tools', 'Safety Equipment', 'Architectural Services'],
        'Automotive Parts': ['Lubricants', 'Tools', 'Accessories'],
        'Agriculture & Food': ['Processing Equipment', 'Packaging', 'Organic Fertilizers'],
        'Textiles & Apparel': ['Fashion Accessories', 'Laundry Services', 'Packaging'],
      };
      
      const complements = complementaryPairs[sourceProduct.category] || [];
      if (complements.some(c => product.category.includes(c) || c.includes(product.category))) {
        matchScore += 0.5;
        matchType = 'complementary';
      } else {
        matchScore += 0.15;
        matchType = 'bundle';
      }
    }
    
    // Add randomness for realism
    matchScore += (Math.random() - 0.3) * 0.3;
    matchScore = Math.max(0.1, Math.min(0.95, matchScore));
    
    // Only include meaningful matches
    if (matchScore >= 0.25) {
      matches.push({
        productA: { id: sourceProduct.id, name: sourceProduct.name, category: sourceProduct.category },
        productB: { id: product.id, name: product.name, category: product.category },
        matchScore: Math.round(matchScore * 100) / 100,
        matchType,
        coOccurrenceRate: Math.round(matchScore * 0.9 * 100) / 100,
        avgTimeBetweenPurchases: Math.floor(Math.random() * 45) + 5,
        revenuePotential: Math.round(matchScore * 50000 * (Math.random() + 0.5)),
      });
    }
  }
  
  return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
}

// ============================================================================
// Regional Market Intelligence
// ============================================================================

/**
 * Gets market intelligence for Algerian regions (wilayas)
 */
export function getRegionalMarketData(wilayaCode?: number): RegionalMarketData[] {
  if (wilayaCode !== undefined) {
    const wilaya = ALGERIAN_WILAYAS.find(w => w.wilayaCode === wilayaCode);
    return wilaya ? [wilaya] : [];
  }
  return ALGERIAN_WILAYAS;
}

/**
 * Identifies market opportunities by region
 */
export function identifyMarketOpportunities(): Array<{
  wilaya: RegionalMarketData;
  opportunityType: 'underserved' | 'growing' | 'emerging';
  suggestedCategories: string[];
  opportunityScore: number;
}> {
  return ALGERIAN_WILAYAS
    .map(wilaya => ({
      wilaya,
      opportunityType: (
        wilaya.competitionLevel === 'low' && wilaya.demandIndex > 60 ? 'underserved' as const :
        wilaya.growthIndex > 80 ? 'growing' as const :
        'emerging' as const
      ),
      suggestedCategories: wilaya.topCategories.slice(0, 2),
      opportunityScore: Math.round(
        (wilaya.growthIndex * 0.4 + (100 - wilaya.businessDensity) * 0.3 + wilaya.demandIndex * 0.3)
      ),
    }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 5);
}

// ============================================================================
// Export aggregate functions
// ============================================================================

export interface BusinessIntelligenceDashboard {
  demandForecasts: DemandForecast[];
  priceOptimizations: PriceOptimization[];
  atRiskBuyers: BuyerBehavior[];
  supplierRisks: SupplierRiskScore[];
  marketTrends: MarketTrend[];
  regionalOpportunities: ReturnType<typeof identifyMarketOpportunities>;
}

/**
 * Generates comprehensive BI dashboard data
 */
export function generateBIDashboard(
  categories: string[] = PRODUCT_CATEGORIES.slice(0, 5),
  region: string = 'Algeria'
): BusinessIntelligenceDashboard {
  // Generate demand forecasts
  const demandForecasts = categories.map(cat => 
    generateDemandForecast(cat, region)
  );
  
  // Sample products for price optimization
  const sampleProducts = [
    { id: 'p1', name: 'Industrial Steel Pipes', price: 12500, category: 'Metal Products' },
    { id: 'p2', name: 'Cotton Textile Roll', price: 8500, category: 'Textiles & Apparel' },
    { id: 'p3', name: 'CNC Machine Tool', price: 250000, category: 'Machinery & Equipment' },
    { id: 'p4', name: 'Organic Dates Premium', price: 1200, category: 'Agriculture & Food' },
    { id: 'p5', name: 'Solar Panel Kit 300W', price: 45000, category: 'Energy & Fuel' },
  ];
  
  const priceOptimizations = batchPriceOptimization(sampleProducts);
  
  // At-risk buyers
  const atRiskBuyers = identifyAtRiskBuyers(0.5).slice(0, 5);
  
  // Supplier risks
  const supplierIds = ['sup-1', 'sup-2', 'sup-3', 'sup-4', 'sup-5'];
  const supplierRisks = batchSupplierRiskScoring(supplierIds);
  
  // Market trends
  const marketTrends = analyzeMarketTrends();
  
  // Regional opportunities
  const regionalOpportunities = identifyMarketOpportunities();
  
  return {
    demandForecasts,
    priceOptimizations,
    atRiskBuyers,
    supplierRisks,
    marketTrends,
    regionalOpportunities,
  };
}
