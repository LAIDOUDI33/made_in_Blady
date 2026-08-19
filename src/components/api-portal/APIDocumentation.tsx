'use client';

import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Code2, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown,
  Terminal,
  FileJson,
  Eye,
  Key,
  Search,
  Filter,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ALGERIATRADE_ENDPOINTS,
  getEndpointsByCategory,
  getCategories,
  getEndpoint,
  type EndpointDefinition,
  type CodeExample
} from '@/lib/api-gateway/gateway';

type Language = 'curl' | 'python' | 'javascript' | 'php';

// Color coding for HTTP methods
const methodColors: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function APIDocumentation() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('curl');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showTryItOut, setShowTryItOut] = useState(false);
  
  const categories = useMemo(() => ['all', ...getCategories()], []);
  
  const filteredEndpoints = useMemo(() => {
    let endpoints = selectedCategory === 'all' 
      ? ALGERIATRADE_ENDPOINTS 
      : getEndpointsByCategory(selectedCategory);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      endpoints = endpoints.filter(e => 
        e.path.toLowerCase().includes(query) ||
        e.description.en.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query)
      );
    }
    
    return endpoints;
  }, [selectedCategory, searchQuery]);

  const handleCopyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            API Reference
          </h2>
          <p className="text-muted-foreground mt-1">
            Complete REST API documentation for AlgeriaTrade.dz platform
          </p>
        </div>
        <Badge variant="outline" className="gap-1 px-3 py-1">
          <Terminal className="w-4 h-4" />
          v2.0.0 • Stable
        </Badge>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Sidebar - Endpoint List */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Endpoints</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Category Filters */}
            <ScrollArea className="max-h-[400px]">
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="text-xs h-7"
                  >
                    {cat === 'all' ? 'All' : cat}
                  </Button>
                ))}
              </div>
              
              <Separator />
              
              {/* Endpoint List */}
              <div className="divide-y">
                {filteredEndpoints.map((endpoint, idx) => (
                  <button
                    key={`${endpoint.method}-${endpoint.path}-${idx}`}
                    onClick={() => {
                      setSelectedEndpoint(endpoint);
                      setShowTryItOut(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                      selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method
                        ? 'bg-primary/5 border-l-2 border-l-primary'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${methodColors[endpoint.method]}`}>
                        {endpoint.method}
                      </span>
                      <span className="font-mono text-sm truncate">{endpoint.path}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate pl-14">
                      {endpoint.description.en}
                    </p>
                  </button>
                ))}
                
                {filteredEndpoints.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No endpoints found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content - Endpoint Details */}
        {selectedEndpoint ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded font-mono font-bold ${methodColors[selectedEndpoint.method]}`}>
                    {selectedEndpoint.method}
                  </span>
                  <div>
                    <CardTitle className="font-mono text-lg">
                      /v2{selectedEndpoint.path}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {selectedEndpoint.description.en}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedEndpoint.category}</Badge>
                  {selectedEndpoint.deprecated && (
                    <Badge variant="destructive">Deprecated</Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="gap-1">
                    <Eye className="w-4 h-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="try-it" className="gap-1">
                    <Terminal className="w-4 h-4" />
                    Try It Out
                  </TabsTrigger>
                  <TabsTrigger value="code" className="gap-1">
                    <Code2 className="w-4 h-4" />
                    Code Samples
                  </TabsTrigger>
                  <TabsTrigger value="schema" className="gap-1">
                    <FileJson className="w-4 h-4" />
                    Schema
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                  {/* Description in multiple languages */}
                  <div>
                    <h4 className="font-semibold mb-3">Description</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <LanguageBlock label="English" text={selectedEndpoint.description.en} lang="en" />
                      <LanguageBlock label="Français" text={selectedEndpoint.description.fr} lang="fr" />
                      <LanguageBlock label="العربية" text={selectedEndpoint.description.ar} lang="ar" dir="rtl" />
                    </div>
                  </div>

                  {/* Parameters Table */}
                  {selectedEndpoint.parameters.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Parameters</h4>
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 font-medium">Name</th>
                              <th className="text-left p-3 font-medium">Type</th>
                              <th className="text-left p-3 font-medium">In</th>
                              <th className="text-left p-3 font-medium">Required</th>
                              <th className="text-left p-3 font-medium">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {selectedEndpoint.parameters.map((param, i) => (
                              <tr key={i} className="hover:bg-muted/30">
                                <td className="p-3 font-mono text-primary">{param.name}</td>
                                <td className="p-3">
                                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{param.type}</code>
                                </td>
                                <td className="p-3">
                                  <Badge variant="outline" className="text-xs capitalize">{param.in}</Badge>
                                </td>
                                <td className="p-3">
                                  {param.required ? (
                                    <Badge variant="destructive" className="text-xs">Required</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                                  )}
                                </td>
                                <td className="p-3 text-muted-foreground">{param.description.en}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Required Permissions */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Required Permissions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEndpoint.permissions.map(perm => (
                        <code key={perm} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                          {perm}
                        </code>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Try It Out Tab */}
                <TabsContent value="try-it" className="mt-6 space-y-6">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Test this endpoint</h4>
                      <Button size="sm" onClick={() => setShowTryItOut(!showTryItOut)}>
                        {showTryItOut ? 'Reset' : 'Send Request'}
                      </Button>
                    </div>
                    
                    {/* URL Builder */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Request URL</label>
                        <div className="flex rounded-md border bg-background">
                          <span className={`px-3 py-2 rounded-l-md font-mono text-sm font-semibold ${methodColors[selectedEndpoint.method]} border-r`}>
                            {selectedEndpoint.method}
                          </span>
                          <Input 
                            readOnly 
                            value={`https://api.algeriatrade.dz/v2${selectedEndpoint.path}`} 
                            className="border-0 font-mono text-sm"
                          />
                        </div>
                      </div>

                      {/* Headers */}
                      <div>
                        <label className="text-sm font-medium mb-1 block">Headers</label>
                        <div className="grid md:grid-cols-2 gap-2">
                          <div>
                            <Input placeholder="Authorization: Bearer at_xxxx..." defaultValue="Bearer at_demo_key_here" />
                            <p className="text-xs text-muted-foreground mt-1">Your API Key</p>
                          </div>
                          <div>
                            <Input placeholder="Accept: application/json" defaultValue="application/json" />
                            <p className="text-xs text-muted-foreground mt-1">Response Format</p>
                          </div>
                        </div>
                      </div>

                      {/* Query Parameters (for GET requests) */}
                      {(selectedEndpoint.method === 'GET' || selectedEndpoint.method === 'DELETE') && (
                        <div>
                          <label className="text-sm font-medium mb-1 block">Query Parameters</label>
                          <div className="space-y-2">
                            {selectedEndpoint.parameters
                              .filter(p => p.in === 'query')
                              .map(param => (
                                <div key={param.name} className="grid grid-cols-[120px_1fr_auto] gap-2 items-center">
                                  <code className="text-sm text-right">{param.name}</code>
                                  <Input 
                                    placeholder={param.type} 
                                    defaultValue={param.defaultValue}
                                  />
                                  {param.required && (
                                    <Badge variant="destructive" className="text-xs">*</Badge>
                                  )}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}

                      {/* Body (for POST/PUT/PATCH) */}
                      {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT' || selectedEndpoint.method === 'PATCH') && (
                        <div>
                          <label className="text-sm font-medium mb-1 block">Request Body (JSON)</label>
                          <textarea 
                            className="w-full min-h-[150px] p-3 rounded-md border bg-background font-mono text-sm resize-y"
                            defaultValue={JSON.stringify(
                              selectedEndpoint.requestSchema?.properties || {}, 
                              null, 
                              2
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Response Preview */}
                    {showTryItOut && (
                      <div className="mt-6">
                        <Separator className="mb-4" />
                        <h4 className="font-semibold mb-2">Response</h4>
                        <div className="rounded-md bg-slate-950 text-slate-100 p-4 font-mono text-sm overflow-x-auto">
                          <pre>{JSON.stringify({
                            success: true,
                            data: generateMockResponse(selectedEndpoint),
                            meta: {
                              queriedAt: new Date().toISOString(),
                              apiVersion: "v2",
                              requestId: `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`,
                              pagination: {
                                page: 1,
                                limit: 20,
                                total: 156,
                                totalPages: 8
                              }
                            }
                          }, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Code Samples Tab */}
                <TabsContent value="code" className="mt-6 space-y-6">
                  {/* Language Selector */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Code Examples</h4>
                    <div className="flex rounded-md border overflow-hidden">
                      {(['curl', 'python', 'javascript', 'php'] as Language[]).map(lang => (
                        <button
                          key={lang}
                          onClick={() => setSelectedLanguage(lang)}
                          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                            selectedLanguage === lang 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          {lang === 'javascript' ? 'JS' : lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code Examples List */}
                  <div className="space-y-4">
                    {selectedEndpoint.examples.length > 0 ? (
                      selectedEndpoint.examples.map((example, idx) => (
                        <CodeExampleBlock
                          key={idx}
                          example={example}
                          language={selectedLanguage}
                          isCopied={copiedCode === `${selectedEndpoint.path}-${idx}`}
                          onCopy={() => handleCopyCode(example.code, `${selectedEndpoint.path}-${idx}`)}
                        />
                      ))
                    ) : (
                      /* Generate examples based on method */
                      <CodeExampleBlock
                        example={{
                          language: selectedLanguage,
                          code: generateCodeSnippet(selectedEndpoint, selectedLanguage),
                          description: `${selectedEndpoint.method} request to ${selectedEndpoint.path}`
                        }}
                        language={selectedLanguage}
                        isCopied={copiedCode === `${selectedEndpoint.path}-generated`}
                        onCopy={() => handleCopyCode(generateCodeSnippet(selectedEndpoint, selectedLanguage), `${selectedEndpoint.path}-generated`)}
                      />
                    )}
                  </div>

                  {/* Authentication Examples */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Authentication Setup
                    </h4>
                    <AuthExamples language={selectedLanguage} onCopy={(code) => handleCopyCode(code, 'auth')} isCopied={copiedCode === 'auth'} />
                  </div>
                </TabsContent>

                {/* Schema Tab */}
                <TabsContent value="schema" className="mt-6 space-y-6">
                  {/* Request Schema */}
                  {selectedEndpoint.requestSchema && (
                    <div>
                      <h4 className="font-semibold mb-3">Request Schema</h4>
                      <SchemaViewer schema={selectedEndpoint.requestSchema} type="request" />
                    </div>
                  )}

                  {/* Response Schema */}
                  {selectedEndpoint.responseSchema && (
                    <div>
                      <h4 className="font-semibold mb-3">Response Schema</h4>
                      <SchemaViewer schema={selectedEndpoint.responseSchema} type="response" />
                    </div>
                  )}

                  {/* Error Responses */}
                  <div>
                    <h4 className="font-semibold mb-3">Error Responses</h4>
                    <div className="space-y-3">
                      <ErrorCard status={401} message="Unauthorized - Invalid or missing API key" code="UNAUTHORIZED" />
                      <ErrorCard status={403} message="Forbidden - Insufficient permissions" code="FORBIDDEN" />
                      <ErrorCard status={429} message="Rate limit exceeded - Too many requests" code="RATE_LIMITED" />
                      <ErrorCard status={500} message="Internal server error" code="INTERNAL_ERROR" />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center min-h-[500px]">
            <CardContent className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">Select an Endpoint</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Choose an endpoint from the sidebar to view its documentation, try it out, and see code examples.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function LanguageBlock({ label, text, lang, dir }: { label: string; text: string; lang: string; dir?: 'ltr' | 'rtl' }) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <Badge variant="outline" className="mb-2 text-xs">{label}</Badge>
      <p className={`text-sm ${dir === 'rtl' ? 'text-right' : ''}`} dir={dir}>{text}</p>
    </div>
  );
}

function CodeExampleBlock({ 
  example, 
  language, 
  isCopied, 
  onCopy 
}: { 
  example: CodeExample; 
  language: Language; 
  isCopied: boolean;
  onCopy: () => void;
}) {
  // For now, show the example if it matches the selected language, otherwise show a generic one
  const displayCode = example.language === language ? example.code : generateGenericExample(language);

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs capitalize">{language}</Badge>
          <span className="text-sm text-muted-foreground">{example.description}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onCopy} className="gap-1 h-7">
          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {isCopied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="bg-slate-950 text-slate-100 p-4 overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed"><code>{displayCode}</code></pre>
      </div>
    </div>
  );
}

function AuthExamples({ language, onCopy, isCopied }: { language: Language; onCopy: (code: string) => void; isCopied: boolean }) {
  const authCodes: Record<Language, string> = {
    curl: `# Set your API key as an environment variable
export ALGERIATRADE_API_KEY="at_your_api_key_here"

# Use it in requests
curl -H "Authorization: Bearer $ALGERIATRADE_API_KEY" \\
  https://api.algeriatrace.dz/v2/products`,
    
    python: `import os
from algeriatrade import AlgeriaTradeClient

# Initialize with your API key
client = AlgeriaTradeClient(api_key=os.environ["ALGERIATRADE_API_KEY"])

# All requests are automatically authenticated
products = client.products.list(category="textile")`,
    
    javascript: `// Import the SDK
import { AlgeriaTrade } from '@algeriatrade/sdk';

// Initialize with your API key
const client = new AlgeriaTrade({
  apiKey: process.env.ALGERIATRADE_API_KEY,
  environment: 'production'
});

// All requests are automatically authenticated
const products = await client.products.list({ category: 'textile' });`,
    
    php: `<?php
require 'vendor/autoload.php';

use AlgeriaTrade\\SDK\\Client;

// Initialize with your API key
$client = new Client([
    'api_key' => getenv('ALGERIATRADE_API_KEY'),
    'environment' => 'production'
]);

// All requests are automatically authenticated
$products = $client->products()->list(['category' => 'textile']);`
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
        <span className="text-sm text-muted-foreground">API Key Authentication ({language})</span>
        <Button variant="ghost" size="sm" onClick={() => onCopy(authCodes[language])} className="gap-1 h-7">
          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {isCopied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="bg-slate-950 text-slate-100 p-4 overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed"><code>{authCodes[language]}</code></pre>
      </div>
    </div>
  );
}

function SchemaViewer({ schema, type }: { schema: object; type: 'request' | 'response' }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
        <Badge variant={type === 'request' ? 'default' : 'secondary'}>
          {type === 'request' ? 'Request Body' : 'Response Body'}
        </Badge>
        <Button variant="ghost" size="sm" className="gap-1 h-7" onClick={() => navigator.clipboard.writeText(JSON.stringify(schema, null, 2))}>
          <Copy className="w-3.5 h-3.5" />
          Copy JSON
        </Button>
      </div>
      <div className="bg-slate-950 text-slate-100 p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
        <pre className="font-mono text-sm leading-relaxed"><code>{JSON.stringify(schema, null, 2)}</code></pre>
      </div>
    </div>
  );
}

function ErrorCard({ status, message, code }: { status: number; message: string; code: string }) {
  const isError = status >= 500;
  const isWarning = status >= 400 && status < 500;
  
  return (
    <div className={`p-4 rounded-lg border ${
      isError ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' :
      isWarning ? 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800' :
      'bg-muted'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`font-mono font-bold text-lg ${
          isError ? 'text-red-600 dark:text-red-400' :
          isWarning ? 'text-amber-600 dark:text-amber-400' :
          'text-foreground'
        }`}>{status}</span>
        <div>
          <code className="text-sm font-medium">{code}</code>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateMockResponse(endpoint: EndpointDefinition): any {
  // Generate mock data based on endpoint path
  if (endpoint.path.includes('/products')) {
    return Array.from({ length: 5 }, (_, i) => ({
      id: `prod_${i + 1}`,
      name: `Sample Product ${i + 1}`,
      nameAr: `منتج تجريبي ${i + 1}`,
      slug: `sample-product-${i + 1}`,
      price: Math.floor(Math.random() * 10000) + 500,
      currency: 'DZD',
      category: 'electronics',
      images: [`https://cdn.algeriatrade.dz/products/${i + 1}/main.jpg`],
      supplier: {
        id: `supp_${i + 1}`,
        name: `Supplier ${i + 1}`,
        verified: true
      }
    }));
  }
  
  if (endpoint.path.includes('/orders')) {
    return Array.from({ length: 3 }, (_, i) => ({
      id: `ord_${Date.now()}_${i}`,
      status: ['pending', 'confirmed', 'shipped'][i],
      totalAmount: Math.floor(Math.random() * 50000) + 10000,
      createdAt: new Date().toISOString(),
      itemsCount: Math.floor(Math.random() * 5) + 1
    }));
  }
  
  return { message: 'Success', timestamp: new Date().toISOString() };
}

function generateCodeSnippet(endpoint: EndpointDefinition, language: Language): string {
  const url = `https://api.algeriatrade.dz/v2${endpoint.path}`;
  
  switch (language) {
    case 'curl':
      return `curl -X ${endpoint.method} "${url}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"${endpoint.method !== 'GET' ? ' \\\n  -H "Content-Type: application/json" \\\n  -d \'{}\'\'' : ''}`;
      
    case 'python':
      return `import requests

response = requests.${endpoint.method.toLowerCase()}(
    "${url}",
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Accept": "application/json"
    }${endpoint.method !== 'GET' ? ',\n    json={}' : ''}
)

data = response.json()
print(data)`;
      
    case 'javascript':
      return `const response = await fetch("${url}", {
  method: "${endpoint.method}",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Accept": "application/json"${endpoint.method !== 'GET' ? ',\n    "Content-Type": "application/json"' : ''}
  }${endpoint.method !== 'GET' ? ',\n  body: JSON.stringify({})' : ''}
});

const data = await response.json();
console.log(data);`;
      
    case 'php':
      return `$client = new GuzzleHttp\\Client();

$response = $client->${endpoint.method.toLowerCase()}("${url}", [
    "headers" => [
        "Authorization" => "Bearer YOUR_API_KEY",
        "Accept" => "application/json"
    ]${endpoint.method !== 'GET' ? ',\n    "json" => []' : ''}
]);

$data = json_decode($response->getBody(), true);`;
      
    default:
      return '';
  }
}

function generateGenericExample(language: Language): string {
  const genericSnippets: Record<Language, string> = {
    curl: `curl -X GET "https://api.algeriatrade.dz/v2/endpoint" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"`,
    
    python: `import requests

response = requests.get(
    "https://api.algeriatrade.dz/v2/endpoint",
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)
data = response.json()`,
    
    javascript: `const response = await fetch(
  'https://api.algeriatrade.dz/v2/endpoint',
  { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
);
const data = await response.json();`,
    
    php: `$response = $client->get('https://api.algeriatrade.dz/v2/endpoint', [
    'headers' => ['Authorization' => 'Bearer YOUR_API_KEY']
]);
$data = json_decode($response->getBody(), true);`
  };
  
  return genericSnippets[language];
}
