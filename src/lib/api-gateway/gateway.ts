// API Gateway & Management System for AlgeriaTrade.dz
// Comprehensive API key generation, validation, rate limiting, and logging

import { randomBytes, createHash, createHmac } from 'crypto';
import { ApiKey, ApiPermission, WebhookEventType, ApiResponse } from '@/lib/api-marketplace/types';

// ============================================
// API KEY GENERATION & VALIDATION
// ============================================

export interface GeneratedApiKey {
  id: string;
  plainTextKey: string; // Only shown once!
  keyPrefix: string;
  name: string;
  permissions: ApiPermission[];
  createdAt: Date;
}

/**
 * Generate a secure API key with AlgeriaTrade prefix
 * Format: at_[base64url_encoded_32_bytes]
 */
export function generateApiKey(): { plainTextKey: string; hash: string; prefix: string } {
  const rawKey = randomBytes(32).toString('base64url');
  const plainTextKey = `at_${rawKey}`;
  const hash = hashApiKey(plainTextKey);
  const prefix = `${plainTextKey.substring(0, 8)}...`;
  
  return { plainTextKey, hash, prefix };
}

/**
 * Hash an API key for secure storage (SHA-256)
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate an API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^at_[A-Za-z0-9_-]{43}$/.test(key);
}

/**
 * Extract key metadata without revealing the actual key
 */
export function getKeyMetadata(keyPrefix: string): {
  prefix: string;
  algorithm: string;
  length: number;
} {
  return {
    prefix: keyPrefix,
    algorithm: 'SHA-256',
    length: 43, // base64url encoded 32 bytes
  };
}

// ============================================
// RATE LIMITING SYSTEM
// ============================================

interface RateLimitBucket {
  count: number;
  resetAt: number;
  lastRequest: number;
}

interface QuotaUsage {
  dailyCount: number;
  dailyReset: number;
  monthlyCount: number;
  monthlyReset: number;
}

// In-memory stores (use Redis in production)
const rateLimitBuckets = new Map<string, RateLimitBucket>();
const quotaUsage = new Map<string, QuotaUsage>();

// Plan-based limits (requests per minute)
const RATE_LIMITS: Record<string, number> = {
  free: 10,
  pro: 100,
  enterprise: 1000,
};

// Daily quota limits
const DAILY_QUOTAS: Record<string, number> = {
  free: 100,
  pro: 10000,
  enterprise: -1, // Unlimited
};

/**
 * Check and update rate limit for an API key
 */
export function checkRateLimit(
  apiKeyId: string,
  plan: string = 'free'
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  limit: number;
} {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute window
  const limit = RATE_LIMITS[plan] || RATE_LIMITS.free;
  
  const bucket = rateLimitBuckets.get(apiKeyId);
  
  // No existing bucket or expired - create new
  if (!bucket || bucket.resetAt < now) {
    rateLimitBuckets.set(apiKeyId, {
      count: 1,
      resetAt: now + windowMs,
      lastRequest: now,
    });
    
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
      limit,
    };
  }
  
  // Check if limit exceeded
  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: bucket.resetAt,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
      limit,
    };
  }
  
  // Increment and allow
  bucket.count++;
  bucket.lastRequest = now;
  
  return {
    allowed: true,
    remaining: limit - bucket.count,
    resetTime: bucket.resetAt,
    limit,
  };
}

/**
 * Check daily/monthly quota for an API key
 */
export function checkQuota(
  apiKeyId: string,
  plan: string = 'free'
): {
  allowed: boolean;
  dailyRemaining: number;
  monthlyRemaining: number;
  dailyReset: number;
  monthlyReset: number;
} {
  const now = Date.now();
  const dailyLimit = DAILY_QUOTAS[plan] || DAILY_QUOTAS.free;
  
  let usage = quotaUsage.get(apiKeyId);
  
  // Initialize or reset if needed
  if (!usage || usage.dailyReset < now) {
    usage = {
      dailyCount: 0,
      dailyReset: getEndOfDay(now),
      monthlyCount: usage?.monthlyCount ?? 0,
      monthlyReset: usage?.monthlyReset ?? getEndOfMonth(now),
    };
    quotaUsage.set(apiKeyId, usage);
  }
  
  if (usage.monthlyReset < now) {
    usage.monthlyCount = 0;
    usage.monthlyReset = getEndOfMonth(now);
  }
  
  // Unlimited for enterprise
  if (dailyLimit === -1) {
    return {
      allowed: true,
      dailyRemaining: -1,
      monthlyRemaining: -1,
      dailyReset: usage.dailyReset,
      monthlyReset: usage.monthlyReset,
    };
  }
  
  const allowed = usage.dailyCount < dailyLimit;
  
  if (allowed) {
    usage.dailyCount++;
  }
  
  return {
    allowed,
    dailyRemaining: Math.max(0, dailyLimit - usage.dailyCount),
    monthlyRemaining: -1, // Not enforcing monthly limits currently
    dailyReset: usage.dailyReset,
    monthlyReset: usage.monthlyReset,
  };
}

function getEndOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

function getEndOfMonth(timestamp: number): number {
  const date = new Date(timestamp);
  date.setMonth(date.getMonth() + 1, 0); // Last day of current month
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

// ============================================
// REQUEST/RESPONSE LOGGING
// ============================================

export interface ApiLogEntry {
  id: string;
  requestId: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  timestamp: Date;
  requestBodySize?: number;
  responseBodySize?: number;
  error?: string;
}

// In-memory log store (use database in production)
const requestLogs: ApiLogEntry[] = [];
const MAX_LOG_SIZE = 10000;

/**
 * Log an API request/response
 */
export function logApiRequest(entry: Omit<ApiLogEntry, 'id' | 'timestamp'>): void {
  const logEntry: ApiLogEntry = {
    ...entry,
    id: generateRequestId(),
    timestamp: new Date(),
  };
  
  requestLogs.unshift(logEntry);
  
  // Keep log size manageable
  if (requestLogs.length > MAX_LOG_SIZE) {
    requestLogs.splice(MAX_LOG_SIZE);
  }
}

/**
 * Get logs for an API key
 */
export function getApiLogs(
  apiKeyId: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    statusCode?: number;
    method?: string;
  } = {}
): { logs: ApiLogEntry[]; total: number } {
  let filtered = requestLogs.filter(log => log.apiKeyId === apiKeyId);
  
  if (options.startDate) {
    filtered = filtered.filter(log => log.timestamp >= options.startDate!);
  }
  
  if (options.endDate) {
    filtered = filtered.filter(log => log.timestamp <= options.endDate!);
  }
  
  if (options.statusCode) {
    filtered = filtered.filter(log => log.statusCode === options.statusCode);
  }
  
  if (options.method) {
    filtered = filtered.filter(log => log.method.toUpperCase() === options.method!.toUpperCase());
  }
  
  const total = filtered.length;
  const offset = options.offset || 0;
  const limit = options.limit || 50;
  
  return {
    logs: filtered.slice(offset, offset + limit),
    total,
  };
}

/**
 * Get aggregated stats from logs
 */
export function getLogStats(apiKeyId: string): {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  requestsByMethod: Record<string, number>;
  requestsByStatus: Record<string, number>;
  errorsByType: Record<string, number>;
} {
  const logs = requestLogs.filter(log => log.apiKeyId === apiKeyId);
  const totalRequests = logs.length;
  
  if (totalRequests === 0) {
    return {
      totalRequests: 0,
      successRate: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      requestsByMethod: {},
      requestsByStatus: {},
      errorsByType: {},
    };
  }
  
  const successes = logs.filter(l => l.statusCode < 400).length;
  const successRate = (successes / totalRequests) * 100;
  
  const responseTimes = logs.map(l => l.responseTime).sort((a, b) => a - b);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;
  const p95ResponseTime = responseTimes[p95Index] || 0;
  
  const requestsByMethod: Record<string, number> = {};
  const requestsByStatus: Record<string, number> = {};
  const errorsByType: Record<string, number> = {};
  
  logs.forEach(log => {
    requestsByMethod[log.method] = (requestsByMethod[log.method] || 0) + 1;
    const statusCategory = `${Math.floor(log.statusCode / 100)}xx`;
    requestsByStatus[statusCategory] = (requestsByStatus[statusCategory] || 0) + 1;
    
    if (log.error) {
      errorsByType[log.error] = (errorsByType[log.error] || 0) + 1;
    }
  });
  
  return {
    totalRequests,
    successRate: Math.round(successRate * 100) / 100,
    avgResponseTime: Math.round(avgResponseTime),
    p95ResponseTime: Math.round(p95ResponseTime),
    requestsByMethod,
    requestsByStatus,
    errorsByType,
  };
}

// ============================================
// API VERSIONING SYSTEM
// ============================================

export interface ApiVersion {
  version: string;
  status: 'deprecated' | 'stable' | 'beta' | 'legacy';
  releaseDate: Date;
  deprecationDate?: Date;
  sunsetDate?: Date;
  basePath: string;
  supportedFeatures: string[];
}

const API_VERSIONS: ApiVersion[] = [
  {
    version: 'v1',
    status: 'stable',
    releaseDate: new Date('2024-01-01'),
    basePath: '/api/v1',
    supportedFeatures: ['products', 'orders', 'rfqs', 'companies', 'search'],
  },
  {
    version: 'v2',
    status: 'stable',
    releaseDate: new Date('2024-06-01'),
    basePath: '/api/v2',
    supportedFeatures: ['products', 'orders', 'rfqs', 'companies', 'search', 'analytics', 'webhooks', 'payments'],
  },
  {
    version: 'v3',
    status: 'beta',
    releaseDate: new Date('2025-01-15'),
    basePath: '/api/v3',
    supportedFeatures: ['products', 'orders', 'rfqs', 'companies', 'search', 'analytics', 'webhooks', 'payments', 'ai', 'negotiations'],
  },
];

/**
 * Get all available API versions
 */
export function getApiVersions(): ApiVersion[] {
  return API_VERSIONS;
}

/**
 * Get specific version info
 */
export function getApiVersion(version: string): ApiVersion | undefined {
  return API_VERSIONS.find(v => v.version === version);
}

/**
 * Resolve API version from request
 */
export function resolveVersion(requestedVersion?: string): ApiVersion {
  if (!requestedVersion) {
    // Default to latest stable
    return API_VERSIONS.find(v => v.status === 'stable') || API_VERSIONS[0];
  }
  
  const version = API_VERSIONS.find(v => v.version === requestedVersion);
  
  if (!version) {
    throw new Error(`Unsupported API version: ${requestedVersion}`);
  }
  
  if (version.status === 'deprecated' || version.status === 'legacy') {
    console.warn(`Warning: Using ${version.status} API version ${version.version}`);
  }
  
  return version;
}

/**
 * Check if feature is supported in version
 */
export function isFeatureSupported(version: string, feature: string): boolean {
  const apiVersion = getApiVersion(version);
  return apiVersion?.supportedFeatures.includes(feature) || false;
}

// ============================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================

/**
 * Generate webhook signature for payload verification
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): { valid: boolean; age: number } {
  const elements = signature.split(',');
  let timestamp = 0;
  let expectedSignature = '';
  
  for (const element of elements) {
    const [key, value] = element.split('=');
    if (key === 't') {
      timestamp = parseInt(value, 10);
    } else if (key.startsWith('v')) {
      expectedSignature = value;
    }
  }
  
  // Check timestamp is within 5 minutes
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (Math.abs(age) > 300) {
    return { valid: false, age };
  }
  
  const signedPayload = `${timestamp}.${payload}`;
  const computedSignature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  // Constant-time comparison to prevent timing attacks
  const valid = timingSafeEqual(expectedSignature, computedSignature);
  
  return { valid, age };
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// ============================================
// REQUEST ID GENERATION
// ============================================

/**
 * Generate unique request ID for tracing
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = randomBytes(8).toString('hex');
  return `req_${timestamp}_${randomPart}`;
}

// ============================================
// STANDARD API RESPONSE HELPERS
// ============================================

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: Partial<ApiResponse<T>['meta']>
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      queriedAt: new Date().toISOString(),
      apiVersion: 'v2',
      requestId: generateRequestId(),
      ...meta,
    },
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 400
): Response {
  const body: ApiResponse = {
    success: false,
    error: message,
    code,
    meta: {
      queriedAt: new Date().toISOString(),
      apiVersion: 'v2',
      requestId: generateRequestId(),
    },
  };
  
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': body.meta.requestId,
    },
  });
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): ApiResponse<T[]> {
  return createSuccessResponse(data, {
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ============================================
// ALGERIATRADE API ENDPOINTS DEFINITION
// ============================================

export interface EndpointDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: { en: string; fr: string; ar: string };
  category: string;
  permissions: ApiPermission[];
  parameters: EndpointParameter[];
  requestSchema?: object;
  responseSchema?: object;
  examples: CodeExample[];
  deprecated?: boolean;
  deprecationNotice?: string;
}

export interface EndpointParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'body';
  required: boolean;
  type: string;
  description: { en: string; fr: string; ar: string };
  defaultValue?: string;
  enum?: string[];
}

export interface CodeExample {
  language: string;
  code: string;
  description: string;
}

/**
 * Complete AlgeriaTrade API endpoints catalog
 */
export const ALGERIATRADE_ENDPOINTS: EndpointDefinition[] = [
  // ==================== PRODUCTS ====================
  {
    path: '/products',
    method: 'GET',
    description: {
      en: 'List all products with filtering and pagination',
      fr: 'Lister tous les produits avec filtrage et pagination',
      ar: 'قائمة جميع المنتجات مع التصفية والترقيم'
    },
    category: 'Products',
    permissions: ['products:read'],
    parameters: [
      { name: 'page', in: 'query', required: false, type: 'integer', description: { en: 'Page number', fr: 'Numéro de page', ar: 'رقم الصفحة' }, defaultValue: '1' },
      { name: 'limit', in: 'query', required: false, type: 'integer', description: { en: 'Items per page', fr: 'Éléments par page', ar: 'العناصر لكل صفحة' }, defaultValue: '20' },
      { name: 'category', in: 'query', required: false, type: 'string', description: { en: 'Filter by category slug', fr: 'Filtrer par catégorie', ar: 'تصفية حسب الفئة' } },
      { name: 'wilaya', in: 'query', required: false, type: 'string', description: { en: 'Filter by wilaya code', fr: 'Filtrer par wilaya', ar: 'تصفية حسب الولاية' } },
      { name: 'search', in: 'query', required: false, type: 'string', description: { en: 'Search query', fr: 'Recherche', ar: 'استعلام البحث' } },
      { name: 'min_price', in: 'query', required: false, type: 'number', description: { en: 'Minimum price (DZD)', fr: 'Prix minimum (DZD)', ar: 'الحد الأدنى للسعر' } },
      { name: 'max_price', in: 'query', required: false, type: 'number', description: { en: 'Maximum price (DZD)', fr: 'Prix maximum (DZD)', ar: 'الحد الأقصى للسعر' } },
      { name: 'sort', in: 'query', required: false, type: 'string', description: { en: 'Sort field', fr: 'Tri par', ar: 'حقل الترتيب' }, enum: ['price_asc', 'price_desc', 'newest', 'popular'], defaultValue: 'newest' },
    ],
    examples: [
      {
        language: 'curl',
        code: `curl -X GET "https://api.algeriatrade.dz/v2/products?category=textile&wilaya=16&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"`,
        description: 'Get textile products from Bejaia'
      },
      {
        language: 'python',
        code: `import requests

response = requests.get(
    "https://api.algeriatrade.dz/v2/products",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    params={
        "category": "textile",
        "wilaya": "16",
        "limit": 10
    }
)

products = response.json()
for product in products["data"]:
    print(f"{product['name']}: {product['price']} DZD")`,
        description: 'Python example using requests'
      },
      {
        language: 'javascript',
        code: `const response = await fetch(
  'https://api.algeriatrade.dz/v2/products?category=textile&limit=10',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Accept': 'application/json'
    }
  }
);

const { data, meta } = await response.json();
console.log(\`Found \${meta.pagination.total} products\`);`,
        description: 'JavaScript/Node.js fetch example'
      },
      {
        language: 'php',
        code: `$client = new GuzzleHttp\\Client();

$response = $client->get('https://api.algeriatrade.dz/v2/products', [
    'headers' => [
        'Authorization' => 'Bearer YOUR_API_KEY',
        'Accept' => 'application/json'
    ],
    'query' => [
        'category' => 'textile',
        'wilaya' => '16',
        'limit' => 10
    ]
]);

$products = json_decode($response->getBody(), true);
foreach ($products['data'] as $product) {
    echo $product['name'] . ': ' . $product['price'] . " DZD\\n";
}`,
        description: 'PHP Guzzle example'
      }
    ],
    responseSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              nameAr: { type: 'string' },
              slug: { type: 'string' },
              price: { type: 'number' },
              currency: { type: 'string' },
              category: { type: 'string' },
              images: { type: 'array', items: { type: 'string' } },
              supplier: { 
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  verified: { type: 'boolean' }
                }
              }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            apiVersion: { type: 'string' },
            requestId: { type: 'string' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  },
  {
    path: '/products/{slug}',
    method: 'GET',
    description: {
      en: 'Get product details by slug',
      fr: 'Obtenir les détails d\'un produit par slug',
      ar: 'الحصول على تفاصيل المنتج حسب المعرف'
    },
    category: 'Products',
    permissions: ['products:read'],
    parameters: [
      { name: 'slug', in: 'path', required: true, type: 'string', description: { en: 'Product URL slug', fr: 'Slug du produit', ar: 'معرف المنتج في الرابط' } },
    ],
    examples: [
      {
        language: 'curl',
        code: `curl -X GET "https://api.algeriatrade.dz/v2/products/dates-fraiches-blida" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        description: 'Get specific product details'
      }
    ],
    responseSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            nameAr: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            currency: { type: 'string' },
            inStock: { type: 'boolean' },
            moq: { type: 'integer' },
            specifications: { type: 'object' },
            images: { type: 'array' },
            supplier: { type: 'object' },
            certifications: { type: 'array' }
          }
        }
      }
    }
  },
  {
    path: '/products',
    method: 'POST',
    description: {
      en: 'Create a new product listing',
      fr: 'Créer une nouvelle annonce produit',
      ar: 'إنشاء قائمة منتج جديدة'
    },
    category: 'Products',
    permissions: ['products:write'],
    parameters: [
      { name: 'body', in: 'body', required: true, type: 'object', description: { en: 'Product data', fr: 'Données du produit', ar: 'بيانات المنتج' } },
    ],
    requestSchema: {
      type: 'object',
      required: ['name', 'categoryId', 'price'],
      properties: {
        name: { type: 'string', maxLength: 200 },
        nameAr: { type: 'string' },
        categoryId: { type: 'string' },
        price: { type: 'number', minimum: 0 },
        currency: { type: 'string', enum: ['DZD', 'USD', 'EUR'] },
        description: { type: 'string' },
        moq: { type: 'integer', minimum: 1 },
        wilayaCode: { type: 'string' },
        images: { type: 'array', items: { type: 'string' } },
        specifications: { type: 'object' }
      }
    },
    examples: [
      {
        language: 'curl',
        code: `curl -X POST "https://api.algeriatrade.dz/v2/products" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Premium Dates Medjool",
    "nameAr": "تمر مجدول فاخر",
    "categoryId": "food-dry-fruits",
    "price": 1500,
    "moq": 10,
    "wilayaCode": "16",
    "description": "High quality Algerian dates"
  }'`,
        description: 'Create a new product'
      }
    ]
  },

  // ==================== ORDERS ====================
  {
    path: '/orders',
    method: 'GET',
    description: {
      en: 'List orders with filtering',
      fr: 'Lister les commandes avec filtres',
      ar: 'قائمة الطلبات مع التصفية'
    },
    category: 'Orders',
    permissions: ['orders:read'],
    parameters: [
      { name: 'status', in: 'query', required: false, type: 'string', enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], description: { en: 'Filter by status', fr: 'Filtrer par statut', ar: 'تصفية حسب الحالة' } },
      { name: 'date_from', in: 'query', required: false, type: 'string', format: 'date', description: { en: 'Start date', fr: 'Date de début', ar: 'تاريخ البداية' } },
      { name: 'date_to', in: 'query', required: false, type: 'string', format: 'date', description: { en: 'End date', fr: 'Date de fin', ar: 'تاريخ النهاية' } },
    ],
    examples: [
      {
        language: 'curl',
        code: `curl -X GET "https://api.algeriatrade.dz/v2/orders?status=shipped&page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        description: 'Get shipped orders'
      }
    ]
  },
  {
    path: '/orders/{id}',
    method: 'GET',
    description: {
      en: 'Get order details with timeline',
      fr: 'Obtenir les détails d\'une commande',
      ar: 'الحصول على تفاصيل الطلب'
    },
    category: 'Orders',
    permissions: ['orders:read'],
    parameters: [
      { name: 'id', in: 'path', required: true, type: 'string', description: { en: 'Order ID', fr: 'ID commande', ar: 'معرف الطلب' } },
    ]
  },
  {
    path: '/orders',
    method: 'POST',
    description: {
      en: 'Create a new order',
      fr: 'Créer une nouvelle commande',
      ar: 'إنشاء طلب جديد'
    },
    category: 'Orders',
    permissions: ['orders:write'],
    parameters: [
      { name: 'body', in: 'body', required: true, type: 'object', description: { en: 'Order data', fr: 'Données commande', ar: 'بيانات الطلب' } },
    ],
    requestSchema: {
      type: 'object',
      required: ['items', 'shippingAddress'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['productId', 'quantity'],
            properties: {
              productId: { type: 'string' },
              quantity: { type: 'integer', minimum: 1 },
              unitPrice: { type: 'number' }
            }
          }
        },
        shippingAddress: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            phone: { type: 'string' },
            wilaya: { type: 'string' },
            commune: { type: 'string' },
            address: { type: 'string' }
          }
        },
        paymentMethod: { type: 'string', enum: ['ccp', 'cib', 'baridimob', 'crypto', 'bank_transfer'] },
        notes: { type: 'string' }
      }
    }
  },

  // ==================== RFQS ====================
  {
    path: '/rfqs',
    method: 'GET',
    description: {
      en: 'List Request for Quotations',
      fr: 'Lister les Demandes de Devis',
      ar: 'قائمة طلبات عروض الأسعار'
    },
    category: 'RFQs',
    permissions: ['rfq:read'],
    parameters: [
      { name: 'category', in: 'query', required: false, type: 'string', description: { en: 'Filter by category', fr: 'Catégorie', ar: 'الفئة' } },
      { name: 'status', in: 'query', required: false, type: 'string', enum: ['open', 'closed', 'expired'], description: { en: 'RFQ status', fr: 'Statut DD', ar: 'حالة طلب عرض السعر' } },
    ]
  },
  {
    path: '/rfqs',
    method: 'POST',
    description: {
      en: 'Submit a new RFQ',
      fr: 'Soumettre une nouvelle demande de devis',
      ar: 'إرسال طلب عرض سعر جديد'
    },
    category: 'RFQs',
    permissions: ['rfq:write'],
    parameters: [
      { name: 'body', in: 'body', required: true, type: 'object', description: { en: 'RFQ data', fr: 'Données DD', ar: 'بيانات طلب عرض السعر' } },
    ],
    requestSchema: {
      type: 'object',
      required: ['title', 'description', 'categoryId', 'quantity', 'deadline'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        categoryId: { type: 'string' },
        quantity: { type: 'number' },
        unit: { type: 'string' },
        budget: { type: 'number' },
        deadline: { type: 'string', format: 'date' },
        deliveryWilaya: { type: 'string' },
        attachments: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  // ==================== COMPANIES ====================
  {
    path: '/companies',
    method: 'GET',
    description: {
      en: 'Search and list companies',
      fr: 'Rechercher et lister les entreprises',
      ar: 'البحث عن الشركات وقائمتها'
    },
    category: 'Companies',
    permissions: ['companies:read'],
    parameters: [
      { name: 'q', in: 'query', required: false, type: 'string', description: { en: 'Search query', fr: 'Recherche', ar: 'كلمة البحث' } },
      { name: 'wilaya', in: 'query', required: false, type: 'string', description: { en: 'Filter by wilaya', fr: 'Filtrer par wilaya', ar: 'تصفية حسب الولاية' } },
      { name: 'sector', in: 'query', required: false, type: 'string', description: { en: 'Business sector', fr: 'Secteur d\'activité', ar: 'قطاع النشاط' } },
      { name: 'verified', in: 'query', required: false, type: 'boolean', description: { en: 'Only verified companies', fr: 'Entreprises vérifiées seulement', ar: 'الشركات الموثقة فقط' } },
    ]
  },
  {
    path: '/companies/{slug}',
    method: 'GET',
    description: {
      en: 'Get company profile with reviews',
      fr: 'Obtenir le profil entreprise avec avis',
      ar: 'الحصول على ملف الشركة مع التقييمات'
    },
    category: 'Companies',
    permissions: ['companies:read'],
    parameters: [
      { name: 'slug', in: 'path', required: true, type: 'string', description: { en: 'Company slug', fr: 'Slug entreprise', ar: 'معرف الشركة' } },
    ]
  },

  // ==================== SEARCH ====================
  {
    path: '/search',
    method: 'GET',
    description: {
      en: 'Full-text search across platform',
      fr: 'Recherche plein texte sur la plateforme',
      ar: 'بحث نص كامل عبر المنصة'
    },
    category: 'Search',
    permissions: ['search'],
    parameters: [
      { name: 'q', in: 'query', required: true, type: 'string', description: { en: 'Search query', fr: 'Terme de recherche', ar: 'مصطلح البحث' } },
      { name: 'type', in: 'query', required: false, type: 'string', enum: ['all', 'products', 'companies', 'rfqs'], description: { en: 'Content type', fr: 'Type de contenu', ar: 'نوع المحتوى' }, defaultValue: 'all' },
      { name: 'facets', in: 'query', required: false, type: 'boolean', description: { en: 'Include facet results', fr: 'Inclure les facettes', ar: 'تضمين نتائج الوجوه' } },
    ]
  },

  // ==================== ANALYTICS ====================
  {
    path: '/analytics/trends',
    method: 'GET',
    description: {
      en: 'Get market trends and insights',
      fr: 'Obtenir les tendances du marché',
      ar: 'الحصول على اتجاهات السوق'
    },
    category: 'Analytics',
    permissions: ['analytics:read'],
    parameters: [
      { name: 'category', in: 'query', required: false, type: 'string', description: { en: 'Product category', fr: 'Catégorie produit', ar: 'فئة المنتج' } },
      { name: 'period', in: 'query', required: false, type: 'string', enum: ['7d', '30d', '90d', '1y'], description: { en: 'Time period', fr: 'Période', ar: 'الفترة الزمنية' }, defaultValue: '30d' },
      { name: 'wilaya', in: 'query', required: false, type: 'string', description: { en: 'Region filter', fr: 'Filtre région', ar: 'تصفية المنطقة' } },
    ]
  },
  {
    path: '/analytics/pricing',
    method: 'GET',
    description: {
      en: 'Get pricing intelligence data',
      fr: 'Obtenir les données de pricing',
      ar: 'الحصول على بيانات التسعير'
    },
    category: 'Analytics',
    permissions: ['analytics:read'],
    parameters: [
      { name: 'product_category', in: 'query', required: true, type: 'string', description: { en: 'Product category', fr: 'Catégorie', ar: 'فئة المنتج' } },
      { name: 'wilaya', in: 'query', required: false, type: 'string', description: { en: 'Regional pricing', fr: 'Prix régional', ar: 'التسعير الإقليمي' } },
    ]
  },

  // ==================== WEBHOOKS ====================
  {
    path: '/webhooks',
    method: 'GET',
    description: {
      en: 'List your webhook subscriptions',
      fr: 'Lister vos abonnements webhooks',
      ar: 'قائمة اشتراكات الويب هوكس'
    },
    category: 'Webhooks',
    permissions: ['webhooks:manage'],
  },
  {
    path: '/webhooks',
    method: 'POST',
    description: {
      en: 'Create a new webhook subscription',
      fr: 'Créer un nouvel abonnement webhook',
      ar: 'إنشاء اشتراك ويب هوكس جديد'
    },
    category: 'Webhooks',
    permissions: ['webhooks:manage'],
    parameters: [
      { name: 'body', in: 'body', required: true, type: 'object', description: { en: 'Webhook config', fr: 'Configuration webhook', ar: 'إعدادات الويب هوكس' } },
    ],
    requestSchema: {
      type: 'object',
      required: ['url', 'events'],
      properties: {
        url: { type: 'string', format: 'uri' },
        events: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['order.created', 'order.updated', 'order.shipped', 'order.delivered', 'rfq.created', 'rfq.quotation_received', 'product.created', 'message.received']
          }
        },
        secret: { type: 'string' },
        active: { type: 'boolean', default: true }
      }
    }
  },
  {
    path: '/webhooks/{id}',
    method: 'DELETE',
    description: {
      en: 'Delete a webhook subscription',
      fr: 'Supprimer un abonnement webhook',
      ar: 'حذف اشتراك الويب هوكس'
    },
    category: 'Webhooks',
    permissions: ['webhooks:manage'],
    parameters: [
      { name: 'id', in: 'path', required: true, type: 'string', description: { en: 'Webhook ID', fr: 'ID webhook', ar: 'معرف الويب هوكس' } },
    ]
  },

  // ==================== PAYMENTS ====================
  {
    path: '/payments/create-intent',
    method: 'POST',
    description: {
      en: 'Create a payment intent',
      fr: 'Créer une intention de paiement',
      ar: 'إنشاء نية دفع'
    },
    category: 'Payments',
    permissions: ['orders:write'],
    parameters: [
      { name: 'body', in: 'body', required: true, type: 'object', description: { en: 'Payment details', fr: 'Détails paiement', ar: 'تفاصيل الدفع' } },
    ],
    requestSchema: {
      type: 'object',
      required: ['amount', 'currency', 'method', 'orderId'],
      properties: {
        amount: { type: 'number' },
        currency: { type: 'string', default: 'DZD' },
        method: { type: 'string', enum: ['ccp', 'cib', 'baridimob', 'satim', 'crypto'] },
        orderId: { type: 'string' },
        returnUrl: { type: 'string', format: 'uri' },
        cancelUrl: { type: 'string', format: 'uri' }
      }
    }
  },
  {
    path: '/payments/{id}/status',
    method: 'GET',
    description: {
      en: 'Check payment status',
      fr: 'Vérifier le statut du paiement',
      ar: 'التحقق من حالة الدفع'
    },
    category: 'Payments',
    permissions: ['orders:read'],
    parameters: [
      { name: 'id', in: 'path', required: true, type: 'string', description: { en: 'Payment ID', fr: 'ID paiement', ar: 'معرف الدفع' } },
    ]
  },
];

/**
 * Get endpoints by category
 */
export function getEndpointsByCategory(category: string): EndpointDefinition[] {
  return ALGERIATRADE_ENDPOINTS.filter(e => e.category.toLowerCase() === category.toLowerCase());
}

/**
 * Get single endpoint by path and method
 */
export function getEndpoint(path: string, method: string): EndpointDefinition | undefined {
  return ALGERIATRADE_ENDPOINTS.find(e => e.path === path && e.method === method.toUpperCase());
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  const categories = new Set(ALGERIATRADE_ENDPOINTS.map(e => e.category));
  return Array.from(categories).sort();
}

/**
 * Generate OpenAPI/Swagger spec from endpoints
 */
export function generateOpenAPISpec(): object {
  const paths: Record<string, any> = {};
  
  for (const endpoint of ALGERIATRADE_ENDPOINTS) {
    const pathKey = `/v2${endpoint.path}`;
    
    if (!paths[pathKey]) {
      paths[pathKey] = {};
    }
    
    const operation: any = {
      summary: endpoint.description.en,
      description: endpoint.description.fr,
      operationId: `${endpoint.method.toLowerCase()}${endpoint.path.replace(/[\/{}]/g, '_')}`,
      tags: [endpoint.category],
      security: [{ bearerAuth: [] }],
      parameters: endpoint.parameters
        .filter(p => p.in !== 'body')
        .map(p => ({
          name: p.name,
          in: p.in,
          required: p.required,
          schema: { type: p.type },
          description: p.description.en,
          ...(p.enum && { enum: p.enum }),
        })),
      responses: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: endpoint.responseSchema || { $ref: '#/components/schemas/ApiResponse' }
            }
          }
        },
        401: { description: 'Unauthorized - Invalid API key' },
        429: { description: 'Too Many Requests - Rate limit exceeded' },
      }
    };
    
    if (endpoint.deprecated) {
      operation.deprecated = true;
    }
    
    if (endpoint.parameters.some(p => p.in === 'body') && endpoint.requestSchema) {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: endpoint.requestSchema
          }
        }
      };
    }
    
    paths[pathKey][endpoint.method.toLowerCase()] = operation;
  }
  
  return {
    openapi: '3.0.3',
    info: {
      title: 'AlgeriaTrade.dz API',
      description: 'Official REST API for AlgeriaTrade.dz B2B Marketplace\n\nAPI pour la plateforme B2B AlgeriaTrade.dz\n\nواجهة برمجة التطبيقات لمنصة AlgeriaTrade.dز للتجارة بين الشركات',
      version: '2.0.0',
      contact: {
        name: 'AlgeriaTrade Developer Support',
        email: 'api-support@algeriatrade.dz',
        url: 'https://developer.algeriatrade.dz'
      },
      license: {
        name: 'Commercial License',
        url: 'https://algeriatrade.dz/terms/api'
      }
    },
    servers: [
      {
        url: 'https://api.algeriatrade.dz',
        description: 'Production server'
      },
      {
        url: 'https://sandbox-api.algeriatrade.dz',
        description: 'Sandbox/Test environment'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'at_xxxx...',
          description: 'Your AlgeriaTrade API key'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {},
            error: { type: 'string' },
            code: { type: 'string' },
            meta: { $ref: '#/components/schemas/ResponseMeta' }
          }
        },
        ResponseMeta: {
          type: 'object',
          properties: {
            queriedAt: { type: 'string', format: 'date-time' },
            apiVersion: { type: 'string' },
            requestId: { type: 'string' },
            pagination: { $ref: '#/components/schemas/Pagination' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        }
      }
    },
    paths,
  };
}
