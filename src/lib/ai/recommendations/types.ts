// AI Recommendation System Types

export interface RecommendationInput {
  userId?: string;
  type: 'products' | 'suppliers' | 'categories';
  limit?: number;
  context?: 'homepage' | 'product_detail' | 'category' | 'search' | 'cart' | 'checkout';
  itemId?: string; // Current item being viewed (for similar items)
  categoryId?: string; // Current category context
}

export interface RecommendationResult {
  id: string;
  itemId: string;
  type: 'product' | 'supplier' | 'category';
  score: number;
  reason: string;
  source: RecommendationSource;
  item?: ProductRecommendationData | SupplierRecommendationData | CategoryRecommendationData;
}

export interface ProductRecommendationData {
  id: string;
  name: string;
  slug: string;
  price?: number;
  priceRangeMin?: number;
  priceRangeMax?: number;
  currency: string;
  image?: string;
  companyName: string;
  companySlug: string;
  category: string;
  categorySlug: string;
  isVerified: boolean;
  rating?: number;
  viewCount?: number;
  moq?: string;
}

export interface SupplierRecommendationData {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  wilaya: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  responseRate: number;
  productCount: number;
  categories: string[];
  matchPercentage?: number;
}

export interface CategoryRecommendationData {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  productCount: number;
}

export type RecommendationSource = 
  | 'collaborative_filtering'
  | 'content_based'
  | 'popular'
  | 'trending'
  | 'contextual'
  | 'cold_start'
  | 'hybrid';

export interface InteractionEvent {
  userId?: string;
  sessionId?: string;
  type: 'view' | 'search' | 'contact' | 'favorite' | 'rfq' | 'order' | 'click' | 'add_to_cart';
  productId?: string;
  categoryId?: string;
  companyId?: string;
  searchTerm?: string;
  referrer?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  position?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface UserPreferenceProfile {
  favoriteCategories: { id: string; name: string; weight: number }[];
  preferredPriceRange: { min: number; max: number };
  preferredSuppliers: string[];
  searchHistory: string[];
  viewedProducts: string[];
  favoriteProducts: string[];
  recentInteractions: InteractionEvent[];
}

export interface TrendingItem {
  itemId: string;
  itemType: 'product' | 'category' | 'supplier';
  currentScore: number;
  previousScore: number;
  changePercent: number;
  period: 'day' | 'week' | 'month';
}

export interface RecommendationConfig {
  // Algorithm weights (should sum to 1)
  weights: {
    collaborativeFiltering: number;
    contentBased: number;
    trending: number;
    popular: number;
  };
  
  // Limits
  maxRecommendations: number;
  minScoreThreshold: number;
  
  // Cold start settings
  coldStartDefaults: {
    defaultCategories: string[];
    featuredSupplierIds: string[];
  };
  
  // Time windows
  lookbackPeriods: {
    short: number; // hours - for trending
    medium: number; // days - for recent activity
    long: number; // days - for historical patterns
  };
  
  // Expiration
  recommendationTTL: number; // hours
  
  // A/B testing
  abTesting: {
    enabled: boolean;
    showToPercentage: number; // 0-100
  };
}

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  weights: {
    collaborativeFiltering: 0.3,
    contentBased: 0.35,
    trending: 0.2,
    popular: 0.15,
  },
  maxRecommendations: 20,
  minScoreThreshold: 0.1,
  coldStartDefaults: {
    defaultCategories: [],
    featuredSupplierIds: [],
  },
  lookbackPeriods: {
    short: 24, // 24 hours for trending
    medium: 7, // 7 days for recent activity
    long: 30, // 30 days for patterns
  },
  recommendationTTL: 24, // 24 hours
  abTesting: {
    enabled: false,
    showToPercentage: 100,
  },
};

// Feedback types
export interface RecommendationFeedback {
  recommendationId: string;
  userId?: string;
  action: 'clicked' | 'dismissed' | 'converted' | 'viewed';
  timestamp: Date;
}
