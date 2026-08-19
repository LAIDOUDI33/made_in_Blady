'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Code2, 
  Shield, 
  Zap, 
  Globe, 
  Key, 
  Webhook,
  Terminal,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Users,
  Server
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Code2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AlgeriaTrade.dz</h1>
                <p className="text-xs text-muted-foreground">API Developer Portal</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1 hidden sm:flex">
                <Server className="w-3 h-3" />
                v2.0 Stable
              </Badge>
              
              <Link href="/developer">
                <Button size="sm" className="gap-1">
                  Open Developer Portal
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link href="/admin/developer-portal">
                <Button variant="outline" size="sm" className="gap-1 hidden sm:flex">
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4 gap-1">
                <Zap className="w-3 h-3" />
                Now in Production - v2.0
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                AlgeriaTrade{' '}
                <span className="text-primary">Developer Portal</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Build powerful integrations with Algeria's largest B2B marketplace. 
                Access products, orders, RFQs, and more through our comprehensive REST API.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link href="/developer">
                  <Button size="lg" className="gap-2 text-base px-8">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                
                <Link href="/developer#playground">
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                    <Terminal className="w-5 h-5" />
                    Try API Playground
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                <QuickStat value="15+" label="API Endpoints" />
                <QuickStat value="99.97%" label="Uptime SLA" />
                <QuickStat value="<150ms" label="Avg Response" />
                <QuickStat value="4" label="SDK Languages" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Overview */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Complete Developer Platform</h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Everything you need to integrate with AlgeriaTrade.dz B2B marketplace
            </p>

            <Tabs defaultValue="api" className="w-full max-w-5xl mx-auto">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="api" className="gap-1">
                  <BookOpen className="w-4 h-4" />
                  API Reference
                </TabsTrigger>
                <TabsTrigger value="keys" className="gap-1">
                  <Key className="w-4 h-4" />
                  API Keys
                </TabsTrigger>
                <TabsTrigger value="webhooks" className="gap-1">
                  <Webhook className="w-4 h-4" />
                  Webhooks
                </TabsTrigger>
                <TabsTrigger value="sdks" className="gap-1">
                  <Code2 className="w-4 h-4" />
                  SDKs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="api" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-primary" />
                      Interactive API Documentation
                    </CardTitle>
                    <CardDescription>
                      Complete REST API reference with try-it-out console, code examples, and response schemas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {[
                        'Products API - Search & browse catalog',
                        'Orders API - Create & manage orders',
                        'RFQs API - Submit & respond to quotes',
                        'Companies API - Business directory access',
                        'Search API - Full-text search across platform',
                        'Analytics API - Market insights & trends',
                        'Webhooks API - Real-time event subscriptions',
                        'Payments API - Multiple payment methods',
                        'Account API - Developer account management',
                      ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-slate-100">
                        <code>{`// Example: Fetch textile products from Bejaia
GET /v2/products?category=textile&wilaya=16&limit=10

Response:
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": { "page": 1, "total": 156 }
  }
}`}</code>
                      </pre>
                    </div>
                    
                    <div className="mt-4">
                      <Link href="/developer">
                        <Button className="gap-1">
                          Explore Full Documentation
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="keys" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-6 h-6 text-primary" />
                      Secure API Key Management
                    </CardTitle>
                    <CardDescription>
                      Generate, manage, and monitor your API keys with fine-grained permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Key Features</h4>
                        <ul className="space-y-2">
                          {[
                            'Secure key generation (SHA-256 hashed)',
                            'Granular permission control (read/write/admin)',
                            'Configurable rate limits per key',
                            'IP address whitelisting',
                            'Usage statistics dashboard',
                            'Automatic key rotation workflow',
                          ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-semibold">Permission Scopes</h4>
                        <div className="flex flex-wrap gap-2">
                          {['products:read', 'products:write', 'orders:read', 'orders:write', 
                            'rfq:read', 'rfq:write', 'companies:read', 'search', 
                            'analytics:read', 'webhooks:manage'].map(perm => (
                            <code key={perm} className="bg-muted px-2 py-1 rounded text-xs">{perm}</code>
                          ))}
                        </div>
                        
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            ⚠️ Keys are only shown once at creation. Store them securely!
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="webhooks" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Webhook className="w-6 h-6 text-primary" />
                      Real-time Webhooks
                    </CardTitle>
                    <CardDescription>
                      Receive instant notifications for orders, RFQs, messages, and more
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Available Events</h4>
                        <div className="space-y-2">
                          {[
                            { event: 'order.created', desc: 'New order placed' },
                            { event: 'order.updated', desc: 'Order status changed' },
                            { event: 'order.shipped', desc: 'Order shipped' },
                            { event: 'rfq.created', desc: 'New RFQ submitted' },
                            { event: 'product.created', desc: 'Product listed' },
                            { event: 'message.received', desc: 'New message' },
                          ].map(({ event, desc }, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                              <code className="text-xs font-mono">{event}</code>
                              <span className="text-xs text-muted-foreground">{desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Security Features</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-primary mt-0.5" />
                            HMAC-SHA256 signature verification
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-primary mt-0.5" />
                            Timestamp validation (5-min window)
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-primary mt-0.5" />
                            Configurable retry policies
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-primary mt-0.5" />
                            Delivery logs & monitoring
                          </li>
                        </ul>
                        
                        <div className="mt-4 bg-slate-950 rounded-lg p-3 overflow-x-auto">
                          <pre className="text-xs text-slate-300">
{`{
  "event": "order.created",
  "data": { "orderId": "ord_123", ... },
  "timestamp": "2024-03-15T10:30:00Z",
  "signature": "t=1710491400,v1=abc..."
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sdks" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="w-6 h-6 text-primary" />
                      Official SDKs
                    </CardTitle>
                    <CardDescription>
                      Pre-built libraries for popular programming languages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { lang: 'JavaScript', icon: '🟨', version: '2.4.1', status: 'Stable', install: 'npm install @algeriatrade/sdk' },
                        { lang: 'Python', icon: '🐍', version: '2.3.0', status: 'Stable', install: 'pip install algeriatrade-sdk' },
                        { lang: 'PHP', icon: '🐘', version: '1.8.2', status: 'Stable', install: 'composer require algeriatrade/sdk' },
                        { lang: 'Java', icon: '☕', version: '1.2.0', status: 'Beta', install: 'Maven dependency' },
                      ].map((sdk, i) => (
                        <div key={i} className="p-4 rounded-lg border hover:border-primary transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{sdk.icon}</span>
                            <Badge variant={sdk.status === 'Stable' ? 'default' : 'secondary'}>
                              {sdk.status}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{sdk.lang} SDK</h4>
                          <p className="text-xs text-muted-foreground mb-2">v{sdk.version}</p>
                          <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                            {sdk.install}
                          </code>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6">
                      <Link href="/developer">
                        <Button variant="outline" className="gap-1">
                          View SDK Documentation & Downloads
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card>
                <CardHeader className="text-center pb-0">
                  <CardTitle>Free</CardTitle>
                  <CardDescription className="mt-2">
                    <span className="text-3xl font-bold">$0</span>
                    <span className="text-muted-foreground"> /month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm mb-6">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100 requests/day</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Products & Search APIs</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Community support</li>
                  </ul>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/developer">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="ring-2 ring-primary relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Popular</Badge>
                </div>
                <CardHeader className="text-center pb-0">
                  <CardTitle>Professional</CardTitle>
                  <CardDescription className="mt-2">
                    <span className="text-3xl font-bold">9,990</span>
                    <span className="text-muted-foreground"> DZD/month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm mb-6">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 10,000 requests/day</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> All API endpoints</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time webhooks</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Priority support</li>
                  </ul>
                  <Button className="w-full" asChild>
                    <Link href="/developer">Start Pro Trial</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center pb-0">
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription className="mt-2">
                    <span className="text-3xl font-bold">Custom</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm mb-6">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited requests</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> SLA 99.9% guarantee</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 24/7 dedicated support</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> On-premise option</li>
                  </ul>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="#">Contact Sales</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA to Developer Portal */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardContent className="py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
                      <Zap className="w-6 h-6 text-primary" />
                      Ready to Start Building?
                    </h2>
                    <p className="text-muted-foreground max-w-xl">
                      Join thousands of developers integrating with AlgeriaTrade.dz. 
                      Create your free developer account and get your API key in minutes.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                    <Link href="/developer">
                      <Button size="lg" className="gap-2">
                        Open Developer Portal
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </Link>
                    <Link href="/admin/developer-portal">
                      <Button size="lg" variant="outline" className="gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Code2 className="w-4 h-4" />
              AlgeriaTrade.dz API Developer Portal v2.0
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/developer" className="hover:text-foreground">Developer Portal</Link>
              <Link href="/admin/developer-portal" className="hover:text-foreground">Admin</Link>
              <span>•</span>
              <span>15+ Endpoints</span>
              <span>•</span>
              <span>99.97% Uptime</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function QuickStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
