'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Code2,
  Zap,
  Shield,
  Globe,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Terminal,
  Key,
  Webhook,
  Package,
  Users,
  MessageSquare,
  ExternalLink,
  Github,
  Twitter,
  Star,
  Clock,
  AlertCircle,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import APIDocumentation from '@/components/api-portal/APIDocumentation';
import APIKeyManager from '@/components/api-portal/APIKeyManager';
import WebhookConfigurator from '@/components/api-portal/WebhookConfigurator';
import SDKDownloader from '@/components/api-portal/SDKDownloader';
import APIPlayground from '@/components/api-portal/APIPlayground';
import { API_PLANS } from '@/lib/api-marketplace/types';

// Navigation items for documentation
const DOC_NAV_ITEMS = [
  { id: 'getting-started', label: 'Getting Started', icon: <Zap className="w-4 h-4" /> },
  { id: 'authentication', label: 'Authentication', icon: <Key className="w-4 h-4" /> },
  { id: 'api-reference', label: 'API Reference', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'sdks', label: 'SDKs', icon: <Package className="w-4 h-4" /> },
  { id: 'webhooks', label: 'Webhooks', icon: <Webhook className="w-4 h-4" /> },
  { id: 'playground', label: 'API Playground', icon: <Terminal className="w-4 h-4" /> },
];

export default function DeveloperPortalPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // API Status mock data
  const apiStatus = {
    overall: 'operational' as const,
    uptime: '99.97%',
    responseTime: '124ms',
    lastIncident: null,
    services: [
      { name: 'API Gateway', status: 'operational' },
      { name: 'Products API', status: 'operational' },
      { name: 'Orders API', status: 'operational' },
      { name: 'RFQs API', status: 'operational' },
      { name: 'Search API', status: 'operational' },
      { name: 'Analytics API', status: 'degraded' },
      { name: 'Webhooks', status: 'operational' },
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Code2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">AlgeriaTrade.dz</h1>
                <p className="text-xs text-muted-foreground">Developer Portal</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => setActiveSection('overview')}
                className={`text-sm font-medium transition-colors ${activeSection === 'overview' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveSection('docs')}
                className={`text-sm font-medium transition-colors ${activeSection === 'docs' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Documentation
              </button>
              <button 
                onClick={() => setActiveSection('playground')}
                className={`text-sm font-medium transition-colors ${activeSection === 'playground' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Playground
              </button>
              <Button variant="outline" size="sm" asChild>
                <a href="#pricing">Get API Key</a>
              </Button>
            </nav>

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden pt-4 pb-2 border-t mt-3 space-y-2">
              <button onClick={() => { setActiveSection('overview'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted">Overview</button>
              <button onClick={() => { setActiveSection('docs'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted">Documentation</button>
              <button onClick={() => { setActiveSection('playground'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted">Playground</button>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a href="#pricing">Get API Key</a>
              </Button>
            </nav>
          )}
        </div>
      </header>

      <main>
        {/* OVERVIEW SECTION */}
        {activeSection === 'overview' && (
          <>
            {/* Hero Section */}
            <section className="bg-gradient-to-b from-primary/5 via-background to-background border-b">
              <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto text-center">
                  <Badge variant="secondary" className="mb-4 gap-1">
                    <Zap className="w-3 h-3" />
                    Now in Stable v2.0
                  </Badge>
                  
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                    Build with the{' '}
                    <span className="text-primary">AlgeriaTrade API</span>
                  </h1>
                  
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    Integrate Algeria's largest B2B marketplace into your applications. 
                    Access products, orders, RFQs, and more with our comprehensive REST API.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                    <Button size="lg" onClick={() => setActiveSection('docs')} className="gap-2 text-base px-8">
                      Get Started Free
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setActiveSection('playground')} className="gap-2 text-base px-8">
                      <Terminal className="w-5 h-5" />
                      Try the API
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                    <StatCard value="15+" label="API Endpoints" />
                    <StatCard value="99.97%" label="Uptime SLA" />
                    <StatCard value="<150ms" label="Avg Response" />
                    <StatCard value="4" label="SDK Languages" />
                  </div>
                </div>
              </div>
            </section>

            {/* Features Grid */}
            <section className="py-20">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-4">Everything You Need to Build</h2>
                <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                  Our developer platform provides all the tools and resources you need to integrate AlgeriaTrade into your workflow.
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FeatureCard
                    icon={<BookOpen className="w-8 h-8" />}
                    title="Comprehensive Documentation"
                    description="Detailed API reference with examples in cURL, Python, JavaScript, and PHP."
                  />
                  <FeatureCard
                    icon={<Terminal className="w-8 h-8" />}
                    title="Interactive Playground"
                    description="Test API endpoints directly in your browser with our built-in testing console."
                  />
                  <FeatureCard
                    icon={<Package className="w-8 h-8" />}
                    title="Official SDKs"
                    description="Pre-built libraries for JavaScript, Python, PHP, and Java to accelerate development."
                  />
                  <FeatureCard
                    icon={<Shield className="w-8 h-8" />}
                    title="Enterprise Security"
                    description="OAuth 2.0, API key authentication, IP whitelisting, and webhook signature verification."
                  />
                  <FeatureCard
                    icon={<Webhook className="w-8 h-8" />}
                    title="Real-time Webhooks"
                    description="Receive instant notifications for orders, RFQs, and other important events."
                  />
                  <FeatureCard
                    icon={<Globe className="w-8 h-8" />}
                    title="Global Infrastructure"
                    description="Edge-deployed API with automatic failover and 99.97% uptime guarantee."
                  />
                </div>
              </div>
            </section>

            {/* Getting Started Quick Guide */}
            <section className="py-20 bg-muted/30">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Quick Start Guide</h2>

                <div className="max-w-4xl mx-auto">
                  <div className="space-y-8">
                    <StepCard 
                      step={1}
                      title="Create Your Account"
                      description="Sign up for a free developer account on AlgeriaTrade.dz"
                      code={null}
                    />
                    <StepCard 
                      step={2}
                      title="Generate an API Key"
                      description="Navigate to the API Keys section and create your first credential"
                      code={`curl -X POST "https://api.algeriatrade.dz/v2/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "dev@example.com", "company": "My Company"}'`}
                    />
                    <StepCard 
                      step={3}
                      title="Make Your First Request"
                      description="Use your API key to fetch products from the marketplace"
                      code={`curl "https://api.algeriatrade.dz/v2/products?limit=5" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"`}
                    />
                    <StepCard 
                      step={4}
                      title="Set Up Webhooks (Optional)"
                      description="Configure webhooks to receive real-time event notifications"
                      code={`curl -X POST "https://api.algeriatrade.dz/v2/webhooks" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/webhooks",
    "events": ["order.created", "order.updated"]
  }'`}
                    />
                  </div>

                  <div className="text-center mt-12">
                    <Button size="lg" onClick={() => setActiveSection('docs')} className="gap-2">
                      Read Full Documentation
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* API Status Section */}
            <section className="py-20">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">System Status</h2>

                <div className="max-w-3xl mx-auto">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            apiStatus.overall === 'operational' ? 'bg-emerald-500' : 
                            apiStatus.overall === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          <span className="font-semibold text-lg capitalize">{apiStatus.overall}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>Uptime: <strong>{apiStatus.uptime}</strong></span>
                          <span>Avg Response: <strong>{apiStatus.responseTime}</strong></span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {apiStatus.services.map((service) => (
                          <div key={service.name} className="flex items-center justify-between py-2 border-b last:border-b-0">
                            <span>{service.name}</span>
                            <Badge 
                              variant={
                                service.status === 'operational' ? 'default' :
                                service.status === 'degraded' ? 'secondary' : 'destructive'
                              }
                              className="gap-1"
                            >
                              {service.status === 'operational' && <CheckCircle2 className="w-3 h-3" />}
                              {service.status === 'degraded' && <AlertCircle className="w-3 h-3" />}
                              {service.status === 'down' && <X className="w-3 h-3" />}
                              {service.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Last incident: {apiStatus.lastIncident || 'None in the past 90 days'}
                        </p>
                        <Button variant="link" className="p-0 h-auto mt-1">
                          View full status page →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Pricing Tiers */}
            <section id="pricing" className="py-20 bg-muted/30">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-4">Choose Your Plan</h2>
                <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                  Start free and scale as you grow. All plans include access to our sandbox environment.
                </p>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {API_PLANS.map((plan) => (
                    <Card 
                      key={plan.id} 
                      className={`relative ${plan.isPopular ? 'ring-2 ring-primary shadow-lg scale-105' : ''}`}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="px-3">Most Popular</Badge>
                        </div>
                      )}
                      
                      <CardHeader className="text-center pb-0">
                        <CardTitle className="text-xl">{plan.nameFr || plan.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {plan.price === 0 ? (
                            <span className="text-3xl font-bold">Free</span>
                          ) : (
                            <>
                              <span className="text-3xl font-bold">{(plan.price / 1000).toFixed(1)}K</span>
                              <span className="text-muted-foreground"> DZD/{plan.interval}</span>
                            </>
                          )}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pt-6">
                        <div className="mb-6">
                          <p className="text-sm text-muted-foreground mb-3">
                            {plan.requestsPerDay === -1 ? 'Unlimited requests' : `${plan.requestsPerDay.toLocaleString()} requests/day`}
                          </p>
                        </div>

                        <ul className="space-y-3 mb-8">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button 
                          className="w-full" 
                          variant={plan.isPopular ? 'default' : 'outline'}
                          disabled={plan.id === 'enterprise'}
                        >
                          {plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Documentation Navigation */}
            <section className="py-20">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Explore Documentation</h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {DOC_NAV_ITEMS.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection('docs')}
                      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent hover:shadow-md transition-all text-left group"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {item.icon}
                      </div>
                      <span className="font-medium group-hover:text-primary transition-colors">
                        {item.label}
                      </span>
                      <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Community & Support */}
            <section className="py-20 bg-muted/30">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Join Our Developer Community</h2>

                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 text-center">
                      <div className="w-14 h-14 rounded-full bg-[#5865F2]/10 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-7 h-7 text-[#5865F2]" />
                      </div>
                      <h3 className="font-semibold mb-2">Discord Server</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Chat with other developers and the AlgeriaTrade team
                      </p>
                      <Button variant="outline" size="sm" className="gap-1" asChild>
                        <a href="#" target="_blank" rel="noopener noreferrer">
                          Join Discord
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 text-center">
                      <div className="w-14 h-14 rounded-full bg-gray-900/10 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
                        <Github className="w-7 h-7" />
                      </div>
                      <h3 className="font-semibold mb-2">GitHub</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Report issues, contribute, and star our repos
                      </p>
                      <Button variant="outline" size="sm" className="gap-1" asChild>
                        <a href="#" target="_blank" rel="noopener noreferrer">
                          View GitHub
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 text-center">
                      <div className="w-14 h-14 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center mx-auto mb-4">
                        <Twitter className="w-7 h-7 text-[#1DA1F2]" />
                      </div>
                      <h3 className="font-semibold mb-2">Twitter/X</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Follow for updates, tips, and announcements
                      </p>
                      <Button variant="outline" size="sm" className="gap-1" asChild>
                        <a href="#" target="_blank" rel="noopener noreferrer">
                          Follow Us
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>
          </>
        )}

        {/* DOCUMENTATION SECTION */}
        {activeSection === 'docs' && (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <Button variant="ghost" onClick={() => setActiveSection('overview')} className="gap-1 mb-4">
                ← Back to Overview
              </Button>
              
              <Tabs defaultValue="reference" className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
                  <TabsTrigger value="reference" className="gap-1 hidden sm:flex">
                    <BookOpen className="w-4 h-4" />
                    API Reference
                  </TabsTrigger>
                  <TabsTrigger value="keys" className="gap-1 hidden sm:flex">
                    <Key className="w-4 h-4" />
                    API Keys
                  </TabsTrigger>
                  <TabsTrigger value="webhooks" className="gap-1 hidden sm:flex">
                    <Webhook className="w-4 h-4" />
                    Webhooks
                  </TabsTrigger>
                  <TabsTrigger value="sdks" className="gap-1 hidden sm:flex">
                    <Package className="w-4 h-4" />
                    SDKs
                  </TabsTrigger>
                  <TabsTrigger value="playground-docs" className="gap-1 hidden sm:flex">
                    <Terminal className="w-4 h-4" />
                    Playground
                  </TabsTrigger>
                  
                  {/* Mobile-friendly tabs */}
                  <TabsTrigger value="reference" className="sm:hidden">Reference</TabsTrigger>
                  <TabsTrigger value="keys" className="sm:hidden">Keys</TabsTrigger>
                  <TabsTrigger value="webhooks" className="sm:hidden">Hooks</TabsTrigger>
                  <TabsTrigger value="sdks" className="sm:hidden">SDKs</TabsTrigger>
                  <TabsTrigger value="playground-docs" className="sm:hidden">Play</TabsTrigger>
                </TabsList>

                <TabsContent value="reference" className="mt-6">
                  <APIDocumentation />
                </TabsContent>
                
                <TabsContent value="keys" className="mt-6">
                  <APIKeyManager />
                </TabsContent>
                
                <TabsContent value="webhooks" className="mt-6">
                  <WebhookConfigurator />
                </TabsContent>
                
                <TabsContent value="sdks" className="mt-6">
                  <SDKDownloader />
                </TabsContent>
                
                <TabsContent value="playground-docs" className="mt-6">
                  <APIPlayground />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* PLAYGROUND SECTION */}
        {activeSection === 'playground' && (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <Button variant="ghost" onClick={() => setActiveSection('overview')} className="gap-1 mb-4">
                ← Back to Overview
              </Button>
            </div>
            <APIPlayground />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold">AlgeriaTrade API</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The official REST API for Algeria's largest B2B marketplace.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Documentation</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setActiveSection('docs')} className="hover:text-foreground">Getting Started</button></li>
                <li><button onClick={() => setActiveSection('docs')} className="hover:text-foreground">API Reference</button></li>
                <li><button onClick={() => setActiveSection('docs')} className="hover:text-foreground">SDK Downloads</button></li>
                <li><button onClick={() => setActiveSection('docs')} className="hover:text-foreground">Webhook Guide</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">API Status</a></li>
                <li><a href="#" className="hover:text-foreground">Changelog</a></li>
                <li><a href="#" className="hover:text-foreground">Rate Limits</a></li>
                <li><a href="#" className="hover:text-foreground">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Acceptable Use</a></li>
                <li><a href="#" className="hover:text-foreground">SLA Agreement</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 AlgeriaTrade.dz. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground"><Github className="w-5 h-5" /></a>
              <a href="#" className="hover:text-foreground"><Twitter className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ 
  step, 
  title, 
  description, 
  code 
}: { 
  step: number; 
  title: string; 
  description: string; 
  code: string | null;
}) {
  return (
    <div className="flex gap-6">
      <div className="shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
          {step}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-muted-foreground mb-3">{description}</p>
        
        {code && (
          <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
