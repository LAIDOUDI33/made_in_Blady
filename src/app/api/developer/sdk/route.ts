import { NextRequest, NextResponse } from 'next/server';

// SDK information
const SDKS = [
  {
    id: 'javascript',
    name: 'AlgeriaTrade JavaScript SDK',
    language: 'JavaScript / TypeScript',
    version: '2.4.1',
    status: 'stable',
    description: 'Official JavaScript/TypeScript SDK for Node.js, browsers, and edge runtimes',
    packageManager: 'npm',
    packageName: '@algeriatrade/sdk',
    installCommand: 'npm install @algeriatrade/sdk',
    repositoryUrl: 'https://github.com/algeriatrade/js-sdk',
    docsUrl: 'https://docs.algeriatrade.dz/sdk/javascript',
    size: '245 KB',
    license: 'MIT',
    lastUpdated: '2024-03-10',
    features: [
      'Full API coverage (Products, Orders, RFQs, etc.)',
      'TypeScript types included',
      'Automatic retry & rate limit handling',
      'Webhook signature verification',
      'Streaming responses support',
      'Browser & Node.js compatible'
    ],
    supportedPlatforms: ['Node.js 18+', 'Browsers (ES2020+)', 'Deno', 'Bun', 'Edge Runtimes'],
  },
  {
    id: 'python',
    name: 'AlgeriaTrade Python SDK',
    language: 'Python 3.8+',
    version: '2.3.0',
    status: 'stable',
    description: 'Official Python SDK with async/sync support for modern Python applications',
    packageManager: 'pip',
    packageName: 'algeriatrade-sdk',
    installCommand: 'pip install algeriatrade-sdk',
    repositoryUrl: 'https://github.com/algeriatrade/python-sdk',
    docsUrl: 'https://docs.algeriatrade.dz/sdk/python',
    size: '180 KB',
    license: 'MIT',
    lastUpdated: '2024-03-08',
    features: [
      'Async & sync clients available',
      'Full API coverage',
      'Pydantic models for data validation',
      'Built-in retry logic',
      'Django/Flask integration helpers',
      'Type hints throughout'
    ],
    supportedPlatforms: ['Python 3.8+', 'PyPy', 'Django 4.0+', 'FastAPI', 'Flask 2.0+'],
  },
  {
    id: 'php',
    name: 'AlgeriaTrade PHP SDK',
    language: 'PHP 8.0+',
    version: '1.8.2',
    status: 'stable',
    description: 'Official PHP SDK with Laravel and Symfony integration packages',
    packageManager: 'composer',
    packageName: 'algeriatrade/sdk',
    installCommand: 'composer require algeriatrade/sdk',
    repositoryUrl: 'https://github.com/algeriatrade/php-sdk',
    docsUrl: 'https://docs.algeriatrade.dz/sdk/php',
    size: '156 KB',
    license: 'MIT',
    lastUpdated: '2024-03-05',
    features: [
      'PSR-18 HTTP client compatible',
      'Laravel & Symfony packages available',
      'Full API coverage',
      'Request/response caching',
      'Event system for webhooks',
      'PHPDoc throughout'
    ],
    supportedPlatforms: ['PHP 8.0+', 'Laravel 9+/10/11', 'Symfony 6.0+', 'Lumen', 'Vanilla PHP'],
  },
  {
    id: 'java',
    name: 'AlgeriaTrade Java SDK',
    language: 'Java 11+',
    version: '1.2.0',
    status: 'beta',
    description: 'Official Java SDK for JVM-based applications including Spring Boot',
    packageManager: 'maven',
    groupId: 'com.algeriatrade',
    artifactId: 'algeriatrade-sdk',
    installCommand: `// Maven dependency
<dependency>
  <groupId>com.algeriatrade</groupId>
  <artifactId>algeriatrade-sdk</artifactId>
  <version>1.2.0</version>
</dependency>`,
    repositoryUrl: 'https://github.com/algeriatrade/java-sdk',
    docsUrl: 'https://docs.algeriatrade.dz/sdk/java',
    size: '320 KB',
    license: 'Apache 2.0',
    lastUpdated: '2024-02-28',
    features: [
      'Spring Boot auto-configuration',
      'Reactive/WebFlux support',
      'Full API coverage',
      'Jackson model classes',
      'SLF4J logging integration',
      'Maven & Gradle support'
    ],
    supportedPlatforms: ['Java 11+', 'Spring Boot 3.x', 'Spring Framework 6.x', 'Quarkus', 'Micronaut'],
  }
];

// GET /api/developer/sdk - Get SDK information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sdkId = searchParams.get('sdk');
    const lang = searchParams.get('language');

    // Return specific SDK if requested
    if (sdkId || lang) {
      const id = sdkId || lang;
      const sdk = SDKS.find(s => s.id === id || s.language.toLowerCase().includes(id?.toLowerCase() || ''));

      if (!sdk) {
        return NextResponse.json(
          { 
            success: false, 
            error: `SDK not found for: ${id}`,
            code: 'NOT_FOUND',
            availableSDKs: SDKS.map(s => ({ id: s.id, language: s.language }))
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: sdk,
        meta: { queriedAt: new Date().toISOString(), apiVersion: 'v2' }
      });
    }

    // Return all SDKs summary
    return NextResponse.json({
      success: true,
      data: {
        sdks: SDKS.map(sdk => ({
          id: sdk.id,
          name: sdk.name,
          language: sdk.language,
          version: sdk.version,
          status: sdk.status,
          packageManager: sdk.packageManager,
          packageName: sdk.packageName,
          installCommand: sdk.installCommand.split('\n')[0], // First line only
          repositoryUrl: sdk.repositoryUrl,
          docsUrl: sdk.docsUrl,
          size: sdk.size,
          lastUpdated: sdk.lastUpdated,
          featureCount: sdk.features.length,
        })),
        quickStart: {
          javascript: {
            install: 'npm install @algeriatrade/sdk',
            code: `import { AlgeriaTrade } from '@algeriatrade/sdk';

const client = new AlgeriaTrade({
  apiKey: process.env.ALGERIATRADE_API_KEY,
  environment: 'production'
});

const products = await client.products.list({ category: 'textile' });`
          },
          python: {
            install: 'pip install algeriatrade-sdk',
            code: `from algeriatrade import AlgeriaTradeClient

client = AlgeriaTradeClient(
    api_key="your_api_key",
    environment="production"
)

products = client.products.list(category="textile")`
          },
          php: {
            install: 'composer require algeriatrade/sdk',
            code: `$client = new \\AlgeriaTrade\\SDK\\Client([
    'api_key' => getenv('ALGERIATRADE_API_KEY'),
    'environment' => 'production'
]);

$products = $client->products()->list(['category' => 'textile']);`
          },
          java: {
            install: '// Add Maven dependency (see docs)',
            code: `AlgeriaTradeClient client = AlgeriaTradeClient.builder()
    .apiKey(System.getenv("ALGERIATRADE_API_KEY"))
    .environment(Environment.PRODUCTION)
    .build();

ProductListResponse products = client.products().list(
    ProductListParams.builder()
        .category("textile")
        .build()
);`
          }
        }
      },
      meta: {
        queriedAt: new Date().toISOString(),
        apiVersion: 'v2',
        totalSDKs: SDKS.length,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SDK information', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
