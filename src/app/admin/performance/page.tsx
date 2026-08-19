'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import CDNDashboard from '@/components/performance/CDNDashboard';
import EdgeFunctionMonitor from '@/components/performance/EdgeFunctionMonitor';
import PerformanceScorecard from '@/components/performance/PerformanceScorecard';
import RealUserMonitoring from '@/components/performance/RealUserMonitoring';
import {
  Settings,
  Globe,
  Server,
  Zap,
  Shield,
  Bell,
  MapPin,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  Database,
  Network,
  Router,
} from 'lucide-react';

// Types
interface CacheRule {
  id: string;
  name: string;
  pattern: string;
  ttl: number;
  enabled: boolean;
}

interface CDNConfig {
  provider: string;
  enabled: boolean;
  weight: number;
  apiKey?: string;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  condition: 'above' | 'below';
  enabled: boolean;
  notifyEmail: boolean;
  notifySlack: boolean;
}

export default function AdminPerformancePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Cache rules state
  const [cacheRules, setCacheRules] = useState<CacheRule[]>([
    { id: '1', name: 'Static Assets', pattern: '\\.(js|css|woff2?)$', ttl: 31536000, enabled: true },
    { id: '2', name: 'Images', pattern: '\\.(jpg|jpeg|png|webp|avif)$', ttl: 2592000, enabled: true },
    { id: '3', name: 'API Responses', pattern: '^/api/', ttl: 60, enabled: true },
    { id: '4', name: 'HTML Pages', pattern: '\\.html$|^/$', ttl: 300, enabled: true },
    { id: '5', name: 'Personalized Content', pattern: '/account|/dashboard', ttl: 0, enabled: true },
  ]);

  // CDN config state
  const [cdnConfigs, setCdnConfigs] = useState<CDNConfig[]>([
    { provider: 'Cloudflare', enabled: true, weight: 60 },
    { provider: 'Fastly', enabled: true, weight: 25 },
    { provider: 'CloudFront', enabled: true, weight: 15 },
  ]);

  // Alert rules state
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    { id: '1', name: 'High Error Rate', metric: 'errorRate', threshold: 1, condition: 'above', enabled: true, notifyEmail: true, notifySlack: true },
    { id: '2', name: 'Low Cache Hit Rate', metric: 'cacheHitRate', threshold: 80, condition: 'below', enabled: true, notifyEmail: true, notifySlack: false },
    { id: '3', name: 'High Latency', metric: 'p95Latency', threshold: 2000, condition: 'above', enabled: true, notifyEmail: false, notifySlack: true },
    { id: '4', name: 'CDN Degradation', metric: 'healthScore', threshold: 90, condition: 'below', enabled: true, notifyEmail: true, notifySlack: true },
  ]);

  // Regional settings state
  const [regionalSettings, setRegionalSettings] = useState({
    algeria: { priority: 'high', edgeLocation: 'Algiers', customTTL: 180 },
    tunisia: { priority: 'medium', edgeLocation: 'Tunis', customTTL: 300 },
    morocco: { priority: 'medium', edgeLocation: 'Casablanca', customTTL: 300 },
    france: { priority: 'medium', edgeLocation: 'Paris', customTTL: 420 },
    other: { priority: 'low', edgeLocation: 'Frankfurt', customTTL: 600 },
  });

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveMessage('Settings saved successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const addCacheRule = () => {
    const newRule: CacheRule = {
      id: Date.now().toString(),
      name: 'New Rule',
      pattern: '',
      ttl: 3600,
      enabled: true,
    };
    setCacheRules([...cacheRules, newRule]);
  };

  const removeCacheRule = (id: string) => {
    setCacheRules(cacheRules.filter(r => r.id !== id));
  };

  const updateCacheRule = (id: string, updates: Partial<CacheRule>) => {
    setCacheRules(cacheRules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Performance Administration</h1>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex">
                AlgeriaTrade.dz Edge & CDN
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {saveMessage && (
                <div className={`flex items-center gap-1 text-sm ${
                  saveMessage.includes('success') ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {saveMessage.includes('success') ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {saveMessage}
                </div>
              )}
              
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl mb-6 flex-wrap h-auto">
            <TabsTrigger value="overview" className="gap-1">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="cdn-config" className="gap-1">
              <Globe className="w-4 h-4" />
              CDN Config
            </TabsTrigger>
            <TabsTrigger value="cache-rules" className="gap-1">
              <Database className="w-4 h-4" />
              Cache Rules
            </TabsTrigger>
            <TabsTrigger value="edge-functions" className="gap-1">
              <Zap className="w-4 h-4" />
              Edge Functions
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1">
              <Bell className="w-4 h-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="regional" className="gap-1">
              <MapPin className="w-4 h-4" />
              Regional
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Shows all dashboards */}
          <TabsContent value="overview" className="mt-6 space-y-8">
            <div className="grid gap-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickStatCard 
                  title="Global Cache Hit Ratio"
                  value="91.2%"
                  icon={<Database className="w-5 h-5 text-blue-500" />}
                  trend="+2.1%"
                  trendUp={true}
                />
                <QuickStatCard 
                  title="Avg Response Time (MENA)"
                  value="142ms"
                  icon={<Clock className="w-5 h-5 text-emerald-500" />}
                  trend="-12ms"
                  trendUp={true}
                />
                <QuickStatCard 
                  title="Active Edge Functions"
                  value="8"
                  icon={<Zap className="w-5 h-5 text-purple-500" />}
                  status="healthy"
                />
                <QuickStatCard 
                  title="Error Rate"
                  value="0.18%"
                  icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                  trend="-0.03%"
                  trendUp={true}
                />
              </div>

              {/* CDN Dashboard */}
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  CDN Performance Dashboard
                </h2>
                <CDNDashboard autoRefresh={true} refreshInterval={60000} />
              </section>

              {/* Edge Function Monitor */}
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Edge Function Monitor
                </h2>
                <EdgeFunctionMonitor autoRefresh={true} refreshInterval={15000} />
              </section>

              {/* Performance Scorecard */}
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Core Web Vitals Scorecard
                </h2>
                <PerformanceScorecard />
              </section>

              {/* Real User Monitoring */}
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Real User Monitoring
                </h2>
                <RealUserMonitoring autoRefresh={true} refreshInterval={30000} />
              </section>
            </div>
          </TabsContent>

          {/* CDN Configuration Tab */}
          <TabsContent value="cdn-config" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Multi-CDN Configuration</CardTitle>
                <CardDescription>
                  Configure CDN providers and traffic distribution for optimal MENA delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Provider Cards */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {cdnConfigs.map((config) => (
                      <Card key={config.provider} className={!config.enabled ? 'opacity-60' : ''}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Server className="w-5 h-5 text-primary" />
                                <span className="font-semibold">{config.provider}</span>
                              </div>
                              <Switch
                                checked={config.enabled}
                                onCheckedChange={(checked) => {
                                  setCdnConfigs(cdnConfigs.map(c => 
                                    c.provider === config.provider ? { ...c, enabled: checked } : c
                                  ));
                                }}
                              />
                            </div>

                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm">Traffic Weight (%)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={config.weight}
                                  onChange={(e) => {
                                    setCdnConfigs(cdnConfigs.map(c => 
                                      c.provider === config.provider 
                                        ? { ...c, weight: parseInt(e.target.value) || 0 } 
                                        : c
                                    ));
                                  }}
                                  disabled={!config.enabled}
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label className="text-sm">API Key</Label>
                                <Input
                                  type="password"
                                  placeholder="••••••••"
                                  disabled={!config.enabled}
                                  className="mt-1"
                                />
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={config.enabled ? 'default' : 'secondary'}>
                                  {config.enabled ? 'Active' : 'Disabled'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Traffic Distribution Visualization */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-3">Traffic Distribution Preview</h4>
                    <div className="space-y-3">
                      {cdnConfigs.filter(c => c.enabled).map(config => (
                        <div key={config.provider} className="flex items-center gap-3">
                          <span className="w-24 text-sm">{config.provider}</span>
                          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                config.provider === 'Cloudflare' ? 'bg-orange-500' :
                                config.provider === 'Fastly' ? 'bg-blue-500' :
                                'bg-purple-500'
                              }`}
                              style={{ width: `${config.weight}%` }}
                            />
                          </div>
                          <span className="w-12 text-right text-sm font-mono">{config.weight}%</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Total: {cdnConfigs.reduce((sum, c) => sum + (c.enabled ? c.weight : 0), 0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purge Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Purge Management</CardTitle>
                <CardDescription>
                  Manually purge cached content across all CDN providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Purge Type</Label>
                      <Select defaultValue="url">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="tag">Tag</SelectItem>
                          <SelectItem value="prefix">Prefix</SelectItem>
                          <SelectItem value="all">All (Danger!)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Target(s)</Label>
                      <Input placeholder="/products/* or tag:homepage" className="mt-1" />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Execute Purge
                    </Button>
                    <Button variant="outline">
                      View Purge History
                    </Button>
                  </div>

                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Warning:</strong> Full cache purges can cause increased origin load. 
                      Use URL or tag-based purges when possible.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cache Rules Tab */}
          <TabsContent value="cache-rules" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cache Rule Editor</CardTitle>
                    <CardDescription>
                      Define caching policies for different content types and URL patterns
                    </CardDescription>
                  </div>
                  <Button onClick={addCacheRule} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cacheRules.map((rule) => (
                    <div key={rule.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 grid sm:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={rule.name}
                              onChange={(e) => updateCacheRule(rule.id, { name: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Pattern (Regex)</Label>
                            <Input
                              value={rule.pattern}
                              onChange={(e) => updateCacheRule(rule.id, { pattern: e.target.value })}
                              placeholder="\\.(js|css)$"
                              className="mt-1 font-mono text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">TTL (seconds)</Label>
                            <Input
                              type="number"
                              value={rule.ttl}
                              onChange={(e) => updateCacheRule(rule.id, { ttl: parseInt(e.target.value) || 0 })}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={(checked) => updateCacheRule(rule.id, { enabled: checked })}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCacheRule(rule.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>TTL: {formatTTL(rule.ttl)}</span>
                        <span>•</span>
                        <span>Status: {rule.enabled ? 'Active' : 'Disabled'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edge Functions Tab */}
          <TabsContent value="edge-functions" className="mt-6">
            <EdgeFunctionMonitor autoRefresh={false} />
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Edge Function Deployment</CardTitle>
                <CardDescription>
                  Deploy and manage edge functions for request routing and transformation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: 'geo-router', desc: 'Geographic routing logic', status: 'deployed' },
                      { name: 'bot-detector', desc: 'Bot detection & filtering', status: 'deployed' },
                      { name: 'rate-limiter', desc: 'Rate limiting at edge', status: 'deployed' },
                      { name: 'ab-testing', desc: 'A/B test assignment', status: 'deployed' },
                      { name: 'image-transform', desc: 'Image optimization', status: 'pending' },
                      { name: 'auth-validator', desc: 'Token validation', status: 'deployed' },
                    ].map(func => (
                      <div key={func.name} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium font-mono">{func.name}</span>
                          <Badge variant={func.status === 'deployed' ? 'default' : 'secondary'}>
                            {func.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{func.desc}</p>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Redeploy
                          </Button>
                          <Button size="sm" variant="outline">
                            Logs
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Deploy New Edge Function
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Performance Alerts Setup</CardTitle>
                    <CardDescription>
                      Configure alerts for performance degradation and anomalies
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Alert
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertRules.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Switch
                              checked={alert.enabled}
                              onCheckedChange={(checked) => {
                                setAlertRules(alertRules.map(a =>
                                  a.id === alert.id ? { ...a, enabled: checked } : a
                                ));
                              }}
                            />
                            <span className="font-medium">{alert.name}</span>
                            <Badge variant="outline">{alert.metric}</Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground ml-10">
                            Trigger when {alert.metric} is{' '}
                            <strong>{alert.condition}</strong>{' '}
                            <strong>{alert.threshold}{getMetricUnit(alert.metric)}</strong>
                          </p>
                          
                          <div className="flex items-center gap-4 mt-2 ml-10 text-sm">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={alert.notifyEmail}
                                onChange={(e) => {
                                  setAlertRules(alertRules.map(a =>
                                    a.id === alert.id ? { ...a, notifyEmail: e.target.checked } : a
                                  ));
                                }}
                                className="rounded"
                              />
                              Email
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={alert.notifySlack}
                                onChange={(e) => {
                                  setAlertRules(alertRules.map(a =>
                                    a.id === alert.id ? { ...a, notifySlack: e.target.checked } : a
                                  ));
                                }}
                                className="rounded"
                              />
                              Slack
                            </label>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAlertRules(alertRules.filter(a => a.id !== alert.id))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: '5 min ago', metric: 'P95 Latency', value: '2450ms', severity: 'warning' },
                    { time: '23 min ago', metric: 'Cache Hit Rate', value: '78%', severity: 'warning' },
                    { time: '1 hour ago', metric: 'Error Rate', value: '2.1%', severity: 'critical' },
                    { time: '2 hours ago', metric: 'Health Score', value: 'CloudFront: 85%', severity: 'info' },
                  ].map((alert, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-sm text-muted-foreground">{alert.time}</span>
                      <span className="font-medium">{alert.metric}</span>
                      <span className="font-mono ml-auto">{alert.value}</span>
                      <Badge
                        variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'warning' ? 'secondary' : 'default'
                        }
                        className="text-xs"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Regional Optimization Tab */}
          <TabsContent value="regional" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Regional Optimization Settings</CardTitle>
                <CardDescription>
                  Configure region-specific settings for optimal MENA performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Map visualization placeholder */}
                  <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-dashed border-primary/20">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-primary mx-auto mb-3" />
                      <h3 className="font-semibold text-lg mb-1">MENA Region Focus</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Optimizing for Algerian users with low latency to Algiers, Oran, Constantine, 
                        and regional expansion to Tunisia, Morocco, and France.
                      </p>
                    </div>
                  </div>

                  {/* Regional settings table */}
                  <div className="space-y-4">
                    {Object.entries(regionalSettings).map(([region, settings]) => (
                      <div key={region} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            <span className="font-semibold capitalize">{region}</span>
                          </div>
                          <Badge variant={
                            settings.priority === 'high' ? 'default' :
                            settings.priority === 'medium' ? 'secondary' : 'outline'
                          }>
                            {settings.priority} priority
                          </Badge>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm">Primary Edge Location</Label>
                            <Select
                              value={settings.edgeLocation}
                              onValueChange={(value) => {
                                setRegionalSettings({
                                  ...regionalSettings,
                                  [region]: { ...settings, edgeLocation: value }
                                });
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Algiers">Algiers, DZ</SelectItem>
                                <SelectItem value="Oran">Oran, DZ</SelectItem>
                                <SelectItem value="Constantine">Constantine, DZ</SelectItem>
                                <SelectItem value="Paris">Paris, FR</SelectItem>
                                <SelectItem value="Marseille">Marseille, FR</SelectItem>
                                <SelectItem value="Tunis">Tunis, TN</SelectItem>
                                <SelectItem value="Casablanca">Casablanca, MA</SelectItem>
                                <SelectItem value="Frankfurt">Frankfurt, DE</SelectItem>
                                <SelectItem value="Dubai">Dubai, AE</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm">Custom TTL (seconds)</Label>
                            <Input
                              type="number"
                              value={settings.customTTL}
                              onChange={(e) => {
                                setRegionalSettings({
                                  ...regionalSettings,
                                  [region]: { ...settings, customTTL: parseInt(e.target.value) || 0 }
                                });
                              }}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-sm">Priority Level</Label>
                            <Select
                              value={settings.priority}
                              onValueChange={(value) => {
                                setRegionalSettings({
                                  ...regionalSettings,
                                  [region]: { ...settings, priority: value as any }
                                });
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Estimated latency improvements */}
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-start gap-3">
                      <Router className="w-6 h-6 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                          Expected Performance Improvements
                        </h4>
                        <ul className="mt-2 text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
                          <li>• Algiers users: ~14ms average latency (vs ~120ms without edge)</li>
                          <li>• Oran users: ~24ms average latency (via Algiers PoP)</li>
                          <li>• France users: ~28ms average latency (via Paris/Marseille)</li>
                          <li>• Overall cache hit rate improvement: +15% with regional TTLs</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Sub-components

function QuickStatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp,
  status 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  status?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-muted rounded-lg">{icon}</div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
        
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        
        {status && (
          <div className="mt-2">
            <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
              {status}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatTTL(seconds: number): string {
  if (seconds <= 0) return 'No cache';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function getMetricUnit(metric: string): string {
  const units: Record<string, string> = {
    errorRate: '%',
    cacheHitRate: '%',
    p95Latency: 'ms',
    healthScore: '%',
    avgLatency: 'ms',
  };
  return units[metric] || '';
}
