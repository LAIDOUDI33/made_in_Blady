// AI Recommendations Module - Public API
export { recommendationEngine, RecommendationEngine } from './engine';
export { interactionTracker, InteractionTracker } from './tracker';
export {
  collaborativeFiltering,
  contentBasedFiltering,
  getTrendingItems,
  getPopularItems,
  getColdStartRecommendations,
  getContextualRecommendations,
  buildUserPreferenceProfile,
} from './algorithms';
export type {
  RecommendationInput,
  RecommendationResult,
  RecommendationSource,
  InteractionEvent,
  UserPreferenceProfile,
  TrendingItem,
  ProductRecommendationData,
  SupplierRecommendationData,
  CategoryRecommendationData,
  RecommendationConfig,
  RecommendationFeedback,
} from './types';

export { DEFAULT_RECOMMENDATION_CONFIG } from './types';
