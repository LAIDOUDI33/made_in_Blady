import { NextRequest, NextResponse } from 'next/server';
import { 
  ALGERIATRADE_ENDPOINTS, 
  getCategories, 
  getEndpointsByCategory,
  generateOpenAPISpec 
} from '@/lib/api-gateway/gateway';

// GET /api/developer/docs - Get API documentation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json, openapi
    const category = searchParams.get('category');
    const endpoint = searchParams.get('endpoint');

    // Return OpenAPI/Swagger spec if requested
    if (format === 'openapi' || format === 'swagger' || format === 'yaml') {
      const openApiSpec = generateOpenAPISpec();
      
      if (format === 'yaml') {
        // Convert to YAML-like format (simplified)
        const yamlString = JSONToYAML(openApiSpec);
        return new NextResponse(yamlString, {
          headers: { 'Content-Type': 'text/yaml' }
        });
      }

      return NextResponse.json(openApiSpec);
    }

    // Get specific endpoint if requested
    if (endpoint) {
      const [method, path] = endpoint.split(' ');
      const endpointData = ALGERIATRADE_ENDPOINTS.find(
        e => e.path === path && e.method === method?.toUpperCase()
      );

      if (!endpointData) {
        return NextResponse.json(
          { success: false, error: 'Endpoint not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: endpointData,
        meta: {
          queriedAt: new Date().toISOString(),
          apiVersion: 'v2',
        }
      });
    }

    // Get endpoints by category or all
    let endpoints = category ? getEndpointsByCategory(category) : ALGERIATRADE_ENDPOINTS;

    // Build documentation response
    const documentation = {
      info: {
        title: 'AlgeriaTrade.dz REST API',
        version: '2.0.0',
        description: 'Official REST API for AlgeriaTrade.dz B2B Marketplace',
        contact: {
          email: 'api-support@algeriatrade.dz',
          url: 'https://developer.algeriatrade.dz'
        },
        license: {
          name: 'Commercial License',
          url: 'https://algeriatrade.dz/terms/api'
        }
      },
      servers: [
        { url: 'https://api.algeriatrade.dz', description: 'Production' },
        { url: 'https://sandbox-api.algeriatrade.dz', description: 'Sandbox/Test' }
      ],
      categories: getCategories(),
      totalEndpoints: ALGERIATRADE_ENDPOINTS.length,
      endpoints: endpoints.map(ep => ({
        method: ep.method,
        path: `/v2${ep.path}`,
        description: ep.description,
        category: ep.category,
        permissions: ep.permissions,
        parametersCount: ep.parameters.length,
        hasRequestBody: ep.parameters.some(p => p.in === 'body'),
        deprecated: ep.deprecated || false,
      })),
      authentication: {
        type: 'Bearer Token',
        headerName: 'Authorization',
        prefix: 'Bearer at_',
        description: 'Use your API key obtained from the Developer Portal'
      },
      rateLimits: {
        free: { requestsPerMinute: 10, requestsPerDay: 100 },
        pro: { requestsPerMinute: 100, requestsPerDay: 10000 },
        enterprise: { requestsPerMinute: 1000, requestsPerDay: -1 }, // unlimited
      },
      sdks: {
        javascript: { package: '@algeriatrade/sdk', version: '2.4.1' },
        python: { package: 'algeriatrade-sdk', version: '2.3.0' },
        php: { package: 'algeriatrade/sdk', version: '1.8.2' },
        java: { groupId: 'com.algeriatrade', artifactId: 'algeriatrade-sdk', version: '1.2.0' },
      },
      changelog: [
        { version: '2.0.0', date: '2024-01-15', type: 'major', notes: 'Major release with new endpoints and improved response format' },
        { version: '1.9.0', date: '2023-12-01', type: 'minor', notes: 'Added analytics endpoints' },
        { version: '1.8.0', date: '2023-10-15', type: 'minor', notes: 'Webhook improvements and new event types' },
      ]
    };

    return NextResponse.json({
      success: true,
      data: documentation,
      meta: {
        queriedAt: new Date().toISOString(),
        apiVersion: 'v2',
        endpointsReturned: endpoints.length,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documentation', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Simple JSON to YAML converter (basic implementation)
function JSONToYAML(obj: any, indent: string = ''): string {
  let yaml = '';
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      yaml += `${indent}${key}: null\n`;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      yaml += `${indent}${key}:\n${JSONToYAML(value, indent + '  ')}`;
    } else if (Array.isArray(value)) {
      yaml += `${indent}${key}:\n`;
      for (const item of value) {
        if (typeof item === 'object') {
          yaml += `${indent}  -\n${JSONToYAML(item, indent + '    ')}`;
        } else {
          yaml += `${indent}  - ${item}\n`;
        }
      }
    } else if (typeof value === 'string') {
      yaml += `${indent}${key}: "${value}"\n`;
    } else {
      yaml += `${indent}${key}: ${value}\n`;
    }
  }
  
  return yaml;
}
