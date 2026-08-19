'use client';

import React, { useState } from 'react';
import {
  Download,
  Package,
  Code2,
  FileText,
  Github,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Terminal,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

// SDK definitions
interface SdkInfo {
  id: string;
  name: string;
  language: string;
  languageIcon: string;
  version: string;
  status: 'stable' | 'beta' | 'alpha' | 'deprecated';
  description: string;
  features: string[];
  installCommand: string;
  packageManager?: string;
  repositoryUrl: string;
  docsUrl: string;
  size: string;
  lastUpdated: Date;
  quickStartCode: string;
  changelog: ChangelogEntry[];
}

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  changes: string[];
}

const SDKS: SdkInfo[] = [
  {
    id: 'javascript',
    name: 'AlgeriaTrade JS SDK',
    language: 'JavaScript / TypeScript',
    languageIcon: '🟨',
    version: '2.4.1',
    status: 'stable',
    description: 'Official JavaScript/TypeScript SDK for Node.js, browsers, and edge runtimes',
    features: [
      'Full API coverage (Products, Orders, RFQs, etc.)',
      'TypeScript types included',
      'Automatic retry & rate limit handling',
      'Webhook signature verification',
      'Streaming responses support',
      'Browser & Node.js compatible'
    ],
    installCommand: 'npm install @algeriatrade/sdk',
    packageManager: 'npm',
    repositoryUrl: 'https://github.com/algeriatrade/js-sdk',
    docsUrl: 'https://docs.algeriatrade.dz/sdk/javascript',
    size: '245 KB',
    lastUpdated: new Date('2024-03-10'),
    quickStartCode: `// Import the SDK
import { AlgeriaTrade } from '@algeriatrade/sdk';

// Initialize with your API key
const client = new AlgeriaTrade({
  apiKey: process.env.ALGERIATRADE_API_KEY,
  environment: 'production' // or 'sandbox'
});

// Fetch products
const products = await client.products.list({
  category: 'textile',
  wilaya: '16',
  limit: 20
});

console.log(\`Found \${products.meta.pagination.total} products\`);

// Create an order
const order = await client.orders.create({
  items: [
    { productId: 'prod_abc123', quantity: 100 }
  ],
  shippingAddress: {
    fullName: 'Company Name',
    phone: '+213 XXX XXX XXX',
    wilaya: '16',
    address: '123 Business Street'
  },
  paymentMethod: 'ccp'
});

console.log(\`Order created: \${order.data.id}\`);

// Set up webhooks (for server-side)
client.webhooks.on('order.created', async (event) => {
  console.log('New order:', event.data);
  // Process the order...
});`,
    changelog: [
      {
        version: '2.4.1',
        date: '2024-03-10',
        type: 'patch',
        changes: ['Fixed webhook verification timing issue', 'Improved error messages for rate limits']
      },
      {
        version: '2.4.0',
        date: '2024-03-01',
        type: 'minor',
        changes: ['Added streaming response support', 'New analytics endpoints', 'Performance improvements']
      },
      {
        version: '2.3.0',
        date: '2024-02-15',
        type: 'minor',
        changes: ['Added bulk operations', 'Improved TypeScript types', 'New RFQ methods']
      },
      {
        version: '2.0.0',
        date: '2024-01-15',
        type: 'major',
        changes: ['Complete rewrite for v2 API', 'Breaking changes - see migration guide', 'New authentication flow']
      }
    ]
  },
  {
    id: 'python',
    name: 'AlgeriaTrade Python SDK',
    language: 'Python 3.8+',
    languageIcon: '🐍',
    version: '2.3.0',
    status: 'stable',
    description: 'Official Python SDK with async/sync support for modern Python applications',
    features: [
      'Async & sync clients available',
      'Full API coverage',
      'Pydantic models for data validation',
      'Built-in retry logic',
      'Django/Flask integration helpers',
      'Type hints throughout'
    ],
    installCommand: 'pip install algeriatrade-sdk',
    packageManager: 'pip',
    repositoryUrl: 'https://github.com/algeriatrade/python-sdk',
    docsUrl: 'https://docs.algeriatrade.dz/sdk/python',
    size: '180 KB',
    lastUpdated: new Date('2024-03-08'),
    quickStartCode: `# Import the SDK
from algeriatrade import AlgeriaTradeClient

# Initialize with your API key
client = AlgeriaTradeClient(
    api_key="your_api_key_here",
    environment="production"  # or "sandbox"
)

# Fetch products
products = client.products.list(
    category="textile",
    wilaya="16",
    limit=20
)

print(f"Found {products.meta.pagination.total} products")

for product in products.data:
    print(f"{product.name}: {product.price} DZD")

# Create a new order
order = client.orders.create(
    items=[
        {"product_id": "prod_abc123", "quantity": 100}
    ],
    shipping_address={
        "full_name": "Company Name",
        "phone": "+213 XXX XXX XXX",
        "wilaya": "16",
        "address": "123 Business Street"
    },
    payment_method="ccp"
)

print(f"Order created: {order.data.id}")

# Async usage
import asyncio

async def main():
    async with AsyncAlgeriaTradeClient(api_key="...") as client:
        products = await client.products.list()
        print(products)

asyncio.run(main())`,
    changelog: [
      {
        version: '2.3.0',
        date: '2024-03-08',
        type: 'minor',
        changes: ['Added async context manager support', 'Fixed pagination bugs', 'Better error handling']
      },
      {
        version: '2.2.0',
        date: '2024-02-20',
        type: 'minor',
        changes: ['Added Django management commands', 'Webhook handler decorators', 'Request caching']
      },
      {
        version: '2.0.0',
        date: '2024-01-20',
        type: 'major',
        changes: ['Migrated to Pydantic v2', 'API v2 support', 'Breaking changes in models']
      }
    ]
  },
  {
    id: 'php',
    name: 'AlgeriaTrade PHP SDK',
    language: 'PHP 8.0+',
    languageIcon: '🐘',
    version: '1.8.2',
    status: 'stable',
    description: 'Official PHP SDK with Laravel and Symfony integration packages',
    features: [
      'PSR-18 HTTP client compatible',
      'Laravel & Symfony packages available',
      'Full API coverage',
      'Request/response caching',
      'Event system for webhooks',
      'PHPDoc throughout'
    ],
    installCommand: 'composer require algeriatrade/sdk',
    packageManager: 'composer',
    repositoryUrl: 'https://github.com/algeriatrade/php-sdk',
    docsUrl: 'https://docs.algeriatrade.dz/sdk/php',
    size: '156 KB',
    lastUpdated: new Date('2024-03-05'),
    quickStartCode: `<?php
require 'vendor/autoload.php';

use AlgeriaTrade\\\\SDK\\\\Client;
use AlgeriaTrade\\\\SDK\\\\Model\\\\ProductFilter;

// Initialize the client
$client = new Client([
    'api_key' => getenv('ALGERIATRADE_API_KEY'),
    'environment' => 'production'
]);

// Fetch products with filters
$filter = new ProductFilter();
$filter->setCategory('textile')
       ->setWilaya('16')
       ->setLimit(20);

$products = $client->products()->list($filter);

echo "Found " . $products->getMeta()->getPagination()->getTotal() . " products\\n";

foreach ($products->getData() as $product) {
    echo $product->getName() . ": " . $product->getPrice() . " DZD\\n";
}

// Create an order
$order = $client->orders()->create([
    'items' => [
        ['product_id' => 'prod_abc123', 'quantity' => 100]
    ],
    'shipping_address' => [
        'full_name' => 'Company Name',
        'phone' => '+213 XXX XXX XXX',
        'wilaya' => '16',
        'address' => '123 Business Street'
    ],
    'payment_method' => 'ccp'
]);

echo "Order created: " . $order->getData()->getId();

// Laravel usage (with facade)
use AlgeriaTrade\\\\Laravel\\\\Facades\\\\AlgeriaTrade;

$products = AlgeriaTrade::products()->list();`,
    changelog: [
      {
        version: '1.8.2',
        date: '2024-03-05',
        type: 'patch',
        changes: ['Fixed Guzzle 7 compatibility issue', 'Memory leak fix in streaming']
      },
      {
        version: '1.8.0',
        date: '2024-02-10',
        type: 'minor',
        changes: ['Added Laravel 11 support', 'New batch operations', 'Improved caching']
      },
      {
        version: '1.5.0',
        date: '2024-01-10',
        type: 'minor',
        changes: ['Symfony bundle released', 'PSR-18 abstraction', 'Custom middleware support']
      }
    ]
  },
  {
    id: 'java',
    name: 'AlgeriaTrade Java SDK',
    language: 'Java 11+',
    languageIcon: '☕',
    version: '1.2.0',
    status: 'beta',
    description: 'Official Java SDK for JVM-based applications including Spring Boot',
    features: [
      'Spring Boot auto-configuration',
      'Reactive/WebFlux support',
      'Full API coverage',
      'Jackson model classes',
      'SLF4J logging integration',
      'Maven & Gradle support'
    ],
    installCommand: '// Maven\n<dependency>\n  <groupId>com.algeriatrade</groupId>\n  <artifactId>algeriatrade-sdk</artifactId>\n  <version>1.2.0</version>\n</dependency>',
    packageManager: 'maven',
    repositoryUrl: 'https://github.com/algeriatrade/java-sdk',
    docsUrl: 'https://docs.algeriatrade.dz/sdk/java',
    size: '320 KB',
    lastUpdated: new Date('2024-02-28'),
    quickStartCode: `package com.example;

import com.algeriatrade.client.AlgeriaTradeClient;
import com.algeriatrade.model.*;
import com.algeriatrade.params.*;
import reactor.core.publisher.Mono;

public class Example {
    public static void main(String[] args) {
        // Initialize client
        AlgeriaTradeClient client = AlgeriaTradeClient.builder()
            .apiKey(System.getenv("ALGERIATRADE_API_KEY"))
            .environment(Environment.PRODUCTION)
            .build();
        
        // Sync call to list products
        ProductListResponse products = client.products().list(
            ProductListParams.builder()
                .category("textile")
                .wilaya("16")
                .limit(20)
                .build()
        );
        
        System.out.println("Found " + products.getMeta().getPagination().getTotal() + " products");
        
        for (Product product : products.getData()) {
            System.out.println(product.getName() + ": " + product.getPrice() + " DZD");
        }
        
        // Reactive call
        Mono<OrderResponse> orderMono = client.orders().create(
            OrderCreateParams.builder()
                .addItem(OrderItem.builder()
                    .productId("prod_abc123")
                    .quantity(100)
                    .build())
                .shippingAddress(ShippingAddress.builder()
                    .fullName("Company Name")
                    .phone("+213 XXX XXX XXX")
                    .wilaya("16")
                    .address("123 Business Street")
                    .build())
                .paymentMethod(PaymentMethod.CCP)
                .build()
        );
        
        orderMono.subscribe(order -> 
            System.out.println("Order created: " + order.getData().getId())
        );
    }
}`,
    changelog: [
      {
        version: '1.2.0',
        date: '2024-02-28',
        type: 'minor',
        changes: ['Added WebFlux reactive client', 'Spring Boot 3.x compatibility', 'New analytics module']
      },
      {
        version: '1.0.0',
        date: '2024-01-15',
        type: 'major',
        changes: ['Initial stable release', 'Core API coverage', 'Spring Boot starter']
      }
    ]
  }
];

export default function SDKDownloader() {
  const [selectedSdk, setSelectedSdk] = useState<SdkInfo>(SDKS[0]);
  const [selectedVersion, setSelectedVersion] = useState<string>(selectedSdk.version);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [expandedChangelog, setExpandedChangelog] = useState<string | null>(null);

  const handleCopyInstall = async () => {
    await navigator.clipboard.writeText(selectedSdk.installCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const getStatusBadge = (status: SdkInfo['status']) => {
    const config = {
      stable: { label: 'Stable', variant: 'default' as const, icon: <CheckCircle2 className="w-3 h-3" /> },
      beta: { label: 'Beta', variant: 'secondary' as const, icon: <Clock className="w-3 h-3" /> },
      alpha: { label: 'Alpha', variant: 'outline' as const, icon: <AlertTriangle className="w-3 h-3" /> },
      deprecated: { label: 'Deprecated', variant: 'destructive' as const, icon: <AlertTriangle className="w-3 h-3" /> },
    };
    return config[status];
  };

  const getChangelogBadge = (type: ChangelogEntry['type']) => {
    const config = {
      major: { label: 'MAJOR', variant: 'destructive' as const },
      minor: { label: 'MINOR', variant: 'default' as const },
      patch: { label: 'PATCH', variant: 'secondary' as const },
    };
    return config[type];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-7 h-7 text-primary" />
          SDK Downloads
        </h2>
        <p className="text-muted-foreground mt-1">
          Official SDKs to integrate AlgeriaTrade into your applications
        </p>
      </div>

      {/* SDK Selection Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SDKS.map(sdk => {
          const statusConfig = getStatusBadge(sdk.status);
          const isSelected = selectedSdk.id === sdk.id;
          
          return (
            <Card 
              key={sdk.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary border-primary' : ''
              }`}
              onClick={() => {
                setSelectedSdk(sdk);
                setSelectedVersion(sdk.version);
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{sdk.languageIcon}</span>
                  <Badge variant={statusConfig.variant} className="gap-1">
                    {statusConfig.icon}
                    {statusConfig.label}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-1">{sdk.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{sdk.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <code className="text-xs">v{sdk.version}</code>
                  <span className="text-xs text-muted-foreground">{sdk.size}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected SDK Details */}
      <Tabs defaultValue="install" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="install" className="gap-1">
            <Download className="w-4 h-4" />
            Install
          </TabsTrigger>
          <TabsTrigger value="quickstart" className="gap-1">
            <Terminal className="w-4 h-4" />
            Quick Start
          </TabsTrigger>
          <TabsTrigger value="changelog" className="gap-1">
            <FileText className="w-4 h-4" />
            Changelog
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-1">
            <BookOpen className="w-4 h-4" />
            Features
          </TabsTrigger>
        </TabsList>

        {/* Install Tab */}
        <TabsContent value="install" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-[1fr_350px] gap-6">
            {/* Installation Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Installation
                </CardTitle>
                <CardDescription>
                  Install {selectedSdk.name} using your preferred package manager
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Version Selector */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Version:</label>
                  <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSdk.changelog.map(entry => (
                        <SelectItem key={entry.version} value={entry.version}>
                          v{entry.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline">Latest: v{selectedSdk.version}</Badge>
                </div>

                <Separator />

                {/* Install Command */}
                <div>
                  <Label className="mb-2 block">Install Command</Label>
                  <div className="relative">
                    <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto pr-24">
                      <code>{selectedSdk.installCommand}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-3 right-3 gap-1"
                      onClick={handleCopyInstall}
                    >
                      {copiedCommand ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="font-medium mb-3">Requirements</h4>
                  <ul className="space-y-2">
                    {selectedSdk.id === 'javascript' && (
                      <>
                        <RequirementItem met>Node.js 18+ or modern browser</RequirementItem>
                        <RequirementItem met>npm, yarn, or pnpm</RequirementItem>
                        <RequirementItem>TypeScript 5+ (optional, for types)</RequirementItem>
                      </>
                    )}
                    {selectedSdk.id === 'python' && (
                      <>
                        <RequirementItem met>Python 3.8 or higher</RequirementItem>
                        <RequirementItem met>pip or pipenv</RequirementItem>
                        <RequirementItem>httpx (for async)</RequirementItem>
                      </>
                    )}
                    {selectedSdk.id === 'php' && (
                      <>
                        <RequirementItem met>PHP 8.0 or higher</RequirementItem>
                        <RequirementItem met>Composer 2.0+</RequirementItem>
                        <RequirementItem>ext-json enabled</RequirementItem>
                        <RequirementItem>Guzzle HTTP (optional)</RequirementItem>
                      </>
                    )}
                    {selectedSdk.id === 'java' && (
                      <>
                        <RequirementItem met>Java 11 or higher</RequirementItem>
                        <RequirementItem met>Maven 3.8+ or Gradle 7+</RequirementItem>
                        <RequirementItem>Spring Boot 3.x (optional)</RequirementItem>
                      </>
                    )}
                  </ul>
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button variant="outline" className="gap-1" asChild>
                    <a href={selectedSdk.repositoryUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  </Button>
                  <Button variant="outline" className="gap-1" asChild>
                    <a href={selectedSdk.docsUrl} target="_blank" rel="noopener noreferrer">
                      <BookOpen className="w-4 h-4" />
                      Full Documentation
                    </a>
                  </Button>
                  <Button variant="outline" className="gap-1" asChild>
                    <a href={`${selectedSdk.repositoryUrl}/issues`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      Report Issue
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <InfoRow label="Language" value={selectedSdk.language} />
                  <InfoRow label="Current Version" value={`v${selectedSdk.version}`} />
                  <InfoRow label="Status" value={
                    <Badge variant={getStatusBadge(selectedSdk.status).variant} className="gap-1">
                      {getStatusBadge(selectedSdk.status).icon}
                      {getStatusBadge(selectedSdk.status).label}
                    </Badge>
                  } />
                  <InfoRow label="Package Size" value={selectedSdk.size} />
                  <InfoRow label="Last Updated" value={formatDate(selectedSdk.lastUpdated)} />
                  <InfoRow label="License" value={<Badge variant="outline">MIT</Badge>} />
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Security Notice
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Always pin your dependency version in production. Review our 
                    <a href="#" className="text-primary hover:underline ml-1">security policy</a>.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Quick Start Tab */}
        <TabsContent value="quickstart" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Quick Start Guide
              </CardTitle>
              <CardDescription>
                Get up and running with {selectedSdk.name} in minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Step 1 */}
                <StepSection step={1} title="Install the SDK">
                  <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto">
                    <code>{selectedSdk.installCommand}</code>
                  </pre>
                </StepSection>

                {/* Step 2 */}
                <StepSection step={2} title="Get Your API Key">
                  <p className="text-muted-foreground mb-3">
                    Sign in to the developer portal and create an API key from the{' '}
                    <strong>API Keys</strong> section.
                  </p>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <p className="text-muted-foreground"># Set your API key as environment variable</p>
                    <p># For production, use a secrets manager</p>
                    <p className="mt-2 text-foreground">
                      {selectedSdk.id === 'javascript' && 'export ALGERIATRADE_API_KEY=at_your_api_key_here'}
                      {selectedSdk.id === 'python' && 'export ALGERIATRADE_API_KEY=at_your_api_key_here'}
                      {selectedSdk.id === 'php' && '# Add to .env file: ALGERIATRADE_API_KEY=at_your_api_key_here'}
                      {selectedSdk.id === 'java' && '# Add to application.properties: algeriatrade.api-key=at_your_api_key_here'}
                    </p>
                  </div>
                </StepSection>

                {/* Step 3 */}
                <StepSection step={3} title="Make Your First Request">
                  <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto max-h-[400px] overflow-y-auto">
                    <code>{selectedSdk.quickStartCode}</code>
                  </pre>
                </StepSection>

                {/* Next Steps */}
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-3">Next Steps</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start gap-2" asChild>
                      <a href={selectedSdk.docsUrl} target="_blank" rel="noopener noreferrer">
                        <BookOpen className="w-4 h-4" />
                        Read Full Documentation
                      </a>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2" asChild>
                      <a href="/developer/api-playground">
                        <Terminal className="w-4 h-4" />
                        Try API Playground
                      </a>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2" asChild>
                      <a href="/developer/webhooks">
                        <Code2 className="w-4 h-4" />
                        Set Up Webhooks
                      </a>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2" asChild>
                      <a href={selectedSdk.repositoryUrl}>
                        <Github className="w-4 h-4" />
                        View Examples on GitHub
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Changelog Tab */}
        <TabsContent value="changelog" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Changelog</CardTitle>
              <CardDescription>
                Recent updates and changes to {selectedSdk.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-4 pr-4">
                  {selectedSdk.changelog.map((entry) => {
                    const badgeConfig = getChangelogBadge(entry.type);
                    const isExpanded = expandedChangelog === entry.version;
                    
                    return (
                      <div key={entry.version} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedChangelog(isExpanded ? null : entry.version)}
                          className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-lg">v{entry.version}</span>
                            <Badge variant={badgeConfig.variant}>{badgeConfig.label}</Badge>
                            <span className="text-sm text-muted-foreground">{entry.date}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t bg-muted/30">
                            <ul className="mt-3 space-y-2">
                              {entry.changes.map((change, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                  {change}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              
              <Separator className="my-4" />
              
              <div className="flex items-center justify-between">
                <Button variant="outline" className="gap-1" asChild>
                  <a href={`${selectedSdk.repositoryUrl}/releases`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    View All Releases
                  </a>
                </Button>
                <p className="text-sm text-muted-foreground">
                  Full history available on GitHub
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {selectedSdk.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Supported APIs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {['Products', 'Orders', 'RFQs', 'Companies', 'Search', 'Analytics', 'Webhooks', 'Payments'].map(api => (
                      <Badge key={api} variant="secondary" className="justify-center py-1.5">{api}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Platform Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {selectedSdk.id === 'javascript' && (
                      <>
                        <SupportItem platform="Node.js 18+" supported />
                        <SupportItem platform="Browsers (ES2020+)" supported />
                        <SupportItem platform="Deno" supported />
                        <SupportItem platform="Bun" supported />
                        <SupportItem platform="Edge Runtimes" supported />
                      </>
                    )}
                    {selectedSdk.id === 'python' && (
                      <>
                        <SupportItem platform="CPython 3.8+" supported />
                        <SupportItem platform="PyPy" supported />
                        <SupportItem platform="Django 4.0+" supported />
                        <SupportItem platform="FastAPI" supported />
                        <SupportItem platform="Flask 2.0+" supported />
                      </>
                    )}
                    {selectedSdk.id === 'php' && (
                      <>
                        <SupportItem platform="PHP 8.0+" supported />
                        <SupportItem platform="Laravel 9+/10/11" supported />
                        <SupportItem platform="Symfony 6.0+" supported />
                        <SupportItem platform="Lumen" supported />
                        <SupportItem platform="Vanilla PHP" supported />
                      </>
                    )}
                    {selectedSdk.id === 'java' && (
                      <>
                        <SupportItem platform="Java 11+" supported />
                        <SupportItem platform="Spring Boot 3.x" supported />
                        <SupportItem platform="Spring Framework 6.x" supported />
                        <SupportItem platform="Quarkus" supported />
                        <SupportItem platform="Micronaut" supported />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function RequirementItem({ children, met }: { children: React.ReactNode; met?: boolean }) {
  return (
    <li className={`flex items-center gap-2 ${met ? '' : 'opacity-60'}`}>
      {met ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground shrink-0" />
      )}
      <span className="text-sm">{children}</span>
    </li>
  );
}

function StepSection({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
          {step}
        </div>
        <h4 className="font-semibold text-lg">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function SupportItem({ platform, supported }: { platform: string; supported?: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
      <span className="text-sm">{platform}</span>
      {supported ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      ) : (
        <span className="text-xs text-muted-foreground">Coming soon</span>
      )}
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
