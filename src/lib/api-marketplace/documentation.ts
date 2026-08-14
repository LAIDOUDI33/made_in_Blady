import { ApiEndpoint, ApiCategory, ApiPermission } from './types';

/**
 * Complete API Endpoints Definition for AlgeriaTrade API
 * This serves as the single source of truth for all API documentation
 */
export const API_ENDPOINTS: ApiEndpoint[] = [
  // ============================================
  // PRODUCTS ENDPOINTS
  // ============================================
  {
    id: 'list-products',
    path: '/api/v1/products',
    method: 'GET',
    description: {
      fr: 'Lister les produits avec filtres avancés',
      en: 'List products with advanced filters',
      ar: 'قائمة المنتجات مع فلاتر متقدمة',
    },
    category: 'products',
    requiredPermissions: ['products:read'],
    requestSchema: {
      type: 'object',
      properties: {
        category: { 
          type: 'string', 
          description: 'Filter by category slug' 
        },
        search: { 
          type: 'string', 
          description: 'Search in product name and description' 
        },
        page: { 
          type: 'integer', 
          default: 1,
          minimum: 1,
          description: 'Page number for pagination'
        },
        limit: { 
          type: 'integer', 
          default: 20,
          minimum: 1,
          maximum: 100,
          description: 'Items per page'
        },
        wilaya: { 
          type: 'string', 
          description: 'Filter by wilaya code (e.g., "16" for Alger)' 
        },
        min_price: { 
          type: 'number', 
          description: 'Minimum price filter (DZD)' 
        },
        max_price: { 
          type: 'number', 
          description: 'Maximum price filter (DZD)' 
        },
        sort: { 
          type: 'string', 
          enum: ['price_asc', 'price_desc', 'newest', 'popular'],
          default: 'newest',
          description: 'Sort order'
        },
        is_verified: {
          type: 'boolean',
          description: 'Only show products from verified suppliers'
        }
      },
    },
    responseSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: true },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Product' }
        },
        pagination: { $ref: '#/components/schemas/Pagination' },
        meta: { $ref: '#/components/schemas/ResponseMeta' }
      },
    },
    rateLimitCost: 1,
    version: '1.0.0',
  },

  {
    id: 'get-product',
    path: '/api/v1/products/{slug}',
    method: 'GET',
    description: {
      fr: 'Obtenir les détails d\'un produit par son slug',
      en: 'Get product details by slug',
      ar: 'الحصول على تفاصيل المنتج بواسطة المعرف',
    },
    category: 'products',
    requiredPermissions: ['products:read'],
    requestSchema: {
      type: 'object',
      properties: {
        slug: { 
          type: 'string', 
          description: 'Product URL slug' 
        },
      },
      required: ['slug'],
    },
    responseSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { $ref: '#/components/schemas/Product' },
        meta: { $ref: '#/components/schemas/ResponseMeta' }
      },
    },
    rateLimitCost: 1,
    version: '1.0.0',
  },

  // ============================================
  // SEARCH ENDPOINTS
  // ============================================
  {
    id: 'search',
    path: '/api/v1/search',
    method: 'GET',
    description: {
      fr: 'Rechercher des produits et fournisseurs globalement',
      en: 'Search across products and suppliers',
      ar: 'البحث في المنتجات والموردين',
    },
    category: 'search',
    requiredPermissions: ['search'],
    requestSchema: {
      type: 'object',
      properties: {
        q: { 
          type: 'string', 
          minLength: 2,
          description: 'Search query (minimum 2 characters)'
        },
        type: { 
          type: 'string', 
          enum: ['all', 'products', 'suppliers'],
          default: 'all',
          description: 'Search scope'
        },
        page: { 
          type: 'integer', 
          default: 1 
        },
        limit: { 
          type: 'integer', 
          default: 10 
        },
      },
      required: ['q'],
    },
    responseSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        query: { type: 'string' },
        type: { type: 'string' },
        results: {
          type: 'object',
          properties: {
            products: { type: 'array' },
            suppliers: { type: 'array' }
          }
        },
        meta: {
          type: 'object',
          properties: {
            totalResults: { type: 'integer' },
            searchedAt: { type: 'string', format: 'date-time' }
          }
        }
      },
    },
    rateLimitCost: 2,
    version: '1.0.0',
  },

  // ============================================
  // ORDERS ENDPOINTS
  // ============================================
  {
    id: 'list-orders',
    path: '/api/v1/orders',
    method: 'GET',
    description: {
      fr: 'Lister les commandes de l\'utilisateur authentifié',
      en: 'List authenticated user orders',
      ar: 'قائمة طلبات المستخدم المصادق عليه',
    },
    category: 'orders',
    requiredPermissions: ['orders:read'],
    requestSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
        },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 20 },
      },
    },
    rateLimitCost: 1,
    version: '1.0.0',
  },

  {
    id: 'create-order',
    path: '/api/v1/orders',
    method: 'POST',
    description: {
      fr: 'Créer une nouvelle commande',
      en: 'Create a new order',
      ar: 'إنشاء طلب جديد',
    },
    category: 'orders',
    requiredPermissions: ['orders:write'],
    requestSchema: {
      type: 'object',
      required: ['items', 'shipping_address'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['product_id', 'quantity'],
            properties: {
              product_id: { type: 'string' },
              quantity: { type: 'integer', minimum: 1 },
              notes: { type: 'string' }
            }
          }
        },
        shipping_address: {
          type: 'object',
          required: ['address', 'wilaya', 'city'],
          properties: {
            address: { type: 'string' },
            wilaya: { type: 'string' },
            city: { type: 'string' },
            phone: { type: 'string' },
            recipient_name: { type: 'string' }
          }
        },
        payment_method: {
          type: 'string',
          enum: ['cib', 'ccp', 'baridimob', 'bank_transfer', 'cod']
        },
        notes: { type: 'string' }
      },
    },
    rateLimitCost: 3,
    version: '1.0.0',
  },

  // ============================================
  // RFQ (REQUEST FOR QUOTATION) ENDPOINTS
  // ============================================
  {
    id: 'list-rfqs',
    path: '/api/v1/rfqs',
    method: 'GET',
    description: {
      fr: 'Lister les appels d\'offres de l\'utilisateur',
      en: 'List user RFQs (Requests for Quotation)',
      ar: 'قائمة طلبات عرض السعر للمستخدم',
    },
    category: 'rfqs',
    requiredPermissions: ['rfq:read'],
    requestSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['open', 'closed', 'expired']
        },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 20 },
      },
    },
    rateLimitCost: 1,
    version: '1.0.0',
  },

  {
    id: 'create-rfq',
    path: '/api/v1/rfqs',
    method: 'POST',
    description: {
      fr: 'Créer un appel d\'offres pour obtenir des devis',
      en: 'Create an RFQ to receive quotations from suppliers',
      ar: 'إنشاء طلب عرض سعر للحصول على عروض من الموردين',
    },
    category: 'rfqs',
    requiredPermissions: ['rfq:write'],
    requestSchema: {
      type: 'object',
      required: ['title', 'category', 'quantity'],
      properties: {
        title: { 
          type: 'string', 
          minLength: 5,
          maxLength: 200,
          description: 'RFQ title'
        },
        description: { 
          type: 'string',
          maxLength: 2000,
          description: 'Detailed description of requirements'
        },
        category: { 
          type: 'string',
          description: 'Category slug or ID'
        },
        quantity: { 
          type: 'number',
          minimum: 1,
          description: 'Required quantity'
        },
        unit: { 
          type: 'string',
          description: 'Unit of measurement (e.g., "kg", "units", "meters")'
        },
        budget: { 
          type: 'number',
          description: 'Maximum budget in DZD (optional)'
        },
        deadline: { 
          type: 'string', 
          format: 'date',
          description: 'Deadline for quotations'
        },
        wilaya: { 
          type: 'string',
          description: 'Delivery location wilaya code'
        },
        attachments: {
          type: 'array',
          items: { type: 'string', format: 'uri' },
          description: 'URLs to specification documents or images'
        }
      },
    },
    responseSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { $ref: '#/components/schemas/RFQ' },
        message: { type: 'string' }
      },
    },
    rateLimitCost: 3,
    version: '1.0.0',
  },

  // ============================================
  // COMPANIES ENDPOINTS
  // ============================================
  {
    id: 'list-companies',
    path: '/api/v1/companies',
    method: 'GET',
    description: {
      fr: 'Lister les entreprises vérifiées sur la plateforme',
      en: 'List verified companies on the platform',
      ar: 'قائمة الشركات الموثقة على المنصة',
    },
    category: 'companies',
    requiredPermissions: ['companies:read'],
    requestSchema: {
      type: 'object',
      properties: {
        verified: { 
          type: 'boolean',
          default: true,
          description: 'Only verified companies'
        },
        category: { 
          type: 'string',
          description: 'Filter by business category'
        },
        wilaya: { 
          type: 'string',
          description: 'Filter by location'
        },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 20 },
        search: { type: 'string' },
      },
    },
    rateLimitCost: 1,
    version: '1.0.0',
  },

  {
    id: 'get-company',
    path: '/api/v1/companies/{slug}',
    method: 'GET',
    description: {
      fr: 'Obtenir les détails d\'une entreprise',
      en: 'Get company details',
      ar: 'الحصول على تفاصيل شركة',
    },
    category: 'companies',
    requiredPermissions: ['companies:read'],
    rateLimitCost: 1,
    version: '1.0.0',
  },

  // ============================================
  // CATEGORIES ENDPOINTS
  // ============================================
  {
    id: 'list-categories',
    path: '/api/v1/categories',
    method: 'GET',
    description: {
      fr: 'Lister toutes les catégories de produits',
      en: 'List all product categories',
      ar: 'قائمة جميع فئات المنتجات',
    },
    category: 'products',
    requiredPermissions: ['categories:read'],
    responseSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Category' }
        },
        meta: { $ref: '#/components/schemas/ResponseMeta' }
      },
    },
    rateLimitCost: 1,
    version: '1.0.0',
  },

  // ============================================
  // ANALYTICS ENDPOINTS
  // ============================================
  {
    id: 'get-analytics-overview',
    path: '/api/v1/analytics/overview',
    method: 'GET',
    description: {
      fr: 'Obtenir les statistiques du compte développeur',
      en: 'Get developer account analytics overview',
      ar: 'الحصول على نظرة عامة على إحصائيات حساب المطور',
    },
    category: 'analytics',
    requiredPermissions: ['analytics:read'],
    responseSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            total_requests: { type: 'integer' },
            requests_today: { type: 'integer' },
            requests_this_month: { type: 'integer' },
            avg_response_time_ms: { type: 'number' },
            error_rate_percent: { type: 'number' },
            top_endpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  endpoint: { type: 'string' },
                  count: { type: 'integer' }
                }
              }
            },
            requests_by_day: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  count: { type: 'integer' }
                }
              }
            }
          }
        }
      },
    },
    rateLimitCost: 5,
    version: '1.0.0',
  },

  // ============================================
  // ACCOUNT ENDPOINTS
  // ============================================
  {
    id: 'get-account-info',
    path: '/api/v1/account',
    method: 'GET',
    description: {
      fr: 'Obtenir les informations du compte API',
      en: 'Get API account information',
      ar: 'الحصول على معلومات حساب API',
    },
    category: 'account',
    requiredPermissions: [],
    responseSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            plan: { type: 'string' },
            requests_remaining_today: { type: 'integer' },
            api_keys_count: { type: 'integer' },
            apps_count: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      },
    },
    rateLimitCost: 1,
    version: '1.0.0',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get endpoints by category
 */
export function getEndpointsByCategory(category: ApiCategory): ApiEndpoint[] {
  return API_ENDPOINTS.filter(e => e.category === category);
}

/**
 * Get single endpoint by ID
 */
export function getEndpointById(id: string): ApiEndpoint | undefined {
  return API_ENDPOINTS.find(e => e.id === id);
}

/**
 * Get all unique categories
 */
export function getCategories(): { name: ApiCategory; count: number }[] {
  const categoryMap = new Map<ApiCategory, number>();
  
  for (const endpoint of API_ENDPOINTS) {
    const current = categoryMap.get(endpoint.category) || 0;
    categoryMap.set(endpoint.category, current + 1);
  }

  return Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));
}

/**
 * Generate OpenAPI 3.0 specification
 */
export function generateOpenAPISpec(): object {
  return {
    openapi: '3.0.3',
    info: {
      title: 'AlgeriaTrade API',
      version: '1.0.0',
      description: `**API pour la plateforme B2B AlgeriaTrade.dz**

API RESTful pour accéder aux données du plus grand marché B2B d'Algérie.

---

**RESTful API for AlgeriaTrade.dz B2B Platform**

Access thousands of products, suppliers, and business data through our comprehensive API.

## Authentication

All API requests require authentication using an API key in the header:

\`\`\`
X-API-Key: at_your_api_key_here
\`\`\`

## Rate Limits

- **Free Plan**: 100 requests/day
- **Pro Plan**: 10,000 requests/day  
- **Enterprise**: Unlimited

Rate limit headers are included in every response:
- \`X-RateLimit-Limit\`: Your daily limit
- \`X-RateLimit-Remaining\`: Requests remaining
- \`X-RateLimit-Reset\`: When the limit resets (Unix timestamp)

## Errors

The API uses standard HTTP status codes and returns errors in this format:

\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "message": "Detailed explanation"
}
\`\`\`

## Support

- Documentation: https://algeriatrade.dz/api-portal
- Email: api@algeriatrade.dz
- Status Page: https://status.algeriatrade.dz`,
      contact: {
        email: 'api@algeriatrade.dz',
        url: 'https://algeriatrade.dz/docs/api',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      termsOfService: 'https://algeriatrade.dz/terms',
    },
    servers: [
      { 
        url: 'https://api.algeriatrade.dz', 
        description: 'Production Server 🚀' 
      },
      { 
        url: 'https://staging-api.algeriatrade.dz', 
        description: 'Staging Environment 🧪' 
      },
      { 
        url: 'http://localhost:3000/api', 
        description: 'Local Development 💻' 
      },
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Your API key obtained from the developer portal',
        },
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxxxxxxx' },
            slug: { type: 'string', example: 'panneau-solaire-300w' },
            name: { type: 'string', example: 'Panneau Solaire 300W Monocristallin' },
            nameAr: { type: 'string', example: 'لوحة شمسية 300 واط أحادية البلورة' },
            description: { type: 'string' },
            price: { type: 'number', example: 25000 },
            currency: { type: 'string', example: 'DZD' },
            unit: { type: 'string', example: 'unit' },
            stockQuantity: { type: 'integer', example: 150 },
            images: {
              type: 'array',
              items: { type: 'string', format: 'uri' }
            },
            category: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' }
              }
            },
            company: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                isVerified: { type: 'boolean' }
              }
            },
            status: { 
              type: 'string', 
              enum: ['draft', 'published', 'archived'] 
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            name: { type: 'string', example: 'SolarTech Algérie' },
            description: { type: 'string' },
            logoUrl: { type: 'string', format: 'uri' },
            isVerified: { type: 'boolean' },
            wilaya: { type: 'string', example: '16' },
            city: { type: 'string', example: 'Alger' },
            contactEmail: { type: 'string', format: 'email' },
            contactPhone: { type: 'string' },
            website: { type: 'string', format: 'uri' },
            foundedYear: { type: 'integer' },
            employeeCount: { type: 'string' },
            _count: {
              type: 'object',
              properties: {
                products: { type: 'integer' }
              }
            }
          },
        },
        RFQ: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string' },
            budget: { type: 'number' },
            status: { 
              type: 'string', 
              enum: ['open', 'in_progress', 'closed', 'expired'] 
            },
            deadline: { type: 'string', format: 'date' },
            createdAt: { type: 'string', format: 'date-time' },
            quotationsCount: { type: 'integer' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'Énergie Solaire' },
            nameAr: { type: 'string', example: 'طاقة شمسية' },
            slug: { type: 'string', example: 'energie-solaire' },
            icon: { type: 'string' },
            productCount: { type: 'integer' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 150 },
            totalPages: { type: 'integer', example: 8 },
          },
        },
        ResponseMeta: {
          type: 'object',
          properties: {
            queriedAt: { type: 'string', format: 'date-time' },
            apiVersion: { type: 'string', example: '1.0.0' },
            requestId: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid API key' },
            code: { 
              type: 'string', 
              enum: [
                'INVALID_API_KEY',
                'MISSING_API_KEY',
                'RATE_LIMITED',
                'IP_FORBIDDEN',
                'INVALID_QUERY',
                'NOT_FOUND',
                'INTERNAL_ERROR',
                'PERMISSION_DENIED'
              ]
            },
            message: { type: 'string' },
          },
          required: ['error', 'code'],
        },
      },
    },
    paths: Object.fromEntries(
      API_ENDPOINTS.map(endpoint => {
        const path = endpoint.path.replace(/{slug}/g, '{slug}').replace(/{id}/g, '{id}');
        
        return [
          path,
          {
            [endpoint.method.toLowerCase()]: {
              summary: endpoint.description.fr,
              description: `${endpoint.description.en}\n\n**العربية:** ${endpoint.description.ar}`,
              operationId: endpoint.id,
              tags: [endpoint.category],
              security: [{ apiKey: [] }],
              deprecated: endpoint.deprecated ?? false,
              parameters: extractParameters(endpoint),
              ...(endpoint.requestSchema && endpoint.method !== 'GET' ? {
                requestBody: {
                  required: true,
                  content: {
                    'application/json': {
                      schema: endpoint.requestSchema,
                      example: getExampleForEndpoint(endpoint),
                    },
                  },
                },
              } : {}),
              responses: {
                '200': {
                  description: 'Successful response',
                  content: {
                    'application/json': {
                      schema: endpoint.responseSchema || {
                        type: 'object',
                        properties: {
                          success: { type: 'boolean', const: true },
                          data: { type: 'object' },
                        },
                      },
                    },
                  },
                },
                '401': {
                  description: 'Unauthorized - Invalid or missing API key',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Error' },
                      example: {
                        error: 'Invalid API key',
                        code: 'INVALID_API_KEY',
                      },
                    },
                  },
                },
                '429': {
                  description: 'Too Many Requests - Rate limit exceeded',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Error' },
                      example: {
                        error: 'Rate limit exceeded',
                        code: 'RATE_LIMITED',
                        retryAfter: 60,
                      },
                    },
                  },
                },
                '500': {
                  description: 'Internal Server Error',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Error' },
                    },
                  },
                },
              },
            },
          },
        ];
      })
    ),
    tags: [
      { 
        name: 'products', 
        description: 'Gestion des produits | Product management | إدارة المنتجات' 
      },
      { 
        name: 'search', 
        description: 'Recherche globale | Global search | بحث شامل' 
      },
      { 
        name: 'orders', 
        description: 'Gestion des commandes | Order management | إدارة الطلبات' 
      },
      { 
        name: 'rfqs', 
        description: 'Appels d\'offres | RFQ management | طلبات عرض السعر' 
      },
      { 
        name: 'companies', 
        description: 'Entreprises et fournisseurs | Companies & Suppliers | الشركات والموردون' 
      },
      { 
        name: 'analytics', 
        description: 'Statistiques d\'utilisation | Usage Analytics | إحصائيات الاستخدام' 
      },
      { 
        name: 'account', 
        description: 'Informations du compte | Account information | معلومات الحساب' 
      },
    ],
  };
}

/**
 * Extract OpenAPI parameters from endpoint definition
 */
function extractParameters(endpoint: ApiEndpoint): any[] {
  const params: any[] = [];
  
  // Path parameters
  if (endpoint.path.includes('{slug}')) {
    params.push({
      name: 'slug',
      in: 'path',
      required: true,
      description: 'Resource identifier (slug)',
      schema: { type: 'string' },
      example: 'panneau-solaire-300w',
    });
  }
  
  if (endpoint.path.includes('{id}')) {
    params.push({
      name: 'id',
      in: 'path',
      required: true,
      description: 'Resource ID',
      schema: { type: 'string' },
    });
  }

  // Query parameters for GET requests
  if (endpoint.method === 'GET' && endpoint.requestSchema?.properties) {
    for (const [name, schema] of Object.entries(endpoint.requestSchema.properties as any)) {
      params.push({
        name,
        in: 'query',
        required: endpoint.requestSchema.required?.includes(name) || false,
        description: (schema as any).description,
        schema: {
          type: (schema as any).type,
          enum: (schema as any).enum,
          default: (schema as any).default,
        },
      });
    }
  }
  
  return params;
}

/**
 * Generate example request body for an endpoint
 */
function getExampleForEndpoint(endpoint: ApiEndpoint): any {
  switch (endpoint.id) {
    case 'create-order':
      return {
        items: [
          { product_id: 'product_slug_123', quantity: 5 }
        ],
        shipping_address: {
          address: '123 Rue Didouche Mourad',
          wilaya: '16',
          city: 'Alger',
          phone: '+213555123456',
          recipient_name: 'Mohammed Ali'
        },
        payment_method: 'cod',
        notes: 'Livraison avant midi SVP'
      };
    
    case 'create-rfq':
      return {
        title: 'Besoin de 500 mètres de câble électrique CU 4mm²',
        description: 'Recherche fournisseur régulier pour câbles électriques cuivre norme CEI',
        category: 'electricite-cablage',
        quantity: 500,
        unit: 'mètres',
        budget: 150000,
        deadline: '2025-02-15',
        wilaya: '16',
      };
    
    default:
      return {};
  }
}

/**
 * Export API spec as JSON string
 */
export function getOpenApiJsonString(pretty: boolean = true): string {
  return JSON.stringify(generateOpenAPISpec(), null, pretty ? 2 : 0);
}
