// AI Negotiation Assistant
// مساعد التفاوض بالذكاء الاصطناعي
// Provides fairness analysis, win probability, and counter-offer suggestions

import ZAI from 'z-ai-web-dev-sdk';

// ============================================
// TYPES
// ============================================

export interface AIAnalysis {
  fairnessScore: number; // 0-100
  marketPosition: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET';
  suggestedCounterPrice?: number;
  winProbability: number; // 0-100%
  riskFactors: string[];
  strengths: string[];
  recommendations: string[];
  similarDeals: { price: number; outcome: string }[];
}

export interface CounterSuggestion {
  suggestedPrice: number;
  suggestedQuantity?: number;
  suggestedDeliveryDays?: number;
  confidence: number; // 0-100
  reasoning: string;
  reasoningAr: string;
  reasoningFr: string;
  expectedOutcome: 'ACCEPTED' | 'COUNTERED' | 'REJECTED';
}

export interface NegotiationOfferForAnalysis {
  id: string;
  negotiationId: string;
  offerNumber: number;
  fromRole: 'BUYER' | 'SELLER';
  fromUserId: string;
  toUserId: string;
  type: string;
  originalPrice?: number;
  offeredPrice?: number;
  quantity?: number;
  deliveryDays?: number;
  paymentTerms?: string;
  specifications?: Record<string, any>;
  notes?: string;
  validUntil: Date;
  status: string;
  createdAt: Date;
}

export interface NegotiationForAnalysis {
  id: string;
  negotiationNumber: string;
  buyerId: string;
  sellerId: string;
  type: string;
  status: string;
  totalOffers: number;
  counterOffers: number;
  offers: NegotiationOfferForAnalysis[];
}

// ============================================
// MARKET DATA (Simulated for demo)
// ============================================

const MARKET_DATA: Record<string, { avgPrice: number; minPrice: number; maxPrice: number }> = {
  // Product category -> market price ranges (in DZD)
  default: { avgPrice: 100000, minPrice: 50000, maxPrice: 200000 },
  electronics: { avgPrice: 150000, minPrice: 80000, maxPrice: 300000 },
  textiles: { avgPrice: 50000, minPrice: 20000, maxPrice: 100000 },
  construction: { avgPrice: 500000, minPrice: 200000, maxPrice: 1000000 },
  food: { avgPrice: 30000, minPrice: 10000, maxPrice: 80000 },
};

const SIMILAR_DEALS = [
  { price: 95000, outcome: 'ACCEPTED' },
  { price: 105000, outcome: 'ACCEPTED' },
  { price: 88000, outcome: 'REJECTED' },
  { price: 110000, outcome: 'COUNTERED' },
  { price: 92000, outcome: 'ACCEPTED' },
  { price: 98000, outcome: 'ACCEPTED' },
];

// ============================================
// AI ANALYSIS FUNCTIONS
// ============================================

/**
 * Analyze offer fairness using AI
 * تحليل عدالة العرض باستخدام الذكاء الاصطناعي
 */
export async function analyzeOfferWithAI(offer: NegotiationOfferForAnalysis): Promise<AIAnalysis> {
  try {
    const zai = await ZAI.create();
    
    const prompt = `You are a B2B negotiation AI assistant for AlgeriaTrade.dz marketplace. 
Analyze this negotiation offer and provide detailed assessment in English.

OFFER DETAILS:
- Role: ${offer.fromRole} (Buyer or Seller)
- Type: ${offer.type}
- Original Price: ${offer.originalPrice ?? 'N/A'} DZD
- Offered Price: ${offer.offeredPrice ?? 'N/A'} DZD
- Quantity: ${offer.quantity ?? 'N/A'}
- Delivery Days: ${offer.deliveryDays ?? 'N/A'}
- Payment Terms: ${offer.paymentTerms ?? 'N/A'}
- Notes: ${offer.notes ?? 'N/A'}

Market Context (Algerian B2B):
- Average market price for similar products: ~100,000 DZD
- Typical discount range: 5-15% from listed price
- Standard payment terms: 30-60 days net
- Typical delivery: 7-21 days

Provide analysis as JSON:
{
  "fairnessScore": 0-100,
  "marketPosition": "BELOW_MARKET" | "AT_MARKET" | "ABOVE_MARKET",
  "suggestedCounterPrice": number or null,
  "winProbability": 0-100,
  "riskFactors": ["string"],
  "strengths": ["string"],
  "recommendations": ["string"]
}`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional B2B negotiation analyst. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const aiResult = JSON.parse(responseText);

    return {
      fairnessScore: Math.min(100, Math.max(0, aiResult.fairnessScore ?? 70)),
      marketPosition: aiResult.marketPosition ?? 'AT_MARKET',
      suggestedCounterPrice: aiResult.suggestedCounterPrice ?? undefined,
      winProbability: Math.min(100, Math.max(0, aiResult.winProbability ?? 60)),
      riskFactors: aiResult.riskFactors ?? [],
      strengths: aiResult.strengths ?? [],
      recommendations: aiResult.recommendations ?? [],
      similarDeals: SIMILAR_DEALS,
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    // Fallback to rule-based analysis
    return fallbackAnalysis(offer);
  }
}

/**
 * Generate counter-offer suggestion using AI
 * توليد اقتراح عرض مضاد باستخدام الذكاء الاصطناعي
 */
export async function generateCounterSuggestion(negotiation: NegotiationForAnalysis): Promise<CounterSuggestion> {
  try {
    const zai = await ZAI.create();
    
    const lastOffer = negotiation.offers[negotiation.offers.length - 1];
    const offerHistory = negotiation.offers.map(o => 
      `${o.fromRole}: ${o.offeredPrice ?? o.originalPrice} DZD`
    ).join(' → ');

    const prompt = `You are a B2B negotiation AI assistant for AlgeriaTrade.dz.
Generate an optimal counter-offer suggestion based on this negotiation history.

NEGOTIATION: ${negotiation.negotiationNumber}
Type: ${negotiation.type}
Total Offers: ${negotiation.totalOffers}
Counter Offers: ${negotiation.counterOffers}

OFFER HISTORY:
${offerHistory || 'Initial negotiation'}

LAST OFFER:
- From: ${lastOffer?.fromRole}
- Original Price: ${lastOffer?.originalPrice ?? 'N/A'} DZD
- Offered Price: ${lastOffer?.offeredPrice ?? 'N/A'} DZD

Provide suggestion as JSON:
{
  "suggestedPrice": number,
  "confidence": 0-100,
  "reasoning": "English explanation",
  "reasoningAr": "الشرح بالعربية",
  "reasoningFr": "Explication en français",
  "expectedOutcome": "ACCEPTED" | "COUNTERED" | "REJECTED"
}`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional B2B negotiation strategist. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 800,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const aiResult = JSON.parse(responseText);

    return {
      suggestedPrice: aiResult.suggestedPrice ?? (lastOffer?.offeredPrice ?? 100000),
      suggestedQuantity: lastOffer?.quantity,
      suggestedDeliveryDays: lastOffer?.deliveryDays,
      confidence: Math.min(100, Math.max(0, aiResult.confidence ?? 70)),
      reasoning: aiResult.reasoning ?? 'Based on market analysis and negotiation patterns.',
      reasoningAr: aiResult.reasoningAr ?? 'بناءً على تحليل السوق وأنماط التفاوض.',
      reasoningFr: aiResult.reasoningFr ?? "Basé sur l'analyse du marché et les modèles de négociation.",
      expectedOutcome: aiResult.expectedOutcome ?? 'COUNTERED',
    };
  } catch (error) {
    console.error('AI suggestion error:', error);
    return fallbackSuggestion(negotiation);
  }
}

/**
 * Get negotiation tips based on current state
 * الحصول على نصائح التفاوض بناءً على الحالة الحالية
 */
export async function getNegotiationTips(
  negotiation: NegotiationForAnalysis,
  userRole: 'BUYER' | 'SELLER'
): Promise<string[]> {
  try {
    const zai = await ZAI.create();
    
    const lastOffer = negotiation.offers[negotiation.offers.length - 1];
    
    const prompt = `Provide 3-5 brief negotiation tips for a ${userRole} in this B2B situation:

Current State:
- Negotiation Type: ${negotiation.type}
- Your Role: ${userRole}
- Current Offer From: ${lastOffer?.fromRole}
- Current Price: ${lastOffer?.offeredPrice ?? lastOffer?.originalPrice} DZD
- Round: ${negotiation.totalOffers} offers so far

Respond with a JSON array of strings only, no other text.`;

    const completion = await zai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content || '[]';
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Negotiation tips error:', error);
    return getDefaultTips(userRole);
  }
}

/**
 * Assess deal risk factors
 * تقييم عوامل مخاطر الصفقة
 */
export async function assessDealRisk(offer: NegotiationOfferForAnalysis): Promise<{
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: { name: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; description: string }[];
}> {
  const factors: { name: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; description: string }[] = [];

  // Price risk assessment
  if (offer.offeredPrice && offer.originalPrice) {
    const discountPercent = ((offer.originalPrice - offer.offeredPrice) / offer.originalPrice) * 100;
    
    if (discountPercent > 30) {
      factors.push({
        name: 'Deep Discount',
        severity: 'HIGH',
        description: `Discount of ${discountPercent.toFixed(1)}% is significantly above market average`,
      });
    } else if (discountPercent > 20) {
      factors.push({
        name: 'High Discount',
        severity: 'MEDIUM',
        description: `Discount of ${discountPercent.toFixed(1)}% is above typical range`,
      });
    }
  }

  // Delivery risk
  if (offer.deliveryDays && offer.deliveryDays < 3) {
    factors.push({
      name: 'Tight Delivery',
      severity: 'MEDIUM',
      description: `${offer.deliveryDays} days delivery may be challenging`,
    });
  }

  // Payment terms risk
  if (offer.paymentTerms) {
    const daysMatch = offer.paymentTerms.match(/(\d+)\s*(day|jours|jour)/i);
    if (daysMatch && parseInt(daysMatch[1]) > 90) {
      factors.push({
        name: 'Extended Payment Terms',
        severity: 'MEDIUM',
        description: 'Payment terms exceed 90 days, increasing credit risk',
      });
    }
  }

  // Determine overall risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  const highCount = factors.filter(f => f.severity === 'HIGH').length;
  
  if (highCount >= 2) {
    riskLevel = 'CRITICAL';
  } else if (highCount >= 1 || factors.length >= 3) {
    riskLevel = 'HIGH';
  } else if (factors.length >= 1) {
    riskLevel = 'MEDIUM';
  }

  return { riskLevel, factors };
}

// ============================================
// FALLBACK FUNCTIONS (Rule-based)
// ============================================

function fallbackAnalysis(offer: NegotiationOfferForAnalysis): AIAnalysis {
  let fairnessScore = 70;
  let marketPosition: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET' = 'AT_MARKET';
  let suggestedCounterPrice: number | undefined;
  let winProbability = 60;

  const marketData = MARKET_DATA.default;

  if (offer.offeredPrice && offer.originalPrice) {
    const discountPercent = ((offer.originalPrice - offer.offeredPrice) / offer.originalPrice) * 100;
    
    if (discountPercent < 10) {
      fairnessScore = 85;
      marketPosition = 'ABOVE_MARKET';
      winProbability = 80;
    } else if (discountPercent <= 20) {
      fairnessScore = 75;
      marketPosition = 'AT_MARKET';
      winProbability = 65;
    } else if (discountPercent <= 30) {
      fairnessScore = 55;
      marketPosition = 'BELOW_MARKET';
      winProbability = 45;
      suggestedCounterPrice = offer.originalPrice * 0.88;
    } else {
      fairnessScore = 35;
      marketPosition = 'BELOW_MARKET';
      winProbability = 25;
      suggestedCounterPrice = offer.originalPrice * 0.92;
    }
  }

  return {
    fairnessScore,
    marketPosition,
    suggestedCounterPrice,
    winProbability,
    riskFactors: fairnessScore < 50 ? ['Price significantly below market average'] : [],
    strengths: fairnessScore > 70 ? ['Competitive pricing', 'Reasonable terms'] : ['Room for negotiation'],
    recommendations: fairnessScore < 50 
      ? ['Consider adjusting price closer to market rate']
      : ['Offer appears fair and likely to be accepted'],
    similarDeals: SIMILAR_DEALS,
  };
}

function fallbackSuggestion(negotiation: NegotiationForAnalysis): CounterSuggestion {
  const lastOffer = negotiation.offers[negotiation.offers.length - 1];
  const currentPrice = lastOffer?.offeredPrice ?? lastOffer?.originalPrice ?? 100000;
  
  // Suggest a middle ground (5% improvement from last offer)
  const suggestedPrice = currentPrice * 1.05;

  return {
    suggestedPrice: Math.round(suggestedPrice),
    suggestedQuantity: lastOffer?.quantity,
    suggestedDeliveryDays: lastOffer?.deliveryDays,
    confidence: 65,
    reasoning: 'Based on typical negotiation patterns, a 5% counter is well-positioned.',
    reasoningAr: 'بناءً على أنماط التفاوض النموذجية، العداد بنسبة 5٪ موضع جيد.',
    reasoningFr: "Basé sur les modèles de négociation typiques, un contre de 5% est bien positionné.",
    expectedOutcome: 'COUNTERED',
  };
}

function getDefaultTips(role: 'BUYER' | 'SELLER'): string[] {
  if (role === 'BUYER') {
    return [
      'Research market prices before making offers',
      'Start with a reasonable but negotiable offer',
      'Consider total value, not just price',
      'Build rapport with the supplier',
      'Be prepared to compromise on non-price terms',
    ];
  }
  return [
      'Know your minimum acceptable price',
      'Highlight your product\'s unique value',
      'Offer flexible payment terms as alternative',
      'Respond promptly to maintain momentum',
      'Document all agreements clearly',
    ];
}
