/**
 * Smart Recommendation Engine for AlgeriaTrade.dz
 * B2B-focused recommendation system with:
 * - Collaborative filtering for B2B
 * - Content-based product matching
 * - Supplier-buyer compatibility scoring
 * - RFQ auto-matching
 * - Dynamic pricing suggestions
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  currency: string;
  supplierId: string;
  supplierName: string;
  tags: string[];
  specifications: Record<string, string | number>;
  rating: number;
  reviewCount: number;
  minOrderQuantity: number;
  leadTimeDays: number;
  origin?: string; // Wilaya or country
}

export interface BuyerProfile {
  id: string;
  companyName: string;
  segment: 'enterprise' | 'sme' | 'startup' | 'government';
  industry: string;
  preferredCategories: string[];
  priceRange: { min: number; max: number };
  location: {
    wilayaCode: number;
    wilayaName: string;
  };
  orderHistory: OrderRecord[];
  browsingHistory: string[]; // Product IDs
  savedProducts: string[];
  rfqHistory: RFQRecord[];
  createdAt: Date;
}

export interface SupplierProfile {
  id: string;
  companyName: string;
  categories: string[];
  products: Product[];
  location: {
    wilayaCode: number;
    wilayaName: string;
  };
  rating: number;
  responseTime: number; // Average hours
  fulfillmentRate: number; // 0-1
  yearsInBusiness: number;
  certifications: string[];
  minOrderValue: number;
  paymentTerms: string[];
  verified: boolean;
}

export interface OrderRecord {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  orderDate: Date;
  supplierId: string;
  satisfaction: number; // 1-5
}

export interface RFQRecord {
  id: string;
  title: string;
  category: string;
  description: string;
  quantity: number;
  budget?: number;
  deadline: Date;
  status: 'open' | 'closed' | 'awarded';
  responsesReceived: number;
  awardedSupplierId?: string;
}

export interface RecommendationResult {
  itemId: string;
  itemType: 'product' | 'supplier' | 'rfq';
  score: number; // 0-1
  reason: string;
  metadata: Record<string, unknown>;
}

export interface SupplierMatch {
  supplier: SupplierProfile;
  compatibilityScore: number; // 0-100
  matchFactors: MatchFactor[];
  recommendedActions: string[];
  estimatedResponseTime: number; // hours
  priceCompetitiveness: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface MatchFactor {
  category: 'location' | 'category' | 'price' | 'quality' | 'reliability' | 'experience';
  score: number; // 0-10
  weight: number; // Importance weight
  description: string;
}

export interface RFQMatch {
  rfq: RFQRecord;
  matchedSuppliers: Array<{
    supplier: SupplierProfile;
    matchScore: number;
    confidence: number;
    suggestedPrice?: number;
    reasons: string[];
  }>;
}

export interface PricingSuggestion {
  productId: string;
  currentPrice: number;
  suggestedPrice: number;
  adjustmentPercent: number;
  reasoning: string;
  expectedImpact: {
    demandChange: number; // percentage
    revenueChange: number; // percentage
    marginImpact: number; // percentage points
  };
  competitorContext: {
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    position: 'lowest' | 'competitive' | 'premium' | 'highest';
  };
  urgency: 'immediate' | 'soon' | 'monitor';
}

// ============================================================================
// Mock Data for Development
// ============================================================================

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Industrial Steel Pipes API 5L Grade B',
    description: 'High-quality seamless steel pipes for oil and gas industry. Compliant with international standards.',
    category: 'Metal Products',
    subcategory: 'Steel Pipes',
    price: 12500,
    currency: 'DZD',
    supplierId: 'sup-001',
    supplierName: 'Algeria Steel Industries',
    tags: ['steel', 'pipes', 'industrial', 'oil-gas', 'api-5l'],
    specifications: { diameter: '6 inch', length: '12m', grade: 'B', standard: 'API 5L' },
    rating: 4.7,
    reviewCount: 156,
    minOrderQuantity: 10,
    leadTimeDays: 14,
    origin: '16-Algiers',
  },
  {
    id: 'prod-002',
    name: 'Premium Dates Deglet Nour (10kg)',
    description: 'Premium quality Algerian dates from Biskra oasis. Export-grade packaging available.',
    category: 'Agriculture & Food',
    subcategory: 'Dates & Dried Fruits',
    price: 4500,
    currency: 'DZD',
    supplierId: 'sup-002',
    supplierName: 'Biskra Dates Cooperative',
    tags: ['dates', 'organic', 'premium', 'export-quality', 'deglet-nour'],
    specifications: { weight: '10kg', variety: 'Deglet Nour', origin: 'Biskra', certification: 'Organic' },
    rating: 4.9,
    reviewCount: 342,
    minOrderQuantity: 50,
    leadTimeDays: 3,
    origin: '07-Biskra',
  },
  {
    id: 'prod-003',
    name: 'CNC Lathe Machine CK6140',
    description: 'Precision CNC lathe machine for metalworking. Includes training and 2-year warranty.',
    category: 'Machinery & Equipment',
    subcategory: 'CNC Machines',
    price: 2850000,
    currency: 'DZD',
    supplierId: 'sup-003',
    supplierName: 'TechnoMach Algeria',
    tags: ['cnc', 'lathe', 'precision', 'industrial', 'automation'],
    specifications: { swing: '400mm', distance: '1000mm', spindle: '7.5kW', control: 'Fanuc' },
    rating: 4.5,
    reviewCount: 28,
    minOrderQuantity: 1,
    leadTimeDays: 45,
    origin: 'imported',
  },
  {
    id: 'prod-004',
    name: 'Cotton Fabric Roll (100m)',
    description: 'High-quality cotton fabric for textile manufacturing. Available in multiple colors.',
    category: 'Textiles & Apparel',
    subcategory: 'Cotton Fabrics',
    price: 8500,
    currency: 'DZD',
    supplierId: 'sup-004',
    supplierName: 'Setif Textile Mills',
    tags: ['cotton', 'fabric', 'textile', 'wholesale', 'manufacturing'],
    specifications: { length: '100m', width: '1.5m', weight: '180gsm', composition: '100% cotton' },
    rating: 4.3,
    reviewCount: 89,
    minOrderQuantity: 5,
    leadTimeDays: 7,
    origin: '29-Setif',
  },
  {
    id: 'prod-005',
    name: 'Solar Panel System 5kW Complete Kit',
    description: 'Complete solar power system with panels, inverter, mounting, and installation guide.',
    category: 'Energy & Fuel',
    subcategory: 'Solar Energy',
    price: 185000,
    currency: 'DZD',
    supplierId: 'sup-005',
    supplierName: 'SolarTech Solutions',
    tags: ['solar', 'renewable', 'energy', 'complete-kit', 'installation'],
    specifications: { capacity: '5kW', panels: '10x500W', inverter: '5kW hybrid', warranty: '25 years' },
    rating: 4.6,
    reviewCount: 67,
    minOrderQuantity: 1,
    leadTimeDays: 21,
    origin: '16-Algiers',
  },
  {
    id: 'prod-006',
    name: 'Pharmaceutical Grade Glycerin (25L)',
    description: 'USP grade glycerin for pharmaceutical and cosmetic applications.',
    category: 'Chemicals',
    subcategory: 'Pharmaceutical Chemicals',
    price: 12500,
    currency: 'DZD',
    supplierId: 'sup-006',
    supplierName: 'BioChem Algeria',
    tags: ['glycerin', 'pharmaceutical', 'usp-grade', 'chemicals', 'kosher'],
    specifications: { purity: '99.7%', volume: '25L', grade: 'USP/EP/BP', certification: 'ISO 9001' },
    rating: 4.8,
    reviewCount: 45,
    minOrderQuantity: 4,
    leadTimeDays: 10,
    origin: '43-Constantine',
  },
  {
    id: 'prod-007',
    name: 'Automotive Brake Pads Set (Front)',
    description: 'OEM quality brake pads suitable for most European and Asian vehicles.',
    category: 'Automotive Parts',
    subcategory: 'Brake Systems',
    price: 3200,
    currency: 'DZD',
    supplierId: 'sup-007',
    supplierName: 'AutoParts Pro Algeria',
    tags: ['brake-pads', 'automotive', 'oem-quality', 'safety', 'replacement'],
    specifications: { position: 'front', material: 'ceramic', warranty: '30000km', includes: '4 pads + hardware' },
    rating: 4.4,
    reviewCount: 198,
    minOrderQuantity: 20,
    leadTimeDays: 5,
    origin: '31-Oran',
  },
  {
    id: 'prod-008',
    name: 'Portland Cement CEM I 52.5N (50kg)',
    description: 'High-strength Portland cement for construction projects. EN 197-1 compliant.',
    category: 'Construction Materials',
    subcategory: 'Cement & Binders',
    price: 750,
    currency: 'DZD',
    supplierId: 'sup-008',
    supplierName: 'SCIMAT Algérie',
    tags: ['cement', 'construction', 'high-strength', 'en-197', 'building-materials'],
    specifications: { type: 'CEM I 52.5N', weight: '50kg', standard: 'EN 197-1', strength: '52.5 MPa' },
    rating: 4.2,
    reviewCount: 567,
    minOrderQuantity: 200,
    leadTimeDays: 2,
    origin: '16-Algiers',
  },
];

const MOCK_SUPPLIERS: SupplierProfile[] = [
  {
    id: 'sup-001',
    companyName: 'Algeria Steel Industries',
    categories: ['Metal Products', 'Steel Pipes', 'Construction Materials'],
    products: [MOCK_PRODUCTS[0]],
    location: { wilayaCode: 16, wilayaName: 'Algiers' },
    rating: 4.7,
    responseTime: 4,
    fulfillmentRate: 0.96,
    yearsInBusiness: 15,
    certifications: ['ISO 9001', 'API Q1'],
    minOrderValue: 100000,
    paymentTerms: ['LC', 'TT', '30 days'],
    verified: true,
  },
  {
    id: 'sup-002',
    companyName: 'Biskra Dates Cooperative',
    categories: ['Agriculture & Food', 'Dates & Dried Fruits', 'Organic Products'],
    products: [MOCK_PRODUCTS[1]],
    location: { wilayaCode: 7, wilayaName: 'Biskra' },
    rating: 4.9,
    responseTime: 2,
    fulfillmentRate: 0.98,
    yearsInBusiness: 25,
    certifications: ['Organic EU', 'HACCP', 'ISO 22000'],
    minOrderValue: 25000,
    paymentTerms: ['TT', 'COD', '15 days'],
    verified: true,
  },
  {
    id: 'sup-003',
    companyName: 'TechnoMach Algeria',
    categories: ['Machinery & Equipment', 'CNC Machines', 'Industrial Automation'],
    products: [MOCK_PRODUCTS[2]],
    location: { wilayaCode: 16, wilayaName: 'Algiers' },
    rating: 4.5,
    responseTime: 8,
    fulfillmentRate: 0.92,
    yearsInBusiness: 8,
    certifications: ['ISO 9001', 'CE Marking'],
    minOrderValue: 500000,
    paymentTerms: ['LC', '50% advance'],
    verified: true,
  },
  {
    id: 'sup-004',
    companyName: 'Setif Textile Mills',
    categories: ['Textiles & Apparel', 'Cotton Fabrics', 'Wholesale Textiles'],
    products: [MOCK_PRODUCTS[3]],
    location: { wilayaCode: 29, wilayaName: 'Setif' },
    rating: 4.3,
    responseTime: 6,
    fulfillmentRate: 0.94,
    yearsInBusiness: 12,
    certifications: ['OEKO-TEX', 'ISO 9001'],
    minOrderValue: 50000,
    paymentTerms: ['TT', '30 days', 'LC'],
    verified: true,
  },
  {
    id: 'sup-005',
    companyName: 'SolarTech Solutions',
    categories: ['Energy & Fuel', 'Solar Energy', 'Renewable Energy'],
    products: [MOCK_PRODUCTS[4]],
    location: { wilayaCode: 16, wilayaName: 'Algiers' },
    rating: 4.6,
    responseTime: 5,
    fulfillmentRate: 0.95,
    yearsInBusiness: 6,
    certifications: ['TÜV Rheinland', 'ISO 9001'],
    minOrderValue: 75000,
    paymentTerms: ['40% advance', '60% on delivery', 'LC'],
    verified: true,
  },
];

const MOCK_BUYER_PROFILES: BuyerProfile[] = [
  {
    id: 'buyer-001',
    companyName: 'Construction Plus SARL',
    segment: 'sme',
    industry: 'Construction',
    preferredCategories: ['Construction Materials', 'Metal Products', 'Tools'],
    priceRange: { min: 1000, max: 500000 },
    location: { wilayaCode: 16, wilayaName: 'Algiers' },
    orderHistory: [
      { productId: 'prod-008', quantity: 500, unitPrice: 750, totalValue: 375000, orderDate: new Date('2024-01-15'), supplierId: 'sup-008', satisfaction: 5 },
      { productId: 'prod-001', quantity: 25, unitPrice: 12500, totalValue: 312500, orderDate: new Date('2024-02-20'), supplierId: 'sup-001', satisfaction: 4 },
    ],
    browsingHistory: ['prod-008', 'prod-001', 'prod-007'],
    savedProducts: ['prod-008', 'prod-001'],
    rfqHistory: [],
    createdAt: new Date('2022-06-10'),
  },
  {
    id: 'buyer-002',
    companyName: 'FoodEx Import-Export',
    segment: 'enterprise',
    industry: 'Food & Beverage',
    preferredCategories: ['Agriculture & Food', 'Packaging & Printing'],
    priceRange: { min: 5000, max: 2000000 },
    location: { wilayaCode: 31, wilayaName: 'Oran' },
    orderHistory: [
      { productId: 'prod-002', quantity: 200, unitPrice: 4500, totalValue: 900000, orderDate: new Date('2024-03-01'), supplierId: 'sup-002', satisfaction: 5 },
    ],
    browsingHistory: ['prod-002', 'prod-004'],
    savedProducts: ['prod-002'],
    rfqHistory: [
      { id: 'rfq-001', title: 'Bulk Dates Purchase', category: 'Agriculture & Food', description: 'Looking for premium dates for export to EU', quantity: 10000, budget: 50000000, deadline: new Date('2024-06-01'), status: 'open', responsesReceived: 3 },
    ],
    createdAt: new Date('2019-03-15'),
  },
  {
    id: 'buyer-003',
    companyName: 'MedPharm Distribution',
    segment: 'enterprise',
    industry: 'Pharmaceuticals',
    preferredCategories: ['Chemicals', 'Pharmaceuticals', 'Packaging & Printing'],
    priceRange: { min: 10000, max: 5000000 },
    location: { wilayaCode: 43, wilayaName: 'Constantine' },
    orderHistory: [
      { productId: 'prod-006', quantity: 20, unitPrice: 12500, totalValue: 250000, orderDate: new Date('2024-02-10'), supplierId: 'sup-006', satisfaction: 5 },
    ],
    browsingHistory: ['prod-006', 'prod-003'],
    savedProducts: ['prod-006'],
    rfqHistory: [],
    createdAt: new Date('2020-09-01'),
  },
];

// ============================================================================
// Collaborative Filtering for B2B
// ============================================================================

/**
 * Item-based collaborative filtering adapted for B2B context
 * Finds similar buyers and recommends products they purchased
 */
export function collaborativeFilteringRecommendations(
  targetBuyerId: string,
  allBuyers: BuyerProfile[],
  allProducts: Product[],
  topN: number = 10
): RecommendationResult[] {
  const targetBuyer = allBuyers.find(b => b.id === targetBuyerId);
  if (!targetBuyer) {
    throw new Error(`Buyer ${targetBuyerId} not found`);
  }
  
  const recommendations: RecommendationResult[] = [];
  
  // Calculate buyer similarity scores
  const buyerSimilarities: Array<{ buyer: BuyerProfile; similarity: number }> = [];
  
  for (const buyer of allBuyers) {
    if (buyer.id === targetBuyerId) continue;
    
    let similarity = 0;
    
    // Category preference similarity
    const commonCategories = targetBuyer.preferredCategories.filter(c =>
      buyer.preferredCategories.includes(c)
    );
    similarity += (commonCategories.length / Math.max(targetBuyer.preferredCategories.length, 1)) * 0.35;
    
    // Segment similarity
    if (buyer.segment === targetBuyer.segment) similarity += 0.15;
    
    // Industry similarity
    if (buyer.industry === targetBuyer.industry) similarity += 0.15;
    
    // Location proximity (same or neighboring region)
    if (Math.abs(buyer.location.wilayaCode - targetBuyer.location.wilayaCode) <= 5) {
      similarity += 0.1;
    }
    
    // Price range overlap
    const priceOverlap = Math.min(targetBuyer.priceRange.max, buyer.priceRange.max) -
                        Math.max(targetBuyer.priceRange.min, buyer.priceRange.min);
    if (priceOverlap > 0) {
      similarity += 0.1 * Math.min(1, priceOverlap / targetBuyer.priceRange.max);
    }
    
    // Order history overlap
    const orderedProductIds = targetBuyer.orderHistory.map(o => o.productId);
    const theirOrderedIds = buyer.orderHistory.map(o => o.productId);
    const commonOrders = orderedProductIds.filter(id => theirOrderedIds.includes(id));
    if (commonOrders.length > 0) {
      similarity += 0.15 * (commonOrders.length / Math.max(orderedProductIds.length, 1));
    }
    
    buyerSimilarities.push({ buyer, similarity });
  }
  
  // Sort by similarity and get top similar buyers
  buyerSimilarities.sort((a, b) => b.similarity - a.similarity);
  const topSimilar = buyerSimilarities.slice(0, 5);
  
  // Collect products from similar buyers that target hasn't purchased
  const targetPurchasedIds = new Set(targetBuyer.orderHistory.map(o => o.productId));
  const targetSavedIds = new Set(targetBuyer.savedProducts);
  
  const candidateProducts = new Map<string, { product: Product; score: number; sources: string[] }>();
  
  for (const { buyer, similarity } of topSimilar) {
    for (const order of buyer.orderHistory) {
      if (targetPurchasedIds.has(order.productId)) continue;
      
      const product = allProducts.find(p => p.id === order.productId);
      if (!product) continue;
      
      const existing = candidateProducts.get(order.productId);
      const weightedScore = similarity * (order.satisfaction / 5);
      
      if (existing) {
        existing.score += weightedScore;
        existing.sources.push(buyer.companyName);
      } else {
        candidateProducts.set(order.productId, {
          product,
          score: weightedScore,
          sources: [buyer.companyName],
        });
      }
    }
  }
  
  // Convert to recommendation results
  for (const [productId, data] of candidateProducts) {
    recommendations.push({
      itemId: productId,
      itemType: 'product',
      score: Math.min(1, data.score),
      reason: `Popular among similar companies: ${data.sources.slice(0, 2).join(', ')}`,
      metadata: {
        productName: data.product.name,
        category: data.product.category,
        similarBuyers: data.sources.length,
      },
    });
  }
  
  return recommendations.sort((a, b) => b.score - a.score).slice(0, topN);
}

// ============================================================================
// Content-Based Product Matching
// ============================================================================

/**
 * Content-based filtering using product attributes and buyer preferences
 */
export function contentBasedRecommendations(
  buyerProfile: BuyerProfile,
  allProducts: Product[],
  topN: number = 10
): RecommendationResult[] {
  const recommendations: RecommendationResult[] = [];
  
  for (const product of allProducts) {
    // Skip already purchased/saved products
    const purchasedIds = new Set([
      ...buyerProfile.orderHistory.map(o => o.productId),
      ...buyerProfile.savedProducts,
    ]);
    if (purchasedIds.has(product.id)) continue;
    
    let score = 0;
    const reasons: string[] = [];
    
    // Category match
    if (buyerProfile.preferredCategories.includes(product.category)) {
      score += 0.35;
      reasons.push(`Matches your preferred category: ${product.category}`);
    } else if (buyerProfile.preferredCategories.some(pref =>
      product.category.includes(pref.split(' ')[0]) || pref.includes(product.category.split(' ')[0])
    )) {
      score += 0.15;
      reasons.push(`Related to your interests`);
    }
    
    // Price range fit
    if (product.price >= buyerProfile.priceRange.min && product.price <= buyerProfile.priceRange.max) {
      score += 0.2;
      reasons.push('Within your typical budget range');
    } else if (product.price < buyerProfile.priceRange.max * 1.2) {
      score += 0.05;
    }
    
    // Rating boost
    score += (product.rating / 5) * 0.15;
    if (product.rating >= 4.5) {
      reasons.push(`Highly rated (${product.rating}/5)`);
    }
    
    // Tag matching with browsing history
    const browsedProducts = allProducts.filter(p => 
      buyerProfile.browsingHistory.includes(p.id)
    );
    for (const browsed of browsedProducts) {
      const commonTags = product.tags.filter(t => browsed.tags.includes(t));
      if (commonTags.length > 0) {
        score += 0.05 * commonTags.length;
        reasons.push(`Similar to recently viewed items`);
        break;
      }
    }
    
    // Review count (social proof)
    if (product.reviewCount >= 100) {
      score += 0.05;
    }
    
    // Origin preference (local suppliers often preferred)
    if (product.origin && product.origin.includes(String(buyerProfile.location.wilayaCode))) {
      score += 0.1;
      reasons.push('Local supplier - faster delivery');
    }
    
    // Minimum score threshold
    if (score >= 0.2) {
      recommendations.push({
        itemId: product.id,
        itemType: 'product',
        score: Math.min(1, score),
        reason: reasons.slice(0, 2).join('; '),
        metadata: {
          productName: product.name,
          category: product.category,
          price: product.price,
          rating: product.rating,
          supplier: product.supplierName,
        },
      });
    }
  }
  
  return recommendations.sort((a, b) => b.score - a.score).slice(0, topN);
}

// ============================================================================
// Supplier-Buyer Compatibility Scoring
// ============================================================================

/**
 * Calculates compatibility score between a buyer and potential suppliers
 */
export function calculateSupplierCompatibility(
  buyerProfile: BuyerProfile,
  supplier: SupplierProfile
): SupplierMatch {
  const factors: MatchFactor[] = [];
  
  // Category match factor
  const categoryMatch = supplier.categories.some(scat =>
    buyerProfile.preferredCategories.some(bcat =>
      scat.toLowerCase().includes(bcat.toLowerCase()) ||
      bcat.toLowerCase().includes(scat.toLowerCase())
    )
  );
  const categoryScore = categoryMatch ? 9 : (supplier.categories.length > 3 ? 5 : 2);
  factors.push({
    category: 'category',
    score: categoryScore,
    weight: 0.25,
    description: categoryMatch ? 'Strong category alignment' : 'Limited category overlap',
  });
  
  // Location factor (proximity matters for logistics)
  const distance = Math.abs(supplier.location.wilayaCode - buyerProfile.location.wilayaCode);
  let locationScore: number;
  if (distance === 0) locationScore = 10;
  else if (distance <= 5) locationScore = 8;
  else if (distance <= 15) locationScore = 6;
  else if (distance <= 30) locationScore = 4;
  else locationScore = 2;
  
  factors.push({
    category: 'location',
    score: locationScore,
    weight: 0.15,
    description: distance === 0 ? 'Same wilaya' : `${distance} wilayas away`,
  });
  
  // Price alignment factor
  const canMeetMinOrder = buyerProfile.priceRange.max >= supplier.minOrderValue;
  const priceScore = canMeetMinOrder ? 8 : 3;
  factors.push({
    category: 'price',
    score: priceScore,
    weight: 0.2,
    description: canMeetMinOrder ? 'Meets minimum order requirements' : 'Minimum order may be high',
  });
  
  // Quality/reliability factor
  const qualityScore = Math.round(supplier.rating * 2); // Scale 0-10
  factors.push({
    category: 'quality',
    score: qualityScore,
    weight: 0.2,
    description: `Rating: ${supplier.rating}/5 with ${supplier.products.length} products`,
  });
  
  // Reliability factor
  const reliabilityScore = Math.round(supplier.fulfillmentRate * 10);
  factors.push({
    category: 'reliability',
    score: reliabilityScore,
    weight: 0.15,
    description: `${Math.round(supplier.fulfillmentRate * 100)}% fulfillment rate`,
  });
  
  // Experience factor
  const experienceScore = Math.min(10, supplier.yearsInBusiness);
  factors.push({
    category: 'experience',
    score: experienceScore,
    weight: 0.05,
    description: `${supplier.yearsInBusiness} years in business`,
  });
  
  // Calculate weighted compatibility score
  const compatibilityScore = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight * 10, 0)
  );
  
  // Determine price competitiveness based on market analysis
  const avgProductPrice = supplier.products.reduce((sum, p) => sum + p.price, 0) / supplier.products.length || 0;
  const priceCompetitiveness: SupplierMatch['priceCompetitiveness'] =
    avgProductPrice < buyerProfile.priceRange.median ? 'excellent' :
    avgProductPrice < buyerProfile.priceRange.max * 0.8 ? 'good' :
    avgProductPrice < buyerProfile.priceRange.max ? 'fair' : 'poor';
  
  // Generate recommended actions
  const actions: string[] = [];
  if (!supplier.verified) {
    actions.push('Request verification documents before ordering');
  }
  if (responseTime > 24) {
    actions.push('Consider expedited shipping options');
  }
  if (compatibilityScore >= 80) {
    actions.push('Strong match - consider establishing partnership');
  }
  if (categoryMatch && canMeetMinOrder) {
    actions.push('Send inquiry about bulk pricing');
  }
  if (actions.length === 0) {
    actions.push('Review product catalog for specific needs');
  }
  
  return {
    supplier,
    compatibilityScore: Math.max(0, Math.min(100, compatibilityScore)),
    matchFactors: factors,
    recommendedActions: actions.slice(0, 3),
    estimatedResponseTime: supplier.responseTime,
    priceCompetitiveness,
  };
}

/**
 * Find best matching suppliers for a buyer
 */
export function findBestSuppliers(
  buyerProfile: BuyerProfile,
  suppliers: SupplierProfile[],
  topN: number = 5
): SupplierMatch[] {
  const matches = suppliers.map(supplier => 
    calculateSupplierCompatibility(buyerProfile, supplier)
  );
  
  return matches
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, topN);
}

// ============================================================================
// RFQ Auto-Matching
// ============================================================================

/**
 * Automatically matches RFQs with suitable suppliers
 */
export function autoMatchRFQ(
  rfq: RFQRecord,
  suppliers: SupplierProfile[]
): RFQMatch {
  const matchedSuppliers: RFQMatch['matchedSuppliers'] = [];
  
  for (const supplier of suppliers) {
    // Check category match
    const categoryMatch = supplier.categories.some(cat =>
      cat.toLowerCase().includes(rfq.category.toLowerCase()) ||
      rfq.category.toLowerCase().includes(cat.toLowerCase())
    );
    
    if (!categoryMatch) continue;
    
    // Calculate match score
    let matchScore = 0;
    const reasons: string[] = [];
    
    // Base category match
    matchScore += 40;
    reasons.push('Category expertise matches RFQ requirements');
    
    // Check if supplier has relevant products
    const relevantProducts = supplier.products.filter(p =>
      p.category === rfq.category ||
      p.subcategory?.toLowerCase().includes(rfq.description.toLowerCase()) ||
      p.tags.some(t => rfq.description.toLowerCase().includes(t.toLowerCase()))
    );
    
    if (relevantProducts.length > 0) {
      matchScore += 25;
      reasons.push(`${relevantProducts.length} relevant products available`);
    }
    
    // Location advantage
    // Assuming RFQ is from same region as buyer would be
    if (supplier.location.wilayaCode !== undefined) {
      matchScore += 10;
      reasons.push('Strategic location for delivery');
    }
    
    // Reliability bonus
    if (supplier.fulfillmentRate >= 0.95) {
      matchScore += 10;
      reasons.push('Excellent fulfillment record');
    }
    
    // Verification status
    if (supplier.verified) {
      matchScore += 10;
      reasons.push('Verified supplier');
    }
    
    // Response time consideration
    if (supplier.responseTime <= 4) {
      matchScore += 5;
      reasons.push('Fast response time');
    }
    
    // Budget consideration
    if (rfq.budget && supplier.minOrderValue <= rfq.budget) {
      // Suggest competitive pricing
      const suggestedPrice = rfq.budget / rfq.quantity * (0.85 + Math.random() * 0.15);
      
      matchedSuppliers.push({
        supplier,
        matchScore: Math.min(100, matchScore),
        confidence: Math.min(1, matchScore / 80),
        suggestedPrice: Math.round(suggestedPrice),
        reasons,
      });
    } else {
      matchedSuppliers.push({
        supplier,
        matchScore: Math.min(100, matchScore),
        confidence: Math.min(1, matchScore / 80),
        reasons,
      });
    }
  }
  
  // Sort by match score
  matchedSuppliers.sort((a, b) => b.matchScore - a.matchScore);
  
  return {
    rfq,
    matchedSuppliers,
  };
}

/**
 * Process multiple RFQs for auto-matching
 */
export function batchRFQMatching(
  rfqs: RFQRecord[],
  suppliers: SupplierProfile[]
): RFQMatch[] {
  return rfqs.map(rfq => autoMatchRFQ(rfq, suppliers));
}

// ============================================================================
// Dynamic Pricing Suggestions
// ============================================================================

/**
 * Generates dynamic pricing suggestions based on market conditions
 */
export function generatePricingSuggestion(
  product: Product,
  marketData: {
    competitorPrices: Array<{ supplierId: string; price: number }>;
    demandTrend: 'increasing' | 'stable' | 'decreasing';
    seasonalityFactor: number;
    inventoryLevel: 'low' | 'optimal' | 'high';
    daysListed: number;
  }
): PricingSuggestion {
  const { competitorPrices, demandTrend, seasonalityFactor, inventoryLevel, daysListed } = marketData;
  
  // Analyze competitor prices
  const prices = competitorPrices.map(cp => cp.price);
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : product.price;
  const minPrice = prices.length > 0 ? Math.min(...prices) : product.price * 0.9;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : product.price * 1.1;
  
  // Determine current position
  let position: PricingSuggestion['competitorContext']['position'];
  if (product.price <= minPrice) position = 'lowest';
  else if (product.price >= maxPrice) position = 'highest';
  else if (product.price <= avgPrice * 1.05) position = 'competitive';
  else position = 'premium';
  
  // Calculate suggested price
  let suggestedPrice = product.price;
  let reasoning: string[] = [];
  
  // Demand trend impact
  if (demandTrend === 'increasing') {
    suggestedPrice *= 1.03 + Math.random() * 0.04; // 3-7% increase
    reasoning.push('High demand allows for price increase');
  } else if (demandTrend === 'decreasing') {
    suggestedPrice *= 0.95 + Math.random() * 0.03; // 2-5% decrease
    reasoning.push('Market softening suggests competitive pricing');
  }
  
  // Seasonality impact
  if (seasonalityFactor > 1.2) {
    suggestedPrice *= 1.05;
    reasoning.push('Peak season - premium pricing appropriate');
  } else if (seasonalityFactor < 0.8) {
    suggestedPrice *= 0.95;
    reasoning.push('Off-season discount recommended');
  }
  
  // Inventory impact
  if (inventoryLevel === 'high') {
    suggestedPrice *= 0.92 + Math.random() * 0.05; // 5-13% discount
    reasoning.push('High inventory - consider promotion');
  } else if (inventoryLevel === 'low') {
    suggestedPrice *= 1.02 + Math.random() * 0.03; // 2-5% increase
    reasoning.push('Low stock - maintain or increase price');
  }
  
  // Listing age impact
  if (daysListed > 90) {
    suggestedPrice *= 0.95;
    reasoning.push('Long listing period - refresh pricing');
  }
  
  // Competitor positioning
  if (position === 'highest' && demandTrend !== 'increasing') {
    suggestedPrice = Math.min(suggestedPrice, avgPrice * 1.08);
    reasoning.push('Adjust toward market average');
  } else if (position === 'lowest' && demandTrend === 'increasing') {
    suggestedPrice = Math.max(suggestedPrice, avgPrice * 0.97);
    reasoning.push('Room for price increase while remaining competitive');
  }
  
  // Ensure minimum margin (assume 40% cost base)
  const minViablePrice = product.price * 0.5;
  suggestedPrice = Math.max(minViablePrice, suggestedPrice);
  
  // Round to reasonable value
  suggestedPrice = Math.round(suggestedPrice / 100) * 100;
  
  // Calculate impacts
  const adjustmentPercent = ((suggestedPrice - product.price) / product.price) * 100;
  
  // Demand elasticity approximation
  const elasticity = -1.2; // Typical for B2B
  const demandChange = elasticity * (adjustmentPercent / 100) * 100;
  const revenueChange = (1 + demandChange / 100) * (1 + adjustmentPercent / 100) - 1;
  
  // Margin impact (simplified)
  const currentMargin = 0.4; // Assume 40%
  const newMargin = currentMargin * (suggestedPrice / product.price);
  const marginImpact = (newMargin - currentMargin) * 100;
  
  // Determine urgency
  let urgency: PricingSuggestion['urgency'];
  if (Math.abs(adjustmentPercent) > 15 || inventoryLevel === 'high') {
    urgency = 'immediate';
  } else if (Math.abs(adjustmentPercent) > 5 || daysListed > 60) {
    urgency = 'soon';
  } else {
    urgency = 'monitor';
  }
  
  return {
    productId: product.id,
    currentPrice: product.price,
    suggestedPrice,
    adjustmentPercent: Math.round(adjustmentPercent * 10) / 10,
    reasoning: reasoning.join('. ') + '.',
    expectedImpact: {
      demandChange: Math.round(demandChange * 10) / 10,
      revenueChange: Math.round(revenueChange * 1000) / 10,
      marginImpact: Math.round(marginImpact * 10) / 10,
    },
    competitorContext: {
      avgPrice: Math.round(avgPrice),
      minPrice: Math.round(minPrice),
      maxPrice: Math.round(maxPrice),
      position,
    },
    urgency,
  };
}

/**
 * Batch generate pricing suggestions
 */
export function batchPricingSuggestions(
  products: Product[],
  marketDataProvider: (product: Product) => ReturnType<typeof generatePricingSuggestion> extends infer R ? R : never
): PricingSuggestion[] {
  return products.map(product => {
    // Generate mock market data for each product
    const mockMarketData = {
      competitorPrices: Array.from({ length: Math.floor(Math.random() * 8) + 2 }, () => ({
        supplierId: `sup-${Math.floor(Math.random() * 100)}`,
        price: product.price * (0.85 + Math.random() * 0.3),
      })),
      demandTrend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)] as 'increasing' | 'stable' | 'decreasing',
      seasonalityFactor: 0.8 + Math.random() * 0.6,
      inventoryLevel: ['low', 'optimal', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'optimal' | 'high',
      daysListed: Math.floor(Math.random() * 180),
    };
    
    return generatePricingSuggestion(product, mockMarketData);
  });
}

// ============================================================================
// Hybrid Recommendation Engine
// ============================================================================

/**
 * Combines collaborative and content-based approaches for better recommendations
 */
export function getHybridRecommendations(
  buyerId: string,
  buyers: BuyerProfile[],
  products: Product[],
  options: { collaborativeWeight?: number; contentWeight?: number; topN?: number } = {}
): RecommendationResult[] {
  const {
    collaborativeWeight = 0.4,
    contentWeight = 0.6,
    topN = 10,
  } = options;
  
  const buyer = buyers.find(b => b.id === buyerId);
  if (!buyer) throw new Error(`Buyer ${buyerId} not found`);
  
  // Get both types of recommendations
  const collabRecs = collaborativeFilteringRecommendations(buyerId, buyers, products, topN * 2);
  const contentRecs = contentBasedRecommendations(buyer, products, topN * 2);
  
  // Combine scores
  const combinedScores = new Map<string, { score: number; rec: RecommendationResult }>();
  
  for (const rec of collabRecs) {
    combinedScores.set(rec.itemId, {
      score: rec.score * collaborativeWeight,
      rec,
    });
  }
  
  for (const rec of contentRecs) {
    const existing = combinedScores.get(rec.itemId);
    if (existing) {
      existing.score += rec.score * contentWeight;
      existing.rec.reason = `${existing.rec.reason}; Also: ${rec.reason}`;
    } else {
      combinedScores.set(rec.itemId, {
        score: rec.score * contentWeight,
        rec,
      });
    }
  }
  
  // Sort and return top N
  return Array.from(combinedScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ score, rec }) => ({
      ...rec,
      score: Math.min(1, score),
    }));
}

// ============================================================================
// Export convenience functions
// ============================================================================

/**
 * Get complete recommendation package for a buyer
 */
export function getCompleteRecommendationPackage(
  buyerId: string
): {
  productRecommendations: RecommendationResult[];
  supplierMatches: SupplierMatch[];
  rfqMatches: RFQMatch[];
  pricingSuggestions: PricingSuggestion[];
} {
  const buyer = MOCK_BUYER_PROFILES.find(b => b.id === buyerId) || MOCK_BUYER_PROFILES[0];
  
  return {
    productRecommendations: getHybridRecommendations(buyer.id, MOCK_BUYER_PROFILES, MOCK_PRODUCTS),
    supplierMatches: findBestSuppliers(buyer, MOCK_SUPPLIERS),
    rfqMatches: buyer.rfqHistory.length > 0 
      ? batchRFQMatching(buyer.rfqHistory, MOCK_SUPPLIERS)
      : [],
    pricingSuggestions: batchPricingSuggestions(MOCK_PRODUCTS, () => null as never),
  };
}

// Export mock data for use in other modules
export { MOCK_PRODUCTS, MOCK_SUPPLIERS, MOCK_BUYER_PROFILES };
