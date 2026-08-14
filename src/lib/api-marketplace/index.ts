// API Marketplace Module - Main Export File
// AlgeriaTrade.dz Developer Portal & API Management System

// Types
export type {
  ApiKey,
  ApiPermission,
  ApiEndpoint,
  ApiCategory,
  WebhookEvent,
  WebhookEventType,
  ApiUsageRecord,
  DeveloperApp,
  ApiPlan,
  ApiResponse,
} from './types';

export { API_PLANS, PERMISSION_DESCRIPTIONS } from './types';

// Key Manager
export { apiKeyManager, ApiKeyManager } from './keyManager';

// Rate Limiter
export {
  checkRateLimit,
  getRateLimitHeaders,
  createRateLimitResponse,
  getRateLimitStatus,
  resetRateLimit,
  getRateLimiterStats,
} from './rateLimiter';

// Documentation
export {
  API_ENDPOINTS,
  getEndpointsByCategory,
  getEndpointById,
  getCategories,
  generateOpenAPISpec,
  getOpenApiJsonString,
} from './documentation';
